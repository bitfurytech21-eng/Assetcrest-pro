'use client';

import { useEffect, useState } from 'react';
import {
  ActiveInvestment,
  CryptoAssetSymbol,
  CryptoWalletRecord,
  KycStatus,
  KycSubmission,
  VisitorLocationLog,
  ContactTicket,
  TransactionRecord,
  UserAccount,
  WalletStatus,
} from './assetcrest-store';
import { RoiSettlementPlan } from './roi-engine';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'admin@assetcrest.co';

export interface CloudTransferRequest {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  toRefCode: string;
  amount: number;
  status: 'PendingClaim' | 'Completed';
  note?: string;
}

export interface TransferDirectoryEntry {
  uid: string;
  displayName: string;
  referralCode: string;
  accountType: 'Individual' | 'Joint';
}

export interface NeonSyncState {
  neonSessionUser: UserAccount | null;
  cloudUser: UserAccount | null;
  allUsers: UserAccount[];
  kycSubmissionsMap: Record<string, KycSubmission & { status: KycStatus }>;
  transactions: TransactionRecord[];
  investments: ActiveInvestment[];
  tickets: ContactTicket[];
  locationLogs: VisitorLocationLog[];
  incomingTransfers: CloudTransferRequest[];
  cryptoWallets: CryptoWalletRecord[];
  isAdmin: boolean;
  loading: boolean;
  isNewUserWelcome: boolean;
}

const EMPTY_SYNC_STATE: NeonSyncState = {
  neonSessionUser: null,
  cloudUser: null,
  allUsers: [],
  kycSubmissionsMap: {},
  transactions: [],
  investments: [],
  tickets: [],
  locationLogs: [],
  incomingTransfers: [],
  cryptoWallets: [],
  isAdmin: false,
  loading: true,
  isNewUserWelcome: false,
};

// Session token held strictly in JS memory (never localStorage/sessionStorage).
// HttpOnly session cookies also persist sessions across page reloads.
let inMemoryAuthToken: string | null = null;
let currentState: NeonSyncState = { ...EMPTY_SYNC_STATE };
const stateListeners = new Set<(state: NeonSyncState) => void>();

function emitState(patch: Partial<NeonSyncState>) {
  currentState = { ...currentState, ...patch };
  for (const listener of stateListeners) {
    listener(currentState);
  }
}

export function getCurrentCloudUserId(): string | null {
  return currentState.cloudUser?.id ?? null;
}

async function apiRequest<T = any>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (inMemoryAuthToken) {
    headers.Authorization = `Bearer ${inMemoryAuthToken}`;
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, {
    method: options.method || 'GET',
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const err: any = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return data as T;
}

let refreshPromise: Promise<void> | null = null;

export async function refreshNeonSync(): Promise<void> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const data = await apiRequest<{
        cloudUser: UserAccount | null;
        allUsers: UserAccount[];
        kycSubmissionsMap: Record<string, KycSubmission & { status: KycStatus }>;
        transactions: TransactionRecord[];
        investments: ActiveInvestment[];
        tickets: ContactTicket[];
        locationLogs: VisitorLocationLog[];
        incomingTransfers: CloudTransferRequest[];
        cryptoWallets: CryptoWalletRecord[];
        isAdmin: boolean;
      }>('/api/neon/sync');

      emitState({
        neonSessionUser: data.cloudUser ?? null,
        cloudUser: data.cloudUser ?? null,
        allUsers: Array.isArray(data.allUsers) ? data.allUsers : [],
        kycSubmissionsMap: data.kycSubmissionsMap || {},
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        investments: Array.isArray(data.investments) ? data.investments : [],
        tickets: Array.isArray(data.tickets) ? data.tickets : [],
        locationLogs: Array.isArray(data.locationLogs) ? data.locationLogs : [],
        incomingTransfers: Array.isArray(data.incomingTransfers) ? data.incomingTransfers : [],
        cryptoWallets: Array.isArray(data.cryptoWallets) ? data.cryptoWallets : [],
        isAdmin: Boolean(data.isAdmin),
        loading: false,
      });
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        inMemoryAuthToken = null;
        emitState({
          ...EMPTY_SYNC_STATE,
          loading: false,
          isNewUserWelcome: false,
        });
      } else {
        emitState({ loading: false });
      }
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

const PENDING_LOCATIONS_KEY = 'assetcrest_pending_locations_v1';

export function queuePendingLocationLog(entry: Omit<VisitorLocationLog, 'id'>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(PENDING_LOCATIONS_KEY);
    const list: Omit<VisitorLocationLog, 'id'>[] = raw ? JSON.parse(raw) : [];
    list.push(entry);
    window.localStorage.setItem(PENDING_LOCATIONS_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    // ignore storage errors
  }
}

