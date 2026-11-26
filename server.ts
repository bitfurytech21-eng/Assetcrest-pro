import "./src/lib/load-env.ts";
import express from "express";
import fs from "fs";
import path from "path";
import { requireAdmin, requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getUsers, getUserById } from "./src/db/users.ts";
import { createPool, isDatabaseConfigured } from "./src/db/index.ts";
import { getMemoryUserById, ensureNeonSchemaAndSeed, getAdminSetupStatus } from "./src/db/neonRepo.ts";
import { ensureAutomationSchemaAndSeed } from "./src/db/automationRepo.ts";
import { createNeonApiRouter } from "./src/api/neonRoutes.ts";
import { renderTradingPage } from "./src/trading/tradingPage.ts";
import { handleApkPackagePost } from "./src/api/apkPackage.ts";
import { fetchLiveCryptoPricesUsd } from "./src/lib/market-prices.ts";

const HOME_UPSTREAM_URL = (
  process.env.HOME_UPSTREAM_URL?.trim() || "https://assetcrest-pro-bqm8.onrender.com"
).replace(/\/+$/, "");

function isPortalAppPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (p === "/app" || p.startsWith("/app/")) return true;
  if (p === "/admin" || p.startsWith("/admin/")) return true;
  if (
    p === "/login" ||
    p === "/register" ||
    p === "/signup" ||
    p === "/logout" ||
    p === "/forgot-password" ||
    p === "/reset-password" ||
    p.startsWith("/password") ||
    p.startsWith("/user/profile")
  ) {
    return true;
  }
  if (
    p.startsWith("/@") ||
    p.startsWith("/src/") ||
    p.startsWith("/node_modules/") ||
    p.startsWith("/assets/aistudio/") ||
    p.startsWith("/.well-known/") ||
    p === "/manifest.json" ||
    p === "/sw.js" ||
    p === "/icon.svg" ||
    p === "/icon-192.png" ||
    p === "/icon-512.png" ||
    p === "/icon-maskable-512.png" ||
    p === "/apple-touch-icon.png"
  ) {
    return true;
  }
  return false;
}

async function proxyHomePageUpstream(req: express.Request, res: express.Response): Promise<void> {
  const targetUrl = `${HOME_UPSTREAM_URL}${req.originalUrl || req.url || "/"}`;
  const headers = new Headers();
  if (req.headers.accept) headers.set("accept", String(req.headers.accept));
  if (req.headers["accept-language"]) {
    headers.set("accept-language", String(req.headers["accept-language"]));
  }
  if (req.headers["content-type"]) {
    headers.set("content-type", String(req.headers["content-type"]));
  }
  if (req.headers["user-agent"]) {
    headers.set("user-agent", String(req.headers["user-agent"]));
  }

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD" && Buffer.isBuffer(req.body) && req.body.length > 0;

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? new Uint8Array(req.body) : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(25000),
    });

    res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        lower === "content-encoding" ||
        lower === "content-length" ||
        lower === "transfer-encoding" ||
        lower === "connection" ||
        lower === "keep-alive" ||
        lower === "x-frame-options" ||
        lower === "content-security-policy" ||
        lower === "content-security-policy-report-only" ||
        lower === "set-cookie" ||
        lower.startsWith("access-control-")
      ) {
        return;
      }
      if (lower === "location") {
        const rewritten = value.toLowerCase().startsWith(HOME_UPSTREAM_URL.toLowerCase())
          ? value.slice(HOME_UPSTREAM_URL.length) || "/"
          : value;
        res.setHeader("location", rewritten);
        return;
      }
      res.setHeader(key, value);
    });

    const setCookies =
      typeof (upstream.headers as any).getSetCookie === "function"
        ? ((upstream.headers as any).getSetCookie() as string[])
        : upstream.headers.get("set-cookie")
          ? [upstream.headers.get("set-cookie") as string]
          : [];
    for (const cookie of setCookies) {
      res.append("set-cookie", cookie);
    }

    if (method === "HEAD") {
      res.end();
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (err: any) {
    console.error("[AssetCrest] Home proxy error for", targetUrl, err?.message || err);
    res.status(502).type("text/plain").send("AssetCrest home page upstream is temporarily unavailable.");
  }
}

function getRequestOrigin(req: express.Request): string {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https")
    .split(",")[0]
    .trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim();
  return host ? `${proto}://${host}` : `http://127.0.0.1:${PORT}`;
}

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const PORT = isProduction
  ? Number(process.env.PORT) || 3000
  : process.env.APPLET_ID
    ? 3000
    : Number(process.env.PORT) || 3000;

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

