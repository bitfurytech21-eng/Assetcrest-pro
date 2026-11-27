'use client';

import { useSyncExternalStore } from 'react';

export type PageTab =
  | 'dashboard'
  | 'deposit'
  | 'withdraw'
  | 'transfer'
  | 'swap'
  | 'transactions'
  | 'plans'
  | 'my-investments'
  | 'vacation-portal'
  | 'real-estate'
  | 'kyc'
  | 'profile'
  | 'referrals'
  | 'contact'
  | 'admin'
  | 'apk';

export type AccountType = 'Individual' | 'Joint';
export type UserRole = 'investor' | 'admin';
export type KycStatus = 'Unverified' | 'Pending' | 'Approved' | 'Rejected';
export type CryptoAssetSymbol = 'USD' | 'USDC' | 'ETH' | 'BTC' | 'USDT' | 'BNB' | 'SOL' | 'XRP';

export interface JointOwnerDetails {
  coOwnerName: string;
  coOwnerEmail: string;
  relationship: string;
  authorizationMode: 'Either Owner' | 'Dual Notice';
}

export interface KycSubmission {
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

export interface UserAccount {
  id: string;
  username?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  referredBy?: string;
  password: string;
  role: UserRole;
  accountType: AccountType;
  jointDetails?: JointOwnerDetails;
  avatarDataUrl?: string;
  referralCode: string;
  accountBalance: number;
  totalProfit: number;
  bonus: number;
  referralBonus: number;
  totalDeposit: number;
  cryptoBalances: Record<Exclude<CryptoAssetSymbol, 'USD'>, number>;
  kycStatus: KycStatus;
  kycSubmission?: KycSubmission;
  createdAt: string;
  accountStatus?: 'Active' | 'Blocked';
  lastLoginAt?: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  type: 'Deposit' | 'Withdrawal' | 'Transfer Out' | 'Transfer In' | 'Swap' | 'Investment' | 'Bonus';
  method: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Cancelled';
  date: string;
  note?: string;
  proofName?: string;
  proofDataUrl?: string;
}

export interface ActiveInvestment {
  id: string;
  userId: string;
  category: 'Standard' | 'Vacation' | 'Real Estate';
  planName: string;
  amount: number;
  dailyRate: string;
  durationDays: number;
  status: 'Active' | 'Completed';
  startedAt: string;
  meta?: string;
  startedAtMs?: number;
  lastAccrualMs?: number;
  lastPayoutAt?: string;
  payoutCyclesCompleted?: number;
  accruedProfit?: number;
  principalReturned?: boolean;
  autoCompound?: boolean;
  autoRoiEnabled?: boolean;
}

export interface VisitorLocationLog {
  id: string;
  refCode: string;
  clickedUrl: string;
  latitude: string;
  longitude: string;
  accuracyLabel: string;
  timezone: string;
  language: string;
  deviceSummary: string;
  timestamp: string;
}

export interface ContactTicket {
  id: string;
  userId: string;
  senderEmail: string;
  targetDeskEmail: string;
  subject: string;
  message: string;
  date: string;
}

export interface InvestmentPlanConfig {
  id: string;
  name: string;
  category: 'Standard' | 'Vacation' | 'Real Estate';
  price?: number;
  dailyRate: string;
  monthlyRate?: string;
  referralBonusPct?: number;
  durationDays: number;
  min: number;
  max: number;
  isActive: boolean;
  features?: string[];
  destination?: string;
  perk?: string;
  batchLabel?: string;
  applicationPeriod?: string;
  migrationPeriod?: string;
  accountQualification?: number;
  targetedReach?: number;
  instantReward?: string;
  sector?: string;
  location?: string;
  annualized?: string;
  occupancy?: string;
}

export interface SessionLogRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  timestamp: string;
  deviceSummary: string;
}

