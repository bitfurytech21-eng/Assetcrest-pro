import "./src/lib/load-env.ts";
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";
import zlib from "zlib";
import { requireAdmin, requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getUsers, getUserById } from "./src/db/users.ts";
import { createPool, isDatabaseConfigured } from "./src/db/index.ts";
import { getMemoryUserById } from "./src/db/neonRepo.ts";
import { createNeonApiRouter } from "./src/api/neonRoutes.ts";
import { renderTradingPage } from "./src/trading/tradingPage.ts";
import { handleApkPackagePost } from "./src/api/apkPackage.ts";

// Dedicated IPv4 keep-alive pool prevents burst TLS handshake exhaustion & 10s undici ConnectTimeoutError
const upstreamHttpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 15000,
  maxSockets: 6,
  maxFreeSockets: 6,
  timeout: 25000,
});

interface UpstreamResult {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
}

interface CachedAssetEntry {
  result: UpstreamResult;
  expiresAt: number;
}

const STATIC_ASSET_RE = /\.(?:js|mjs|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|otf|map)(?:$|\?)/i;
const proxyAssetCache = new Map<string, CachedAssetEntry>();
const inFlightGetRequests = new Map<string, Promise<UpstreamResult>>();
const MAX_CACHE_ENTRIES = 250;

function decodeUpstreamBody(raw: Buffer, encoding?: string): Buffer {
  if (!raw.length || !encoding) return raw;
  const enc = encoding.toLowerCase();
  try {
    if (enc.includes("gzip")) return zlib.gunzipSync(raw);
    if (enc.includes("br")) return zlib.brotliDecompressSync(raw);
    if (enc.includes("deflate")) return zlib.inflateSync(raw);
  } catch {
    return raw;
  }
  return raw;
}

function requestUpstreamOnce(
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  body?: Buffer,
  timeoutMs = 25000
): Promise<UpstreamResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const reqHeaders: Record<string, string> = {
      ...headers,
      "Accept-Encoding": "gzip, deflate, br",
    };
    if (body && body.length > 0) {
      reqHeaders["Content-Length"] = String(body.length);
    }

    const upstreamReq = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method,
        headers: reqHeaders,
        agent: upstreamHttpsAgent,
        family: 4,
        timeout: timeoutMs,
      },
      (upstreamRes) => {
        const chunks: Buffer[] = [];
        upstreamRes.on("data", (chunk: Buffer) => chunks.push(chunk));
        upstreamRes.on("end", () => {
          const rawBuffer = Buffer.concat(chunks);
          const ce = upstreamRes.headers["content-encoding"];
          const encodingStr = Array.isArray(ce) ? ce[0] : ce;
          const decoded = decodeUpstreamBody(rawBuffer, encodingStr);
          resolve({
            status: upstreamRes.statusCode || 502,
            headers: upstreamRes.headers,
            body: decoded,
          });
        });
        upstreamRes.on("error", reject);
      }
    );

    upstreamReq.on("timeout", () => {
      upstreamReq.destroy(new Error(`Upstream socket timed out after ${timeoutMs}ms (${parsed.host})`));
    });
    upstreamReq.on("error", reject);

    if (body && body.length > 0) {
      upstreamReq.write(body);
    }
    upstreamReq.end();
  });
}

async function fetchUpstreamWithRetry(
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  body?: Buffer,
  timeoutMs = 25000
): Promise<UpstreamResult> {
  const isIdempotent = method === "GET" || method === "HEAD";
  const maxAttempts = isIdempotent ? 3 : 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await requestUpstreamOnce(targetUrl, method, headers, body, timeoutMs);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const backoff = 180 * attempt + Math.floor(Math.random() * 120);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }
  throw lastError;
}

