import crypto from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { createPool, db, isDatabaseConfigured } from './index.ts';
import {
  automationDeliveryLogs,
  emailDeliverySettings,
  emailTemplates,
  webhookEndpoints,
} from './schema.ts';
import {
  DEFAULT_EMAIL_TEMPLATES,
  type EmailTemplateCategory,
  type EmailTemplateDefinition,
} from '../lib/email-templates-seed.ts';

export type MailDeliveryMode = 'auto' | 'smtp' | 'webhook';

export interface EmailTemplateRecord extends EmailTemplateDefinition {
  updatedAt: string;
}

export interface WebhookEndpointRecord {
  id: string;
  name: string;
  url: string;
  signingSecret: string;
  subscribedEvents: string[];
  isActive: boolean;
  deliveryMode: 'event' | 'email_relay';
  customHeaders: Record<string, string>;
  lastTriggeredAt?: string;
  lastStatusCode?: number;
  createdAt: string;
}

export interface PublicWebhookEndpointRecord extends Omit<WebhookEndpointRecord, 'signingSecret'> {
  hasSigningSecret: boolean;
  signingSecretPreview: string;
}

export interface EmailDeliverySettingsRecord {
  id: string;
  mode: MailDeliveryMode;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  emailWebhookUrl: string;
  emailWebhookSecret: string;
  notifyAdminOnEvents: boolean;
}

export interface PublicEmailDeliverySettings {
  mode: MailDeliveryMode;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  hasSmtpPass: boolean;
  hasResendApiKey: boolean;
  emailWebhookUrl: string;
  hasEmailWebhookSecret: boolean;
  notifyAdminOnEvents: boolean;
}

export interface AutomationDeliveryLogRecord {
  id: string;
  kind: 'email' | 'webhook';
  eventKey: string;
  target: string;
  subjectOrMethod: string;
  status: 'Sent' | 'Delivered' | 'Queued' | 'Skipped' | 'Failed';
  httpStatus?: number;
  errorMessage?: string;
  payloadPreview: string;
  createdAt: string;
}

function nowStamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function nextAutoId(prefix: string): string {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${Date.now()}-${rand}`;
}

function envDefaultSettings(): EmailDeliverySettingsRecord {
  return {
    id: 'default',
    mode: 'auto',
    fromName: 'AssetCrest',
    fromEmail: (process.env.SMTP_FROM || 'info@assetcrestonline.com').trim(),
    replyTo: 'info@assetcrestonline.com',
    smtpHost: (process.env.SMTP_HOST || '').trim(),
    smtpPort: Number(process.env.SMTP_PORT || 587) || 587,
    smtpSecure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    smtpUser: (process.env.SMTP_USER || '').trim(),
    smtpPass: (process.env.SMTP_PASS || '').trim(),
    emailWebhookUrl: (process.env.EMAIL_WEBHOOK_URL || '').trim(),
    emailWebhookSecret: (process.env.EMAIL_WEBHOOK_SECRET || '').trim(),
    notifyAdminOnEvents: true,
  };
}

const memoryAutomationState: {
  initialized: boolean;
  templates: EmailTemplateRecord[];
  webhooks: WebhookEndpointRecord[];
  mailSettings: EmailDeliverySettingsRecord;
  logs: AutomationDeliveryLogRecord[];
} = {
  initialized: false,
  templates: [],
  webhooks: [],
  mailSettings: envDefaultSettings(),
  logs: [],
};

function ensureMemoryAutomationSeeded() {
  if (memoryAutomationState.initialized) return;
  memoryAutomationState.initialized = true;
  const stamp = nowStamp();
  memoryAutomationState.templates = DEFAULT_EMAIL_TEMPLATES.map((t) => ({
    ...t,
    updatedAt: stamp,
  }));
  memoryAutomationState.mailSettings = envDefaultSettings();

  const envPortalWebhookUrl = process.env.PORTAL_WEBHOOK_URL?.trim();
  if (envPortalWebhookUrl) {
    memoryAutomationState.webhooks.push({
      id: 'whk-env-default',
      name: 'Primary Portal Webhook (ENV)',
      url: envPortalWebhookUrl,
      signingSecret: process.env.PORTAL_WEBHOOK_SECRET?.trim() || '',
      subscribedEvents: ['*'],
      isActive: true,
      deliveryMode: 'event',
      customHeaders: {},
      createdAt: stamp,
    });
  }
}

let automationSchemaPromise: Promise<void> | null = null;

export async function ensureAutomationSchemaAndSeed(): Promise<void> {
  if (!isDatabaseConfigured) {
    ensureMemoryAutomationSeeded();
    return;
  }
  if (automationSchemaPromise) return automationSchemaPromise;

  automationSchemaPromise = (async () => {
    const pool = createPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id TEXT PRIMARY KEY,
        event_key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        subject TEXT NOT NULL,
        preheader TEXT NOT NULL DEFAULT '',
        html_body TEXT NOT NULL,
        text_body TEXT NOT NULL,
        variables JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        signing_secret TEXT NOT NULL DEFAULT '',
        subscribed_events JSONB NOT NULL DEFAULT '["*"]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        delivery_mode TEXT NOT NULL DEFAULT 'event',
        custom_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
        last_triggered_at TEXT,
        last_status_code INTEGER,
        created_at TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS email_delivery_settings (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL DEFAULT 'auto',
        from_name TEXT NOT NULL DEFAULT 'AssetCrest',
        from_email TEXT NOT NULL DEFAULT 'info@assetcrestonline.com',
        reply_to TEXT NOT NULL DEFAULT 'info@assetcrestonline.com',
        smtp_host TEXT NOT NULL DEFAULT '',
        smtp_port INTEGER NOT NULL DEFAULT 587,
        smtp_secure BOOLEAN NOT NULL DEFAULT FALSE,
        smtp_user TEXT NOT NULL DEFAULT '',
        smtp_pass TEXT NOT NULL DEFAULT '',
        email_webhook_url TEXT NOT NULL DEFAULT '',
        email_webhook_secret TEXT NOT NULL DEFAULT '',
        notify_admin_on_events BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS automation_delivery_logs (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        event_key TEXT NOT NULL,
        target TEXT NOT NULL,
        subject_or_method TEXT NOT NULL,
        status TEXT NOT NULL,
        http_status INTEGER,
        error_message TEXT,
        payload_preview TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
    `);

    for (const tpl of DEFAULT_EMAIL_TEMPLATES) {
      await db
        .insert(emailTemplates)
        .values({
          id: tpl.id,
          eventKey: tpl.eventKey,
          name: tpl.name,
          category: tpl.category,
          enabled: tpl.enabled,
          subject: tpl.subject,
          preheader: tpl.preheader,
          htmlBody: tpl.htmlBody,
          textBody: tpl.textBody,
          variables: tpl.variables,
        })
        .onConflictDoNothing();
    }

    const existingSettings = await db
      .select({ id: emailDeliverySettings.id })
      .from(emailDeliverySettings)
      .where(eq(emailDeliverySettings.id, 'default'))
      .limit(1);

    if (existingSettings.length === 0) {
      const defaults = envDefaultSettings();
      await db
        .insert(emailDeliverySettings)
        .values({
          id: 'default',
          mode: defaults.mode,
          fromName: defaults.fromName,
          fromEmail: defaults.fromEmail,
          replyTo: defaults.replyTo,
          smtpHost: defaults.smtpHost,
          smtpPort: defaults.smtpPort,
          smtpSecure: defaults.smtpSecure,
          smtpUser: defaults.smtpUser,
          smtpPass: defaults.smtpPass,
          emailWebhookUrl: defaults.emailWebhookUrl,
          emailWebhookSecret: defaults.emailWebhookSecret,
          notifyAdminOnEvents: defaults.notifyAdminOnEvents,
        })
        .onConflictDoNothing();
    }

    const envPortalWebhookUrl = process.env.PORTAL_WEBHOOK_URL?.trim();
    if (envPortalWebhookUrl) {
      await db
        .insert(webhookEndpoints)
        .values({
          id: 'whk-env-default',
          name: 'Primary Portal Webhook (ENV)',
          url: envPortalWebhookUrl,
          signingSecret: process.env.PORTAL_WEBHOOK_SECRET?.trim() || '',
          subscribedEvents: ['*'],
          isActive: true,
          deliveryMode: 'event',
          customHeaders: {},
          createdAt: nowStamp(),
        })
        .onConflictDoNothing();
    }
  })().catch((err) => {
    automationSchemaPromise = null;
    throw err;
  });

  return automationSchemaPromise;
}

