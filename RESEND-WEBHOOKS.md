# Resend delivery webhooks

AssetCrest receives Resend email-delivery events at:

`https://assetcrestonline.com/api/webhooks/resend`

If the deployed portal uses a different canonical app host, use that host with the same path. This endpoint is separate from `/api/webhooks/inbound`, which is the portal's own outbound email-relay receiver.

## Configure in Resend

1. Open [Resend Webhooks](https://resend.com/webhooks).
2. Choose **Add Webhook**.
3. Set the endpoint URL to `https://assetcrestonline.com/api/webhooks/resend`.
4. Subscribe to these email events:
   - `email.sent`
   - `email.delivered`
   - `email.delivery_delayed`
   - `email.bounced`
   - `email.complained`
   - `email.failed`
   - `email.suppressed`
5. Save the webhook and copy its signing secret (it begins with `whsec_`).
6. In the production hosting environment, set `RESEND_WEBHOOK_SECRET` to that signing secret and redeploy/restart the service.

Do not put the Resend API key (`re_...`) in `RESEND_WEBHOOK_SECRET`. The API key remains in the server-side SMTP/API configuration; the webhook signing secret is a different credential. Never expose either secret in frontend code or commit real values to Git.

## What the endpoint does

- Accepts POST requests with the original raw JSON body.
- Verifies the Svix headers (`svix-id`, `svix-timestamp`, and `svix-signature`) using the configured signing secret.
- Rejects invalid signatures and timestamps outside a five-minute tolerance.
- Records verified delivery events in the existing automation delivery log.
- Does not treat `email.sent` as proof of delivery; `email.delivered` is the delivery confirmation event.

## Notes

- Keep the webhook URL public and HTTPS.
- If the app's live canonical host is not `assetcrestonline.com`, use the deployed app host instead; the path remains `/api/webhooks/resend`.
- Open/click tracking events are intentionally not enabled by default. Add `email.opened` or `email.clicked` only if the privacy and analytics behavior is disclosed to recipients.
- Resend may retry failed webhook deliveries. Event processing should remain observational and must not trigger balance changes, withdrawals, or investment accounting.
