import crypto from 'crypto';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { createPool, db, isDatabaseConfigured } from './index.ts';
import {
  cryptoWallets,
  investments,
  locationLogs,
  passwordResets,
  tickets,
  transactions,
  transferRequests,
  users,
  type DbCryptoBalances,
  type DbJointOwnerDetails,
  type DbKycSubmission,
} from './schema.ts';
import { hashPassword, hashToken, verifyPassword } from '../lib/auth-session.ts';

export type WalletStatus = 'Active' | 'Inactive' | 'Maintenance';
export type KycStatus = 'Unverified' | 'Pending' | 'Approved' | 'Rejected';
export type CryptoAssetSymbol = 'USD' | 'USDC' | 'ETH' | 'BTC' | 'USDT' | 'BNB' | 'SOL' | 'XRP';

export interface PublicUserAccount {
  id: string;
  username?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  referredBy?: string;
  password: string;
  role: 'investor' | 'admin';
  accountType: 'Individual' | 'Joint';
  jointDetails?: DbJointOwnerDetails;
  avatarDataUrl?: string;
  referralCode: string;
  accountBalance: number;
  totalProfit: number;
  bonus: number;
  referralBonus: number;
  totalDeposit: number;
  cryptoBalances: DbCryptoBalances;
  kycStatus: KycStatus;
  kycSubmission?: DbKycSubmission;
  createdAt: string;
  accountStatus?: 'Active' | 'Blocked';
  lastLoginAt?: string;
}

