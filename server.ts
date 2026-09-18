import express from "express";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getUsers } from "./src/db/users.ts";

const app = express();
const PORT = 3000;

// Parse raw bodies for POST/PUT requests (form submissions, JSON, uploads)
app.use(express.raw({ type: "*/*", limit: "50mb" }));

// Enable CORS for all assets and endpoints
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database: "cloudsql-postgres",
    region: "europe-west3",
    target: "https://assetcrest.co",
    appTarget: "https://app.assetcrest.co",
    timestamp: new Date().toISOString(),
  });
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

// Proxy handler for AssetCrest
async function handleProxy(req: express.Request, res: express.Response) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const isApp =
      req.path.startsWith("/app") ||
      req.path === "/login" ||
      req.path === "/register" ||
      req.path === "/forgot-password" ||
      req.path.startsWith("/password") ||
      req.path.startsWith("/dashboard") ||
      req.path.startsWith("/admin") ||
      req.path.startsWith("/livewire") ||
      req.path.startsWith("/storage") ||
      req.path.startsWith("/themes");

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

    // Handle redirects (301, 302, 303, 307, 308)
    if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
      const location = upstreamResponse.headers.get("location");
      if (location) {
        let rewrittenLocation = location
          .replace(/^https?:\/\/assetcrest\.co\//, "/")
          .replace(/^https?:\/\/assetcrest\.co/, "/")
          .replace(/^https?:\/\/app\.assetcrest\.co\//, "/app/")
          .replace(/^https?:\/\/app\.assetcrest\.co/, "/app");
        res.setHeader("Location", rewrittenLocation);
      }
      res.status(upstreamResponse.status).end();
      return;
    }

    const contentType = upstreamResponse.headers.get("content-type") || "";
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

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
      const rewrittenHtml = rewriteContent(html);
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
      const rewrittenText = rewriteContent(text);
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