export async function flushPendingLocationLogs(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(PENDING_LOCATIONS_KEY);
    if (!raw) return;
    const list: Omit<VisitorLocationLog, 'id'>[] = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return;
    window.localStorage.removeItem(PENDING_LOCATIONS_KEY);
    for (const entry of list) {
      await apiRequest('/api/neon/location-logs', { method: 'POST', body: entry }).catch(() => {});
    }
  } catch {
    // ignore
  }
}

export async function neonGetAdminStatus(): Promise<{
  adminEmail: string;
  adminClaimed: boolean;
  envPasswordConfigured: boolean;
}> {
  return apiRequest('/api/auth/admin-status');
}

export async function neonClaimAdmin(password: string): Promise<UserAccount> {
  const res = await apiRequest<{ token: string; user: UserAccount }>('/api/auth/claim-admin', {
    method: 'POST',
    body: { password },
  });
  inMemoryAuthToken = res.token;
  emitState({
    neonSessionUser: res.user,
    cloudUser: res.user,
    isAdmin: res.user.role === 'admin',
    loading: false,
  });
  await flushPendingLocationLogs();
  await refreshNeonSync();
  return res.user;
}

export async function neonRegister(params: {
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  country: string;
  referredBy?: string;
  password: string;
}): Promise<UserAccount> {
  const res = await apiRequest<{ token: string; user: UserAccount }>('/api/auth/register', {
    method: 'POST',
    body: params,
  });
  inMemoryAuthToken = res.token;
  emitState({
    neonSessionUser: res.user,
    cloudUser: res.user,
    isAdmin: res.user.role === 'admin',
    isNewUserWelcome: true,
    loading: false,
  });
  await flushPendingLocationLogs();
  await refreshNeonSync();
  return res.user;
}

export async function neonLogin(identifier: string, password: string): Promise<UserAccount> {
  const res = await apiRequest<{ token: string; user: UserAccount }>('/api/auth/login', {
    method: 'POST',
    body: { identifier, password },
  });
  inMemoryAuthToken = res.token;
  emitState({
    neonSessionUser: res.user,
    cloudUser: res.user,
    isAdmin: res.user.role === 'admin',
    loading: false,
  });
  await flushPendingLocationLogs();
  await refreshNeonSync();
  return res.user;
}

export async function neonForgotPassword(email: string): Promise<{ ok: boolean; message: string }> {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function neonResetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<UserAccount> {
  const res = await apiRequest<{ token: string; user: UserAccount }>('/api/auth/reset-password', {
    method: 'POST',
    body: { email, code, newPassword },
  });
  inMemoryAuthToken = res.token;
  emitState({
    neonSessionUser: res.user,
    cloudUser: res.user,
    isAdmin: res.user.role === 'admin',
    loading: false,
  });
  await refreshNeonSync();
  return res.user;
}

export async function signOutCloud(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore errors when clearing session
  }
  inMemoryAuthToken = null;
  emitState({
    ...EMPTY_SYNC_STATE,
    loading: false,
    isNewUserWelcome: false,
  });
}

export function useNeonCloudSync() {
  const [state, setState] = useState<NeonSyncState>(currentState);

  useEffect(() => {
    const listener = (next: NeonSyncState) => setState(next);
    stateListeners.add(listener);
    void refreshNeonSync();

    const interval = window.setInterval(() => {
      if (currentState.cloudUser) {
        void refreshNeonSync();
      }
    }, 12000);

    return () => {
      stateListeners.delete(listener);
      window.clearInterval(interval);
    };
  }, []);

  const dismissWelcome = () => {
    emitState({ isNewUserWelcome: false });
  };

  return {
    ...state,
    dismissWelcome,
    refreshSync: refreshNeonSync,
  };
}

// ============================================================================
// NEON TRANSACTION, WALLET, KYC, ROI, AND ADMIN OPERATIONS
// ============================================================================
export async function cloudSubmitDeposit(params: {
  uid: string;
  method: string;
  amount: number;
  status: 'Pending' | 'Cancelled';
  proofName?: string;
  proofDataUrl?: string;
  note?: string;
}): Promise<string> {
  const res = await apiRequest<{ id: string }>('/api/neon/deposit', {
    method: 'POST',
    body: params,
  });
  await refreshNeonSync();
  return res.id;
}