export interface RepoTransaction {
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

export interface RepoInvestment {
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

export interface RepoTicket {
  id: string;
  userId: string;
  senderEmail: string;
  targetDeskEmail: string;
  subject: string;
  message: string;
  date: string;
}

export interface RepoLocationLog {
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

export interface RepoCryptoWallet {
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

export interface RepoTransferRequest {
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

export const BOOTSTRAPPED_ADMIN_EMAIL =
  (process.env.ADMIN_EMAIL || 'admin@assetcrest.co').trim().toLowerCase();

const EMPTY_BALANCES: DbCryptoBalances = {
  USDC: 0,
  ETH: 0,
  BTC: 0,
  USDT: 0,
  BNB: 0,
  SOL: 0,
  XRP: 0,
};

let seqCounter = 1000;
export function nextNeonId(prefix: string): string {
  seqCounter += 1;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 12) || 'ID';
  return `${safePrefix}-${Date.now()}-${seqCounter}-${rand}`;
}

export function formatStamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

const DEFAULT_WALLETS: RepoCryptoWallet[] = [
  {
    id: 'wal-btc',
    cryptocurrency: 'Bitcoin',
    symbol: 'BTC',
    network: 'BTC Mainnet',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    label: 'Bitcoin Treasury Vault',
    status: 'Active',
    minDeposit: 50,
    maxDeposit: 250000,
    instructions:
      'Send only native BTC over Bitcoin Mainnet. Minimum 2 network confirmations before uploading receipt.',
    createdAt: '2026-10-01 09:00',
    updatedAt: '2026-10-01 09:00',
    updatedByAdminName: 'AssetCrest Admin',
    updatedByAdminEmail: BOOTSTRAPPED_ADMIN_EMAIL,
    assignedUserIds: [],
  },
  {
    id: 'wal-eth',
    cryptocurrency: 'Ethereum',
    symbol: 'ETH',
    network: 'ERC20',
    address: '0xD0E2f9e3c73A4aaDF4436F2b7cef9255b8a41E92',
    label: 'Ethereum Custody Desk',
    status: 'Active',
    minDeposit: 50,
    maxDeposit: 250000,
    instructions:
      'Transfer ETH exclusively via Ethereum Mainnet (ERC20). Retain transaction hash or screenshot for verification.',
    createdAt: '2026-10-01 09:00',
    updatedAt: '2026-10-01 09:00',
    updatedByAdminName: 'AssetCrest Admin',
    updatedByAdminEmail: BOOTSTRAPPED_ADMIN_EMAIL,
    assignedUserIds: [],
  },
  {
    id: 'wal-usdt-trc20',
    cryptocurrency: 'USDT',
    symbol: 'USDT',
    network: 'TRC20',
    address: 'TX9aK3vPq8L2mN5xR7cW4yH1zF6dB8sQ3p',
    label: 'USDT (TRC20) Settlement',
    status: 'Active',
    minDeposit: 50,
    maxDeposit: 500000,
    instructions:
      'Send Tether USD strictly on the TRON (TRC20) network. Sending via other chains may result in permanent loss.',
    createdAt: '2026-10-01 09:00',
    updatedAt: '2026-10-01 09:00',
    updatedByAdminName: 'AssetCrest Admin',
    updatedByAdminEmail: BOOTSTRAPPED_ADMIN_EMAIL,
    assignedUserIds: [],
  },
  {
    id: 'wal-usdt-bep20',
    cryptocurrency: 'USDT',
    symbol: 'USDT',
    network: 'BEP20',
    address: '0xD0E2f9e3c73A4aaDF4436F2b7cef9255b8a41E92',
    label: 'USDT (BEP20) Settlement',
    status: 'Active',
    minDeposit: 50,
    maxDeposit: 500000,
    instructions:
      'Send USDT over BNB Smart Chain (BEP20) only and upload your payment confirmation screenshot.',
    createdAt: '2026-10-01 09:00',
    updatedAt: '2026-10-01 09:00',
    updatedByAdminName: 'AssetCrest Admin',
    updatedByAdminEmail: BOOTSTRAPPED_ADMIN_EMAIL,
    assignedUserIds: [],
  },
  {
    id: 'wal-usdc-bep20',
    cryptocurrency: 'USDC',
    symbol: 'USDC',
    network: 'BEP20',
    address: '0xD0E2f9e3c73A4aaDF4436F2b7cef9255b8a41E92',
    label: 'USDC (BEP20) Primary',
    status: 'Active',
    minDeposit: 50,
    maxDeposit: 500000,
    instructions:
      'Send USDC via BNB Smart Chain (BEP20). Include TxID or receipt screenshot in the confirmation step.',
    createdAt: '2026-10-01 09:00',
    updatedAt: '2026-10-01 09:00',
    updatedByAdminName: 'AssetCrest Admin',
    updatedByAdminEmail: BOOTSTRAPPED_ADMIN_EMAIL,
    assignedUserIds: [],
  },
  {
    id: 'wal-bnb',
    cryptocurrency: 'BNB',
    symbol: 'BNB',
    network: 'BEP20',
    address: '0xD0E2f9e3c73A4aaDF4436F2b7cef9255b8a41E92',
    label: 'BNB Smart Chain Desk',
    status: 'Active',
    minDeposit: 50,
    maxDeposit: 150000,
    instructions: 'Send BNB via BNB Smart Chain (BEP20) only.',
    createdAt: '2026-10-01 09:00',
    updatedAt: '2026-10-01 09:00',
    updatedByAdminName: 'AssetCrest Admin',
    updatedByAdminEmail: BOOTSTRAPPED_ADMIN_EMAIL,
    assignedUserIds: [],
  },
  {
    id: 'wal-sol',
    cryptocurrency: 'Solana',
    symbol: 'SOL',
    network: 'SOL',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    label: 'Solana Institutional Wallet',
    status: 'Active',
    minDeposit: 50,
    maxDeposit: 150000,
    instructions: 'Transfer SOL on the native Solana network.',
    createdAt: '2026-10-01 09:00',
    updatedAt: '2026-10-01 09:00',
    updatedByAdminName: 'AssetCrest Admin',
    updatedByAdminEmail: BOOTSTRAPPED_ADMIN_EMAIL,
    assignedUserIds: [],
  },
  {
    id: 'wal-xrp',
    cryptocurrency: 'Ripple',
    symbol: 'XRP',
    network: 'XRP Ledger',
    address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
    label: 'Ripple (XRP) Ledger Vault',
    status: 'Active',
    minDeposit: 50,
    maxDeposit: 150000,
    instructions: 'Send XRP over the XRP Ledger. Attach your transaction hash screenshot.',
    createdAt: '2026-10-01 09:00',
    updatedAt: '2026-10-01 09:00',
    updatedByAdminName: 'AssetCrest Admin',
    updatedByAdminEmail: BOOTSTRAPPED_ADMIN_EMAIL,
    assignedUserIds: [],
  },
];

// ============================================================================
// IN-MEMORY FALLBACK STORE (USED ONLY WHEN DATABASE_URL IS NOT CONFIGURED)
// ============================================================================
interface MemoryUserRow extends PublicUserAccount {
  passwordHash: string;
}

interface MemoryResetRow {
  id: string;
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: number;
  used: boolean;
}

const memoryState: {
  initialized: boolean;
  users: MemoryUserRow[];
  transactions: RepoTransaction[];
  investments: RepoInvestment[];
  tickets: RepoTicket[];
  locationLogs: Array<RepoLocationLog & { reporterUserId?: string }>;
  cryptoWallets: RepoCryptoWallet[];
  transferRequests: RepoTransferRequest[];
  passwordResets: MemoryResetRow[];
} = {
  initialized: false,
  users: [],
  transactions: [],
  investments: [],
  tickets: [],
  locationLogs: [],
  cryptoWallets: [...DEFAULT_WALLETS],
  transferRequests: [],
  passwordResets: [],
};

function ensureMemorySeeded() {
  if (memoryState.initialized) return;
  memoryState.initialized = true;
  const envAdminPass = process.env.ADMIN_PASSWORD?.trim();
  memoryState.users = [
    {
      id: 'usr-admin',
      username: 'admin',
      name: 'AssetCrest Admin',
      email: BOOTSTRAPPED_ADMIN_EMAIL,
      password: '',
      passwordHash: envAdminPass ? hashPassword(envAdminPass) : '',
      role: 'admin',
      accountType: 'Individual',
      referralCode: 'ADMIN',
      accountBalance: 25000,
      totalProfit: 0,
      bonus: 0,
      referralBonus: 0,
      totalDeposit: 25000,
      cryptoBalances: { USDC: 5000, ETH: 2, BTC: 0.1, USDT: 5000, BNB: 5, SOL: 10, XRP: 1000 },
      kycStatus: 'Approved',
      accountStatus: 'Active',
      createdAt: '2026-10-01',
    },
    {
      id: 'usr-marcus',
      username: 'marcusvance',
      name: 'Marcus Vance',
      email: 'marcus.vance@assetcrest.co',
      country: 'United Kingdom',
      password: '',
      passwordHash: hashPassword('Password123!'),
      role: 'investor',
      accountType: 'Joint',
      jointDetails: {
        coOwnerName: 'Elena Vance',
        coOwnerEmail: 'elena.vance@assetcrest.co',
        relationship: 'Spouse',
        authorizationMode: 'Either Owner',
      },
      referralCode: 'MARCUS',
      accountBalance: 6450,
      totalProfit: 840,
      bonus: 150,
      referralBonus: 120,
      totalDeposit: 6000,
      cryptoBalances: { USDC: 1200, ETH: 0.45, BTC: 0.025, USDT: 800, BNB: 1.5, SOL: 4.2, XRP: 350 },
      kycStatus: 'Approved',
      kycSubmission: {
        legalName: 'Marcus & Elena Vance',
        country: 'United Kingdom',
        documentType: 'Passport',
        documentNumber: 'UK-88342019',
        idFrontDataUrl: '',
        idFrontName: 'passport_vance_verified.png',
        selfieDataUrl: '',
        selfieName: 'selfie_vance_verified.png',
        submittedAt: '2026-11-05 10:14',
        reviewedAt: '2026-11-05 11:02',
        adminNote: 'Verified joint holders.',
      },
      accountStatus: 'Active',
      createdAt: '2026-10-15',
    },
  ];
  memoryState.transactions = [
    {
      id: 'TX-SEED-001',
      userId: 'usr-marcus',
      type: 'Deposit',
      method: 'USDC (BEP20)',
      amount: 6000,
      status: 'Completed',
      date: '2026-11-05 09:30',
      note: 'Initial joint deposit confirmed',
    },
  ];
}

// ============================================================================
// LAZY NEON POSTGRESQL SCHEMA & SEED INITIALIZER
// ============================================================================
let schemaInitPromise: Promise<void> | null = null;

export async function ensureNeonSchemaAndSeed(): Promise<void> {
  if (!isDatabaseConfigured) {
    ensureMemorySeeded();
    return;
  }
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = (async () => {
    const pool = createPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone_number TEXT,
        country TEXT,
        referred_by TEXT,
        password_hash TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'investor',
        account_type TEXT NOT NULL DEFAULT 'Individual',
        joint_details JSONB,
        avatar_data_url TEXT,
        referral_code TEXT NOT NULL UNIQUE,
        account_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
        bonus DOUBLE PRECISION NOT NULL DEFAULT 0,
        referral_bonus DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_deposit DOUBLE PRECISION NOT NULL DEFAULT 0,
        crypto_balances JSONB NOT NULL,
        kyc_status TEXT NOT NULL DEFAULT 'Unverified',
        kyc_submission JSONB,
        account_status TEXT NOT NULL DEFAULT 'Active',
        last_login_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        method TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        status TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        proof_name TEXT,
        proof_data_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS investments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        daily_rate TEXT NOT NULL,
        duration_days INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        started_at TEXT NOT NULL,
        meta TEXT,
        started_at_ms BIGINT,
        last_accrual_ms BIGINT,
        last_payout_at TEXT,
        payout_cycles_completed INTEGER NOT NULL DEFAULT 0,
        accrued_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
        principal_returned BOOLEAN NOT NULL DEFAULT FALSE,
        auto_compound BOOLEAN NOT NULL DEFAULT FALSE,
        auto_roi_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_email TEXT NOT NULL,
        target_desk_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS location_logs (
        id TEXT PRIMARY KEY,
        reporter_user_id TEXT,
        ref_code TEXT NOT NULL,
        clicked_url TEXT NOT NULL,
        latitude TEXT NOT NULL,
        longitude TEXT NOT NULL,
        accuracy_label TEXT NOT NULL,
        timezone TEXT NOT NULL,
        language TEXT NOT NULL,
        device_summary TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS crypto_wallets (
        id TEXT PRIMARY KEY,
        cryptocurrency TEXT NOT NULL,
        symbol TEXT NOT NULL,
        network TEXT NOT NULL,
        address TEXT NOT NULL,
        label TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        min_deposit DOUBLE PRECISION NOT NULL DEFAULT 50,
        max_deposit DOUBLE PRECISION NOT NULL DEFAULT 250000,
        instructions TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        updated_by_admin_name TEXT NOT NULL,
        updated_by_admin_email TEXT NOT NULL,
        assigned_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb
      );
      CREATE TABLE IF NOT EXISTS transfer_requests (
        id TEXT PRIMARY KEY,
        from_uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        from_name TEXT NOT NULL,
        to_uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_name TEXT NOT NULL,
        to_ref_code TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        status TEXT NOT NULL DEFAULT 'PendingClaim',
        note TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Demo wallets and funded demo admin accounts are development-only.
    // Production must use administrator-configured wallet addresses and an explicitly claimed admin.
    if (process.env.NODE_ENV !== 'production') {
      const existingWallets = await db.select({ id: cryptoWallets.id }).from(cryptoWallets).limit(1);
      if (existingWallets.length === 0) {
        for (const w of DEFAULT_WALLETS) {
          await db
            .insert(cryptoWallets)
            .values({
              id: w.id,
              cryptocurrency: w.cryptocurrency,
              symbol: w.symbol,
              network: w.network,
              address: w.address,
              label: w.label,
              status: w.status,
              minDeposit: w.minDeposit,
              maxDeposit: w.maxDeposit,
              instructions: w.instructions,
              createdAt: w.createdAt,
              updatedAt: w.updatedAt,
              updatedByAdminName: w.updatedByAdminName,
              updatedByAdminEmail: w.updatedByAdminEmail,
              assignedUserIds: w.assignedUserIds || [],
            })
            .onConflictDoNothing();
        }
      }
  
      const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
      if (existingUsers.length === 0) {
        const envAdminPass = process.env.ADMIN_PASSWORD?.trim();
        await db
          .insert(users)
          .values({
            id: 'usr-admin',
            username: 'admin',
            name: 'AssetCrest Admin',
            email: BOOTSTRAPPED_ADMIN_EMAIL,
            passwordHash: envAdminPass ? hashPassword(envAdminPass) : '',
            role: 'admin',
            accountType: 'Individual',
            referralCode: 'ADMIN',
            accountBalance: 25000,
            totalProfit: 0,
            bonus: 0,
            referralBonus: 0,
            totalDeposit: 25000,
            cryptoBalances: { USDC: 5000, ETH: 2, BTC: 0.1, USDT: 5000, BNB: 5, SOL: 10, XRP: 1000 },
            kycStatus: 'Approved',
            accountStatus: 'Active',
            createdAt: '2026-10-01',
          })
          .onConflictDoNothing();
      }
    }
  })().catch((err) => {
    schemaInitPromise = null;
    throw err;
  });

  return schemaInitPromise;
}

function mapDbUser(row: typeof users.$inferSelect): PublicUserAccount {
  const balances = (row.cryptoBalances || EMPTY_BALANCES) as DbCryptoBalances;
  return {
    id: row.id,
    username: row.username ?? undefined,
    name: row.name,
    email: row.email,
    phoneNumber: row.phoneNumber ?? undefined,
    country: row.country ?? undefined,
    referredBy: row.referredBy ?? undefined,
    password: '',
    role: row.role === 'admin' ? 'admin' : 'investor',
    accountType: row.accountType === 'Joint' ? 'Joint' : 'Individual',
    jointDetails: row.jointDetails ?? undefined,
    avatarDataUrl: row.avatarDataUrl ?? undefined,
    referralCode: row.referralCode,
    accountBalance: Number(row.accountBalance ?? 0),
    totalProfit: Number(row.totalProfit ?? 0),
    bonus: Number(row.bonus ?? 0),
    referralBonus: Number(row.referralBonus ?? 0),
    totalDeposit: Number(row.totalDeposit ?? 0),
    cryptoBalances: {
      USDC: Number(balances.USDC ?? 0),
      ETH: Number(balances.ETH ?? 0),
      BTC: Number(balances.BTC ?? 0),
      USDT: Number(balances.USDT ?? 0),
      BNB: Number(balances.BNB ?? 0),
      SOL: Number(balances.SOL ?? 0),
      XRP: Number(balances.XRP ?? 0),
    },
    kycStatus: (row.kycStatus as KycStatus) || 'Unverified',
    kycSubmission: row.kycSubmission ?? undefined,
    createdAt: row.createdAt,
    accountStatus: row.accountStatus === 'Blocked' ? 'Blocked' : 'Active',
    lastLoginAt: row.lastLoginAt ?? undefined,
  };
}

function stripMemoryUser(u: MemoryUserRow): PublicUserAccount {
  const { passwordHash: _hash, ...rest } = u;
  return { ...rest, password: '' };
}

export async function getMemoryUserById(userId: string): Promise<PublicUserAccount | null> {
  ensureMemorySeeded();
  const found = memoryState.users.find((u) => u.id === userId);
  return found ? stripMemoryUser(found) : null;
}

export async function getAdminSetupStatus(): Promise<{
  adminEmail: string;
  adminClaimed: boolean;
  envPasswordConfigured: boolean;
}> {
  await ensureNeonSchemaAndSeed();
  const envPasswordConfigured = Boolean(process.env.ADMIN_PASSWORD?.trim());
  if (!isDatabaseConfigured) {
    const adminRow = memoryState.users.find((u) => u.role === 'admin');
    return {
      adminEmail: adminRow?.email || BOOTSTRAPPED_ADMIN_EMAIL,
      adminClaimed: envPasswordConfigured || Boolean(adminRow?.passwordHash),
      envPasswordConfigured,
    };
  }

  const rows = await db
    .select({ email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.role, 'admin'))
    .limit(1);
  const adminRow = rows[0];
  return {
    adminEmail: adminRow?.email || BOOTSTRAPPED_ADMIN_EMAIL,
    adminClaimed: envPasswordConfigured || Boolean(adminRow?.passwordHash),
    envPasswordConfigured,
  };
}

export async function claimAdminPassword(password: string): Promise<PublicUserAccount> {
  await ensureNeonSchemaAndSeed();
  if (process.env.ADMIN_PASSWORD?.trim()) {
    throw new Error('Administrator password is already managed by server environment configuration.');
  }
  if (!password || password.length < 8) {
    throw new Error('Administrator password must be at least 8 characters long.');
  }

  const nextHash = hashPassword(password);

  if (!isDatabaseConfigured) {
    let admin = memoryState.users.find((u) => u.role === 'admin');
    if (admin && admin.passwordHash) {
      throw new Error('Administrator account has already been claimed.');
    }
    if (!admin) {
      admin = {
        id: 'usr-admin',
        username: 'admin',
        name: 'AssetCrest Admin',
        email: BOOTSTRAPPED_ADMIN_EMAIL,
        password: '',
        passwordHash: nextHash,
        role: 'admin',
        accountType: 'Individual',
        referralCode: 'ADMIN',
        accountBalance: 25000,
        totalProfit: 0,
        bonus: 0,
        referralBonus: 0,
        totalDeposit: 25000,
        cryptoBalances: { USDC: 5000, ETH: 2, BTC: 0.1, USDT: 5000, BNB: 5, SOL: 10, XRP: 1000 },
        kycStatus: 'Approved',
        accountStatus: 'Active',
        createdAt: formatStamp().slice(0, 10),
        lastLoginAt: formatStamp(),
      };
      memoryState.users.push(admin);
    } else {
      admin.passwordHash = nextHash;
      admin.lastLoginAt = formatStamp();
    }
    return stripMemoryUser(admin);
  }

  const rows = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  const existing = rows[0];
  if (existing && existing.passwordHash) {
    throw new Error('Administrator account has already been claimed.');
  }

  if (!existing) {
    const inserted = await db
      .insert(users)
      .values({
        id: 'usr-admin',
        username: 'admin',
        name: 'AssetCrest Admin',
        email: BOOTSTRAPPED_ADMIN_EMAIL,
        passwordHash: nextHash,
        role: 'admin',
        accountType: 'Individual',
        referralCode: 'ADMIN',
        accountBalance: 25000,
        totalProfit: 0,
        bonus: 0,
        referralBonus: 0,
        totalDeposit: 25000,
        cryptoBalances: { USDC: 5000, ETH: 2, BTC: 0.1, USDT: 5000, BNB: 5, SOL: 10, XRP: 1000 },
        kycStatus: 'Approved',
        accountStatus: 'Active',
        lastLoginAt: formatStamp(),
        createdAt: formatStamp().slice(0, 10),
      })
      .returning();
    return mapDbUser(inserted[0]);
  }

  const updated = await db
    .update(users)
    .set({
      passwordHash: nextHash,
      lastLoginAt: formatStamp(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, existing.id))
    .returning();
  return mapDbUser(updated[0]);
}

export async function registerUserInNeon(params: {
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  country: string;
  referredBy?: string;
  password: string;
}): Promise<PublicUserAccount> {
  await ensureNeonSchemaAndSeed();

  const cleanUsername = params.username.trim();
  const cleanName = params.name.trim().slice(0, 120);
  const cleanEmail = params.email.trim().toLowerCase().slice(0, 160);
  const cleanPhone = params.phoneNumber.trim().slice(0, 48);
  const cleanCountry = params.country.trim().slice(0, 80);
  const cleanReferredBy = params.referredBy?.trim().slice(0, 48) || undefined;

  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  if (!cleanName || !cleanEmail || !cleanPhone || !cleanCountry) {
    throw new Error('Please complete all required registration fields.');
  }
  if (!params.password || params.password.length < 8) {
    throw new Error('Password must be 8 or more characters long.');
  }

  const passwordHash = hashPassword(params.password);
  const newId = nextNeonId('USR');
  const codeBase = cleanUsername.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'INVESTOR';
  const fallbackSuffix = newId.slice(-4).toUpperCase();
  const createdAt = formatStamp().slice(0, 10);
  const lastLoginAt = formatStamp();

  if (!isDatabaseConfigured) {
    const dupEmail = memoryState.users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (dupEmail) throw new Error('An account with this email address already exists.');
    const dupUsername = memoryState.users.some(
      (u) => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (dupUsername) throw new Error('This username is already taken. Please choose another.');

    const codeConflict = memoryState.users.some(
      (u) => u.referralCode.toUpperCase() === codeBase
    );
    const referralCode = codeConflict ? `${codeBase}${fallbackSuffix}` : codeBase;

    const newUser: MemoryUserRow = {
      id: newId,
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      country: cleanCountry,
      referredBy: cleanReferredBy,
      password: '',
      passwordHash,
      role: 'investor',
      accountType: 'Individual',
      referralCode,
      accountBalance: 0,
      totalProfit: 0,
      bonus: 0,
      referralBonus: 0,
      totalDeposit: 0,
      cryptoBalances: { ...EMPTY_BALANCES },
      kycStatus: 'Unverified',
      accountStatus: 'Active',
      createdAt,
      lastLoginAt,
    };
    memoryState.users.push(newUser);
    return stripMemoryUser(newUser);
  }

  const dupRows = await db
    .select({ id: users.id, email: users.email, username: users.username, referralCode: users.referralCode })
    .from(users)
    .where(
      or(
        eq(users.email, cleanEmail),
        ilike(users.username, cleanUsername),
        eq(users.referralCode, codeBase)
      )
    );

  if (dupRows.some((r) => r.email.toLowerCase() === cleanEmail)) {
    throw new Error('An account with this email address already exists.');
  }
  if (dupRows.some((r) => r.username && r.username.toLowerCase() === cleanUsername.toLowerCase())) {
    throw new Error('This username is already taken. Please choose another.');
  }
  const referralCode = dupRows.some((r) => r.referralCode.toUpperCase() === codeBase)
    ? `${codeBase}${fallbackSuffix}`
    : codeBase;

  const inserted = await db
    .insert(users)
    .values({
      id: newId,
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      country: cleanCountry,
      referredBy: cleanReferredBy || null,
      passwordHash,
      role: 'investor',
      accountType: 'Individual',
      referralCode,
      accountBalance: 0,
      totalProfit: 0,
      bonus: 0,
      referralBonus: 0,
      totalDeposit: 0,
      cryptoBalances: { ...EMPTY_BALANCES },
      kycStatus: 'Unverified',
      accountStatus: 'Active',
      lastLoginAt,
      createdAt,
    })
    .returning();

  return mapDbUser(inserted[0]);
}

export async function authenticateUserInNeon(
  identifier: string,
  password: string
): Promise<PublicUserAccount> {
  await ensureNeonSchemaAndSeed();
  const query = identifier.trim().toLowerCase();
  if (!query || !password) {
    throw new Error('Email/username and password are required.');
  }

  const envAdminPass = process.env.ADMIN_PASSWORD?.trim();

  if (!isDatabaseConfigured) {
    const found = memoryState.users.find(
      (u) =>
        u.email.toLowerCase() === query ||
        (u.username && u.username.toLowerCase() === query)
    );
    if (!found) {
      throw new Error('Invalid email/username or password.');
    }
    if (found.role === 'admin' && envAdminPass) {
      if (password !== envAdminPass) {
        throw new Error('Invalid email/username or password.');
      }
    } else if (!found.passwordHash || !verifyPassword(password, found.passwordHash)) {
      if (found.role === 'admin' && !found.passwordHash) {
        throw new Error('Admin password has not been claimed yet. Set your Admin password first.');
      }
      throw new Error('Invalid email/username or password.');
    }
    if (found.accountStatus === 'Blocked') {
      throw new Error('This account has been blocked by Platform Administration.');
    }
    found.lastLoginAt = formatStamp();
    return stripMemoryUser(found);
  }

  const rows = await db
    .select()
    .from(users)
    .where(or(eq(users.email, query), ilike(users.username, query)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new Error('Invalid email/username or password.');
  }

  if (row.role === 'admin' && envAdminPass) {
    if (password !== envAdminPass) {
      throw new Error('Invalid email/username or password.');
    }
  } else if (!row.passwordHash || !verifyPassword(password, row.passwordHash)) {
    if (row.role === 'admin' && !row.passwordHash) {
      throw new Error('Admin password has not been claimed yet. Set your Admin password first.');
    }
    throw new Error('Invalid email/username or password.');
  }

  if (row.accountStatus === 'Blocked') {
    throw new Error('This account has been blocked by Platform Administration.');
  }

  const updated = await db
    .update(users)
    .set({ lastLoginAt: formatStamp(), updatedAt: new Date() })
    .where(eq(users.id, row.id))
    .returning();

  return mapDbUser(updated[0] || row);
}

export async function createPasswordResetCodeInNeon(emailInput: string): Promise<string> {
  await ensureNeonSchemaAndSeed();
  const cleanEmail = emailInput.trim().toLowerCase();
  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = hashToken(code);
  const id = nextNeonId('RST');

  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) throw new Error('No AssetCrest account found with that email address.');
    memoryState.passwordResets.push({
      id,
      userId: user.id,
      email: cleanEmail,
      codeHash,
      expiresAt: Date.now() + 15 * 60 * 1000,
      used: false,
    });
    return code;
  }

  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);
  if (found.length === 0) {
    throw new Error('No AssetCrest account found with that email address.');
  }

  await db.insert(passwordResets).values({
    id,
    userId: found[0].id,
    email: cleanEmail,
    codeHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    used: false,
  });

  return code;
}

export async function completePasswordResetInNeon(params: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<PublicUserAccount> {
  await ensureNeonSchemaAndSeed();
  const cleanEmail = params.email.trim().toLowerCase();
  const codeHash = hashToken(params.code.trim());
  if (!params.newPassword || params.newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  const nextHash = hashPassword(params.newPassword);

  if (!isDatabaseConfigured) {
    const reset = [...memoryState.passwordResets]
      .reverse()
      .find(
        (r) =>
          r.email === cleanEmail &&
          r.codeHash === codeHash &&
          !r.used &&
          r.expiresAt > Date.now()
      );
    if (!reset) throw new Error('Verification code is invalid or expired.');
    const user = memoryState.users.find((u) => u.id === reset.userId);
    if (!user) throw new Error('Account could not be found.');
    reset.used = true;
    user.passwordHash = nextHash;
    user.lastLoginAt = formatStamp();
    return stripMemoryUser(user);
  }

  const resetRows = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.email, cleanEmail),
        eq(passwordResets.codeHash, codeHash),
        eq(passwordResets.used, false)
      )
    )
    .orderBy(desc(passwordResets.createdAt))
    .limit(1);

  const reset = resetRows[0];
  if (!reset || reset.expiresAt.getTime() <= Date.now()) {
    throw new Error('Verification code is invalid or expired.');
  }

  await db
    .update(passwordResets)
    .set({ used: true })
    .where(eq(passwordResets.id, reset.id));

  const updatedUsers = await db
    .update(users)
    .set({ passwordHash: nextHash, lastLoginAt: formatStamp(), updatedAt: new Date() })
    .where(eq(users.id, reset.userId))
    .returning();

  if (updatedUsers.length === 0) throw new Error('Account could not be found.');
  return mapDbUser(updatedUsers[0]);
}

export async function getSyncedStateForUser(userId: string, isAdmin: boolean) {
  await ensureNeonSchemaAndSeed();

  if (!isDatabaseConfigured) {
    const ownUser = memoryState.users.find((u) => u.id === userId) || null;
    const allUsers = isAdmin
      ? memoryState.users.map(stripMemoryUser)
      : ownUser
      ? [stripMemoryUser(ownUser)]
      : [];
    const kycSubmissionsMap: Record<string, DbKycSubmission & { status: KycStatus }> = {};
    if (isAdmin) {
      for (const u of memoryState.users) {
        if (u.kycSubmission) {
          kycSubmissionsMap[u.id] = { ...u.kycSubmission, status: u.kycStatus };
        }
      }
    }
    return {
      cloudUser: ownUser ? stripMemoryUser(ownUser) : null,
      allUsers,
      kycSubmissionsMap,
      transactions: (isAdmin
        ? memoryState.transactions
        : memoryState.transactions.filter((t) => t.userId === userId)
      ).slice().sort((a, b) => b.date.localeCompare(a.date)),
      investments: (isAdmin
        ? memoryState.investments
        : memoryState.investments.filter((i) => i.userId === userId)
      ).slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
      tickets: (isAdmin
        ? memoryState.tickets
        : memoryState.tickets.filter((tk) => tk.userId === userId)
      ).slice().sort((a, b) => b.date.localeCompare(a.date)),
      locationLogs: isAdmin
        ? memoryState.locationLogs.map(({ reporterUserId: _r, ...rest }) => rest)
        : [],
      incomingTransfers: memoryState.transferRequests.filter(
        (tr) => tr.toUid === userId && tr.status === 'PendingClaim'
      ),
      cryptoWallets: [...memoryState.cryptoWallets].sort((a, b) =>
        a.cryptocurrency.localeCompare(b.cryptocurrency)
      ),
      isAdmin,
    };
  }

  const [ownRows, allUserRows, txRows, invRows, ticketRows, walletRows, incomingRows, locRows] =
    await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      isAdmin ? db.select().from(users) : Promise.resolve([]),
      isAdmin
        ? db.select().from(transactions).orderBy(desc(transactions.createdAt))
        : db
            .select()
            .from(transactions)
            .where(eq(transactions.userId, userId))
            .orderBy(desc(transactions.createdAt)),
      isAdmin
        ? db.select().from(investments).orderBy(desc(investments.createdAt))
        : db
            .select()
            .from(investments)
            .where(eq(investments.userId, userId))
            .orderBy(desc(investments.createdAt)),
      isAdmin
        ? db.select().from(tickets).orderBy(desc(tickets.createdAt))
        : db
            .select()
            .from(tickets)
            .where(eq(tickets.userId, userId))
            .orderBy(desc(tickets.createdAt)),
      db.select().from(cryptoWallets),
      db
        .select()
        .from(transferRequests)
        .where(and(eq(transferRequests.toUid, userId), eq(transferRequests.status, 'PendingClaim'))),
      isAdmin
        ? db.select().from(locationLogs).orderBy(desc(locationLogs.createdAt))
        : Promise.resolve([]),
    ]);