export async function listEmailTemplates(): Promise<EmailTemplateRecord[]> {
  await ensureAutomationSchemaAndSeed();
  if (!isDatabaseConfigured) {
    return memoryAutomationState.templates.map((t) => ({ ...t }));
  }
  const rows = await db.select().from(emailTemplates);
  const byId = new Map<string, EmailTemplateRecord>();
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      eventKey: r.eventKey,
      name: r.name,
      category: r.category as EmailTemplateCategory,
      enabled: Boolean(r.enabled),
      subject: r.subject,
      preheader: r.preheader,
      htmlBody: r.htmlBody,
      textBody: r.textBody,
      variables: Array.isArray(r.variables) ? r.variables : [],
      updatedAt: r.updatedAt.toISOString().slice(0, 19).replace('T', ' '),
    });
  }
  return DEFAULT_EMAIL_TEMPLATES.map((seed) => {
    const found = byId.get(seed.id);
    if (found) return found;
    return { ...seed, updatedAt: nowStamp() };
  });
}

export async function getEmailTemplateByEventKey(
  eventKey: string
): Promise<EmailTemplateRecord | null> {
  await ensureAutomationSchemaAndSeed();
  if (!isDatabaseConfigured) {
    return memoryAutomationState.templates.find((t) => t.eventKey === eventKey) || null;
  }
  const rows = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.eventKey, eventKey))
    .limit(1);
  const r = rows[0];
  if (!r) {
    // Keep event delivery operational if a template row was removed or a partial
    // database migration skipped the seed insert. The admin list already uses
    // these defaults when a row is absent, so event dispatch must do the same.
    const fallback = DEFAULT_EMAIL_TEMPLATES.find((tpl) => tpl.eventKey === eventKey);
    return fallback ? { ...fallback, updatedAt: nowStamp() } : null;
  }
  return {
    id: r.id,
    eventKey: r.eventKey,
    name: r.name,
    category: r.category as EmailTemplateCategory,
    enabled: Boolean(r.enabled),
    subject: r.subject,
    preheader: r.preheader,
    htmlBody: r.htmlBody,
    textBody: r.textBody,
    variables: Array.isArray(r.variables) ? r.variables : [],
    updatedAt: r.updatedAt.toISOString().slice(0, 19).replace('T', ' '),
  };
}

export async function getEmailTemplateById(id: string): Promise<EmailTemplateRecord | null> {
  await ensureAutomationSchemaAndSeed();
  if (!isDatabaseConfigured) {
    return memoryAutomationState.templates.find((t) => t.id === id) || null;
  }
  const rows = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
  const r = rows[0];
  if (!r) {
    const fallback = DEFAULT_EMAIL_TEMPLATES.find((tpl) => tpl.id === id);
    return fallback ? { ...fallback, updatedAt: nowStamp() } : null;
  }
  return {
    id: r.id,
    eventKey: r.eventKey,
    name: r.name,
    category: r.category as EmailTemplateCategory,
    enabled: Boolean(r.enabled),
    subject: r.subject,
    preheader: r.preheader,
    htmlBody: r.htmlBody,
    textBody: r.textBody,
    variables: Array.isArray(r.variables) ? r.variables : [],
    updatedAt: r.updatedAt.toISOString().slice(0, 19).replace('T', ' '),
  };
}

