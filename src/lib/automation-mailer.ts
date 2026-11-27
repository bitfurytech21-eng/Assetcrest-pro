import crypto from 'crypto';
import nodemailer from 'nodemailer';
import {
  appendAutomationDeliveryLog,
  getEmailTemplateByEventKey,
  getEmailTemplateById,
  getRawEmailDeliverySettings,
  listRawWebhookEndpoints,
  recordWebhookTriggerStatus,
  type AutomationDeliveryLogRecord,
  type EmailDeliverySettingsRecord,
  type EmailTemplateRecord,
  type WebhookEndpointRecord,
} from '../db/automationRepo.ts';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getAppBaseUrl(): string {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const hostedUrl = process.env.RENDER_EXTERNAL_URL?.trim() || process.env.VITE_SITE_URL?.trim();
  if (hostedUrl) return hostedUrl.replace(/\/+$/, '');
  const port = process.env.APPLET_ID ? 3000 : Number(process.env.PORT) || 3000;
  return `http://127.0.0.1:${port}`;
}

export function renderTemplateString(
  template: string,
  variables: Record<string, string | number | undefined>,
  escapeValues: boolean
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const raw = variables[key];
    const str = raw === undefined || raw === null ? '' : String(raw);
    return escapeValues ? escapeHtml(str) : str;
  });
}

export function renderEmailTemplate(
  tpl: EmailTemplateRecord,
  variables: Record<string, string | number | undefined>
): { subject: string; preheader: string; html: string; text: string } {
  const baseUrl = getAppBaseUrl();
  const mergedVars: Record<string, string | number | undefined> = {
    dashboardUrl: `${baseUrl}/app/dashboard`,
    resetUrl: `${baseUrl}/app/forgot-password`,
    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC',
    ...variables,
  };

  return {
    subject: renderTemplateString(tpl.subject, mergedVars, false),
    preheader: renderTemplateString(tpl.preheader, mergedVars, false),
    html: renderTemplateString(tpl.htmlBody, mergedVars, true),
    text: renderTemplateString(tpl.textBody, mergedVars, false),
  };
}

export function isSafeWebhookTarget(rawUrl: string): { ok: boolean; reason?: string } {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, reason: 'Only http:// and https:// URLs are allowed.' };
    }
    const host = parsed.hostname.toLowerCase();
    // Always block cloud metadata & link-local addresses
    if (
      host === '169.254.169.254' ||
      host.startsWith('169.254.') ||
      host === 'metadata.google.internal' ||
      host === 'metadata.goog' ||
      host === '0.0.0.0' ||
      host === '[::]' ||
      host === '::'
    ) {
      return { ok: false, reason: 'Cloud metadata and unspecified addresses are not allowed.' };
    }

    // Permit same-app /api/webhooks/inbound loopback testing on our server port only
    const appPort = String(process.env.APPLET_ID ? 3000 : Number(process.env.PORT) || 3000);
    const isLoopback = host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]';
    if (isLoopback) {
      if (parsed.pathname === '/api/webhooks/inbound' && (parsed.port || '80') === appPort) {
        return { ok: true };
      }
      return {
        ok: false,
        reason: 'Loopback URLs are restricted to /api/webhooks/inbound on the active portal port.',
      };
    }

    // Block RFC1918 private IPv4 ranges
    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const a = Number(ipv4[1]);
      const b = Number(ipv4[2]);
      if (
        a === 10 ||
        a === 127 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 169 && b === 254)
      ) {
        return { ok: false, reason: 'Private network IP addresses are not allowed.' };
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'Malformed webhook URL.' };
  }
}

/**
 * Verify Resend's Svix-signed webhook using the untouched request body.
 * Resend secrets are base64-encoded values prefixed with "whsec_".
 */
export function verifyResendWebhookSignature(
  secret: string,
  messageId: string,
  timestamp: string,
  signatureHeader: string,
  rawBody: string
): boolean {
  if (!secret || !messageId || !timestamp || !signatureHeader || !rawBody) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) {
    return false;
  }

  try {
    const encodedSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const key = Buffer.from(encodedSecret, 'base64');
    if (!key.length) return false;
    const signedContent = `${messageId}.${timestamp}.${rawBody}`;
    const expected = crypto.createHmac('sha256', key).update(signedContent).digest('base64');
    const expectedBuffer = Buffer.from(expected);
    return signatureHeader.split(' ').some((part) => {
      const [version, value] = part.split(',', 2);
      if (version !== 'v1' || !value) return false;
      const suppliedBuffer = Buffer.from(value);
      return suppliedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);
    });
  } catch {
    return false;
  }
}