export interface ActivityLogRecord {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  category:
    | 'auth'
    | 'deposit'
    | 'withdrawal'
    | 'kyc'
    | 'plan'
    | 'user'
    | 'roi'
    | 'settings'
    | 'wallet';
  detail: string;
  timestamp: string;
}

export type WalletStatus = 'Active' | 'Inactive' | 'Maintenance';

export interface CryptoWalletRecord {
  id: string;
  cryptocurrency: string;
  symbol: string;
  network: string;
  address: string;
  label: string;
  status: WalletStatus;
  minDeposit: number;
  maxDeposit: number;
  instructions: string;
  createdAt: string;
  updatedAt: string;
  updatedByAdminName: string;
  updatedByAdminEmail: string;
  assignedUserIds?: string[];
}

export interface PlatformSettings {
  platformName: string;
  welcomeQuote: string;
  referralBonusPct: number;
  autoRoiGlobalEnabled: boolean;
  allowNewRegistrations: boolean;
  maintenanceNotice: string;
  updatedAt: string;
}

export interface AssetCrestStore {
  activeUserId: string | null;
  users: UserAccount[];
  transactions: TransactionRecord[];
  investments: ActiveInvestment[];
  locationLogs: VisitorLocationLog[];
  tickets: ContactTicket[];
  welcomeModalUserId: string | null;
  investmentPlans: InvestmentPlanConfig[];
  sessionLogs: SessionLogRecord[];
  activityLogs: ActivityLogRecord[];
  platformSettings: PlatformSettings;
  cryptoWallets: CryptoWalletRecord[];
}

export const CRYPTO_ASSETS: {
  symbol: CryptoAssetSymbol;
  name: string;
  network: string;
}[] = [
  { symbol: 'USD', name: 'US Dollar Wallet', network: 'Internal USD' },
  { symbol: 'USDC', name: 'USD Coin', network: 'BEP20' },
  { symbol: 'USDT', name: 'Tether USD', network: 'BEP20 / TRC20' },
  { symbol: 'BTC', name: 'Bitcoin', network: 'BTC Mainnet' },
  { symbol: 'ETH', name: 'Ethereum', network: 'ERC20' },
  { symbol: 'BNB', name: 'BNB Smart Chain', network: 'BEP20' },
  { symbol: 'SOL', name: 'Solana', network: 'Solana' },
  { symbol: 'XRP', name: 'Ripple', network: 'XRP Ledger' },
];

export const STANDARD_PLAN_FEATURES = [
  '100% Protection',
  'Automated Payouts',
  'A.I Trading',
  '24/7 Support',
];

export const INVESTMENT_PLANS: InvestmentPlanConfig[] = [
  {
    id: 'beginners',
    name: 'Beginners',
    category: 'Standard',
    price: 200,
    dailyRate: '1.36%',
    monthlyRate: '40.8%',
    referralBonusPct: 5,
    durationDays: 30,
    min: 200,
    max: 4999,
    isActive: true,
    features: STANDARD_PLAN_FEATURES,
  },
  {
    id: 'prime',
    name: 'Prime',
    category: 'Standard',
    price: 5000,
    dailyRate: '1.72%',
    monthlyRate: '51.6%',
    referralBonusPct: 5,
    durationDays: 30,
    min: 5000,
    max: 49999,
    isActive: true,
    features: STANDARD_PLAN_FEATURES,
  },
  {
    id: 'executive',
    name: 'Executive',
    category: 'Standard',
    price: 50000,
    dailyRate: '2.08%',
    monthlyRate: '62.4%',
    referralBonusPct: 5,
    durationDays: 30,
    min: 50000,
    max: 99999,
    isActive: true,
    features: STANDARD_PLAN_FEATURES,
  },
  {
    id: 'premium',
    name: 'Premium',
    category: 'Standard',
    price: 100000,
    dailyRate: '2.44%',
    monthlyRate: '73.2%',
    referralBonusPct: 5,
    durationDays: 30,
    min: 100000,
    max: 1000000,
    isActive: true,
    features: STANDARD_PLAN_FEATURES,
  },
  {
    id: 'masters',
    name: 'Masters',
    category: 'Standard',
    price: 500000,
    dailyRate: '2.80%',
    monthlyRate: '84.0%',
    referralBonusPct: 5,
    durationDays: 30,
    min: 500000,
    max: 5000000,
    isActive: true,
    features: STANDARD_PLAN_FEATURES,
  },
];