export async function updateEmailTemplateRecord(
  id: string,
  patch: {
    name?: string;
    enabled?: boolean;
    subject?: string;
    preheader?: string;
    htmlBody?: string;
    textBody?: string;
  }
): Promise<EmailTemplateRecord> {
  await ensureAutomationSchemaAndSeed();
  const existing = await getEmailTemplateById(id);
  if (!existing) throw new Error('Email template not found.');

  const next: EmailTemplateRecord = {
    ...existing,
    name: patch.name?.trim().slice(0, 120) || existing.name,
    enabled: typeof patch.enabled === 'boolean' ? patch.enabled : existing.enabled,
    subject: patch.subject !== undefined ? patch.subject.slice(0, 240) : existing.subject,
    preheader: patch.preheader !== undefined ? patch.preheader.slice(0, 280) : existing.preheader,
    htmlBody: patch.htmlBody !== undefined ? patch.htmlBody.slice(0, 40000) : existing.htmlBody,
    textBody: patch.textBody !== undefined ? patch.textBody.slice(0, 20000) : existing.textBody,
    updatedAt: nowStamp(),
  };

  if (!isDatabaseConfigured) {
    memoryAutomationState.templates = memoryAutomationState.templates.map((t) =>
      t.id === id ? next : t
    );
    return next;
  }

  const updatedRows = await db
    .update(emailTemplates)
    .set({
      name: next.name,
      enabled: next.enabled,
      subject: next.subject,
      preheader: next.preheader,
      htmlBody: next.htmlBody,
      textBody: next.textBody,
      updatedAt: new Date(),
    })
    .where(eq(emailTemplates.id, id))
    .returning({ id: emailTemplates.id });

  // If a seed row is absent, persist the default-backed template on first save.
  if (updatedRows.length === 0) {
    await db.insert(emailTemplates).values({
      id: next.id,
      eventKey: next.eventKey,
      name: next.name,
      category: next.category,
      enabled: next.enabled,
      subject: next.subject,
      preheader: next.preheader,
      htmlBody: next.htmlBody,
      textBody: next.textBody,
      variables: next.variables,
      updatedAt: new Date(),
    });
  }

  return next;
}

export async function getRawEmailDeliverySettings(): Promise<EmailDeliverySettingsRecord> {
  await ensureAutomationSchemaAndSeed();
  if (!isDatabaseConfigured) {
    return { ...memoryAutomationState.mailSettings };
  }
  const rows = await db
    .select()
    .from(emailDeliverySettings)
    .where(eq(emailDeliverySettings.id, 'default'))
    .limit(1);
  const r = rows[0];
  if (!r) return envDefaultSettings();
  const env = envDefaultSettings();
  return {
    id: r.id,
    mode: (r.mode === 'smtp' || r.mode === 'webhook' ? r.mode : 'auto') as MailDeliveryMode,
    fromName: r.fromName || env.fromName,
    fromEmail: r.fromEmail || env.fromEmail,
    replyTo: r.replyTo || env.replyTo,
    smtpHost: r.smtpHost || env.smtpHost,
    smtpPort: Number(r.smtpPort || env.smtpPort || 587),
    smtpSecure: Boolean(r.smtpSecure),
    smtpUser: r.smtpUser || env.smtpUser,
    smtpPass: r.smtpPass || env.smtpPass,
    emailWebhookUrl: r.emailWebhookUrl || env.emailWebhookUrl,
    emailWebhookSecret: r.emailWebhookSecret || env.emailWebhookSecret,
    notifyAdminOnEvents: Boolean(r.notifyAdminOnEvents),
  };
}

export async function getPublicEmailDeliverySettings(): Promise<PublicEmailDeliverySettings> {
  const s = await getRawEmailDeliverySettings();
  return {
    mode: s.mode,
    fromName: s.fromName,
    fromEmail: s.fromEmail,
    replyTo: s.replyTo,
    smtpHost: s.smtpHost,
    smtpPort: s.smtpPort,
    smtpSecure: s.smtpSecure,
    smtpUser: s.smtpUser,
    hasSmtpPass: Boolean(s.smtpPass),
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
    emailWebhookUrl: s.emailWebhookUrl,
    hasEmailWebhookSecret: Boolean(s.emailWebhookSecret),
    notifyAdminOnEvents: s.notifyAdminOnEvents,
  };
}