  const ownUser = ownRows[0] ? mapDbUser(ownRows[0]) : null;
  const allUsers = isAdmin
    ? allUserRows.map(mapDbUser)
    : ownUser
    ? [ownUser]
    : [];

  const kycSubmissionsMap: Record<string, DbKycSubmission & { status: KycStatus }> = {};
  if (isAdmin) {
    for (const u of allUsers) {
      if (u.kycSubmission) {
        kycSubmissionsMap[u.id] = {
          ...u.kycSubmission,
          status: u.kycStatus,
        };
      }
    }
  }

  return {
    cloudUser: ownUser,
    allUsers,
    kycSubmissionsMap,
    transactions: txRows.map((t) => ({
      id: t.id,
      userId: t.userId,
      type: t.type as RepoTransaction['type'],
      method: t.method,
      amount: Number(t.amount),
      status: t.status as RepoTransaction['status'],
      date: t.date,
      note: t.note ?? undefined,
      proofName: t.proofName ?? undefined,
      proofDataUrl: t.proofDataUrl ?? undefined,
    })),
    investments: invRows.map((inv) => ({
      id: inv.id,
      userId: inv.userId,
      category: inv.category as RepoInvestment['category'],
      planName: inv.planName,
      amount: Number(inv.amount),
      dailyRate: inv.dailyRate,
      durationDays: inv.durationDays,
      status: inv.status === 'Completed' ? 'Completed' : 'Active',
      startedAt: inv.startedAt,
      meta: inv.meta ?? undefined,
      startedAtMs: inv.startedAtMs ?? undefined,
      lastAccrualMs: inv.lastAccrualMs ?? undefined,
      lastPayoutAt: inv.lastPayoutAt ?? undefined,
      payoutCyclesCompleted: inv.payoutCyclesCompleted,
      accruedProfit: Number(inv.accruedProfit ?? 0),
      principalReturned: inv.principalReturned,
      autoCompound: inv.autoCompound,
      autoRoiEnabled: inv.autoRoiEnabled,
    })),
    tickets: ticketRows.map((tk) => ({
      id: tk.id,
      userId: tk.userId,
      senderEmail: tk.senderEmail,
      targetDeskEmail: tk.targetDeskEmail,
      subject: tk.subject,
      message: tk.message,
      date: tk.date,
    })),
    locationLogs: locRows.map((l) => ({
      id: l.id,
      refCode: l.refCode,
      clickedUrl: l.clickedUrl,
      latitude: l.latitude,
      longitude: l.longitude,
      accuracyLabel: l.accuracyLabel,
      timezone: l.timezone,
      language: l.language,
      deviceSummary: l.deviceSummary,
      timestamp: l.timestamp,
    })),
    incomingTransfers: incomingRows.map((tr) => ({
      id: tr.id,
      fromUid: tr.fromUid,
      fromName: tr.fromName,
      toUid: tr.toUid,
      toName: tr.toName,
      toRefCode: tr.toRefCode,
      amount: Number(tr.amount),
      status: tr.status === 'Completed' ? 'Completed' : 'PendingClaim',
      note: tr.note ?? undefined,
    })),
    cryptoWallets: walletRows
      .map((w) => ({
        id: w.id,
        cryptocurrency: w.cryptocurrency,
        symbol: w.symbol,
        network: w.network,
        address: w.address,
        label: w.label,
        status: (w.status === 'Inactive' || w.status === 'Maintenance' ? w.status : 'Active') as WalletStatus,
        minDeposit: Number(w.minDeposit),
        maxDeposit: Number(w.maxDeposit),
        instructions: w.instructions,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        updatedByAdminName: w.updatedByAdminName,
        updatedByAdminEmail: w.updatedByAdminEmail,
        assignedUserIds: Array.isArray(w.assignedUserIds) ? w.assignedUserIds : [],
      }))
      .sort((a, b) => a.cryptocurrency.localeCompare(b.cryptocurrency)),
    isAdmin,
  };
}

export async function submitDepositInNeon(params: {
  userId: string;
  method: string;
  amount: number;
  status: 'Pending' | 'Cancelled';
  proofName?: string;
  proofDataUrl?: string;
  note?: string;
}): Promise<string> {
  await ensureNeonSchemaAndSeed();
  const id = nextNeonId('DEP');
  const date = formatStamp();

  if (!isDatabaseConfigured) {
    memoryState.transactions.unshift({
      id,
      userId: params.userId,
      type: 'Deposit',
      method: params.method.slice(0, 180),
      amount: Number(params.amount.toFixed(2)),
      status: params.status,
      date,
      note: params.note?.trim().slice(0, 280),
      proofName: params.proofName?.trim().slice(0, 140),
      proofDataUrl: params.proofDataUrl?.slice(0, 250000),
    });
    return id;
  }

  await db.insert(transactions).values({
    id,
    userId: params.userId,
    type: 'Deposit',
    method: params.method.slice(0, 180),
    amount: Number(params.amount.toFixed(2)),
    status: params.status,
    date,
    note: params.note?.trim().slice(0, 280) || null,
    proofName: params.proofName?.trim().slice(0, 140) || null,
    proofDataUrl: params.proofDataUrl?.slice(0, 250000) || null,
  });

  return id;
}

export async function submitWithdrawalInNeon(params: {
  userId: string;
  method: string;
  amount: number;
  destination: string;
}): Promise<string> {
  await ensureNeonSchemaAndSeed();
  const id = nextNeonId('WDR');
  const date = formatStamp();
  const amt = Number(params.amount.toFixed(2));
  if (amt < 100) throw new Error('Minimum withdrawal amount is $100.00.');

  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.id === params.userId);
    if (!user) throw new Error('User not found.');
    if (user.kycStatus !== 'Approved') throw new Error('KYC approval is required before withdrawing.');
    if (amt > user.accountBalance) throw new Error('Insufficient balance.');
    user.accountBalance = Number((user.accountBalance - amt).toFixed(2));
    memoryState.transactions.unshift({
      id,
      userId: params.userId,
      type: 'Withdrawal',
      method: params.method.slice(0, 180),
      amount: amt,
      status: 'Pending',
      date,
      note: `Destination: ${params.destination.trim()}`.slice(0, 280),
    });
    return id;
  }

