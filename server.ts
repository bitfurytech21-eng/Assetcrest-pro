import express from "express";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getUsers, getOrCreateUser } from "./src/db/users.ts";
import { createPool } from "./src/db/index.ts";
import { renderTradingPage } from "./src/trading/tradingPage.ts";

const app = express();
const PORT = process.env.RENDER ? (Number(process.env.PORT) || 3000) : 3000;


// Parse raw bodies for POST/PUT requests (form submissions, JSON, uploads)
app.use(express.raw({ type: "*/*", limit: "50mb" }));

// Enable CORS for all assets and endpoints
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Real functioning health check endpoint (checks Cloud SQL connection and upstream proxy)
app.get("/api/health", async (_req, res) => {
  let dbStatus = "connected";
  try {
    const pool = createPool();
    await pool.query("SELECT 1;");
  } catch (err: any) {
    dbStatus = "disconnected: " + (err.message || "error");
  }

  let upstreamStatus = "connected";
  try {
    const upstream = await fetch("https://assetcrest.co/", { method: "HEAD" });
    upstreamStatus = upstream.ok ? "connected" : `status ${upstream.status}`;
  } catch (err: any) {
    upstreamStatus = "unreachable: " + (err.message || "error");
  }

  res.json({
    status: dbStatus.startsWith("connected") ? "ok" : "degraded",
    database: dbStatus,
    region: "europe-west3",
    target: "https://assetcrest.co",
    appTarget: "https://app.assetcrest.co",
    upstream: upstreamStatus,
    timestamp: new Date().toISOString(),
  });
});

// Protected user profile endpoint
app.get("/api/user/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await getOrCreateUser(req.user.uid, req.user.email || "", req.user.name);
    res.json(user);
  } catch (error: any) {
    console.error("Failed to fetch user profile:", error);
    res.status(500).json({ error: error.message || "Failed to fetch user profile" });
  }
});

// Protected database API route
app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ error: error.message || "Failed to fetch users" });
  }
});

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
    // Tempus Dominus: date/month view disabled toggles
    .replaceAll(
      's.classList.remove(i.css.disabled):s.classList.add(i.css.disabled)',
      '(s&&s.classList&&s.classList.remove(i.css.disabled)):(s&&s.classList&&s.classList.add(i.css.disabled))'
    )
    .replaceAll(
      's.setAttribute(i.css.monthsContainer,',
      's&&s.setAttribute(i.css.monthsContainer,'
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

    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body: hasBody ? req.body : undefined,
      redirect: "manual",
    });

    // Forward and rewrite Set-Cookie headers
    const rawCookies = upstreamResponse.headers.getSetCookie
      ? upstreamResponse.headers.getSetCookie()
      : [];
    if (rawCookies && rawCookies.length > 0) {
      const rewrittenCookies = rawCookies.map((cookie) =>
        cookie.replace(/Domain=[^;]+;?/gi, "").replace(/Secure;?/gi, "")
      );
      res.setHeader("Set-Cookie", rewrittenCookies);
    }

    // Handle redirects (301, 302, 303, 307, 308)
    if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
      const location = upstreamResponse.headers.get("location");
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

    const contentType = upstreamResponse.headers.get("content-type") || "";
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const cacheControl = upstreamResponse.headers.get("cache-control");
    if (cacheControl) {
      res.setHeader("Cache-Control", cacheControl);
    }

    // Strip framing restrictions to ensure seamless preview embedding
    res.removeHeader("X-Frame-Options");
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("Content-Security-Policy-Report-Only");

    // Rewrite HTML responses
    if (contentType.includes("text/html")) {
      const html = await upstreamResponse.text();
      let rewrittenHtml = rewriteContent(html);
      const guardScript = `<script>
(function() {
  window.addEventListener('error', function(e) {
    if (e && e.message && (e.message.includes('classList') || e.message.includes('null is not an object'))) {
      console.warn('Prevented null element classList error:', e.message);
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
      const text = await upstreamResponse.text();
      let rewrittenText = rewriteContent(text);
      if (contentType.includes("javascript")) {
        rewrittenText = patchJavaScript(rewrittenText);
      }
      res.status(upstreamResponse.status).send(rewrittenText);
      return;
    }

    // Binary assets (images, fonts, media, etc.)
    const buffer = Buffer.from(await upstreamResponse.arrayBuffer());
    res.status(upstreamResponse.status).send(buffer);
  } catch (err: any) {
    console.error("Proxy error:", err);
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

// Proxy all requests
app.all("*", handleProxy);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AssetCrest Proxy Server running on http://0.0.0.0:${PORT}`);
});