export async function cloudSubmitWithdrawal(params: {
  uid: string;
  currentBalance: number;
  method: string;
  amount: number;
  destination: string;
}): Promise<string> {
  const res = await apiRequest<{ id: string }>('/api/neon/withdraw', {
    method: 'POST',
    body: {
      method: params.method,
      amount: params.amount,
      destination: params.destination,
    },
  });
  await refreshNeonSync();
  return res.id;
}

export async function cloudLookupTransferRecipient(
  refCodeInput: string
): Promise<TransferDirectoryEntry | null> {
  const res = await apiRequest<{ recipient: TransferDirectoryEntry | null }>(
    `/api/neon/transfer/lookup?refCode=${encodeURIComponent(refCodeInput.trim())}`
  );
  return res.recipient;
}

export async function cloudSendTransfer(params: {
  fromUser: UserAccount;
  recipient: TransferDirectoryEntry;
  amount: number;
  note?: string;
}): Promise<string> {
  const res = await apiRequest<{ id: string }>('/api/neon/transfer/send', {
    method: 'POST',
    body: {
      toRefCode: params.recipient.referralCode,
      amount: params.amount,
      note: params.note,
    },
  });
  await refreshNeonSync();
  return res.id;
}

export async function cloudClaimTransferRequest(transfer: CloudTransferRequest): Promise<void> {
  await apiRequest('/api/neon/transfer/claim', {
    method: 'POST',
    body: { transferId: transfer.id },
  });
  await refreshNeonSync();
}

export async function cloudExecuteSwap(params: {
  uid: string;
  nextUsdBalance: number;
  nextCryptoBalances: Record<Exclude<CryptoAssetSymbol, 'USD'>, number>;
  method: string;
  usdAmount: number;
  note: string;
}): Promise<string> {
  const res = await apiRequest<{ id: string }>('/api/neon/swap', {
    method: 'POST',
    body: {
      nextUsdBalance: params.nextUsdBalance,
      nextCryptoBalances: params.nextCryptoBalances,
      method: params.method,
      usdAmount: params.usdAmount,
      note: params.note,
    },
  });
  await refreshNeonSync();
  return res.id;
}

export async function cloudInvestPlan(params: {
  uid: string;
  currentBalance: number;
  category: 'Standard' | 'Vacation' | 'Real Estate';
  planName: string;
  amount: number;
  dailyRate: string;
  durationDays: number;
  meta?: string;
  autoCompound?: boolean;
}): Promise<string> {
  const res = await apiRequest<{ id: string }>('/api/neon/invest', {
    method: 'POST',
    body: {
      category: params.category,
      planName: params.planName,
      amount: params.amount,
      dailyRate: params.dailyRate,
      durationDays: params.durationDays,
      meta: params.meta,
      autoCompound: params.autoCompound,
    },
  });
  await refreshNeonSync();
  return res.id;
}

export async function cloudUpdateAvatar(_uid: string, avatarDataUrl?: string): Promise<void> {
  await apiRequest('/api/neon/profile/avatar', {
    method: 'PATCH',
    body: { avatarDataUrl: avatarDataUrl || null },
  });
  await refreshNeonSync();
}

export async function cloudUpdateProfileAndJoint(params: {
  uid: string;
  referralCode: string;
  email: string;
  displayName: string;
  accountType: 'Individual' | 'Joint';
  coOwnerName?: string;
  coOwnerEmail?: string;
  relationship?: string;
  authorizationMode?: 'Either Owner' | 'Dual Notice';
}): Promise<void> {
  await apiRequest('/api/neon/profile', {
    method: 'PATCH',
    body: {
      displayName: params.displayName,
      accountType: params.accountType,
      coOwnerName: params.coOwnerName,
      coOwnerEmail: params.coOwnerEmail,
      relationship: params.relationship,
      authorizationMode: params.authorizationMode,
    },
  });
  await refreshNeonSync();
}

