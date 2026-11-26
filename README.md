# AssetCrest Service & Investor Portal

Self-hosted AssetCrest Investor Portal, Live TradingView terminal, and automated email/webhook platform (`https://ais-pre-hd6te2izxiipwr3ixqdkmp-130818804329.europe-west1.run.app`), integrated with Neon PostgreSQL (Drizzle ORM) and session authentication.

## Features

- **Investor Portal & Trading Terminal**: Full React SPA portal with live TradingView charting, deposit/withdrawal desks, KYC verification, and Android WebAPK builder.
- **Neon PostgreSQL**: Managed database integration using Drizzle ORM with atomic financial ledger updates.
- **Email Templates & Signed Webhooks**: Automatic transactional email templates and HMAC-signed webhook delivery.
- **Ready for Cloud Run & Render**: Automatic `PORT` binding, `/api/health` readiness endpoint, and pre-configured deployment support.

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