export function signWebhookPayload(secret: string, timestampSec: string, rawBody: string): string {
  if (!secret) return '';
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(`${timestampSec}.${rawBody}`)
    .digest('hex');
  return `sha256=${hmac}`;
}

async function deliverViaSmtp(
  settings: EmailDeliverySettingsRecord,
  toEmail: string,
  subject: string,
  html: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    return { ok: false, error: 'SMTP host/credentials not configured' };
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpSecure || settings.smtpPort === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  await transporter.sendMail({
    from: `"${settings.fromName}" <${settings.fromEmail}>`,
    replyTo: settings.replyTo || settings.fromEmail,
    to: toEmail,
    subject,
    html,
    text,
  });

  return { ok: true };
}

async function deliverViaEmailWebhook(
  webhookUrl: string,
  secret: string,
  eventKey: string,
  payload: Record<string, unknown>,
  customHeaders: Record<string, string> = {}
): Promise<{ ok: boolean; httpStatus?: number; error?: string; responseSnippet?: string }> {
  const safeCheck = isSafeWebhookTarget(webhookUrl);
  if (!safeCheck.ok) {
    return { ok: false, error: safeCheck.reason || 'Blocked target URL' };
  }

  const timestampSec = String(Math.floor(Date.now() / 1000));
  const deliveryId = crypto.randomUUID();
  const rawBody = JSON.stringify(payload);
  const signature = signWebhookPayload(secret, timestampSec, rawBody);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'AssetCrest-Automation/1.0',
    'X-AssetCrest-Event': eventKey,
    'X-AssetCrest-Delivery': deliveryId,
    'X-AssetCrest-Timestamp': timestampSec,
    ...customHeaders,
  };
  if (signature) {
    headers['X-AssetCrest-Signature'] = signature;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: rawBody,
      signal: AbortSignal.timeout(10000),
    });
    const text = await response.text().catch(() => '');
    return {
      ok: response.ok,
      httpStatus: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}: ${text.slice(0, 180)}`,
      responseSnippet: text.slice(0, 200),
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Webhook request failed',
    };
  }
}

export async function dispatchEmailWithSettings(params: {
  eventKey: string;
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  variables?: Record<string, unknown>;
}): Promise<AutomationDeliveryLogRecord> {
  const settings = await getRawEmailDeliverySettings();
  const canSmtp = Boolean(settings.smtpHost && settings.smtpUser && settings.smtpPass);
  const canWebhook = Boolean(settings.emailWebhookUrl);

  const emailRelayBody = {
    event: 'email.send',
    triggerEvent: params.eventKey,
    from: { name: settings.fromName, email: settings.fromEmail },
    replyTo: settings.replyTo,
    to: params.toEmail,
    subject: params.subject,
    html: params.html,
    text: params.text,
    variables: params.variables || {},
    sentAt: new Date().toISOString(),
  };

  let status: AutomationDeliveryLogRecord['status'] = 'Queued';
  let httpStatus: number | undefined;
  let errorMessage: string | undefined;

  const trySmtp = settings.mode === 'smtp' || (settings.mode === 'auto' && canSmtp);
  const tryWebhook =
    settings.mode === 'webhook' || (settings.mode === 'auto' && !canSmtp && canWebhook);

  let smtpFailed = false;
  if (trySmtp) {
    try {
      const res = await deliverViaSmtp(settings, params.toEmail, params.subject, params.html, params.text);
      if (res.ok) {
        status = 'Sent';
      } else {
        status = 'Failed';
        errorMessage = res.error;
        smtpFailed = true;
      }
    } catch (err: any) {
      status = 'Failed';
      errorMessage = err?.message || 'SMTP send error';
      smtpFailed = true;
    }
  }

  // In auto mode only, use the configured relay if SMTP delivery fails.
  if ((!trySmtp || (settings.mode === 'auto' && smtpFailed)) && tryWebhook && settings.emailWebhookUrl) {
    const res = await deliverViaEmailWebhook(
      settings.emailWebhookUrl,
      settings.emailWebhookSecret,
      params.eventKey,
      emailRelayBody
    );
    httpStatus = res.httpStatus;
    if (res.ok) {
      status = 'Sent';
      errorMessage = undefined;
    } else {
      status = 'Failed';
      errorMessage = res.error || errorMessage;
    }
  } else if (!trySmtp && !tryWebhook) {
    // Also check if any active webhook endpoint has deliveryMode === 'email_relay'
    const webhooks = await listRawWebhookEndpoints();
    const relayHook = webhooks.find(
      (w) =>
        w.isActive &&
        w.deliveryMode === 'email_relay' &&
        (w.subscribedEvents.includes('*') || w.subscribedEvents.includes(params.eventKey))
    );
    if (relayHook) {
      const res = await deliverViaEmailWebhook(
        relayHook.url,
        relayHook.signingSecret,
        params.eventKey,
        emailRelayBody,
        relayHook.customHeaders
      );
      httpStatus = res.httpStatus;
      await recordWebhookTriggerStatus(relayHook.id, res.httpStatus || 0).catch(() => {});
      if (res.ok) {
        status = 'Sent';
      } else {
        status = 'Failed';
        errorMessage = res.error;
      }
    } else {
      status = 'Queued';
      errorMessage =
        'Template rendered and logged. Configure SMTP or Email Relay Webhook in Admin Console to deliver externally.';
    }
  }

  return appendAutomationDeliveryLog({
    kind: 'email',
    eventKey: params.eventKey,
    target: params.toEmail,
    subjectOrMethod: params.subject,
    status,
    httpStatus,
    errorMessage,
    payloadPreview: JSON.stringify({
      to: params.toEmail,
      subject: params.subject,
      text: params.text.slice(0, 450),
    }),
  });
}

async function triggerWebhookEndpoint(
  hook: WebhookEndpointRecord,
  eventKey: string,
  payload: Record<string, unknown>
): Promise<AutomationDeliveryLogRecord> {
  const res = await deliverViaEmailWebhook(
    hook.url,
    hook.signingSecret,
    eventKey,
    payload,
    hook.customHeaders
  );
  await recordWebhookTriggerStatus(hook.id, res.httpStatus || 0).catch(() => {});

  return appendAutomationDeliveryLog({
    kind: 'webhook',
    eventKey,
    target: hook.url,
    subjectOrMethod: `${hook.name} (${hook.deliveryMode})`,
    status: res.ok ? 'Delivered' : 'Failed',
    httpStatus: res.httpStatus,
    errorMessage: res.error,
    payloadPreview: JSON.stringify(payload).slice(0, 900),
  });
}

export async function dispatchPortalAutomation(params: {
  eventKey: string;
  recipientEmail?: string;
  variables?: Record<string, string | number | undefined>;
  webhookData?: Record<string, unknown>;
  adminCopyEmail?: string;
}): Promise<void> {
  try {
    const [tpl, settings, webhooks] = await Promise.all([
      getEmailTemplateByEventKey(params.eventKey),
      getRawEmailDeliverySettings(),
      listRawWebhookEndpoints(),
    ]);

    let renderedEmail: { subject: string; preheader: string; html: string; text: string } | null =
      null;

    if (tpl && tpl.enabled && params.recipientEmail) {
      renderedEmail = renderEmailTemplate(tpl, params.variables || {});
      await dispatchEmailWithSettings({
        eventKey: params.eventKey,
        toEmail: params.recipientEmail,
        subject: renderedEmail.subject,
        html: renderedEmail.html,
        text: renderedEmail.text,
        variables: params.variables,
      });

      if (
        settings.notifyAdminOnEvents &&
        params.adminCopyEmail &&
        params.adminCopyEmail.toLowerCase() !== params.recipientEmail.toLowerCase()
      ) {
        await dispatchEmailWithSettings({
          eventKey: `${params.eventKey}.admin_notice`,
          toEmail: params.adminCopyEmail,
          subject: `[Admin Alert] ${renderedEmail.subject}`,
          html: renderedEmail.html,
          text: renderedEmail.text,
          variables: params.variables,
        });
      }
    }

    const matchingHooks = webhooks.filter(
      (w) =>
        w.isActive &&
        (w.subscribedEvents.includes('*') || w.subscribedEvents.includes(params.eventKey))
    );

    for (const hook of matchingHooks) {
      const payload =
        hook.deliveryMode === 'email_relay' && renderedEmail
          ? {
              event: params.eventKey,
              timestamp: new Date().toISOString(),
              email: {
                to: params.recipientEmail,
                from: `${settings.fromName} <${settings.fromEmail}>`,
                replyTo: settings.replyTo,
                subject: renderedEmail.subject,
                html: renderedEmail.html,
                text: renderedEmail.text,
              },
              data: params.webhookData || params.variables || {},
            }
          : {
              event: params.eventKey,
              timestamp: new Date().toISOString(),
              recipientEmail: params.recipientEmail || null,
              data: params.webhookData || params.variables || {},
            };

      await triggerWebhookEndpoint(hook, params.eventKey, payload);
    }
  } catch (err) {
    console.error(`[AssetCrest Automation] Failed dispatching ${params.eventKey}:`, err);
  }
}

export async function sendTestTemplateEmail(
  templateId: string,
  targetEmail: string
): Promise<AutomationDeliveryLogRecord> {
  const tpl = await getEmailTemplateById(templateId);
  if (!tpl) throw new Error('Email template not found.');

  const cleanEmail = targetEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Provide a valid test recipient email address.');
  }

  const sampleVars: Record<string, string | number> = {
    name: 'Test Investor',
    username: 'testinvestor',
    email: cleanEmail,
    country: 'United Kingdom',
    referralCode: 'TESTINV',
    code: '482910',
    txId: 'TX-TEST-1001',
    amount: '2,500.00',
    method: 'USDC (BEP20)',
    status: 'Completed',
    newBalance: '12,500.00',
    destination: 'Configured Settlement Address',
    note: 'Sample automated AssetCrest notification',
    legalName: 'Test Investor',
    documentType: 'Passport',
    adminNote: 'Documents verified cleanly.',
    investmentId: 'INV-TEST-2026',
    category: 'Standard',
    planName: 'Prime',
    dailyRate: '1.72%',
    durationDays: 30,
    fromName: 'Jordan Taylor',
    transferId: 'TRF-TEST-88',
    ticketId: 'MSG-TEST-404',
    senderEmail: cleanEmail,
    targetDeskEmail: 'info@assetcrestonline.com',
    subject: 'Sample Concierge Inquiry',
    message: 'Automated email template delivery verification message.',
    planCount: 2,
  };

  const rendered = renderEmailTemplate(tpl, sampleVars);
  return dispatchEmailWithSettings({
    eventKey: `${tpl.eventKey}.test`,
    toEmail: cleanEmail,
    subject: `[TEST] ${rendered.subject}`,
    html: rendered.html,
    text: rendered.text,
    variables: sampleVars,
  });
}

export async function sendTestWebhookEndpoint(
  webhookId: string
): Promise<AutomationDeliveryLogRecord> {
  const list = await listRawWebhookEndpoints();
  const hook = list.find((w) => w.id === webhookId);
  if (!hook) throw new Error('Webhook endpoint not found.');

  const payload = {
    event: 'webhook.test',
    webhookId: hook.id,
    webhookName: hook.name,
    timestamp: new Date().toISOString(),
    data: {
      message: 'Live signed webhook verification payload from AssetCrest Portal.',
      platform: 'AssetCrest',
    },
  };

  return triggerWebhookEndpoint(hook, 'webhook.test', payload);
}

export function verifyInboundWebhookHmac(
  secret: string,
  timestampHeader: string | undefined,
  signatureHeader: string | undefined,
  rawBody: string
): boolean {
  if (!secret) return true;
  if (!signatureHeader) return false;

  const expectedWithTs = timestampHeader
    ? signWebhookPayload(secret, timestampHeader, rawBody)
    : '';
  const expectedRawOnly = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')}`;

  const sigBuf = Buffer.from(signatureHeader);
  for (const candidate of [expectedWithTs, expectedRawOnly]) {
    if (!candidate) continue;
    const candBuf = Buffer.from(candidate);
    if (sigBuf.length === candBuf.length && crypto.timingSafeEqual(sigBuf, candBuf)) {
      return true;
    }
  }
  return false;
}