  await db.transaction(async (tx) => {
    const rows = await tx.select().from(users).where(eq(users.id, params.userId)).limit(1);
    const user = rows[0];
    if (!user) throw new Error('User not found.');
    if (user.kycStatus !== 'Approved') throw new Error('KYC approval is required before withdrawing.');
    if (amt > Number(user.accountBalance)) throw new Error('Insufficient account balance.');

    const debited = await tx
      .update(users)
      .set({ accountBalance: sql`${users.accountBalance} - ${amt}`, updatedAt: new Date() })
      .where(and(
        eq(users.id, params.userId),
        eq(users.kycStatus, 'Approved'),
        sql`${users.accountBalance} >= ${amt}`
      ))
      .returning({ id: users.id });
    if (debited.length === 0) {
      throw new Error('Withdrawal could not be reserved. Check KYC approval and available balance.');
    }

    await tx.insert(transactions).values({
      id,
      userId: params.userId,
      type: 'Withdrawal',
      method: params.method.slice(0, 180),
      amount: amt,
      status: 'Pending',
      date,
      note: `Destination: ${params.destination.trim()}`.slice(0, 280),
    });
  });

  return id;
}

export async function lookupTransferRecipientInNeon(
  refCodeInput: string
): Promise<TransferDirectoryEntry | null> {
  await ensureNeonSchemaAndSeed();
  const normalized = refCodeInput.trim().toUpperCase();
  if (!/^[A-Z0-9_\-]{2,32}$/.test(normalized)) return null;

  if (!isDatabaseConfigured) {
    const found = memoryState.users.find(
      (u) => u.referralCode.toUpperCase() === normalized
    );
    if (!found) return null;
    return {
      uid: found.id,
      displayName: found.name,
      referralCode: found.referralCode,
      accountType: found.accountType,
    };
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      referralCode: users.referralCode,
      accountType: users.accountType,
    })
    .from(users)
    .where(ilike(users.referralCode, normalized))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    uid: row.id,
    displayName: row.name,
    referralCode: row.referralCode,
    accountType: row.accountType === 'Joint' ? 'Joint' : 'Individual',
  };
}

