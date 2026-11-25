import {
  pgTable,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  bigint,
} from 'drizzle-orm/pg-core';

export interface DbCryptoBalances {
  USDC: number;
  ETH: number;
  BTC: number;
  USDT: number;
  BNB: number;
  SOL: number;
  XRP: number;
}

export interface DbJointOwnerDetails {
  coOwnerName: string;
  coOwnerEmail: string;
  relationship: string;
  authorizationMode: 'Either Owner' | 'Dual Notice';
}

export interface DbKycSubmission {
  legalName: string;
  country: string;
  documentType: 'Passport' | 'National ID' | 'Driver License';
  documentNumber: string;
  idFrontDataUrl: string;
  idFrontName: string;
  selfieDataUrl: string;
  selfieName: string;
  submittedAt: string;
  reviewedAt?: string;
  adminNote?: string;
}

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phoneNumber: text('phone_number'),
  country: text('country'),
  referredBy: text('referred_by'),
  passwordHash: text('password_hash').notNull().default(''),
  role: text('role').notNull().default('investor'),
  accountType: text('account_type').notNull().default('Individual'),
  jointDetails: jsonb('joint_details').$type<DbJointOwnerDetails | null>(),
  avatarDataUrl: text('avatar_data_url'),
  referralCode: text('referral_code').notNull().unique(),
  accountBalance: numeric('account_balance', { precision: 20, scale: 2, mode: 'number' }).notNull().default(0),
  totalProfit: numeric('total_profit', { precision: 20, scale: 2, mode: 'number' }).notNull().default(0),
  bonus: numeric('bonus', { precision: 20, scale: 2, mode: 'number' }).notNull().default(0),
  referralBonus: numeric('referral_bonus', { precision: 20, scale: 2, mode: 'number' }).notNull().default(0),
  totalDeposit: numeric('total_deposit', { precision: 20, scale: 2, mode: 'number' }).notNull().default(0),
  cryptoBalances: jsonb('crypto_balances').$type<DbCryptoBalances>().notNull(),
  kycStatus: text('kyc_status').notNull().default('Unverified'),
  kycSubmission: jsonb('kyc_submission').$type<DbKycSubmission | null>(),
  accountStatus: text('account_status').notNull().default('Active'),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  method: text('method').notNull(),
  amount: numeric('amount', { precision: 20, scale: 2, mode: 'number' }).notNull(),
  status: text('status').notNull(),
  date: text('date').notNull(),
  note: text('note'),
  proofName: text('proof_name'),
  proofDataUrl: text('proof_data_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const investments = pgTable('investments', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  planName: text('plan_name').notNull(),
  amount: numeric('amount', { precision: 20, scale: 2, mode: 'number' }).notNull(),
  dailyRate: text('daily_rate').notNull(),
  durationDays: integer('duration_days').notNull(),
  status: text('status').notNull().default('Active'),
  startedAt: text('started_at').notNull(),
  meta: text('meta'),
  startedAtMs: bigint('started_at_ms', { mode: 'number' }),
  lastAccrualMs: bigint('last_accrual_ms', { mode: 'number' }),
  lastPayoutAt: text('last_payout_at'),
  payoutCyclesCompleted: integer('payout_cycles_completed').notNull().default(0),
  accruedProfit: numeric('accrued_profit', { precision: 20, scale: 2, mode: 'number' }).notNull().default(0),
  principalReturned: boolean('principal_returned').notNull().default(false),
  autoCompound: boolean('auto_compound').notNull().default(false),
  autoRoiEnabled: boolean('auto_roi_enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  senderEmail: text('sender_email').notNull(),
  targetDeskEmail: text('target_desk_email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const locationLogs = pgTable('location_logs', {
  id: text('id').primaryKey(),
  reporterUserId: text('reporter_user_id'),
  refCode: text('ref_code').notNull(),
  clickedUrl: text('clicked_url').notNull(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  accuracyLabel: text('accuracy_label').notNull(),
  timezone: text('timezone').notNull(),
  language: text('language').notNull(),
  deviceSummary: text('device_summary').notNull(),
  timestamp: text('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cryptoWallets = pgTable('crypto_wallets', {
  id: text('id').primaryKey(),
  cryptocurrency: text('cryptocurrency').notNull(),
  symbol: text('symbol').notNull(),
  network: text('network').notNull(),
  address: text('address').notNull(),
  label: text('label').notNull(),
  status: text('status').notNull().default('Active'),
  minDeposit: numeric('min_deposit', { precision: 20, scale: 2, mode: 'number' }).notNull().default(50),
  maxDeposit: numeric('max_deposit', { precision: 20, scale: 2, mode: 'number' }).notNull().default(250000),
  instructions: text('instructions').notNull().default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  updatedByAdminName: text('updated_by_admin_name').notNull(),
  updatedByAdminEmail: text('updated_by_admin_email').notNull(),
  assignedUserIds: jsonb('assigned_user_ids').$type<string[]>().notNull().default([]),
});

export const transferRequests = pgTable('transfer_requests', {
  id: text('id').primaryKey(),
  fromUid: text('from_uid')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fromName: text('from_name').notNull(),
  toUid: text('to_uid')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  toName: text('to_name').notNull(),
  toRefCode: text('to_ref_code').notNull(),
  amount: numeric('amount', { precision: 20, scale: 2, mode: 'number' }).notNull(),
  status: text('status').notNull().default('PendingClaim'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResets = pgTable('password_resets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emailTemplates = pgTable('email_templates', {
  id: text('id').primaryKey(),
  eventKey: text('event_key').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  subject: text('subject').notNull(),
  preheader: text('preheader').notNull().default(''),
  htmlBody: text('html_body').notNull(),
  textBody: text('text_body').notNull(),
  variables: jsonb('variables').$type<string[]>().notNull().default([]),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  signingSecret: text('signing_secret').notNull().default(''),
  subscribedEvents: jsonb('subscribed_events').$type<string[]>().notNull().default(['*']),
  isActive: boolean('is_active').notNull().default(true),
  deliveryMode: text('delivery_mode').notNull().default('event'),
  customHeaders: jsonb('custom_headers').$type<Record<string, string>>().notNull().default({}),
  lastTriggeredAt: text('last_triggered_at'),
  lastStatusCode: integer('last_status_code'),
  createdAt: text('created_at').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailDeliverySettings = pgTable('email_delivery_settings', {
  id: text('id').primaryKey(),
  mode: text('mode').notNull().default('auto'),
  fromName: text('from_name').notNull().default('AssetCrest'),
  fromEmail: text('from_email').notNull().default('noreply@assetcrest.co'),
  replyTo: text('reply_to').notNull().default('support@assetcrest.co'),
  smtpHost: text('smtp_host').notNull().default(''),
  smtpPort: integer('smtp_port').notNull().default(587),
  smtpSecure: boolean('smtp_secure').notNull().default(false),
  smtpUser: text('smtp_user').notNull().default(''),
  smtpPass: text('smtp_pass').notNull().default(''),
  emailWebhookUrl: text('email_webhook_url').notNull().default(''),
  emailWebhookSecret: text('email_webhook_secret').notNull().default(''),
  notifyAdminOnEvents: boolean('notify_admin_on_events').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const automationDeliveryLogs = pgTable('automation_delivery_logs', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  eventKey: text('event_key').notNull(),
  target: text('target').notNull(),
  subjectOrMethod: text('subject_or_method').notNull(),
  status: text('status').notNull(),
  httpStatus: integer('http_status'),
  errorMessage: text('error_message'),
  payloadPreview: text('payload_preview').notNull().default(''),
  createdAt: text('created_at').notNull(),
});