export async function cloudChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiRequest('/api/neon/profile/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

export async function cloudSubmitKyc(params: {
  uid: string;
  submission: KycSubmission;
}): Promise<void> {
  await apiRequest('/api/neon/kyc', {
    method: 'POST',
    body: { submission: params.submission },
  });
  await refreshNeonSync();
}

export async function cloudAdminDecideKyc(
  targetUid: string,
  decision: 'Approved' | 'Rejected',
  adminNote: string
): Promise<void> {
  await apiRequest(`/api/neon/admin/kyc/${encodeURIComponent(targetUid)}`, {
    method: 'POST',
    body: { decision, adminNote },
  });
  await refreshNeonSync();
}

export async function cloudAdminApproveDeposit(
  tx: TransactionRecord,
  _targetUser?: UserAccount
): Promise<void> {
  await apiRequest(`/api/neon/admin/deposits/${encodeURIComponent(tx.id)}/approve`, {
    method: 'POST',
  });
  await refreshNeonSync();
}

export async function cloudAdminDeclineDeposit(tx: TransactionRecord): Promise<void> {
  await apiRequest(`/api/neon/admin/deposits/${encodeURIComponent(tx.id)}/decline`, {
    method: 'POST',
  });
  await refreshNeonSync();
}

export async function cloudAdminApproveWithdrawal(tx: TransactionRecord): Promise<void> {
  await apiRequest(`/api/neon/admin/withdrawals/${encodeURIComponent(tx.id)}/approve`, {
    method: 'POST',
  });
  await refreshNeonSync();
}

export async function cloudAdminDeclineWithdrawal(
  tx: TransactionRecord,
  _targetUser?: UserAccount
): Promise<void> {
  await apiRequest(`/api/neon/admin/withdrawals/${encodeURIComponent(tx.id)}/decline`, {
    method: 'POST',
  });
  await refreshNeonSync();
}

export async function cloudAdminDistributeYields(
  payouts: { inv: ActiveInvestment; yieldAmt: number }[]
): Promise<number> {
  const res = await apiRequest<{ count: number }>('/api/neon/admin/yields/distribute', {
    method: 'POST',
    body: { payouts },
  });
  await refreshNeonSync();
  return res.count;
}

export async function cloudToggleInvestmentSettings(
  invId: string,
  settings: { autoCompound?: boolean; autoRoiEnabled?: boolean }
): Promise<boolean> {
  try {
    await apiRequest(`/api/neon/investments/${encodeURIComponent(invId)}/settings`, {
      method: 'PATCH',
      body: settings,
    });
    await refreshNeonSync();
    return true;
  } catch {
    return false;
  }
}

export async function cloudSettleRoiPlan(
  plan: RoiSettlementPlan,
  _users: UserAccount[],
  options?: { silentOnPermissionError?: boolean }
): Promise<{ settledCount: number; permissionRestricted?: boolean }> {
  if (plan.investmentUpdates.length === 0) return { settledCount: 0 };
  try {
    const res = await apiRequest<{ settledCount: number }>('/api/neon/roi/settle', {
      method: 'POST',
      body: {
        investmentUpdates: plan.investmentUpdates.map((u) => ({ investment: u.investment })),
        transactions: plan.transactions,
        userDeltas: plan.userDeltas,
      },
    });
    await refreshNeonSync();
    return { settledCount: res.settledCount };
  } catch (err: any) {
    if (options?.silentOnPermissionError && (err?.status === 401 || err?.status === 403)) {
      return { settledCount: 0, permissionRestricted: true };
    }
    throw err;
  }
}

export async function cloudAdminToggleUserStatus(
  targetUid: string,
  accountStatus: 'Active' | 'Blocked'
): Promise<void> {
  await apiRequest(`/api/neon/admin/users/${encodeURIComponent(targetUid)}/status`, {
    method: 'PATCH',
    body: { accountStatus },
  });
  await refreshNeonSync();
}

export async function cloudAdminAdjustUserFunds(params: {
  targetUid: string;
  accountBalance: number;
  totalProfit: number;
  bonus: number;
  note?: string;
}): Promise<void> {
  await apiRequest(`/api/neon/admin/users/${encodeURIComponent(params.targetUid)}/funds`, {
    method: 'POST',
    body: {
      accountBalance: params.accountBalance,
      totalProfit: params.totalProfit,
      bonus: params.bonus,
      note: params.note,
    },
  });
  await refreshNeonSync();
}

export async function cloudCreateTicket(params: {
  userId: string;
  senderEmail: string;
  targetDeskEmail: string;
  subject: string;
  message: string;
}): Promise<string> {
  const res = await apiRequest<{ id: string }>('/api/neon/tickets', {
    method: 'POST',
    body: params,
  });
  await refreshNeonSync();
  return res.id;
}

export async function cloudLogVisitorLocation(
  _uid: string | null,
  entry: Omit<VisitorLocationLog, 'id'>
): Promise<string> {
  const res = await apiRequest<{ id: string }>('/api/neon/location-logs', {
    method: 'POST',
    body: entry,
  });
  if (currentState.isAdmin) {
    await refreshNeonSync();
  }
  return res.id;
}

export async function cloudSaveCryptoWallet(wallet: CryptoWalletRecord): Promise<void> {
  const payload: CryptoWalletRecord & { status: WalletStatus } = {
    ...wallet,
    assignedUserIds: wallet.assignedUserIds || [],
  };
  await apiRequest('/api/neon/admin/wallets', {
    method: 'POST',
    body: { wallet: payload },
  });
  await refreshNeonSync();
}

export async function cloudDeleteCryptoWallet(walletId: string): Promise<void> {
  await apiRequest(`/api/neon/admin/wallets/${encodeURIComponent(walletId)}`, {
    method: 'DELETE',
  });
  await refreshNeonSync();
}

// ============================================================================
// AUTOMATIC EMAIL TEMPLATES, SMTP/RELAY & WEBHOOK ADMIN CLIENT API
// ============================================================================
export type EmailTemplateCategory =
  | 'Authentication'
  | 'Treasury'
  | 'Compliance'
  | 'Investments'
  | 'Support';

export interface EmailTemplateRecord {
  id: string;
  eventKey: string;
  name: string;
  category: EmailTemplateCategory;
  enabled: boolean;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
  updatedAt: string;
}

export interface WebhookEndpointRecord {
  id: string;
  name: string;
  url: string;
  subscribedEvents: string[];
  isActive: boolean;
  deliveryMode: 'event' | 'email_relay';
  customHeaders: Record<string, string>;
  lastTriggeredAt?: string;
  lastStatusCode?: number;
  createdAt: string;
  hasSigningSecret: boolean;
  signingSecretPreview: string;
}

export interface EmailDeliverySettings {
  mode: 'auto' | 'smtp' | 'webhook';
  fromName: string;
  fromEmail: string;
  replyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  hasSmtpPass: boolean;
  emailWebhookUrl: string;
  hasEmailWebhookSecret: boolean;
  notifyAdminOnEvents: boolean;
}

export interface AutomationDeliveryLog {
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

export interface PortalEventMetadata {
  eventKey: string;
  label: string;
  category: EmailTemplateCategory;
  description: string;
}

export interface AutomationAdminSnapshot {
  templates: EmailTemplateRecord[];
  webhooks: WebhookEndpointRecord[];
  mailSettings: EmailDeliverySettings;
  logs: AutomationDeliveryLog[];
  events: PortalEventMetadata[];
  inboundWebhookPath: string;
}

export async function cloudGetAutomationConfig(): Promise<AutomationAdminSnapshot> {
  return apiRequest<AutomationAdminSnapshot>('/api/neon/admin/automation');
}

export async function cloudSaveEmailTemplate(
  id: string,
  patch: Partial<Pick<EmailTemplateRecord, 'name' | 'enabled' | 'subject' | 'preheader' | 'htmlBody' | 'textBody'>>
): Promise<EmailTemplateRecord> {
  const res = await apiRequest<{ template: EmailTemplateRecord }>(
    `/api/neon/admin/automation/templates/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: patch,
    }
  );
  return res.template;
}

export async function cloudSendTestTemplateEmail(
  id: string,
  toEmail: string
): Promise<AutomationDeliveryLog> {
  const res = await apiRequest<{ log: AutomationDeliveryLog }>(
    `/api/neon/admin/automation/templates/${encodeURIComponent(id)}/test`,
    {
      method: 'POST',
      body: { toEmail },
    }
  );
  return res.log;
}

export async function cloudSaveMailSettings(patch: {
  mode?: 'auto' | 'smtp' | 'webhook';
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
}): Promise<EmailDeliverySettings> {
  const res = await apiRequest<{ mailSettings: EmailDeliverySettings }>(
    '/api/neon/admin/automation/mail-settings',
    {
      method: 'PUT',
      body: patch,
    }
  );
  return res.mailSettings;
}

export async function cloudSaveWebhookEndpoint(payload: {
  id?: string;
  name: string;
  url: string;
  signingSecret?: string;
  subscribedEvents: string[];
  isActive: boolean;
  deliveryMode: 'event' | 'email_relay';
  customHeaders?: Record<string, string>;
}): Promise<WebhookEndpointRecord> {
  const res = await apiRequest<{ webhook: WebhookEndpointRecord }>(
    '/api/neon/admin/automation/webhooks',
    {
      method: 'POST',
      body: payload,
    }
  );
  return res.webhook;
}

export async function cloudDeleteWebhookEndpoint(id: string): Promise<void> {
  await apiRequest(`/api/neon/admin/automation/webhooks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function cloudTestWebhookEndpoint(id: string): Promise<AutomationDeliveryLog> {
  const res = await apiRequest<{ log: AutomationDeliveryLog }>(
    `/api/neon/admin/automation/webhooks/${encodeURIComponent(id)}/test`,
    {
      method: 'POST',
    }
  );
  return res.log;
}