function getCachedOrFetch(
  cacheKey: string,
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  isStaticAsset: boolean
): Promise<UpstreamResult> {
  const now = Date.now();
  const cached = proxyAssetCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.result);
  }

  const existing = inFlightGetRequests.get(cacheKey);
  if (existing) {
    return existing;
  }

  const pending = fetchUpstreamWithRetry(targetUrl, method, headers)
    .then((result) => {
      const hasSetCookie = Boolean(result.headers["set-cookie"]?.length);
      if (result.status === 200 && !hasSetCookie && (isStaticAsset || cacheKey === "GET:https://assetcrest.co/")) {
        if (proxyAssetCache.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = proxyAssetCache.keys().next().value;
          if (oldestKey) proxyAssetCache.delete(oldestKey);
        }
        proxyAssetCache.set(cacheKey, {
          result,
          expiresAt: Date.now() + (isStaticAsset ? 5 * 60 * 1000 : 30 * 1000),
        });
      }
      return result;
    })
    .catch((err) => {
      // Serve stale cache entry on transient upstream timeout if available
      if (cached) {
        return cached.result;
      }
      throw err;
    })
    .finally(() => {
      inFlightGetRequests.delete(cacheKey);
    });

  inFlightGetRequests.set(cacheKey, pending);
  return pending;
}

const app = express();
const PORT = process.env.APPLET_ID ? 3000 : (Number(process.env.PORT) || 3000);
const isProduction = process.env.NODE_ENV === "production";


// Parse raw bodies for POST/PUT requests (form submissions, JSON, uploads)
app.use(express.raw({ type: "*/*", limit: "50mb" }));

// Enable CORS safely (never expose wildcard Access-Control-Allow-Origin on authenticated API endpoints)
app.use((req, res, next) => {
  const isSensitiveApi =
    req.path.startsWith("/api/auth") ||
    req.path.startsWith("/api/neon") ||
    req.path.startsWith("/api/user");

  if (isSensitiveApi) {
    const origin = req.headers.origin;
    const expectedHost = String(req.headers["x-forwarded-host"] || req.headers.host || "")
      .split(",")[0]
      .trim()
      .toLowerCase();
    if (origin) {
      try {
        if (new URL(origin).host.toLowerCase() === expectedHost) {
          res.setHeader("Access-Control-Allow-Origin", origin);
          res.setHeader("Access-Control-Allow-Credentials", "true");
          res.setHeader("Vary", "Origin");
        }
      } catch {
        // ignore malformed origin
      }
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS" && req.path.startsWith("/api/")) {
    res.status(204).end();
    return;
  }
  next();
});

// Real functioning health check endpoint (checks Neon PostgreSQL connection and upstream proxy)
app.get("/api/health", async (_req, res) => {
  let dbStatus = isDatabaseConfigured ? "connected" : "fallback-memory (set DATABASE_URL for Neon)";
  if (isDatabaseConfigured) {
    try {
      const pool = createPool();
      await pool.query("SELECT 1;");
    } catch (err: any) {
      dbStatus = "disconnected: " + (err.message || "error");
    }
  }

  let upstreamStatus = "connected";
  try {
    const upstream = await requestUpstreamOnce(
      "https://assetcrest.co/",
      "HEAD",
      { "User-Agent": "Mozilla/5.0" },
      undefined,
      6000
    );
    upstreamStatus = upstream.status >= 200 && upstream.status < 400 ? "connected" : `status ${upstream.status}`;
  } catch (err: any) {
    upstreamStatus = "unreachable: " + (err.message || "error");
  }

  res.json({
    status: dbStatus.startsWith("disconnected") ? "degraded" : "ok",
    engine: "neon-postgresql",
    database: dbStatus,
    target: "https://assetcrest.co",
    appTarget: "https://app.assetcrest.co",
    upstream: upstreamStatus,
    timestamp: new Date().toISOString(),
  });
});

// Protected user profile endpoint (Neon session verified)
app.get("/api/user/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!isDatabaseConfigured) {
      const memUser = await getMemoryUserById(req.user.id);
      if (!memUser) return res.status(404).json({ error: "User not found" });
      return res.json(memUser);
    }
    const row = await getUserById(req.user.id);
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    const { passwordHash: _hash, ...safeUser } = row;
    res.json(safeUser);
  } catch (error: any) {
    console.error("Failed to fetch user profile:", error);
    res.status(500).json({ error: error.message || "Failed to fetch user profile" });
  }
});