export async function updateEmailDeliverySettings(patch: {
  mode?: MailDeliveryMode;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  emailWebhookUrl?: string;
  emailWebhookSecret?: string;
  notifyAdminOnEvents?: boolean;
}): Promise<PublicEmailDeliverySettings> {
  const current = await getRawEmailDeliverySettings();
  const next: EmailDeliverySettingsRecord = {
    id: 'default',
    mode:
      patch.mode === 'smtp' || patch.mode === 'webhook' || patch.mode === 'auto'
        ? patch.mode
        : current.mode,
    fromName: patch.fromName?.trim().slice(0, 120) || current.fromName,
    fromEmail: patch.fromEmail?.trim().slice(0, 160) || current.fromEmail,
    replyTo: patch.replyTo?.trim().slice(0, 160) || current.replyTo,
    smtpHost: patch.smtpHost !== undefined ? patch.smtpHost.trim().slice(0, 200) : current.smtpHost,
    smtpPort:
      patch.smtpPort !== undefined && Number.isFinite(Number(patch.smtpPort))
        ? Math.max(1, Math.min(65535, Math.floor(Number(patch.smtpPort))))
        : current.smtpPort,
    smtpSecure: typeof patch.smtpSecure === 'boolean' ? patch.smtpSecure : current.smtpSecure,
    smtpUser: patch.smtpUser !== undefined ? patch.smtpUser.trim().slice(0, 200) : current.smtpUser,
    smtpPass:
      patch.smtpPass !== undefined && patch.smtpPass !== '' && patch.smtpPass !== '********'
        ? patch.smtpPass.slice(0, 500)
        : current.smtpPass,
    emailWebhookUrl:
      patch.emailWebhookUrl !== undefined
        ? patch.emailWebhookUrl.trim().slice(0, 500)
        : current.emailWebhookUrl,
    emailWebhookSecret:
      patch.emailWebhookSecret !== undefined &&
      patch.emailWebhookSecret !== '' &&
      patch.emailWebhookSecret !== '********'
        ? patch.emailWebhookSecret.slice(0, 500)
        : current.emailWebhookSecret,
    notifyAdminOnEvents:
      typeof patch.notifyAdminOnEvents === 'boolean'
        ? patch.notifyAdminOnEvents
        : current.notifyAdminOnEvents,
  };

  if (!isDatabaseConfigured) {
    memoryAutomationState.mailSettings = next;
  } else {
    await db
      .insert(emailDeliverySettings)
      .values({
        id: 'default',
        mode: next.mode,
        fromName: next.fromName,
        fromEmail: next.fromEmail,
        replyTo: next.replyTo,
        smtpHost: next.smtpHost,
        smtpPort: next.smtpPort,
        smtpSecure: next.smtpSecure,
        smtpUser: next.smtpUser,
        smtpPass: next.smtpPass,
        emailWebhookUrl: next.emailWebhookUrl,
        emailWebhookSecret: next.emailWebhookSecret,
        notifyAdminOnEvents: next.notifyAdminOnEvents,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: emailDeliverySettings.id,
        set: {
          mode: next.mode,
          fromName: next.fromName,
          fromEmail: next.fromEmail,
          replyTo: next.replyTo,
          smtpHost: next.smtpHost,
          smtpPort: next.smtpPort,
          smtpSecure: next.smtpSecure,
          smtpUser: next.smtpUser,
          smtpPass: next.smtpPass,
          emailWebhookUrl: next.emailWebhookUrl,
          emailWebhookSecret: next.emailWebhookSecret,
          notifyAdminOnEvents: next.notifyAdminOnEvents,
          updatedAt: new Date(),
        },
      });
  }

  return getPublicEmailDeliverySettings();
}