export async function sendTransferInNeon(params: {
  fromUserId: string;
  toRefCode: string;
  amount: number;
  note?: string;
}): Promise<string> {
  await ensureNeonSchemaAndSeed();
  const amt = Number(params.amount.toFixed(2));
  if (amt <= 0) throw new Error('Transfer amount must be positive.');
  const transferId = nextNeonId('REQ');
  const txId = nextNeonId('TRF');
  const stamp = formatStamp();
  const cleanNote = params.note?.trim().slice(0, 240);

  if (!isDatabaseConfigured) {
    const sender = memoryState.users.find((u) => u.id === params.fromUserId);
    const recipient = memoryState.users.find(
      (u) => u.referralCode.toUpperCase() === params.toRefCode.trim().toUpperCase()
    );
    if (!sender || !recipient) throw new Error('Sender or recipient not found.');
    if (sender.id === recipient.id) throw new Error('Cannot transfer to your own account.');
    if (amt > sender.accountBalance) throw new Error('Insufficient balance.');

    sender.accountBalance = Number((sender.accountBalance - amt).toFixed(2));
    memoryState.transferRequests.push({
      id: transferId,
      fromUid: sender.id,
      fromName: sender.name,
      toUid: recipient.id,
      toName: recipient.name,
      toRefCode: recipient.referralCode,
      amount: amt,
      status: 'PendingClaim',
      note: cleanNote,
    });
    memoryState.transactions.unshift({
      id: txId,
      userId: sender.id,
      type: 'Transfer Out',
      method: `To ${recipient.name} (${recipient.referralCode})`.slice(0, 180),
      amount: amt,
      status: 'Completed',
      date: stamp,
      note: cleanNote,
    });
    return transferId;
  }

  await db.transaction(async (tx) => {
    const senderRows = await tx.select().from(users).where(eq(users.id, params.fromUserId)).limit(1);
    const recipientRows = await tx
      .select()
      .from(users)
      .where(ilike(users.referralCode, params.toRefCode.trim()))
      .limit(1);

    const sender = senderRows[0];
    const recipient = recipientRows[0];
    if (!sender || !recipient) throw new Error('Sender or recipient not found.');
    if (sender.id === recipient.id) throw new Error('Cannot transfer to your own account.');
    if (amt > Number(sender.accountBalance)) throw new Error('Insufficient account balance.');

    const debited = await tx
      .update(users)
      .set({
        accountBalance: sql`${users.accountBalance} - ${amt}`,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, sender.id), sql`${users.accountBalance} >= ${amt}`))
      .returning({ id: users.id });
    if (debited.length === 0) throw new Error('Insufficient balance; refresh and try again.');

    await tx.insert(transferRequests).values({
      id: transferId,
      fromUid: sender.id,
      fromName: sender.name.slice(0, 120),
      toUid: recipient.id,
      toName: recipient.name.slice(0, 120),
      toRefCode: recipient.referralCode.slice(0, 32),
      amount: amt,
      status: 'PendingClaim',
      note: cleanNote || null,
    });

    await tx.insert(transactions).values({
      id: txId,
      userId: sender.id,
      type: 'Transfer Out',
      method: `To ${recipient.name} (${recipient.referralCode})`.slice(0, 180),
      amount: amt,
      status: 'Completed',
      date: stamp,
      note: cleanNote || null,
    });
  });

  return transferId;
}