// Real functioning health check endpoint (checks Neon PostgreSQL connection)
app.get("/api/health", async (req, res) => {
  let dbStatus = isDatabaseConfigured ? "connected" : "fallback-memory (set DATABASE_URL for Neon)";
  if (isDatabaseConfigured) {
    try {
      const pool = createPool();
      await pool.query("SELECT 1;");
    } catch (err: any) {
      dbStatus = "disconnected: " + (err.message || "error");
    }
  }

  const origin = getRequestOrigin(req);
  const dbReady = !isDatabaseConfigured || dbStatus === "connected";
  res.status(200).json({
    status: isDatabaseConfigured && dbStatus === "connected" ? "ok" : "degraded",
    engine: isDatabaseConfigured ? "neon-postgresql" : "in-memory-fallback",
    database: dbStatus,
    dbReady,
    target: origin,
    appTarget: `${origin}/app`,
    upstream: "self-hosted",
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

// Public live Binance spot prices for portfolio & swap valuation
app.get("/api/market-data/prices", async (_req, res) => {
  try {
    const result = await fetchLiveCryptoPricesUsd();
    res.setHeader("Cache-Control", "public, max-age=3");
    res.json({
      source: "binance",
      prices: result.prices,
      updatedAt: result.updatedAt,
    });
  } catch (err: any) {
    res.status(502).json({
      error: err?.message || "Live exchange price feed is temporarily unavailable.",
    });
  }
});

// Public Binance market data. This provides genuine quotes, order-book depth and
// recent exchange trades. Order execution remains disabled until a broker is connected.
const BINANCE_MARKET_SYMBOLS = new Set([
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT",
]);
const marketDataCache = new Map<string, { expiresAt: number; payload: unknown }>();

app.get("/api/market-data/:kind/:symbol", async (req, res) => {
  const kind = String(req.params.kind || "").toLowerCase();
  const symbol = String(req.params.symbol || "").toUpperCase();
  if (!BINANCE_MARKET_SYMBOLS.has(symbol) || !["quote", "depth", "trades"].includes(kind)) {
    res.status(400).json({ error: "Unsupported market data request." });
    return;
  }

  const cacheKey = kind + ":" + symbol;
  const cached = marketDataCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.setHeader("Cache-Control", "public, max-age=2");
    res.json(cached.payload);
    return;
  }

  const resource = kind === "quote"
    ? "ticker/24hr?symbol=" + symbol
    : kind === "depth"
      ? "depth?symbol=" + symbol + "&limit=10"
      : "trades?symbol=" + symbol + "&limit=10";

  try {
    const upstream = await fetch("https://api.binance.com/api/v3/" + resource, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": "AssetCrest-MarketData/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) {
      res.status(502).json({ error: "The exchange market-data provider is temporarily unavailable." });
      return;
    }
    const payload = await upstream.json();
    marketDataCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + (kind === "quote" ? 5000 : 2000),
    });
    res.setHeader("Cache-Control", "public, max-age=2");
    res.json(payload);
  } catch {
    res.status(502).json({ error: "Unable to retrieve live exchange market data." });
  }
});

// Return JSON 404 for unknown /api/* endpoints
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

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

async function startServer() {
  if (isProduction) {
    if (!isDatabaseConfigured) {
      console.warn("[AssetCrest] DATABASE_URL not configured in production; starting with in-memory fallback.");
      await ensureNeonSchemaAndSeed().catch((err) =>
        console.warn("[AssetCrest] In-memory seed warning:", err)
      );
      await ensureAutomationSchemaAndSeed().catch((err) =>
        console.warn("[AssetCrest] Automation memory seed warning:", err)
      );
    } else {
      try {
        const pool = createPool();
        await pool.query("SELECT 1;");
        await ensureNeonSchemaAndSeed();
        await ensureAutomationSchemaAndSeed();
        const adminSetup = await getAdminSetupStatus();
        if (!adminSetup.adminClaimed) {
          console.warn(
            "[AssetCrest] No administrator password is set yet. Visit the portal Sign In screen (/api/auth/claim-admin) or set ADMIN_PASSWORD."
          );
        } else {
          console.log("[AssetCrest] Neon PostgreSQL, required schemas, and administrator setup checks passed.");
        }
      } catch (err) {
        console.warn(
          "[AssetCrest] Startup database initialization deferred (server will still bind port):",
          err
        );
      }
    }

    // Serve Vite-built SPA assets and copied public files under both /app and /
    const distDir = path.resolve("dist");
    if (fs.existsSync(distDir)) {
      app.use("/app", express.static(distDir, { index: false, redirect: false }));
      app.use(express.static(distDir, { index: false }));
    }

    // Proxy the AssetCrest home page and marketing subpages/assets untouched from upstream
    app.use((req, res, next) => {
      if (isPortalAppPath(req.path)) {
        next();
        return;
      }
      void proxyHomePageUpstream(req, res);
    });

    const distHtmlPath = path.resolve("dist/index.html");
    app.get("*", (req, res) => {
      if (/\.(?:js|mjs|css|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|otf|json|txt|xml)$/i.test(req.path)) {
        res.status(404).type("text/plain").send("Asset not found");
        return;
      }
      if (fs.existsSync(distHtmlPath)) {
        res.sendFile(distHtmlPath);
        return;
      }
      res.status(503).type("text/plain").send("AssetCrest Portal build missing. Run npm run build.");
    });
  } else {
    // Proxy the AssetCrest home page and marketing subpages/assets untouched from upstream
    app.use((req, res, next) => {
      if (isPortalAppPath(req.path)) {
        next();
        return;
      }
      void proxyHomePageUpstream(req, res);
    });

    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "custom",
    });

    // Pass Vite module/HMR/asset requests to vite.middlewares
    app.use((req, res, next) => {
      const p = req.path;
      const isViteInternal =
        p.startsWith("/app/@") ||
        p.startsWith("/app/src/") ||
        p.startsWith("/app/node_modules/") ||
        p.startsWith("/@") ||
        p.startsWith("/src/") ||
        p.startsWith("/node_modules/") ||
        (/\.[a-z0-9]+$/i.test(p) && !p.endsWith(".html"));
      if (isViteInternal) {
        vite.middlewares(req, res, next);
        return;
      }
      next();
    });

    // Serve SPA HTML for /app/*, /admin/*, /login, /register, and portal routes
    app.get("*", async (req, res, next) => {
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`AssetCrest Investor Portal running on http://0.0.0.0:${PORT}`);
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

void startServer().catch((err) => {
  console.error("[AssetCrest] Startup failed:", err);
  process.exit(1);
});