export async function listRawWebhookEndpoints(): Promise<WebhookEndpointRecord[]> {
  await ensureAutomationSchemaAndSeed();
  if (!isDatabaseConfigured) {
    return memoryAutomationState.webhooks.map((w) => ({ ...w }));
  }
  const rows = await db.select().from(webhookEndpoints).orderBy(desc(webhookEndpoints.updatedAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    signingSecret: r.signingSecret || '',
    subscribedEvents: Array.isArray(r.subscribedEvents) ? r.subscribedEvents : ['*'],
    isActive: Boolean(r.isActive),
    deliveryMode: r.deliveryMode === 'email_relay' ? 'email_relay' : 'event',
    customHeaders:
      r.customHeaders && typeof r.customHeaders === 'object' ? r.customHeaders : {},
    lastTriggeredAt: r.lastTriggeredAt ?? undefined,
    lastStatusCode: r.lastStatusCode ?? undefined,
    createdAt: r.createdAt,
  }));
}

export async function listPublicWebhookEndpoints(): Promise<PublicWebhookEndpointRecord[]> {
  const rows = await listRawWebhookEndpoints();
  return rows.map(({ signingSecret, ...rest }) => ({
    ...rest,
    hasSigningSecret: Boolean(signingSecret),
    signingSecretPreview: signingSecret
      ? `${signingSecret.slice(0, 6)}••••${signingSecret.slice(-4)}`
      : 'None',
  }));
}

export async function saveWebhookEndpointRecord(input: {
  id?: string;
  name: string;
  url: string;
  signingSecret?: string;
  subscribedEvents: string[];
  isActive: boolean;
  deliveryMode: 'event' | 'email_relay';
  customHeaders?: Record<string, string>;
}): Promise<PublicWebhookEndpointRecord> {
  await ensureAutomationSchemaAndSeed();
  const cleanName = input.name.trim().slice(0, 120);
  const cleanUrl = input.url.trim().slice(0, 500);
  if (!cleanName || !cleanUrl) {
    throw new Error('Webhook name and URL are required.');
  }

  const parsed = new URL(cleanUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Webhook URL must use http:// or https://.');
  }

  const existingList = await listRawWebhookEndpoints();
  const existing = input.id ? existingList.find((w) => w.id === input.id) : undefined;
  const id = existing?.id || nextAutoId('WHK').toLowerCase();

  let secret = existing?.signingSecret || '';
  if (input.signingSecret !== undefined && input.signingSecret !== '********') {
    secret = input.signingSecret.trim().slice(0, 300);
  }
  if (!existing && !secret) {
    secret = `whsec_${crypto.randomBytes(18).toString('hex')}`;
  }

  const events =
    Array.isArray(input.subscribedEvents) && input.subscribedEvents.length > 0
      ? input.subscribedEvents.map((e) => String(e).trim()).filter(Boolean)
      : ['*'];

  const record: WebhookEndpointRecord = {
    id,
    name: cleanName,
    url: cleanUrl,
    signingSecret: secret,
    subscribedEvents: events,
    isActive: Boolean(input.isActive),
    deliveryMode: input.deliveryMode === 'email_relay' ? 'email_relay' : 'event',
    customHeaders: input.customHeaders || existing?.customHeaders || {},
    lastTriggeredAt: existing?.lastTriggeredAt,
    lastStatusCode: existing?.lastStatusCode,
    createdAt: existing?.createdAt || nowStamp(),
  };

  if (!isDatabaseConfigured) {
    const idx = memoryAutomationState.webhooks.findIndex((w) => w.id === id);
    if (idx >= 0) memoryAutomationState.webhooks[idx] = record;
    else memoryAutomationState.webhooks.unshift(record);
  } else {
    await db
      .insert(webhookEndpoints)
      .values({
        id: record.id,
        name: record.name,
        url: record.url,
        signingSecret: record.signingSecret,
        subscribedEvents: record.subscribedEvents,
        isActive: record.isActive,
        deliveryMode: record.deliveryMode,
        customHeaders: record.customHeaders,
        lastTriggeredAt: record.lastTriggeredAt ?? null,
        lastStatusCode: record.lastStatusCode ?? null,
        createdAt: record.createdAt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: webhookEndpoints.id,
        set: {
          name: record.name,
          url: record.url,
          signingSecret: record.signingSecret,
          subscribedEvents: record.subscribedEvents,
          isActive: record.isActive,
          deliveryMode: record.deliveryMode,
          customHeaders: record.customHeaders,
          updatedAt: new Date(),
        },
      });
  }

  const { signingSecret, ...rest } = record;
  return {
    ...rest,
    hasSigningSecret: Boolean(signingSecret),
    signingSecretPreview: signingSecret
      ? `${signingSecret.slice(0, 6)}••••${signingSecret.slice(-4)}`
      : 'None',
  };
}