export async function claimTransferRequestInNeon(params: {
  transferId: string;
  claimingUserId: string;
}): Promise<void> {
  await ensureNeonSchemaAndSeed();
  const txId = nextNeonId('TRF');
  const stamp = formatStamp();

  if (!isDatabaseConfigured) {
    const req = memoryState.transferRequests.find((t) => t.id === params.transferId);
    if (!req || req.toUid !== params.claimingUserId || req.status !== 'PendingClaim') return;
    const recipient = memoryState.users.find((u) => u.id === req.toUid);
    if (!recipient) return;
    req.status = 'Completed';
    recipient.accountBalance = Number((recipient.accountBalance + req.amount).toFixed(2));
    memoryState.transactions.unshift({
      id: txId,
      userId: req.toUid,
      type: 'Transfer In',
      method: `From ${req.fromName}`.slice(0, 180),
      amount: req.amount,
      status: 'Completed',
      date: stamp,
      note: req.note,
    });
    return;
  }

  await db.transaction(async (tx) => {
    const claimedRows = await tx
      .update(transferRequests)
      .set({ status: 'Completed' })
      .where(and(
        eq(transferRequests.id, params.transferId),
        eq(transferRequests.toUid, params.claimingUserId),
        eq(transferRequests.status, 'PendingClaim')
      ))
      .returning({
        toUid: transferRequests.toUid,
        fromName: transferRequests.fromName,
        amount: transferRequests.amount,
        note: transferRequests.note,
      });
    const claimed = claimedRows[0];
    if (!claimed) return;

    await tx
      .update(users)
      .set({
        accountBalance: sql`${users.accountBalance} + ${Number(claimed.amount)}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, claimed.toUid));

    const req = claimed;

    await tx.insert(transactions).values({
      id: txId,
      userId: req.toUid,
      type: 'Transfer In',
      method: `From ${req.fromName}`.slice(0, 180),
      amount: Number(req.amount),
      status: 'Completed',
      date: stamp,
      note: req.note || null,
    });
  });
}

export async function executeSwapInNeon(params: {
  userId: string;
  nextUsdBalance: number;
  nextCryptoBalances: DbCryptoBalances;
  method: string;
  usdAmount: number;
  note: string;
}): Promise<string> {
  await ensureNeonSchemaAndSeed();
  const swapTxId = nextNeonId('SWP');
  const stamp = formatStamp();

  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.id === params.userId);
    if (!user) throw new Error('User not found.');
    user.accountBalance = Number(params.nextUsdBalance.toFixed(2));
    user.cryptoBalances = { ...params.nextCryptoBalances };
    memoryState.transactions.unshift({
      id: swapTxId,
      userId: params.userId,
      type: 'Swap',
      method: params.method.slice(0, 180),
      amount: Number(params.usdAmount.toFixed(2)),
      status: 'Completed',
      date: stamp,
      note: params.note.slice(0, 280),
    });
    return swapTxId;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        accountBalance: Number(params.nextUsdBalance.toFixed(2)),
        cryptoBalances: params.nextCryptoBalances,
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.userId));

    await tx.insert(transactions).values({
      id: swapTxId,
      userId: params.userId,
      type: 'Swap',
      method: params.method.slice(0, 180),
      amount: Number(params.usdAmount.toFixed(2)),
      status: 'Completed',
      date: stamp,
      note: params.note.slice(0, 280),
    });
  });

  return swapTxId;
}

export async function investPlanInNeon(params: {
  userId: string;
  category: 'Standard' | 'Vacation' | 'Real Estate';
  planName: string;
  amount: number;
  dailyRate: string;
  durationDays: number;
  meta?: string;
  autoCompound?: boolean;
}): Promise<string> {
  await ensureNeonSchemaAndSeed();
  const prefix =
    params.category === 'Vacation' ? 'VAC' : params.category === 'Real Estate' ? 'RE' : 'INV';
  const invId = nextNeonId(prefix);
  const txId = nextNeonId('TX');
  const nowMs = Date.now();
  const stamp = formatStamp();
  const amt = Number(params.amount.toFixed(2));
  if (amt <= 0) throw new Error('Investment amount must be positive.');

  const methodLabel =
    params.category === 'Standard'
      ? params.planName.slice(0, 180)
      : `${params.category} — ${params.planName}`.slice(0, 180);

  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.id === params.userId);
    if (!user) throw new Error('User not found.');
    if (amt > user.accountBalance) throw new Error('Insufficient balance.');
    user.accountBalance = Number((user.accountBalance - amt).toFixed(2));
    memoryState.investments.unshift({
      id: invId,
      userId: params.userId,
      category: params.category,
      planName: params.planName.slice(0, 140),
      amount: amt,
      dailyRate: params.dailyRate.slice(0, 24),
      durationDays: params.durationDays,
      status: 'Active',
      startedAt: stamp,
      meta: params.meta?.trim().slice(0, 160),
      startedAtMs: nowMs,
      lastAccrualMs: nowMs,
      payoutCyclesCompleted: 0,
      accruedProfit: 0,
      principalReturned: false,
      autoCompound: Boolean(params.autoCompound),
      autoRoiEnabled: true,
    });
    memoryState.transactions.unshift({
      id: txId,
      userId: params.userId,
      type: 'Investment',
      method: methodLabel,
      amount: amt,
      status: 'Completed',
      date: stamp,
    });
    return invId;
  }

  await db.transaction(async (tx) => {
    const rows = await tx.select().from(users).where(eq(users.id, params.userId)).limit(1);
    const user = rows[0];
    if (!user) throw new Error('User not found.');
    if (amt > Number(user.accountBalance)) throw new Error('Insufficient account balance.');

    await tx
      .update(users)
      .set({
        accountBalance: Number((Number(user.accountBalance) - amt).toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.userId));

    await tx.insert(investments).values({
      id: invId,
      userId: params.userId,
      category: params.category,
      planName: params.planName.slice(0, 140),
      amount: amt,
      dailyRate: params.dailyRate.slice(0, 24),
      durationDays: params.durationDays,
      status: 'Active',
      startedAt: stamp,
      meta: params.meta?.trim().slice(0, 160) || null,
      startedAtMs: nowMs,
      lastAccrualMs: nowMs,
      payoutCyclesCompleted: 0,
      accruedProfit: 0,
      principalReturned: false,
      autoCompound: Boolean(params.autoCompound),
      autoRoiEnabled: true,
    });

    await tx.insert(transactions).values({
      id: txId,
      userId: params.userId,
      type: 'Investment',
      method: methodLabel,
      amount: amt,
      status: 'Completed',
      date: stamp,
    });
  });

  return invId;
}

export async function updateAvatarInNeon(userId: string, avatarDataUrl?: string): Promise<void> {
  await ensureNeonSchemaAndSeed();
  const nextAvatar = avatarDataUrl ? avatarDataUrl.slice(0, 120000) : null;

  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.id === userId);
    if (user) user.avatarDataUrl = nextAvatar ?? undefined;
    return;
  }

  await db
    .update(users)
    .set({ avatarDataUrl: nextAvatar, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function updateProfileAndJointInNeon(params: {
  userId: string;
  email: string;
  displayName: string;
  accountType: 'Individual' | 'Joint';
  coOwnerName?: string;
  coOwnerEmail?: string;
  relationship?: string;
  authorizationMode?: 'Either Owner' | 'Dual Notice';
}): Promise<void> {
  await ensureNeonSchemaAndSeed();
  const cleanName = params.displayName.trim().slice(0, 120);
  const jointDetails: DbJointOwnerDetails | null =
    params.accountType === 'Joint'
      ? {
          coOwnerName: (params.coOwnerName || '').trim().slice(0, 120),
          coOwnerEmail: (params.coOwnerEmail || '').trim().toLowerCase().slice(0, 160),
          relationship: (params.relationship || 'Spouse').slice(0, 60),
          authorizationMode: params.authorizationMode === 'Dual Notice' ? 'Dual Notice' : 'Either Owner',
        }
      : null;

  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.id === params.userId);
    if (user) {
      user.name = cleanName;
      user.accountType = params.accountType;
      user.jointDetails = jointDetails ?? undefined;
    }
    return;
  }

  await db
    .update(users)
    .set({
      name: cleanName,
      accountType: params.accountType,
      jointDetails,
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.userId));
}

export async function changePasswordInNeon(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await ensureNeonSchemaAndSeed();
  if (!params.newPassword || params.newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  const nextHash = hashPassword(params.newPassword);
  const envAdminPass = process.env.ADMIN_PASSWORD?.trim();

  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.id === params.userId);
    if (!user) throw new Error('User not found.');
    if (user.role === 'admin' && envAdminPass) {
      throw new Error('Administrator password is managed by server environment settings.');
    }
    if (!user.passwordHash || !verifyPassword(params.currentPassword, user.passwordHash)) {
      throw new Error('Current password is incorrect.');
    }
    user.passwordHash = nextHash;
    return;
  }

  const rows = await db.select().from(users).where(eq(users.id, params.userId)).limit(1);
  const user = rows[0];
  if (!user) throw new Error('User not found.');
  if (user.role === 'admin' && envAdminPass) {
    throw new Error('Administrator password is managed by server environment settings.');
  }
  if (!user.passwordHash || !verifyPassword(params.currentPassword, user.passwordHash)) {
    throw new Error('Current password is incorrect.');
  }

  await db
    .update(users)
    .set({ passwordHash: nextHash, updatedAt: new Date() })
    .where(eq(users.id, params.userId));
}

export async function submitKycInNeon(params: {
  userId: string;
  submission: DbKycSubmission;
}): Promise<void> {
  await ensureNeonSchemaAndSeed();
  const cleanSub: DbKycSubmission = {
    legalName: params.submission.legalName.trim().slice(0, 120),
    country: params.submission.country.trim().slice(0, 80),
    documentType: params.submission.documentType,
    documentNumber: params.submission.documentNumber.trim().slice(0, 64),
    idFrontName: params.submission.idFrontName.slice(0, 120),
    idFrontDataUrl: (params.submission.idFrontDataUrl || '').slice(0, 250000),
    selfieName: params.submission.selfieName.slice(0, 120),
    selfieDataUrl: (params.submission.selfieDataUrl || '').slice(0, 250000),
    submittedAt: params.submission.submittedAt.slice(0, 40),
  };

  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.id === params.userId);
    if (user) {
      user.kycStatus = 'Pending';
      user.kycSubmission = cleanSub;
    }
    return;
  }

  await db
    .update(users)
    .set({
      kycStatus: 'Pending',
      kycSubmission: cleanSub,
      updatedAt: new Date(),
    })
    .where(eq(users.id, params.userId));
}

export async function decideKycInNeon(
  targetUserId: string,
  decision: 'Approved' | 'Rejected',
  adminNote: string
): Promise<void> {
  await ensureNeonSchemaAndSeed();

  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.id === targetUserId);
    if (user) {
      user.kycStatus = decision;
      if (user.kycSubmission) {
        user.kycSubmission = {
          ...user.kycSubmission,
          reviewedAt: formatStamp(),
          adminNote: adminNote.slice(0, 300),
        };
      }
    }
    return;
  }

  const rows = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  const existing = rows[0];
  if (!existing) throw new Error('User not found.');

  const nextSub = existing.kycSubmission
    ? {
        ...existing.kycSubmission,
        reviewedAt: formatStamp(),
        adminNote: adminNote.slice(0, 300),
      }
    : null;

  await db
    .update(users)
    .set({
      kycStatus: decision,
      kycSubmission: nextSub,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetUserId));
}

export async function approveDepositInNeon(txId: string): Promise<void> {
  await ensureNeonSchemaAndSeed();

  if (!isDatabaseConfigured) {
    const tx = memoryState.transactions.find((t) => t.id === txId);
    if (!tx || tx.status === 'Completed') return;
    const owner = memoryState.users.find((u) => u.id === tx.userId);
    if (!owner) return;
    tx.status = 'Completed';
    owner.accountBalance = Number((owner.accountBalance + tx.amount).toFixed(2));
    owner.totalDeposit = Number((owner.totalDeposit + tx.amount).toFixed(2));
    return;
  }

  await db.transaction(async (trx) => {
    const approvedRows = await trx
      .update(transactions)
      .set({ status: 'Completed' })
      .where(and(
        eq(transactions.id, txId),
        eq(transactions.type, 'Deposit'),
        eq(transactions.status, 'Pending')
      ))
      .returning({ userId: transactions.userId, amount: transactions.amount });
    const approved = approvedRows[0];
    if (!approved) return;

    await trx
      .update(users)
      .set({
        accountBalance: sql`${users.accountBalance} + ${Number(approved.amount)}`,
        totalDeposit: sql`${users.totalDeposit} + ${Number(approved.amount)}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, approved.userId));
  });
}

