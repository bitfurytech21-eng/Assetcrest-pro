# AssetCrest Service & Investor Portal

Self-hosted AssetCrest Investor Portal, Live TradingView terminal, and automated email/webhook platform (`https://assetcrestonline.com/`), integrated with Neon PostgreSQL (Drizzle ORM) and session authentication.

## Features

- **Investor Portal & Trading Terminal**: Full React SPA portal with live TradingView charting, deposit/withdrawal desks, KYC verification, and Android WebAPK builder.
- **Neon PostgreSQL**: Managed database integration using Drizzle ORM with atomic financial ledger updates.
- **Email Templates & Signed Webhooks**: Automatic transactional email templates and HMAC-signed webhook delivery.
- **Tawk.to Live Chat**: Site-wide Tawk.to widget loader, shared by the public website and investor portal. Configure the two public widget identifiers as described below.
- **Ready for Cloud Run & Render**: Automatic `PORT` binding, `/api/health` readiness endpoint, and pre-configured deployment support.

## Tawk.to live chat setup

The application already mounts `src/backend/components/TawkToChat.tsx` globally, so one widget is available across public pages and the investor portal. The loader stays inactive until both Tawk.to widget identifiers are configured; it does not create a fake chat window or duplicate a second provider widget.

1. The supplied official embed snippet identifies the AssetCrest widget as Property ID `6b08ea3c7b5efd3cb09191e5` and Widget ID `1k8dd5vd3`.
2. The loader uses those public identifiers by default, so no additional Tawk.to dashboard access or Render variable entry is required for the production widget. Optional `VITE_TAWK_PROPERTY_ID` and `VITE_TAWK_WIDGET_ID` values can override them for another environment.
3. The Tawk.to account/developer email is **customersupport@assetcrestonline.com**, and the website/property URL is **https://assetcrestonline.com/**.
4. After deploying, visit `https://assetcrestonline.com/` and an investor portal page in a fresh browser session. Confirm the chat launcher appears once and that a test message reaches the Tawk.to inbox.

The widget IDs are public embed identifiers, not passwords or API secrets. Do not put a Tawk.to account password or private API key in Vite variables or commit them to GitHub.

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
3. **Environment Variables**:
   - Set `DATABASE_URL` to the Neon pooled PostgreSQL connection string.
   - Configure the Tawk.to variables above after creating the widget.
   - Add other required production credentials through Render's Environment page; never commit secrets.

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