export async function recordWebhookTriggerStatus(
  webhookId: string,
  statusCode: number
): Promise<void> {
  await ensureAutomationSchemaAndSeed();
  const stamp = nowStamp();
  if (!isDatabaseConfigured) {
    const target = memoryAutomationState.webhooks.find((w) => w.id === webhookId);
    if (target) {
      target.lastTriggeredAt = stamp;
      target.lastStatusCode = statusCode;
    }
    return;
  }
  await db
    .update(webhookEndpoints)
    .set({
      lastTriggeredAt: stamp,
      lastStatusCode: statusCode,
      updatedAt: new Date(),
    })
    .where(eq(webhookEndpoints.id, webhookId));
}

export async function deleteWebhookEndpointRecord(webhookId: string): Promise<void> {
  await ensureAutomationSchemaAndSeed();
  if (!isDatabaseConfigured) {
    memoryAutomationState.webhooks = memoryAutomationState.webhooks.filter((w) => w.id !== webhookId);
    return;
  }
  await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, webhookId));
}

export async function appendAutomationDeliveryLog(
  entry: Omit<AutomationDeliveryLogRecord, 'id' | 'createdAt'>
): Promise<AutomationDeliveryLogRecord> {
  await ensureAutomationSchemaAndSeed();
  const record: AutomationDeliveryLogRecord = {
    id: nextAutoId('LOG'),
    kind: entry.kind,
    eventKey: entry.eventKey,
    target: entry.target.slice(0, 320),
    subjectOrMethod: entry.subjectOrMethod.slice(0, 240),
    status: entry.status,
    httpStatus: entry.httpStatus,
    errorMessage: entry.errorMessage?.slice(0, 400),
    payloadPreview: entry.payloadPreview.slice(0, 1500),
    createdAt: nowStamp(),
  };

  if (!isDatabaseConfigured) {
    memoryAutomationState.logs.unshift(record);
    memoryAutomationState.logs = memoryAutomationState.logs.slice(0, 120);
    return record;
  }

  await db.insert(automationDeliveryLogs).values({
    id: record.id,
    kind: record.kind,
    eventKey: record.eventKey,
    target: record.target,
    subjectOrMethod: record.subjectOrMethod,
    status: record.status,
    httpStatus: record.httpStatus ?? null,
    errorMessage: record.errorMessage ?? null,
    payloadPreview: record.payloadPreview,
    createdAt: record.createdAt,
  });

  return record;
}

export async function listAutomationDeliveryLogs(limit = 100): Promise<AutomationDeliveryLogRecord[]> {
  await ensureAutomationSchemaAndSeed();
  if (!isDatabaseConfigured) {
    return memoryAutomationState.logs.slice(0, limit);
  }
  const rows = await db
    .select()
    .from(automationDeliveryLogs)
    .orderBy(desc(automationDeliveryLogs.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind === 'webhook' ? 'webhook' : 'email',
    eventKey: r.eventKey,
    target: r.target,
    subjectOrMethod: r.subjectOrMethod,
    status: (r.status as AutomationDeliveryLogRecord['status']) || 'Queued',
    httpStatus: r.httpStatus ?? undefined,
    errorMessage: r.errorMessage ?? undefined,
    payloadPreview: r.payloadPreview,
    createdAt: r.createdAt,
  }));
}