export const VACATION_QUALIFICATION_USD = 5000;

export const VACATION_PLANS: InvestmentPlanConfig[] = [
  {
    id: 'vac-spring',
    name: 'Spring',
    category: 'Vacation',
    batchLabel: 'Batch A: Spring',
    destination: 'Any War-Free City or State of Preference',
    applicationPeriod: 'March ~',
    migrationPeriod: 'May',
    accountQualification: 6,
    targetedReach: 55000,
    instantReward: '30%',
    price: 55000,
    dailyRate: '1.00%',
    monthlyRate: '30.0%',
    referralBonusPct: 5,
    durationDays: 30,
    min: 55000,
    max: 250000,
    isActive: true,
    perk: 'Fully sponsored three-week holiday trip · Batch A: Spring · 30% Instant Reward',
  },
  {
    id: 'vac-summer',
    name: 'Summer',
    category: 'Vacation',
    batchLabel: 'Batch B: Summer',
    destination: 'Any War-Free City or State of Preference',
    applicationPeriod: 'June ~',
    migrationPeriod: 'August',
    accountQualification: 4,
    targetedReach: 35000,
    instantReward: '20%',
    price: 35000,
    dailyRate: '0.67%',
    monthlyRate: '20.0%',
    referralBonusPct: 5,
    durationDays: 30,
    min: 35000,
    max: 150000,
    isActive: true,
    perk: 'Fully sponsored three-week holiday trip · Batch B: Summer · 20% Instant Reward',
  },
  {
    id: 'vac-autumn',
    name: 'Autumn',
    category: 'Vacation',
    batchLabel: 'Batch C: Autumn',
    destination: 'Any War-Free City or State of Preference',
    applicationPeriod: 'September ~',
    migrationPeriod: 'November',
    accountQualification: 5,
    targetedReach: 45000,
    instantReward: '25%',
    price: 45000,
    dailyRate: '0.83%',
    monthlyRate: '25.0%',
    referralBonusPct: 5,
    durationDays: 30,
    min: 45000,
    max: 200000,
    isActive: true,
    perk: 'Fully sponsored three-week holiday trip · Batch C: Autumn · 25% Instant Reward',
  },
  {
    id: 'vac-winter',
    name: 'Winter',
    category: 'Vacation',
    batchLabel: 'Batch D: Winter',
    destination: 'Any War-Free City or State of Preference',
    applicationPeriod: 'December ~',
    migrationPeriod: 'February',
    accountQualification: 3,
    targetedReach: 25000,
    instantReward: '15%',
    price: 25000,
    dailyRate: '0.50%',
    monthlyRate: '15.0%',
    referralBonusPct: 5,
    durationDays: 30,
    min: 25000,
    max: 100000,
    isActive: true,
    perk: 'Fully sponsored three-week holiday trip · Batch D: Winter · 15% Instant Reward',
  },
];