export async function declineDepositInNeon(txId: string): Promise<void> {
  await ensureNeonSchemaAndSeed();
  if (!isDatabaseConfigured) {
    const tx = memoryState.transactions.find((t) => t.id === txId);
    if (tx) tx.status = 'Cancelled';
    return;
  }
  await db.update(transactions).set({ status: 'Cancelled' }).where(eq(transactions.id, txId));
}

export async function approveWithdrawalInNeon(txId: string): Promise<void> {
  await ensureNeonSchemaAndSeed();
  if (!isDatabaseConfigured) {
    const tx = memoryState.transactions.find((t) => t.id === txId);
    if (tx) tx.status = 'Completed';
    return;
  }
  await db.update(transactions).set({ status: 'Completed' }).where(eq(transactions.id, txId));
}

export async function declineWithdrawalInNeon(txId: string): Promise<void> {
  await ensureNeonSchemaAndSeed();

  if (!isDatabaseConfigured) {
    const tx = memoryState.transactions.find((t) => t.id === txId);
    if (!tx || tx.status === 'Cancelled') return;
    const owner = memoryState.users.find((u) => u.id === tx.userId);
    if (!owner) return;
    tx.status = 'Cancelled';
    owner.accountBalance = Number((owner.accountBalance + tx.amount).toFixed(2));
    return;
  }

  await db.transaction(async (trx) => {
    const txRows = await trx.select().from(transactions).where(eq(transactions.id, txId)).limit(1);
    const tx = txRows[0];
    if (!tx || tx.status === 'Cancelled') return;

    const userRows = await trx.select().from(users).where(eq(users.id, tx.userId)).limit(1);
    const owner = userRows[0];
    if (!owner) return;

    await trx.update(transactions).set({ status: 'Cancelled' }).where(eq(transactions.id, tx.id));
    await trx
      .update(users)
      .set({
        accountBalance: Number((Number(owner.accountBalance) + Number(tx.amount)).toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(users.id, owner.id));
  });
}

export async function distributeYieldsInNeon(
  payouts: { inv: RepoInvestment; yieldAmt: number }[]
): Promise<number> {
  await ensureNeonSchemaAndSeed();
  if (payouts.length === 0) return 0;
  const stamp = formatStamp();

  if (!isDatabaseConfigured) {
    for (const item of payouts) {
      const owner = memoryState.users.find((u) => u.id === item.inv.userId);
      if (!owner) continue;
      const amt = Number(item.yieldAmt.toFixed(2));
      owner.totalProfit = Number((owner.totalProfit + amt).toFixed(2));
      owner.accountBalance = Number((owner.accountBalance + amt).toFixed(2));
      memoryState.transactions.unshift({
        id: nextNeonId('YLD'),
        userId: owner.id,
        type: 'Bonus',
        method: `Daily Yield — ${item.inv.planName}`.slice(0, 180),
        amount: amt,
        status: 'Completed',
        date: stamp,
        note: `${item.inv.dailyRate} yield payout`.slice(0, 280),
      });
    }
    return payouts.length;
  }

  await db.transaction(async (trx) => {
    const creditsByUser = new Map<string, number>();
    for (const item of payouts) {
      const amt = Number(item.yieldAmt.toFixed(2));
      await trx.insert(transactions).values({
        id: nextNeonId('YLD'),
        userId: item.inv.userId,
        type: 'Bonus',
        method: `Daily Yield — ${item.inv.planName}`.slice(0, 180),
        amount: amt,
        status: 'Completed',
        date: stamp,
        note: `${item.inv.dailyRate} yield payout`.slice(0, 280),
      });
      creditsByUser.set(item.inv.userId, (creditsByUser.get(item.inv.userId) ?? 0) + amt);
    }

    for (const [uid, credit] of creditsByUser.entries()) {
      await trx
        .update(users)
        .set({
          totalProfit: sql`${users.totalProfit} + ${credit}`,
          accountBalance: sql`${users.accountBalance} + ${credit}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, uid));
    }
  });

  return payouts.length;
}

export async function toggleInvestmentSettingsInNeon(params: {
  invId: string;
  requesterId: string;
  isAdmin: boolean;
  autoCompound?: boolean;
  autoRoiEnabled?: boolean;
}): Promise<boolean> {
  await ensureNeonSchemaAndSeed();

  if (!isDatabaseConfigured) {
    const inv = memoryState.investments.find((i) => i.id === params.invId);
    if (!inv) return false;
    if (!params.isAdmin && inv.userId !== params.requesterId) return false;
    if (typeof params.autoCompound === 'boolean') inv.autoCompound = params.autoCompound;
    if (typeof params.autoRoiEnabled === 'boolean') inv.autoRoiEnabled = params.autoRoiEnabled;
    return true;
  }

  const rows = await db
    .select({ id: investments.id, userId: investments.userId })
    .from(investments)
    .where(eq(investments.id, params.invId))
    .limit(1);
  const row = rows[0];
  if (!row) return false;
  if (!params.isAdmin && row.userId !== params.requesterId) return false;

  const updates: Partial<typeof investments.$inferInsert> = {};
  if (typeof params.autoCompound === 'boolean') updates.autoCompound = params.autoCompound;
  if (typeof params.autoRoiEnabled === 'boolean') updates.autoRoiEnabled = params.autoRoiEnabled;
  if (Object.keys(updates).length === 0) return true;

  await db.update(investments).set(updates).where(eq(investments.id, params.invId));
  return true;
}

export async function settleRoiPlanInNeon(params: {
  requesterId: string;
  isAdmin: boolean;
  investmentUpdates: Array<{ investment: RepoInvestment }>;
  transactions: RepoTransaction[];
  userDeltas: Record<string, { balanceDelta: number; profitDelta: number }>;
}): Promise<{ settledCount: number }> {
  await ensureNeonSchemaAndSeed();
  if (params.investmentUpdates.length === 0) return { settledCount: 0 };

  const allowedUpdates = params.investmentUpdates.filter(
    (u) => params.isAdmin || u.investment.userId === params.requesterId
  );
  const allowedTxs = params.transactions.filter(
    (t) => params.isAdmin || t.userId === params.requesterId
  );

  if (!isDatabaseConfigured) {
    for (const upd of allowedUpdates) {
      const idx = memoryState.investments.findIndex((i) => i.id === upd.investment.id);
      if (idx >= 0) {
        memoryState.investments[idx] = { ...memoryState.investments[idx], ...upd.investment };
      }
    }
    for (const tx of allowedTxs) {
      if (!memoryState.transactions.some((t) => t.id === tx.id)) {
        memoryState.transactions.unshift(tx);
      }
    }
    for (const [uid, delta] of Object.entries(params.userDeltas)) {
      if (!params.isAdmin && uid !== params.requesterId) continue;
      const u = memoryState.users.find((usr) => usr.id === uid);
      if (!u) continue;
      u.totalProfit = Number((u.totalProfit + delta.profitDelta).toFixed(2));
      u.accountBalance = Number((u.accountBalance + delta.balanceDelta).toFixed(2));
    }
    return { settledCount: allowedUpdates.length };
  }

  await db.transaction(async (trx) => {
    for (const upd of allowedUpdates) {
      const inv = upd.investment;
      await trx
        .update(investments)
        .set({
          status: inv.status,
          amount: Number(inv.amount.toFixed(2)),
          lastAccrualMs: inv.lastAccrualMs ?? null,
          lastPayoutAt: inv.lastPayoutAt ?? null,
          payoutCyclesCompleted: inv.payoutCyclesCompleted ?? 0,
          accruedProfit: Number((inv.accruedProfit ?? 0).toFixed(2)),
          principalReturned: Boolean(inv.principalReturned),
        })
        .where(eq(investments.id, inv.id));
    }

    for (const tx of allowedTxs) {
      await trx
        .insert(transactions)
        .values({
          id: tx.id,
          userId: tx.userId,
          type: tx.type,
          method: tx.method.slice(0, 180),
          amount: Number(tx.amount.toFixed(2)),
          status: tx.status,
          date: tx.date.slice(0, 40),
          note: tx.note?.slice(0, 280) || null,
        })
        .onConflictDoNothing();
    }

    for (const [uid, delta] of Object.entries(params.userDeltas)) {
      if (!params.isAdmin && uid !== params.requesterId) continue;
      if (!delta.balanceDelta && !delta.profitDelta) continue;
      await trx
        .update(users)
        .set({
          totalProfit: sql`${users.totalProfit} + ${delta.profitDelta}`,
          accountBalance: sql`${users.accountBalance} + ${delta.balanceDelta}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, uid));
    }
  });

  return { settledCount: allowedUpdates.length };
}

export async function toggleUserStatusInNeon(
  targetUserId: string,
  accountStatus: 'Active' | 'Blocked'
): Promise<void> {
  await ensureNeonSchemaAndSeed();
  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.id === targetUserId);
    if (user) user.accountStatus = accountStatus;
    return;
  }
  await db
    .update(users)
    .set({ accountStatus, updatedAt: new Date() })
    .where(eq(users.id, targetUserId));
}