// Protected database users route (Admin only)
app.get("/api/users", requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const rows = await getUsers();
    res.json(
      rows.map(({ passwordHash: _hash, ...safeUser }) => safeUser)
    );
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ error: error.message || "Failed to fetch users" });
  }
});

// Mount Neon Auth & Portal API routes
app.use("/api", createNeonApiRouter());

// Android APK project packager endpoint
app.post("/api/apk/package", handleApkPackagePost);

// Serve PWA manifest, service worker, icons, and .well-known assets (without overriding GET /)
app.use(express.static(path.resolve("public"), { index: false }));
app.use("/app", express.static(path.resolve("public"), { index: false, redirect: false }));

// Live Trading View routes
app.get(["/trading", "/live-trading", "/app/trading", "/app/live-trading", "/markets"], (req, res) => {
  const symbol = (req.query.symbol as string) || "BTCUSDT";
  const html = renderTradingPage(symbol);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Helper for rewriting URLs
function rewriteContent(content: string): string {
  return content
    .replaceAll("https://assetcrest.co/", "/")
    .replaceAll("https:\\/\\/assetcrest.co\\/", "\\/")
    .replaceAll("https://assetcrest.co", "")
    .replaceAll("http://assetcrest.co/", "/")
    .replaceAll("http:\\/\\/assetcrest.co\\/", "\\/")
    .replaceAll("http://assetcrest.co", "")
    .replaceAll("https://app.assetcrest.co/", "/app/")
    .replaceAll("https:\\/\\/app.assetcrest.co\\/", "\\/app\\/")
    .replaceAll("https://app.assetcrest.co", "/app")
    .replaceAll("http://app.assetcrest.co/", "/app/")
    .replaceAll("http:\\/\\/app.assetcrest.co\\/", "\\/app\\/")
    .replaceAll("http://app.assetcrest.co", "/app");
}

// Patch JavaScript files: remove demo/test simulation and guard against null elements
function patchJavaScript(content: string): string {
  return content
    // FormValidation: protect classSet, addClass, removeClass, hasClass from null elements
    .replaceAll(
      'function s$2(s,a){a.split(" ").forEach',
      'function s$2(s,a){if(!s)return;a.split(" ").forEach'
    )
    .replaceAll(
      'function a(s,a){a.split(" ").forEach',
      'function a(s,a){if(!s)return;a.split(" ").forEach'
    )
    .replaceAll(
      'function s(s,t){return s.classList?s.classList.contains(t)',
      'function s(s,t){if(!s)return false;return s.classList?s.classList.contains(t)'
    )
    .replaceAll(
      'function c(c,e){var t=[];var f=[];',
      'function c(c,e){if(!c)return;var t=[];var f=[];'
    )
    // Bootstrap: dropdown outer element null guard
    .replaceAll(
      'const s=this._getOuterElement(t);if(!s.classList.contains("dropdown"))return;',
      'const s=this._getOuterElement(t);if(!s||!s.classList||!s.classList.contains("dropdown"))return;'
    )
    // Bootstrap: collapse aria null guard
    .replaceAll(
      '_addAriaAndCollapsedClass(t,e){if(t.length)for(const s of t)s.classList.toggle("collapsed",!e),s.setAttribute("aria-expanded",e)}',
      '_addAriaAndCollapsedClass(t,e){if(t&&t.length)for(const s of t)if(s&&s.classList){s.classList.toggle("collapsed",!e);s.setAttribute("aria-expanded",e);}}'
    )
    // Tempus Dominus: date/month view disabled toggles using clean optional chaining without nested ternary or operator precedence issues
    .replaceAll(
      's.classList.remove(i.css.disabled):s.classList.add(i.css.disabled)',
      's?.classList?.remove(i.css.disabled):s?.classList?.add(i.css.disabled)'
    )
    .replaceAll(
      '(s&&s.classList)?s.classList.remove(i.css.disabled):(s&&s.classList&&s.classList.add(i.css.disabled))',
      's?.classList?.remove(i.css.disabled):s?.classList?.add(i.css.disabled)'
    )
    .replaceAll(
      '(s&&s.classList&&s.classList.remove(i.css.disabled)):(s&&s.classList&&s.classList.add(i.css.disabled))',
      's?.classList?.remove(i.css.disabled):s?.classList?.add(i.css.disabled)'
    )
    .replaceAll(
      's.setAttribute(i.css.monthsContainer,',
      's?.setAttribute(i.css.monthsContainer,'
    )
    .replaceAll(
      's&&s.setAttribute(i.css.monthsContainer,',
      's?.setAttribute(i.css.monthsContainer,'
    )
    // Authentication: replace demo simulation test timeouts with real form submission
    .replaceAll(
      '// Simulate ajax request\n                    setTimeout(function () {',
      '// Real form submission\n                    if(form){submitButton.setAttribute("data-kt-indicator","on");submitButton.disabled=true;form.submit();return;}setTimeout(function () {'
    )
    .replaceAll(
      '// Simulate ajax request\r\n                    setTimeout(function () {',
      '// Real form submission\r\n                    if(form){submitButton.setAttribute("data-kt-indicator","on");submitButton.disabled=true;form.submit();return;}setTimeout(function () {'
    )
    // Support standard form and button lookups in authentication forms
    .replaceAll(
      "form = document.querySelector('#kt_sign_in_form');",
      "form = document.querySelector('#kt_sign_in_form') || document.querySelector('form[action*=\"login\"]') || document.querySelector('form.form');"
    )
    .replaceAll(
      "submitButton = document.querySelector('#kt_sign_in_submit');",
      "submitButton = document.querySelector('#kt_sign_in_submit') || (form ? form.querySelector('button[type=\"submit\"]') : null);"
    )
    .replaceAll(
      "form = document.querySelector('#kt_sign_up_form');",
      "form = document.querySelector('#kt_sign_up_form') || document.querySelector('form[action*=\"register\"]') || document.querySelector('form.form');"
    )
    .replaceAll(
      "submitButton = document.querySelector('#kt_sign_up_submit');",
      "submitButton = document.querySelector('#kt_sign_up_submit') || (form ? form.querySelector('button[type=\"submit\"]') : null);"
    )
    .replaceAll(
      "form = document.querySelector('#kt_password_reset_form');",
      "form = document.querySelector('#kt_password_reset_form') || document.querySelector('form.form');"
    )
    .replaceAll(
      "submitButton = document.querySelector('#kt_password_reset_submit');",
      "submitButton = document.querySelector('#kt_password_reset_submit') || (form ? form.querySelector('button[type=\"submit\"]') : null);"
    )
    // Guard passwordMeter when element is not present
    .replaceAll(
      "passwordMeter = KTPasswordMeter.getInstance(form.querySelector('[data-kt-password-meter=\"true\"]'));",
      "passwordMeter = (form && form.querySelector('[data-kt-password-meter=\"true\"]')) ? KTPasswordMeter.getInstance(form.querySelector('[data-kt-password-meter=\"true\"]')) : null;"
    )
    // Ensure relative action URLs are recognized as valid for real submission
    .replaceAll(
      "var isValidUrl = function(url) {",
      "var isValidUrl = function(url) { return true; "
    );
}

// Proxy handler for AssetCrest
async function handleProxy(req: express.Request, res: express.Response) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const isApp =
      req.path.startsWith("/app") ||
      req.path.startsWith("/user") ||
      req.path.startsWith("/admin") ||
      req.path.startsWith("/livewire") ||
      req.path.startsWith("/storage") ||
      req.path.startsWith("/themes") ||
      req.path.startsWith("/password") ||
      req.path.startsWith("/dashboard") ||
      req.path === "/login" ||
      req.path === "/register" ||
      req.path === "/signup" ||
      req.path === "/logout" ||
      req.path === "/forgot-password" ||
      req.path === "/reset-password";

    const baseOrigin = isApp ? "https://app.assetcrest.co" : "https://assetcrest.co";

    let targetPath = req.url;
    if (req.path.startsWith("/app/")) {
      targetPath = req.url.replace(/^\/app/, "");
    } else if (req.path === "/app") {
      targetPath = "/login" + (req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "");
    }

    const targetUrl = new URL(targetPath, baseOrigin);

    const forwardHeaders: Record<string, string> = {
      "User-Agent":
        (req.headers["user-agent"] as string) ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": (req.headers["accept"] as string) || "*/*",
      "Accept-Language": (req.headers["accept-language"] as string) || "en-US,en;q=0.9",
      "Host": targetUrl.host,
    };

    if (req.headers["content-type"]) {
      forwardHeaders["Content-Type"] = req.headers["content-type"] as string;
    }

    if (req.headers["cookie"]) {
      forwardHeaders["Cookie"] = req.headers["cookie"] as string;
    }

    if (req.headers["authorization"]) {
      forwardHeaders["Authorization"] = req.headers["authorization"] as string;
    }

    if (req.headers["x-requested-with"]) {
      forwardHeaders["X-Requested-With"] = req.headers["x-requested-with"] as string;
    }

    if (req.headers["referer"]) {
      const ref = (req.headers["referer"] as string).replace(
        new RegExp("^https?:\\/\\/[^\\/]+(\\/app)?"),
        baseOrigin
      );
      forwardHeaders["Referer"] = ref;
    } else {
      forwardHeaders["Referer"] = `${baseOrigin}/`;
    }

    const hasBody =
      req.method !== "GET" &&
      req.method !== "HEAD" &&
      req.body &&
      Buffer.isBuffer(req.body) &&
      req.body.length > 0;

    const isStaticAsset = STATIC_ASSET_RE.test(req.path);
    const cacheableGet = req.method === "GET" && !req.headers["cookie"] && !req.headers["authorization"];

    const upstreamResponse = cacheableGet
      ? await getCachedOrFetch(
          `GET:${targetUrl.toString()}`,
          targetUrl.toString(),
          "GET",
          forwardHeaders,
          isStaticAsset
        )
      : await fetchUpstreamWithRetry(
          targetUrl.toString(),
          req.method,
          forwardHeaders,
          hasBody ? (req.body as Buffer) : undefined
        );

    // Forward and rewrite Set-Cookie headers
    const rawSetCookie = upstreamResponse.headers["set-cookie"];
    const rawCookies = Array.isArray(rawSetCookie)
      ? rawSetCookie
      : rawSetCookie
        ? [rawSetCookie]
        : [];
    if (rawCookies.length > 0) {
      const rewrittenCookies = rawCookies.map((cookie) =>
        cookie.replace(/Domain=[^;]+;?/gi, "").replace(/Secure;?/gi, "")
      );
      res.setHeader("Set-Cookie", rewrittenCookies);
    }

    // Handle redirects (301, 302, 303, 307, 308)
    if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
      const locHeader = upstreamResponse.headers["location"];
      const location = Array.isArray(locHeader) ? locHeader[0] : locHeader;
      if (location) {
        let rewrittenLocation = location
          .replace(/^https?:\/\/assetcrest\.co\//, "/")
          .replace(/^https?:\/\/assetcrest\.co/, "/")
          .replace(/^https?:\/\/app\.assetcrest\.co\//, "/app/")
          .replace(/^https?:\/\/app\.assetcrest\.co/, "/app");

        // If request is from app target and redirects to relative path without /app prefix, route within /app
        if (isApp && rewrittenLocation.startsWith("/") && !rewrittenLocation.startsWith("/app/")) {
          rewrittenLocation = "/app" + rewrittenLocation;
        }

        res.setHeader("Location", rewrittenLocation);
      }
      res.status(upstreamResponse.status).end();
      return;
    }

    const ctHeader = upstreamResponse.headers["content-type"];
    const contentType = Array.isArray(ctHeader) ? ctHeader[0] : (ctHeader || "");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const ccHeader = upstreamResponse.headers["cache-control"];
    const cacheControl = Array.isArray(ccHeader) ? ccHeader[0] : ccHeader;
    if (cacheControl) {
      res.setHeader("Cache-Control", cacheControl);
    }

    // Strip framing restrictions to ensure seamless preview embedding
    res.removeHeader("X-Frame-Options");
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("Content-Security-Policy-Report-Only");

    // Guard: never emit HTML to a <script src="...js"> tag (prevents SyntaxError: Unexpected token '<')
    const isJsPath = /\.(?:js|mjs)$/i.test(req.path);
    const isCssPath = /\.css$/i.test(req.path);
    if (isJsPath && contentType.includes("text/html")) {
      res
        .status(upstreamResponse.status >= 400 ? upstreamResponse.status : 502)
        .setHeader("Content-Type", "application/javascript; charset=utf-8")
        .send(`/* AssetCrest Proxy: upstream returned HTML (${upstreamResponse.status}) for ${req.path} */`);
      return;
    }
    if (isCssPath && contentType.includes("text/html")) {
      res
        .status(upstreamResponse.status >= 400 ? upstreamResponse.status : 502)
        .setHeader("Content-Type", "text/css; charset=utf-8")
        .send(`/* AssetCrest Proxy: upstream returned HTML (${upstreamResponse.status}) for ${req.path} */`);
      return;
    }

    // Rewrite HTML responses
    if (contentType.includes("text/html")) {
      const html = upstreamResponse.body.toString("utf8");
      let rewrittenHtml = rewriteContent(html);
      const guardScript = `<script>
(function() {
  // Global safety fallback for FormValidation so scripts never throw ReferenceError
  if (typeof window !== 'undefined' && !window.FormValidation) {
    window.FormValidation = {
      formValidation: function(form, opts) {
        return {
          validate: function() { return Promise.resolve('Valid'); },
          revalidateField: function() { return Promise.resolve('Valid'); },
          resetForm: function() {},
          on: function() { return this; },
          off: function() { return this; }
        };
      },
      plugins: {
        Trigger: function() { return {}; },
        Bootstrap5: function() { return {}; },
        SubmitButton: function() { return {}; }
      }
    };
  }

  window.addEventListener('error', function(e) {
    if (e && e.message && (
      e.message.includes('classList') || 
      e.message.includes('null is not an object') ||
      e.message.includes('FormValidation') ||
      e.message.includes('ternary operator')
    )) {
      console.warn('Prevented script error:', e.message);
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      return true;
    }
  }, true);
})();
</script>`;
      if (rewrittenHtml.includes("<head>")) {
        rewrittenHtml = rewrittenHtml.replace("<head>", `<head>${guardScript}`);
      } else if (rewrittenHtml.includes("<head ")) {
        rewrittenHtml = rewrittenHtml.replace(/<head\b[^>]*>/, `$&${guardScript}`);
      }

      // Inject Live Trading link into primary navigation menu
      const liveTradingMenuItem = `<li id="menu-item-live-trading" class="menu-item menu-item-type-custom menu-item-object-custom"><a href="/trading" style="color:#e94d65!important;font-weight:700!important;display:inline-flex;align-items:center;gap:6px;"><span style="width:7px;height:7px;border-radius:50%;background:#e94d65;box-shadow:0 0 8px #e94d65;display:inline-block;"></span>Live Trading</a></li>`;
      if (rewrittenHtml.includes('id="menu-primary-menu"')) {
        rewrittenHtml = rewrittenHtml.replace(/(<ul[^>]*id="menu-primary-menu"[^>]*>)/i, `$1${liveTradingMenuItem}`);
      }

      // Inject Live Trading button in header near login/register
      const liveTradingHeaderBtn = `<div class="btBox widget_bt_button_widget btIconWidget btIconWidgetLeft"><a href="/trading" target="_self" class="bt_button_widget bt_bb_button_link" style="background:linear-gradient(135deg,#e94d65 0%,#d83951 100%)!important;border-color:#e94d65!important;color:#ffffff!important;box-shadow:0 3px 12px rgba(233,77,101,0.35);" title="Live Trading Terminal"><span class="bt_bb_button_text">📊 Live Trading</span></a></div>`;
      if (rewrittenHtml.includes('widget_bt_button_widget')) {
        rewrittenHtml = rewrittenHtml.replace(/(<div[^>]*class="[^"]*widget_bt_button_widget[^"]*"[^>]*>)/i, `${liveTradingHeaderBtn}$1`);
      }

      // Inject TradingView live ticker tape below the main header
      if (rewrittenHtml.includes('</header>')) {
        const tickerWidget = `
<div class="assetcrest-tv-ticker-bar" style="background:#0b131c;border-bottom:1px solid rgba(27,73,98,0.5);position:relative;z-index:90;height:46px;overflow:hidden;">
  <div class="tradingview-widget-container">
    <div class="tradingview-widget-container__widget"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" async>
    {
      "symbols": [
        { "proName": "BINANCE:BTCUSDT", "title": "Bitcoin" },
        { "proName": "BINANCE:ETHUSDT", "title": "Ethereum" },
        { "proName": "BINANCE:SOLUSDT", "title": "Solana" },
        { "proName": "BINANCE:BNBUSDT", "title": "BNB" },
        { "proName": "FX:EURUSD", "title": "EUR/USD" },
        { "proName": "FX:GBPUSD", "title": "GBP/USD" },
        { "proName": "OANDA:XAUUSD", "title": "Gold" },
        { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" }
      ],
      "showSymbolLogo": true,
      "isTransparent": true,
      "displayMode": "adaptive",
      "colorTheme": "dark",
      "locale": "en"
    }
    </script>
  </div>
</div>`;
        rewrittenHtml = rewrittenHtml.replace('</header>', `</header>${tickerWidget}`);
      }

      res.status(upstreamResponse.status).send(rewrittenHtml);
      return;
    }

    // Rewrite text assets (CSS, JS, JSON) containing domain references
    if (
      contentType.includes("text/css") ||
      contentType.includes("javascript") ||
      contentType.includes("application/json")
    ) {
      const text = upstreamResponse.body.toString("utf8");
      if (isJsPath && text.trimStart().startsWith("<")) {
        res
          .status(upstreamResponse.status >= 400 ? upstreamResponse.status : 502)
          .setHeader("Content-Type", "application/javascript; charset=utf-8")
          .send(`/* AssetCrest Proxy: invalid HTML payload suppressed for ${req.path} */`);
        return;
      }
      let rewrittenText = rewriteContent(text);
      if (contentType.includes("javascript")) {
        rewrittenText = patchJavaScript(rewrittenText);
      }
      res.status(upstreamResponse.status).send(rewrittenText);
      return;
    }

    // Binary assets (images, fonts, media, etc.)
    res.status(upstreamResponse.status).send(upstreamResponse.body);
  } catch (err: any) {
    console.error("Proxy error:", err?.message || err);

    // Return MIME-appropriate error payloads so subresources never throw SyntaxError: Unexpected token '<'
    if (/\.(?:js|mjs)$/i.test(req.path)) {
      res
        .status(502)
        .setHeader("Content-Type", "application/javascript; charset=utf-8")
        .send(`/* AssetCrest Proxy: upstream script fetch failed (${err?.message || "timeout"}) */`);
      return;
    }
    if (/\.css$/i.test(req.path)) {
      res
        .status(502)
        .setHeader("Content-Type", "text/css; charset=utf-8")
        .send(`/* AssetCrest Proxy: upstream stylesheet fetch failed */`);
      return;
    }
    if (/\.json$/i.test(req.path) || (req.headers["accept"] || "").includes("application/json")) {
      res.status(502).json({ error: "Upstream proxy unavailable", message: err?.message || "Connection timed out" });
      return;
    }
    if (STATIC_ASSET_RE.test(req.path)) {
      res.status(502).type("text/plain").send("Upstream asset unavailable");
      return;
    }

    res.status(502).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AssetCrest Proxy - Gateway Notice</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #1e293b; }
          .card { max-width: 480px; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; }
          h2 { color: #0f172a; margin-top: 0; font-size: 20px; }
          p { color: #64748b; font-size: 14px; line-height: 1.6; }
          a { display: inline-block; margin-top: 16px; padding: 10px 20px; background-color: #1b4962; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; }
          a:hover { background-color: #143547; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>AssetCrest Proxy Gateway</h2>
          <p>Connecting to upstream target (https://assetcrest.co)...</p>
          <p style="font-size: 12px; color: #94a3b8;">${err.message || "Connection timed out"}</p>
          <a href="/">Retry Connection</a>
        </div>
      </body>
      </html>
    `);
  }
}

// Check if path belongs to the Auth & After-Auth Investor Dashboard SPA
function isPortalAppRoute(reqPath: string): boolean {
  return (
    reqPath === "/app" ||
    reqPath.startsWith("/app/") ||
    reqPath === "/dashboard" ||
    reqPath.startsWith("/dashboard/") ||
    reqPath === "/login" ||
    reqPath === "/register" ||
    reqPath === "/signup" ||
    reqPath === "/logout" ||
    reqPath === "/forgot-password" ||
    reqPath === "/reset-password" ||
    reqPath.startsWith("/password") ||
    reqPath === "/user" ||
    reqPath.startsWith("/user/") ||
    reqPath === "/admin" ||
    reqPath.startsWith("/admin/")
  );
}

async function startServer() {
  if (isProduction) {
    // Serve Vite-built SPA assets and copied public files under /app
    const distDir = path.resolve("dist");
    if (fs.existsSync(distDir)) {
      app.use("/app", express.static(distDir, { index: false, redirect: false }));
    }
    const distHtmlPath = path.resolve("dist/index.html");
    app.get("*", (req, res, next) => {
      if (isPortalAppRoute(req.path) && fs.existsSync(distHtmlPath)) {
        res.sendFile(distHtmlPath);
        return;
      }
      next();
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "custom",
    });

    // Pass Vite module/HMR/asset requests under /app/ to vite.middlewares
    app.use((req, res, next) => {
      const p = req.path;
      const isViteInternal =
        p.startsWith("/app/@") ||
        p.startsWith("/app/src/") ||
        p.startsWith("/app/node_modules/") ||
        (p.startsWith("/app/") && /\.[a-z0-9]+$/i.test(p) && !p.endsWith(".html"));
      if (isViteInternal) {
        vite.middlewares(req, res, next);
        return;
      }
      next();
    });

    // Serve SPA HTML for Auth and After-Auth Investor Portal routes
    app.get("*", async (req, res, next) => {
      if (!isPortalAppRoute(req.path)) {
        next();
        return;
      }
      try {
        const indexPath = path.resolve("index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(template);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  }

  // Proxy all remaining public marketing routes to assetcrest.co
  app.all("*", handleProxy);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`AssetCrest Proxy & Investor Portal running on http://0.0.0.0:${PORT}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });
}

void startServer();