export const REAL_ESTATE_PLANS: InvestmentPlanConfig[] = [
  {
    id: 're-metro-reit',
    name: 'Metropolitan Commercial REIT',
    category: 'Real Estate',
    sector: 'Class-A Office & Retail',
    location: 'London & Manchester, UK',
    price: 1000,
    dailyRate: '0.88%',
    monthlyRate: '26.4%',
    referralBonusPct: 5,
    annualized: '52.8% Term Yield (60d)',
    durationDays: 60,
    min: 1000,
    max: 50000,
    isActive: true,
    occupancy: '96.4%',
  },
  {
    id: 're-coastal-luxury',
    name: 'Coastal Luxury Residential Fund',
    category: 'Real Estate',
    sector: 'Prime Waterfront Residences',
    location: 'Miami & Marbella',
    price: 5000,
    dailyRate: '1.10%',
    monthlyRate: '33.0%',
    referralBonusPct: 5,
    annualized: '99.0% Term Yield (90d)',
    durationDays: 90,
    min: 5000,
    max: 150000,
    isActive: true,
    occupancy: '98.1%',
  },
  {
    id: 're-logistics',
    name: 'Continental Logistics & Cold-Chain',
    category: 'Real Estate',
    sector: 'Industrial Fulfillment Hubs',
    location: 'Rotterdam & Frankfurt',
    price: 15000,
    dailyRate: '1.30%',
    monthlyRate: '39.0%',
    referralBonusPct: 5,
    annualized: '156.0% Term Yield (120d)',
    durationDays: 120,
    min: 15000,
    max: 500000,
    isActive: true,
    occupancy: '99.2%',
  },
];

export const SUPPORT_EMAILS = [
  {
    label: 'Assetcrest Support',
    email: 'info@assetcrestonline.com',
    hours: 'General enquiries and investor support',
  },
  {
    label: 'Compliance & Maintenance',
    email: 'compliance&maintenance@assetcrestonline.com',
    hours: 'Compliance, account and maintenance enquiries',
  },
  {
    label: 'Customer Support',
    email: 'customersupport@assetcrestonline.com',
    hours: 'Customer assistance',
  },
];

export const EMPTY_CRYPTO_BALANCES: Record<Exclude<CryptoAssetSymbol, 'USD'>, number> = {
  USDC: 0,
  ETH: 0,
  BTC: 0,
  USDT: 0,
  BNB: 0,
  SOL: 0,
  XRP: 0,
};

export const DEFAULT_SEED_STORE: AssetCrestStore = {
  activeUserId: null,
  welcomeModalUserId: null,
  users: [],
  transactions: [],
  investments: [],
  locationLogs: [],
  tickets: [],
  investmentPlans: [
    ...INVESTMENT_PLANS,
    ...VACATION_PLANS,
    ...REAL_ESTATE_PLANS,
  ],
  sessionLogs: [],
  activityLogs: [],
  platformSettings: {
    platformName: 'AssetCrest',
    welcomeQuote:
      'The greatest glory in living lies not in never falling, but in rising every time we fall. - Nelson Mandela',
    referralBonusPct: 5,
    autoRoiGlobalEnabled: true,
    allowNewRegistrations: true,
    maintenanceNotice: '',
    updatedAt: '2026-11-23 00:00',
  },
  cryptoWallets: [],
};

export const DEFAULT_INVESTMENT_PLANS: InvestmentPlanConfig[] = DEFAULT_SEED_STORE.investmentPlans;
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = DEFAULT_SEED_STORE.platformSettings;

const THEME_KEY = 'assetcrest_theme_mode_v1';