export async function adjustUserFundsInNeon(params: {
  targetUserId: string;
  accountBalance: number;
  totalProfit: number;
  bonus: number;
  note?: string;
}): Promise<void> {
  await ensureNeonSchemaAndSeed();
  const stamp = formatStamp();

  if (!isDatabaseConfigured) {
    const user = memoryState.users.find((u) => u.id === params.targetUserId);
    if (!user) throw new Error('User not found.');
    user.accountBalance = Number(params.accountBalance.toFixed(2));
    user.totalProfit = Number(params.totalProfit.toFixed(2));
    user.bonus = Number(params.bonus.toFixed(2));
    if (params.note) {
      memoryState.transactions.unshift({
        id: nextNeonId('ADJ'),
        userId: params.targetUserId,
        type: 'Bonus',
        method: 'Admin Balance Adjustment',
        amount: 0,
        status: 'Completed',
        date: stamp,
        note: params.note.slice(0, 280),
      });
    }
    return;
  }

  await db.transaction(async (trx) => {
    await trx
      .update(users)
      .set({
        accountBalance: Number(params.accountBalance.toFixed(2)),
        totalProfit: Number(params.totalProfit.toFixed(2)),
        bonus: Number(params.bonus.toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.targetUserId));

    if (params.note) {
      await trx.insert(transactions).values({
        id: nextNeonId('ADJ'),
        userId: params.targetUserId,
        type: 'Bonus',
        method: 'Admin Balance Adjustment',
        amount: 0,
        status: 'Completed',
        date: stamp,
        note: params.note.slice(0, 280),
      });
    }
  });
}

export async function createTicketInNeon(params: {
  userId: string;
  senderEmail: string;
  targetDeskEmail: string;
  subject: string;
  message: string;
}): Promise<string> {
  await ensureNeonSchemaAndSeed();
  const id = nextNeonId('MSG');
  const date = formatStamp();

  if (!isDatabaseConfigured) {
    memoryState.tickets.unshift({
      id,
      userId: params.userId,
      senderEmail: params.senderEmail.slice(0, 160),
      targetDeskEmail: params.targetDeskEmail,
      subject: params.subject.trim().slice(0, 160),
      message: params.message.trim().slice(0, 2000),
      date,
    });
    return id;
  }

  await db.insert(tickets).values({
    id,
    userId: params.userId,
    senderEmail: params.senderEmail.slice(0, 160),
    targetDeskEmail: params.targetDeskEmail,
    subject: params.subject.trim().slice(0, 160),
    message: params.message.trim().slice(0, 2000),
    date,
  });

  return id;
}

export async function logVisitorLocationInNeon(
  reporterUserId: string | null,
  log: Omit<RepoLocationLog, 'id'>
): Promise<string> {
  await ensureNeonSchemaAndSeed();
  const id = nextNeonId('LOC');
  const clean = {
    id,
    reporterUserId: reporterUserId || null,
    refCode: (log.refCode || 'DIRECT').toUpperCase().slice(0, 40),
    clickedUrl: (log.clickedUrl || 'https://assetcrest.co').slice(0, 400),
    latitude: (log.latitude || 'Unknown').slice(0, 64),
    longitude: (log.longitude || 'Unknown').slice(0, 64),
    accuracyLabel: (log.accuracyLabel || 'Browser telemetry').slice(0, 120),
    timezone: (log.timezone || 'UTC').slice(0, 80),
    language: (log.language || 'en-US').slice(0, 40),
    deviceSummary: (log.deviceSummary || 'Browser').slice(0, 160),
    timestamp: (log.timestamp || formatStamp()).slice(0, 40),
  };

  if (!isDatabaseConfigured) {
    memoryState.locationLogs.unshift({
      ...clean,
      reporterUserId: clean.reporterUserId ?? undefined,
    });
    return id;
  }

  await db.insert(locationLogs).values(clean);
  return id;
}

export async function saveCryptoWalletInNeon(wallet: RepoCryptoWallet): Promise<void> {
  await ensureNeonSchemaAndSeed();
  if (!isDatabaseConfigured) {
    const idx = memoryState.cryptoWallets.findIndex((w) => w.id === wallet.id);
    if (idx >= 0) {
      memoryState.cryptoWallets[idx] = wallet;
    } else {
      memoryState.cryptoWallets.push(wallet);
    }
    return;
  }

  await db
    .insert(cryptoWallets)
    .values({
      id: wallet.id,
      cryptocurrency: wallet.cryptocurrency,
      symbol: wallet.symbol,
      network: wallet.network,
      address: wallet.address,
      label: wallet.label,
      status: wallet.status,
      minDeposit: Number(wallet.minDeposit),
      maxDeposit: Number(wallet.maxDeposit),
      instructions: wallet.instructions,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      updatedByAdminName: wallet.updatedByAdminName,
      updatedByAdminEmail: wallet.updatedByAdminEmail,
      assignedUserIds: wallet.assignedUserIds || [],
    })
    .onConflictDoUpdate({
      target: cryptoWallets.id,
      set: {
        cryptocurrency: wallet.cryptocurrency,
        symbol: wallet.symbol,
        network: wallet.network,
        address: wallet.address,
        label: wallet.label,
        status: wallet.status,
        minDeposit: Number(wallet.minDeposit),
        maxDeposit: Number(wallet.maxDeposit),
        instructions: wallet.instructions,
        updatedAt: wallet.updatedAt,
        updatedByAdminName: wallet.updatedByAdminName,
        updatedByAdminEmail: wallet.updatedByAdminEmail,
        assignedUserIds: wallet.assignedUserIds || [],
      },
    });
}

export async function deleteCryptoWalletInNeon(walletId: string): Promise<void> {
  await ensureNeonSchemaAndSeed();
  if (!isDatabaseConfigured) {
    memoryState.cryptoWallets = memoryState.cryptoWallets.filter((w) => w.id !== walletId);
    return;
  }
  await db.delete(cryptoWallets).where(eq(cryptoWallets.id, walletId));
}

export async function getUserPublicByIdInNeon(userId: string): Promise<PublicUserAccount | null> {
  await ensureNeonSchemaAndSeed();
  if (!isDatabaseConfigured) {
    const found = memoryState.users.find((u) => u.id === userId);
    return found ? stripMemoryUser(found) : null;
  }
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ? mapDbUser(rows[0]) : null;
}

export async function getTransactionByIdInNeon(txId: string): Promise<RepoTransaction | null> {
  await ensureNeonSchemaAndSeed();
  if (!isDatabaseConfigured) {
    const found = memoryState.transactions.find((t) => t.id === txId);
    return found ? { ...found } : null;
  }
  const rows = await db.select().from(transactions).where(eq(transactions.id, txId)).limit(1);
  const t = rows[0];
  if (!t) return null;
  return {
    id: t.id,
    userId: t.userId,
    type: t.type as RepoTransaction['type'],
    method: t.method,
    amount: Number(t.amount),
    status: t.status as RepoTransaction['status'],
    date: t.date,
    note: t.note ?? undefined,
    proofName: t.proofName ?? undefined,
    proofDataUrl: t.proofDataUrl ?? undefined,
  };
}

export async function getTransferRequestByIdInNeon(
  transferId: string
): Promise<RepoTransferRequest | null> {
  await ensureNeonSchemaAndSeed();
  if (!isDatabaseConfigured) {
    const found = memoryState.transferRequests.find((t) => t.id === transferId);
    return found ? { ...found } : null;
  }
  const rows = await db
    .select()
    .from(transferRequests)
    .where(eq(transferRequests.id, transferId))
    .limit(1);
  const tr = rows[0];
  if (!tr) return null;
  return {
    id: tr.id,
    fromUid: tr.fromUid,
    fromName: tr.fromName,
    toUid: tr.toUid,
    toName: tr.toName,
    toRefCode: tr.toRefCode,
    amount: Number(tr.amount),
    status: tr.status === 'Completed' ? 'Completed' : 'PendingClaim',
    note: tr.note ?? undefined,
  };
}

export async function getUserPublicByEmailInNeon(email: string): Promise<PublicUserAccount | null> {
  await ensureNeonSchemaAndSeed();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;
  if (!isDatabaseConfigured) {
    const found = memoryState.users.find((u) => u.email.toLowerCase() === cleanEmail);
    return found ? stripMemoryUser(found) : null;
  }
  const rows = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
  return rows[0] ? mapDbUser(rows[0]) : null;
}
