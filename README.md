# AssetCrest Service & Proxy

High-fidelity reverse proxy and gateway service for AssetCrest (`https://assetcrest.co` and `https://app.assetcrest.co`), integrated with Cloud SQL (PostgreSQL) and Firebase Authentication.

## Features

- **Full-Fidelity Reverse Proxy**: Streams and dynamically rewrites upstream assets, URLs, and framing restrictions.
- **Client Script Error Shields**: Includes runtime patches for vendor bundles to prevent `classList` and `null` element evaluation errors.
- **Cloud SQL (PostgreSQL)**: Managed database integration using Drizzle ORM.
- **Firebase Authentication**: User authentication and secure route protection via Firebase Admin SDK.
- **Ready for Render**: Pre-configured `render.yaml` blueprint and automatic port binding for 1-click deployment on Render.com.

## Deploying to Render

1. **Push to GitHub**:
   - In AI Studio, open **More Options** (top-right menu) > **Export to GitHub** (or connect your GitHub repository).
2. **Connect to Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New** > **Blueprint** (or **Web Service**).
   - Connect your GitHub repository.
   - Render will automatically detect `render.yaml` and set:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Health Check Path**: `/api/health`
3. **Environment Variables** (Optional for Database):
   - If using external PostgreSQL, set `DATABASE_URL`.

## Local Development

```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
npm start
```