let idCounter = 2000;
export function nextRecordId(prefix: string): string {
  idCounter += 1;
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${idCounter}-${rand}`;
}

export function formatNowStamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

export function appendActivityLog(
  prev: AssetCrestStore,
  entry: Omit<ActivityLogRecord, 'id' | 'timestamp'> & { timestamp?: string }
): ActivityLogRecord[] {
  const rec: ActivityLogRecord = {
    id: nextRecordId('ACT'),
    timestamp: entry.timestamp || formatNowStamp(),
    actorId: entry.actorId,
    actorName: entry.actorName,
    action: entry.action,
    category: entry.category,
    detail: entry.detail,
  };
  return [rec, ...(prev.activityLogs || [])].slice(0, 150);
}

export function appendSessionLog(
  prev: AssetCrestStore,
  user: UserAccount
): SessionLogRecord[] {
  const deviceSummary =
    typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 72) : 'Web Browser';
  const rec: SessionLogRecord = {
    id: nextRecordId('SES'),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    timestamp: formatNowStamp(),
    deviceSummary,
  };
  return [rec, ...(prev.sessionLogs || [])].slice(0, 80);
}

let cachedStore: AssetCrestStore | null = null;
const storeListeners = new Set<() => void>();

const LEGACY_SEED_PLAN_IDS = new Set([
  'starter',
  'growth',
  'institutional',
  'vac-amalfi',
  'vac-alpine',
  'vac-maldives',
]);

function migrateInvestmentPlans(rawPlans?: InvestmentPlanConfig[]): InvestmentPlanConfig[] {
  if (!Array.isArray(rawPlans) || rawPlans.length === 0) {
    return DEFAULT_INVESTMENT_PLANS;
  }

  const hasLegacySeed = rawPlans.some(
    (p) =>
      LEGACY_SEED_PLAN_IDS.has(p.id) ||
      (p.id === 'premium' && p.min === 5000 && p.dailyRate === '0.95%') ||
      (p.id === 're-metro-reit' && p.annualized === '32.1% Est. APY')
  );

  if (!hasLegacySeed) {
    // Ensure new seed plans exist if missing, preserving any admin status/edits
    const byId = new Map(rawPlans.map((p) => [p.id, p]));
    const missingDefaults = DEFAULT_INVESTMENT_PLANS.filter((d) => !byId.has(d.id));
    return missingDefaults.length > 0 ? [...rawPlans, ...missingDefaults] : rawPlans;
  }

  const prevActiveById = new Map(rawPlans.map((p) => [p.id, p.isActive]));
  const customPlans = rawPlans.filter(
    (p) =>
      !LEGACY_SEED_PLAN_IDS.has(p.id) &&
      !DEFAULT_INVESTMENT_PLANS.some((d) => d.id === p.id)
  );

  const syncedDefaults = DEFAULT_INVESTMENT_PLANS.map((def) => {
    // Preserve admin Active/Inactive toggle for plans sharing an ID (except legacy 'premium' which changed tier completely)
    if (def.id !== 'premium' && prevActiveById.has(def.id)) {
      return { ...def, isActive: Boolean(prevActiveById.get(def.id)) };
    }
    return def;
  });

  return [...syncedDefaults, ...customPlans];
}

function ensureUniqueRecordIds<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.map((item, idx) => {
    const rawId = item.id || `REC-${idx}`;
    if (!seen.has(rawId)) {
      seen.add(rawId);
      return item;
    }
    let uniqueId = `${rawId}-D${idx}`;
    let bump = 1;
    while (seen.has(uniqueId)) {
      bump += 1;
      uniqueId = `${rawId}-D${idx}-${bump}`;
    }
    seen.add(uniqueId);
    return { ...item, id: uniqueId };
  });
}

function normalizeStoreRecordIds(s: AssetCrestStore): AssetCrestStore {
  return {
    ...s,
    users: ensureUniqueRecordIds(s.users),
    transactions: ensureUniqueRecordIds(s.transactions),
    investments: ensureUniqueRecordIds(s.investments),
    locationLogs: ensureUniqueRecordIds(s.locationLogs),
    tickets: ensureUniqueRecordIds(s.tickets),
    investmentPlans: ensureUniqueRecordIds(s.investmentPlans),
    sessionLogs: ensureUniqueRecordIds(s.sessionLogs),
    activityLogs: ensureUniqueRecordIds(s.activityLogs),
    cryptoWallets: ensureUniqueRecordIds(s.cryptoWallets),
  };
}

function readStoreFromStorage(): AssetCrestStore {
  // This is a transient UI cache only. Account and financial data are fetched from
  // authenticated API endpoints and persisted by the Neon-backed server.
  if (typeof window === 'undefined') return DEFAULT_SEED_STORE;
  if (!cachedStore) cachedStore = DEFAULT_SEED_STORE;
  return cachedStore;
}

export function updateAssetCrestStore(updater: (prev: AssetCrestStore) => AssetCrestStore): void {
  const current = readStoreFromStorage();
  const next = normalizeStoreRecordIds(updater(current));
  cachedStore = next;
  // Keep transient state in memory only. Persist authoritative user data through Neon APIs.
  storeListeners.forEach((listener) => listener());
}

function subscribeStore(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

function getServerStoreSnapshot(): AssetCrestStore {
  return DEFAULT_SEED_STORE;
}

export function useAssetCrestStore(): AssetCrestStore {
  return useSyncExternalStore(subscribeStore, readStoreFromStorage, getServerStoreSnapshot);
}

// --- Theme Store (Light / Dark) ---
export type ThemeMode = 'light' | 'dark';
let cachedTheme: ThemeMode | null = null;
const themeListeners = new Set<() => void>();

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  if (cachedTheme) return cachedTheme;
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    cachedTheme = saved === 'dark' ? 'dark' : 'light';
    return cachedTheme;
  } catch {
    cachedTheme = 'light';
    return 'light';
  }
}

export function setThemeMode(mode: ThemeMode): void {
  cachedTheme = mode;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_KEY, mode);
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }
  themeListeners.forEach((l) => l());
}

function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribeTheme, readTheme, () => 'light');
}

// --- Image File Compression Helper (fits localStorage & Neon payload limits) ---
export function readAndCompressFile(
  file: File,
  maxDimension = 640,
  maxChars = 230000
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        if (result.length > maxChars) {
          reject(new Error('PDF file exceeds 170 KB embedded receipt limit. Please upload an image screenshot instead.'));
          return;
        }
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const rawUrl = String(reader.result || '');
      const img = new window.Image();
      img.onload = () => {
        let dim = maxDimension;
        let quality = 0.78;
        let output = '';

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const scale = Math.min(1, dim / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawUrl.slice(0, maxChars));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          output = canvas.toDataURL('image/jpeg', quality);
          if (output.length <= maxChars) {
            resolve(output);
            return;
          }
          dim = Math.round(dim * 0.72);
          quality = Math.max(0.4, quality - 0.12);
        }

        resolve(output);
      };
      img.onerror = () => resolve(rawUrl.slice(0, maxChars));
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

// --- Admin-Only Referral/Tracking Link Visitor Location Capture ---
export function captureVisitorLocationForAdmin(
  refCode: string,
  clickedUrl: string,
  onCaptured?: (entry: Omit<VisitorLocationLog, 'id'>) => void
): void {
  if (typeof window === 'undefined') return;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const language = navigator.language || 'en-US';
  const deviceSummary = navigator.userAgent.slice(0, 95);
  const stamp = formatNowStamp();

  const recordLog = (latitude: string, longitude: string, accuracyLabel: string) => {
    const entryBase: Omit<VisitorLocationLog, 'id'> = {
      refCode: refCode.toUpperCase(),
      clickedUrl,
      latitude,
      longitude,
      accuracyLabel,
      timezone,
      language,
      deviceSummary,
      timestamp: stamp,
    };
    const newEntry: VisitorLocationLog = {
      id: nextRecordId('LOC'),
      ...entryBase,
    };
    updateAssetCrestStore((prev) => ({
      ...prev,
      locationLogs: [newEntry, ...prev.locationLogs].slice(0, 100),
    }));
    onCaptured?.(entryBase);
  };

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        recordLog(
          pos.coords.latitude.toFixed(5),
          pos.coords.longitude.toFixed(5),
          `GPS ±${Math.round(pos.coords.accuracy)}m`
        );
      },
      () => {
        recordLog('Permission declined', 'Permission declined', `Timezone fallback (${timezone})`);
      },
      { enableHighAccuracy: false, timeout: 4500, maximumAge: 60000 }
    );
  } else {
    recordLog('Unavailable', 'Unavailable', `Timezone fallback (${timezone})`);
  }
}
