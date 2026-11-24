'use client';

import { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  type ActiveInvestment,
  type ContactTicket,
  type CryptoAssetSymbol,
  type CryptoWalletRecord,
  EMPTY_CRYPTO_BALANCES,
  formatNowStamp,
  type KycStatus,
  type KycSubmission,
  type TransactionRecord,
  type UserAccount,
  type VisitorLocationLog,
  type WalletStatus,
} from './assetcrest-store';
import { type RoiSettlementPlan } from './roi-engine';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'melissamenorsophia@gmail.com';
const PENDING_LOC_KEY = 'assetcrest_pending_loc_logs_v1';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errMsg = error instanceof Error ? error.message : String(error);
  return {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function reportFirestoreSyncError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.warn('Firestore Sync Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

let connectionTested = false;
export async function testConnection(): Promise<void> {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  void testConnection();
}

let cloudIdCounter = 1000;
export function nextCloudId(prefix: string): string {
  cloudIdCounter += 1;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 12) || 'ID';
  return `${safePrefix}-${Date.now()}-${cloudIdCounter}-${rand}`;
}

export interface TransferDirectoryEntry {
  uid: string;
  displayName: string;
  referralCode: string;
  accountType: 'Individual' | 'Joint';
}

export interface TransferRequestRecord {
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

export interface CloudSyncState {
  authReady: boolean;
  firebaseUser: FirebaseUser | null;
  cloudUser: UserAccount | null;
  allUsers: UserAccount[];
  kycSubmissionsMap: Record<string, KycSubmission & { status: KycStatus }>;
  transactions: TransactionRecord[];
  investments: ActiveInvestment[];
  tickets: ContactTicket[];
  locationLogs: VisitorLocationLog[];
  incomingTransfers: TransferRequestRecord[];
  cryptoWallets: CryptoWalletRecord[];
  isAdmin: boolean;
  isNewUserWelcome: boolean;
}

function timestampToShortDate(ts: unknown): string {
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as Timestamp).toDate === 'function') {
    return (ts as Timestamp).toDate().toISOString().slice(0, 10);
  }
  return formatNowStamp().slice(0, 10);
}

function deriveReferralCode(user: FirebaseUser): string {
  const baseSource = user.displayName || user.email?.split('@')[0] || 'INVESTOR';
  const cleaned = baseSource.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'USER';
  const suffix = user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase() || '10001';
  return `${cleaned}${suffix}`.slice(0, 32);
}

function mapFirestoreDocToUser(
  uid: string,
  profileData: Record<string, unknown>,
  privateData?: Record<string, unknown> | null,
  kycData?: Record<string, unknown> | null
): UserAccount {
  const cryptoRaw = (profileData.cryptoBalances || {}) as Record<string, unknown>;
  const cryptoBalances: Record<Exclude<CryptoAssetSymbol, 'USD'>, number> = {
    USDC: Number(cryptoRaw.USDC ?? 0),
    ETH: Number(cryptoRaw.ETH ?? 0),
    BTC: Number(cryptoRaw.BTC ?? 0),
    USDT: Number(cryptoRaw.USDT ?? 0),
    BNB: Number(cryptoRaw.BNB ?? 0),
    SOL: Number(cryptoRaw.SOL ?? 0),
    XRP: Number(cryptoRaw.XRP ?? 0),
  };

  const accountType = profileData.accountType === 'Joint' ? 'Joint' : 'Individual';
  const jointDetails =
    accountType === 'Joint' && privateData && privateData.coOwnerName && privateData.coOwnerEmail
      ? {
          coOwnerName: String(privateData.coOwnerName),
          coOwnerEmail: String(privateData.coOwnerEmail),
          relationship: String(privateData.relationship || 'Spouse'),
          authorizationMode: (privateData.authorizationMode === 'Dual Notice'
            ? 'Dual Notice'
            : 'Either Owner') as 'Either Owner' | 'Dual Notice',
        }
      : undefined;

  const kycSubmission: KycSubmission | undefined = kycData
    ? {
        legalName: String(kycData.legalName || ''),
        country: String(kycData.country || ''),
        documentType: (kycData.documentType as KycSubmission['documentType']) || 'Passport',
        documentNumber: String(kycData.documentNumber || ''),
        idFrontName: String(kycData.idFrontName || ''),
        idFrontDataUrl: String(kycData.idFrontDataUrl || ''),
        selfieName: String(kycData.selfieName || ''),
        selfieDataUrl: String(kycData.selfieDataUrl || ''),
        submittedAt: String(kycData.submittedAt || ''),
        reviewedAt: kycData.reviewedAt ? String(kycData.reviewedAt) : undefined,
        adminNote: kycData.adminNote ? String(kycData.adminNote) : undefined,
      }
    : undefined;

  return {
    id: uid,
    name: String(profileData.displayName || 'Investor'),
    email: String(privateData?.email || auth.currentUser?.email || `${String(profileData.referralCode || uid)}@assetcrest.co`),
    password: '', // Managed via Google Auth
    role: profileData.role === 'admin' ? 'admin' : 'investor',
    accountType,
    jointDetails,
    avatarDataUrl: profileData.avatarDataUrl ? String(profileData.avatarDataUrl) : undefined,
    referralCode: String(profileData.referralCode || deriveSafeCodeFallback(uid)),
    accountBalance: Number(profileData.accountBalance ?? 0),
    totalProfit: Number(profileData.totalProfit ?? 0),
    bonus: Number(profileData.bonus ?? 0),
    referralBonus: Number(profileData.referralBonus ?? 0),
    totalDeposit: Number(profileData.totalDeposit ?? 0),
    cryptoBalances,
    kycStatus: (profileData.kycStatus as KycStatus) || 'Unverified',
    kycSubmission,
    createdAt: timestampToShortDate(profileData.createdAt),
    accountStatus: profileData.accountStatus === 'Blocked' ? 'Blocked' : 'Active',
    lastLoginAt: profileData.lastLoginAt ? String(profileData.lastLoginAt) : undefined,
  };
}

function deriveSafeCodeFallback(uid: string): string {
  return `AC${uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;
}

function mapFirestoreDocToInvestment(
  docId: string,
  data: Record<string, unknown>
): ActiveInvestment {
  return {
    id: String(data.id || docId),
    userId: String(data.userId),
    category: data.category as ActiveInvestment['category'],
    planName: String(data.planName),
    amount: Number(data.amount ?? 0),
    dailyRate: String(data.dailyRate),
    durationDays: Number(data.durationDays ?? 30),
    status: data.status === 'Completed' ? 'Completed' : 'Active',
    startedAt: String(data.startedAt),
    meta: data.meta ? String(data.meta) : undefined,
    startedAtMs: typeof data.startedAtMs === 'number' ? data.startedAtMs : undefined,
    lastAccrualMs: typeof data.lastAccrualMs === 'number' ? data.lastAccrualMs : undefined,
    lastPayoutAt: data.lastPayoutAt ? String(data.lastPayoutAt) : undefined,
    payoutCyclesCompleted:
      typeof data.payoutCyclesCompleted === 'number' ? data.payoutCyclesCompleted : undefined,
    accruedProfit: typeof data.accruedProfit === 'number' ? data.accruedProfit : undefined,
    principalReturned:
      typeof data.principalReturned === 'boolean' ? data.principalReturned : undefined,
    autoCompound: typeof data.autoCompound === 'boolean' ? data.autoCompound : undefined,
    autoRoiEnabled: typeof data.autoRoiEnabled === 'boolean' ? data.autoRoiEnabled : undefined,
  };
}

export async function signInWithGoogleCloud(): Promise<{ user: FirebaseUser; isNewUser: boolean }> {
  const credential = await signInWithPopup(auth, googleProvider);
  const fbUser = credential.user;
  const isNewUser = await ensureUserBootstrapped(fbUser);
  await flushPendingLocationLogs(fbUser.uid);
  return { user: fbUser, isNewUser };
}

export async function signOutCloud(): Promise<void> {
  await signOut(auth);
}

export async function ensureUserBootstrapped(fbUser: FirebaseUser): Promise<boolean> {
  const userRef = doc(db, 'users', fbUser.uid);
  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${fbUser.uid}`);
  }

  if (userSnap.exists()) {
    return false;
  }

  const isBootstrappedAdmin =
    (fbUser.email || '').trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
  const displayName = (
    fbUser.displayName ||
    fbUser.email?.split('@')[0] ||
    'AssetCrest Investor'
  ).slice(0, 120);
  const referralCode = deriveReferralCode(fbUser);
  const email = (fbUser.email || 'investor@assetcrest.co').trim().toLowerCase().slice(0, 160);

  const batch = writeBatch(db);
  batch.set(userRef, {
    uid: fbUser.uid,
    displayName,
    accountType: 'Individual',
    role: isBootstrappedAdmin ? 'admin' : 'investor',
    referralCode,
    kycStatus: 'Unverified',
    accountBalance: 0,
    totalProfit: 0,
    bonus: 0,
    referralBonus: 0,
    totalDeposit: 0,
    cryptoBalances: { ...EMPTY_CRYPTO_BALANCES },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'users', fbUser.uid, 'private', 'info'), {
    uid: fbUser.uid,
    email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'transferDirectory', referralCode), {
    uid: fbUser.uid,
    displayName,
    referralCode,
    accountType: 'Individual',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
  }
}

export function queuePendingLocationLog(log: Omit<VisitorLocationLog, 'id'>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(PENDING_LOC_KEY);
    const existing = raw ? (JSON.parse(raw) as Omit<VisitorLocationLog, 'id'>[]) : [];
    const next = [log, ...existing].slice(0, 20);
    window.localStorage.setItem(PENDING_LOC_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export async function flushPendingLocationLogs(uid: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(PENDING_LOC_KEY);
    if (!raw) return;
    const items = JSON.parse(raw) as Omit<VisitorLocationLog, 'id'>[];
    if (!Array.isArray(items) || items.length === 0) return;

    window.localStorage.removeItem(PENDING_LOC_KEY);
    for (const item of items) {
      await cloudLogVisitorLocation(uid, item);
    }
  } catch {
    // Best-effort flush
  }
}

export async function cloudLogVisitorLocation(
  reporterUid: string,
  log: Omit<VisitorLocationLog, 'id'>
): Promise<void> {
  const id = nextCloudId('LOC');
  try {
    await setDoc(doc(db, 'locationLogs', id), {
      id,
      reporterUid,
      refCode: (log.refCode || 'DIRECT').toUpperCase().slice(0, 40),
      clickedUrl: (log.clickedUrl || 'https://assetcrest.co').slice(0, 400),
      latitude: (log.latitude || 'Unknown').slice(0, 64),
      longitude: (log.longitude || 'Unknown').slice(0, 64),
      accuracyLabel: (log.accuracyLabel || 'Browser telemetry').slice(0, 120),
      timezone: (log.timezone || 'UTC').slice(0, 80),
      language: (log.language || 'en-US').slice(0, 40),
      deviceSummary: (log.deviceSummary || 'Browser').slice(0, 160),
      timestamp: (log.timestamp || formatNowStamp()).slice(0, 40),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `locationLogs/${id}`);
  }
}

export async function cloudSubmitDeposit(params: {
  uid: string;
  method: string;
  amount: number;
  status: 'Pending' | 'Cancelled';
  proofName?: string;
  proofDataUrl?: string;
  note?: string;
}): Promise<string> {
  const id = nextCloudId('DEP');
  const payload: Record<string, unknown> = {
    id,
    userId: params.uid,
    type: 'Deposit',
    method: params.method.slice(0, 180),
    amount: Number(params.amount.toFixed(2)),
    status: params.status,
    date: formatNowStamp().slice(0, 40),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (params.note?.trim()) payload.note = params.note.trim().slice(0, 280);
  if (params.proofName?.trim()) payload.proofName = params.proofName.trim().slice(0, 140);
  if (params.proofDataUrl) payload.proofDataUrl = params.proofDataUrl.slice(0, 250000);

  try {
    await setDoc(doc(db, 'transactions', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `transactions/${id}`);
  }
}

export async function cloudSubmitWithdrawal(params: {
  uid: string;
  currentBalance: number;
  method: string;
  amount: number;
  destination: string;
}): Promise<string> {
  const id = nextCloudId('WDR');
  const nextBalance = Number((params.currentBalance - params.amount).toFixed(2));
  const batch = writeBatch(db);

  batch.update(doc(db, 'users', params.uid), {
    accountBalance: nextBalance,
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'transactions', id), {
    id,
    userId: params.uid,
    type: 'Withdrawal',
    method: params.method.slice(0, 180),
    amount: Number(params.amount.toFixed(2)),
    status: 'Pending',
    date: formatNowStamp().slice(0, 40),
    note: `Destination: ${params.destination.trim()}`.slice(0, 280),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `transactions/${id}`);
  }
}

export async function cloudLookupTransferRecipient(
  refCodeInput: string
): Promise<TransferDirectoryEntry | null> {
  const normalized = refCodeInput.trim().toUpperCase();
  if (!/^[A-Z0-9_\-]{2,32}$/.test(normalized)) {
    return null;
  }
  try {
    const snap = await getDoc(doc(db, 'transferDirectory', normalized));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: String(data.uid),
      displayName: String(data.displayName),
      referralCode: String(data.referralCode),
      accountType: data.accountType === 'Joint' ? 'Joint' : 'Individual',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `transferDirectory/${normalized}`);
  }
}

export async function cloudSendTransfer(params: {
  fromUser: UserAccount;
  recipient: TransferDirectoryEntry;
  amount: number;
  note?: string;
}): Promise<string> {
  const transferId = nextCloudId('REQ');
  const txId = nextCloudId('TRF');
  const nextBalance = Number((params.fromUser.accountBalance - params.amount).toFixed(2));
  const stamp = formatNowStamp().slice(0, 40);
  const cleanNote = params.note?.trim().slice(0, 240);

  const batch = writeBatch(db);
  batch.update(doc(db, 'users', params.fromUser.id), {
    accountBalance: nextBalance,
    updatedAt: serverTimestamp(),
  });

  const reqPayload: Record<string, unknown> = {
    id: transferId,
    fromUid: params.fromUser.id,
    fromName: params.fromUser.name.slice(0, 120),
    toUid: params.recipient.uid,
    toName: params.recipient.displayName.slice(0, 120),
    toRefCode: params.recipient.referralCode.slice(0, 32),
    amount: Number(params.amount.toFixed(2)),
    status: 'PendingClaim',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (cleanNote) reqPayload.note = cleanNote;
  batch.set(doc(db, 'transferRequests', transferId), reqPayload);

  const txPayload: Record<string, unknown> = {
    id: txId,
    userId: params.fromUser.id,
    type: 'Transfer Out',
    method: `To ${params.recipient.displayName} (${params.recipient.referralCode})`.slice(0, 180),
    amount: Number(params.amount.toFixed(2)),
    status: 'Completed',
    date: stamp,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (cleanNote) txPayload.note = cleanNote;
  batch.set(doc(db, 'transactions', txId), txPayload);

  try {
    await batch.commit();
    return transferId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `transferRequests/${transferId}`);
  }
}

export async function cloudClaimTransferRequest(transfer: TransferRequestRecord): Promise<void> {
  const userRef = doc(db, 'users', transfer.toUid);
  const reqRef = doc(db, 'transferRequests', transfer.id);
  const txId = nextCloudId('TRF');

  let userSnap;
  let reqSnap;
  try {
    [userSnap, reqSnap] = await Promise.all([getDoc(userRef), getDoc(reqRef)]);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `transferRequests/${transfer.id}`);
  }

  if (!userSnap.exists() || !reqSnap.exists()) return;
  const reqData = reqSnap.data();
  if (reqData.status !== 'PendingClaim') return;

  const existingBalance = Number(userSnap.data().accountBalance ?? 0);
  const nextBalance = Number((existingBalance + transfer.amount).toFixed(2));

  const batch = writeBatch(db);
  batch.update(userRef, {
    accountBalance: nextBalance,
    lastClaimedTransferId: transfer.id,
    updatedAt: serverTimestamp(),
  });
  batch.update(reqRef, {
    status: 'Completed',
    updatedAt: serverTimestamp(),
  });

  const txPayload: Record<string, unknown> = {
    id: txId,
    userId: transfer.toUid,
    type: 'Transfer In',
    method: `From ${transfer.fromName}`.slice(0, 180),
    amount: transfer.amount,
    status: 'Completed',
    date: formatNowStamp().slice(0, 40),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (transfer.note?.trim()) txPayload.note = transfer.note.trim().slice(0, 280);
  batch.set(doc(db, 'transactions', txId), txPayload);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `transferRequests/${transfer.id}`);
  }
}

export async function cloudExecuteSwap(params: {
  uid: string;
  nextUsdBalance: number;
  nextCryptoBalances: Record<Exclude<CryptoAssetSymbol, 'USD'>, number>;
  method: string;
  usdAmount: number;
  note: string;
}): Promise<string> {
  const swapTxId = nextCloudId('SWP');
  const batch = writeBatch(db);

  batch.set(doc(db, 'transactions', swapTxId), {
    id: swapTxId,
    userId: params.uid,
    type: 'Swap',
    method: params.method.slice(0, 180),
    amount: Number(params.usdAmount.toFixed(2)),
    status: 'Completed',
    date: formatNowStamp().slice(0, 40),
    note: params.note.slice(0, 280),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'users', params.uid), {
    accountBalance: Number(params.nextUsdBalance.toFixed(2)),
    cryptoBalances: params.nextCryptoBalances,
    lastSwapTxId: swapTxId,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return swapTxId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${params.uid}`);
  }
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
  const prefix = params.category === 'Vacation' ? 'VAC' : params.category === 'Real Estate' ? 'RE' : 'INV';
  const invId = nextCloudId(prefix);
  const txId = nextCloudId('TX');
  const nowMs = Date.now();
  const stamp = formatNowStamp().slice(0, 40);
  const nextBalance = Number((params.currentBalance - params.amount).toFixed(2));

  const batch = writeBatch(db);
  batch.update(doc(db, 'users', params.uid), {
    accountBalance: nextBalance,
    updatedAt: serverTimestamp(),
  });

  const invPayload: Record<string, unknown> = {
    id: invId,
    userId: params.uid,
    category: params.category,
    planName: params.planName.slice(0, 140),
    amount: Number(params.amount.toFixed(2)),
    dailyRate: params.dailyRate.slice(0, 24),
    durationDays: params.durationDays,
    status: 'Active',
    startedAt: stamp,
    startedAtMs: nowMs,
    lastAccrualMs: nowMs,
    payoutCyclesCompleted: 0,
    accruedProfit: 0,
    principalReturned: false,
    autoCompound: Boolean(params.autoCompound),
    autoRoiEnabled: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (params.meta?.trim()) invPayload.meta = params.meta.trim().slice(0, 160);
  batch.set(doc(db, 'investments', invId), invPayload);

  batch.set(doc(db, 'transactions', txId), {
    id: txId,
    userId: params.uid,
    type: 'Investment',
    method:
      params.category === 'Standard'
        ? params.planName.slice(0, 180)
        : `${params.category} — ${params.planName}`.slice(0, 180),
    amount: Number(params.amount.toFixed(2)),
    status: 'Completed',
    date: stamp,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return invId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `investments/${invId}`);
  }
}

export async function cloudUpdateAvatar(uid: string, avatarDataUrl?: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      avatarDataUrl: avatarDataUrl ? avatarDataUrl.slice(0, 120000) : deleteField(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
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
  const batch = writeBatch(db);
  const cleanName = params.displayName.trim().slice(0, 120);

  batch.update(doc(db, 'users', params.uid), {
    displayName: cleanName,
    accountType: params.accountType,
    updatedAt: serverTimestamp(),
  });

  if (params.accountType === 'Joint') {
    batch.update(doc(db, 'users', params.uid, 'private', 'info'), {
      email: params.email.trim().toLowerCase().slice(0, 160),
      coOwnerName: (params.coOwnerName || '').trim().slice(0, 120),
      coOwnerEmail: (params.coOwnerEmail || '').trim().toLowerCase().slice(0, 160),
      relationship: (params.relationship || 'Spouse').slice(0, 60),
      authorizationMode: params.authorizationMode === 'Dual Notice' ? 'Dual Notice' : 'Either Owner',
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(doc(db, 'users', params.uid, 'private', 'info'), {
      email: params.email.trim().toLowerCase().slice(0, 160),
      coOwnerName: deleteField(),
      coOwnerEmail: deleteField(),
      relationship: deleteField(),
      authorizationMode: deleteField(),
      updatedAt: serverTimestamp(),
    });
  }

  batch.update(doc(db, 'transferDirectory', params.referralCode), {
    displayName: cleanName,
    accountType: params.accountType,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${params.uid}`);
  }
}

export async function cloudSubmitKyc(params: {
  uid: string;
  submission: KycSubmission;
}): Promise<void> {
  const kycRef = doc(db, 'kycSubmissions', params.uid);
  let existingSnap;
  try {
    existingSnap = await getDoc(kycRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `kycSubmissions/${params.uid}`);
  }

  const batch = writeBatch(db);
  const baseFields = {
    legalName: params.submission.legalName.trim().slice(0, 120),
    country: params.submission.country.trim().slice(0, 80),
    documentType: params.submission.documentType,
    documentNumber: params.submission.documentNumber.trim().slice(0, 64),
    idFrontName: params.submission.idFrontName.slice(0, 120),
    idFrontDataUrl: (params.submission.idFrontDataUrl || '').slice(0, 250000),
    selfieName: params.submission.selfieName.slice(0, 120),
    selfieDataUrl: (params.submission.selfieDataUrl || '').slice(0, 250000),
    status: 'Pending',
    submittedAt: params.submission.submittedAt.slice(0, 40),
    updatedAt: serverTimestamp(),
  };

  if (existingSnap.exists()) {
    batch.update(kycRef, baseFields);
  } else {
    batch.set(kycRef, {
      userId: params.uid,
      ...baseFields,
      createdAt: serverTimestamp(),
    });
  }

  batch.update(doc(db, 'users', params.uid), {
    kycStatus: 'Pending',
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `kycSubmissions/${params.uid}`);
  }
}

export async function cloudAdminDecideKyc(
  targetUid: string,
  decision: 'Approved' | 'Rejected',
  adminNote: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'kycSubmissions', targetUid), {
    status: decision,
    reviewedAt: formatNowStamp().slice(0, 40),
    adminNote: adminNote.slice(0, 300),
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', targetUid), {
    kycStatus: decision,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `kycSubmissions/${targetUid}`);
  }
}

export async function cloudAdminApproveDeposit(
  tx: TransactionRecord,
  targetUser: UserAccount
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'transactions', tx.id), {
    status: 'Completed',
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', tx.userId), {
    accountBalance: Number((targetUser.accountBalance + tx.amount).toFixed(2)),
    totalDeposit: Number((targetUser.totalDeposit + tx.amount).toFixed(2)),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `transactions/${tx.id}`);
  }
}

export async function cloudAdminDeclineDeposit(tx: TransactionRecord): Promise<void> {
  try {
    await updateDoc(doc(db, 'transactions', tx.id), {
      status: 'Cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `transactions/${tx.id}`);
  }
}

export async function cloudAdminApproveWithdrawal(tx: TransactionRecord): Promise<void> {
  try {
    await updateDoc(doc(db, 'transactions', tx.id), {
      status: 'Completed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `transactions/${tx.id}`);
  }
}

export async function cloudAdminDeclineWithdrawal(
  tx: TransactionRecord,
  targetUser: UserAccount
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'transactions', tx.id), {
    status: 'Cancelled',
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', tx.userId), {
    accountBalance: Number((targetUser.accountBalance + tx.amount).toFixed(2)),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `transactions/${tx.id}`);
  }
}

export async function cloudAdminDistributeYields(
  payouts: { inv: ActiveInvestment; owner: UserAccount; yieldAmt: number }[]
): Promise<number> {
  if (payouts.length === 0) return 0;

  const batch = writeBatch(db);
  const stamp = formatNowStamp().slice(0, 40);
  const perUserTotals: Record<string, { owner: UserAccount; credit: number }> = {};

  for (const item of payouts) {
    const txId = nextCloudId('YLD');
    batch.set(doc(db, 'transactions', txId), {
      id: txId,
      userId: item.inv.userId,
      type: 'Bonus',
      method: `Daily Yield — ${item.inv.planName}`.slice(0, 180),
      amount: item.yieldAmt,
      status: 'Completed',
      date: stamp,
      note: `${item.inv.dailyRate} yield payout`.slice(0, 280),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (!perUserTotals[item.owner.id]) {
      perUserTotals[item.owner.id] = { owner: item.owner, credit: 0 };
    }
    perUserTotals[item.owner.id].credit += item.yieldAmt;
  }

  for (const uid of Object.keys(perUserTotals)) {
    const entry = perUserTotals[uid];
    batch.update(doc(db, 'users', uid), {
      totalProfit: Number((entry.owner.totalProfit + entry.credit).toFixed(2)),
      accountBalance: Number((entry.owner.accountBalance + entry.credit).toFixed(2)),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return payouts.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'transactions');
  }
}

export async function cloudToggleInvestmentSettings(
  invId: string,
  updates: { autoCompound?: boolean; autoRoiEnabled?: boolean }
): Promise<boolean> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (typeof updates.autoCompound === 'boolean') payload.autoCompound = updates.autoCompound;
  if (typeof updates.autoRoiEnabled === 'boolean') payload.autoRoiEnabled = updates.autoRoiEnabled;

  try {
    await updateDoc(doc(db, 'investments', invId), payload);
    return true;
  } catch (error) {
    console.warn('Cloud investment settings update deferred:', error);
    return false;
  }
}

export async function cloudSettleRoiPlan(
  plan: RoiSettlementPlan,
  users: UserAccount[],
  options?: { silentOnPermissionError?: boolean }
): Promise<{ settledCount: number; permissionRestricted?: boolean }> {
  if (plan.investmentUpdates.length === 0) {
    return { settledCount: 0 };
  }

  const batch = writeBatch(db);
  const userMap = new Map(users.map((u) => [u.id, u]));

  for (const upd of plan.investmentUpdates) {
    const inv = upd.investment;
    const invUpdate: Record<string, unknown> = {
      status: inv.status,
      amount: Number(inv.amount.toFixed(2)),
      lastAccrualMs: inv.lastAccrualMs,
      payoutCyclesCompleted: inv.payoutCyclesCompleted ?? 0,
      accruedProfit: Number((inv.accruedProfit ?? 0).toFixed(2)),
      principalReturned: Boolean(inv.principalReturned),
      updatedAt: serverTimestamp(),
    };
    if (inv.startedAtMs) invUpdate.startedAtMs = inv.startedAtMs;
    if (inv.lastPayoutAt) invUpdate.lastPayoutAt = inv.lastPayoutAt;
    batch.update(doc(db, 'investments', inv.id), invUpdate);
  }

  for (const tx of plan.transactions) {
    const txPayload: Record<string, unknown> = {
      id: tx.id,
      userId: tx.userId,
      type: tx.type,
      method: tx.method.slice(0, 180),
      amount: Number(tx.amount.toFixed(2)),
      status: tx.status,
      date: tx.date.slice(0, 40),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (tx.note) txPayload.note = tx.note.slice(0, 280);
    batch.set(doc(db, 'transactions', tx.id), txPayload);
  }

  for (const uid of Object.keys(plan.userDeltas)) {
    const owner = userMap.get(uid);
    const delta = plan.userDeltas[uid];
    if (!owner || (!delta.balanceDelta && !delta.profitDelta)) continue;
    batch.update(doc(db, 'users', uid), {
      totalProfit: Number((owner.totalProfit + delta.profitDelta).toFixed(2)),
      accountBalance: Number((owner.accountBalance + delta.balanceDelta).toFixed(2)),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return { settledCount: plan.investmentUpdates.length };
  } catch (error) {
    if (options?.silentOnPermissionError) {
      console.warn('Automatic Cloud ROI sync skipped due to permissions:', error);
      return { settledCount: 0, permissionRestricted: true };
    }
    handleFirestoreError(error, OperationType.WRITE, 'investments');
  }
}

export async function cloudAdminToggleUserStatus(
  targetUid: string,
  accountStatus: 'Active' | 'Blocked'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', targetUid), {
      accountStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
  }
}

export async function cloudAdminAdjustUserFunds(params: {
  targetUid: string;
  accountBalance: number;
  totalProfit: number;
  bonus: number;
  note?: string;
}): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', params.targetUid), {
    accountBalance: Number(params.accountBalance.toFixed(2)),
    totalProfit: Number(params.totalProfit.toFixed(2)),
    bonus: Number(params.bonus.toFixed(2)),
    updatedAt: serverTimestamp(),
  });

  if (params.note) {
    const txId = nextCloudId('ADJ');
    batch.set(doc(db, 'transactions', txId), {
      id: txId,
      userId: params.targetUid,
      type: 'Bonus',
      method: 'Admin Balance Adjustment',
      amount: 0,
      status: 'Completed',
      date: formatNowStamp().slice(0, 40),
      note: params.note.slice(0, 280),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${params.targetUid}`);
  }
}

export async function cloudCreateTicket(params: {
  userId: string;
  senderEmail: string;
  targetDeskEmail: string;
  subject: string;
  message: string;
}): Promise<string> {
  const id = nextCloudId('MSG');
  try {
    await setDoc(doc(db, 'tickets', id), {
      id,
      userId: params.userId,
      senderEmail: params.senderEmail.slice(0, 160),
      targetDeskEmail: params.targetDeskEmail,
      subject: params.subject.trim().slice(0, 160),
      message: params.message.trim().slice(0, 2000),
      date: formatNowStamp().slice(0, 40),
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tickets/${id}`);
  }
}

// ============================================================================
// REAL-TIME FIRESTORE SYNC HOOK
// ============================================================================
export function useFirebaseCloudSync(): CloudSyncState & {
  dismissWelcome: () => void;
} {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isNewUserWelcome, setIsNewUserWelcome] = useState(false);

  const [ownProfileDoc, setOwnProfileDoc] = useState<Record<string, unknown> | null>(null);
  const [ownPrivateDoc, setOwnPrivateDoc] = useState<Record<string, unknown> | null>(null);
  const [ownKycDoc, setOwnKycDoc] = useState<Record<string, unknown> | null>(null);

  const [allProfileDocs, setAllProfileDocs] = useState<Record<string, Record<string, unknown>>>({});
  const [allKycDocs, setAllKycDocs] = useState<Record<string, Record<string, unknown>>>({});
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [investments, setInvestments] = useState<ActiveInvestment[]>([]);
  const [tickets, setTickets] = useState<ContactTicket[]>([]);
  const [locationLogs, setLocationLogs] = useState<VisitorLocationLog[]>([]);
  const [incomingTransfers, setIncomingTransfers] = useState<TransferRequestRecord[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWalletRecord[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthReady(true);

      if (!fbUser) {
        setOwnProfileDoc(null);
        setOwnPrivateDoc(null);
        setOwnKycDoc(null);
        setAllProfileDocs({});
        setAllKycDocs({});
        setTransactions([]);
        setInvestments([]);
        setTickets([]);
        setLocationLogs([]);
        setIncomingTransfers([]);
        setIsNewUserWelcome(false);
      } else {
        void ensureUserBootstrapped(fbUser)
          .then((created) => {
            if (created) setIsNewUserWelcome(true);
            void flushPendingLocationLogs(fbUser.uid);
          })
          .catch((error) => {
            reportFirestoreSyncError(error, OperationType.WRITE, `users/${fbUser.uid}`);
          });
      }
    });
    return () => unsubAuth();
  }, []);

  const uid = firebaseUser?.uid || null;
  const isBootstrappedAdmin =
    Boolean(firebaseUser?.emailVerified) &&
    (firebaseUser?.email || '').toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
  const isAdmin = isBootstrappedAdmin || ownProfileDoc?.role === 'admin';

  useEffect(() => {
    if (!authReady || !uid) return;

    const unsubs: (() => void)[] = [];

    // 1. Own User Profile
    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          setOwnProfileDoc(snap.exists() ? (snap.data() as Record<string, unknown>) : null);
        },
        (error) => {
          reportFirestoreSyncError(error, OperationType.GET, `users/${uid}`);
        }
      )
    );

    // 2. Own Private Info
    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'private', 'info'),
        (snap) => {
          setOwnPrivateDoc(snap.exists() ? (snap.data() as Record<string, unknown>) : null);
        },
        (error) => {
          reportFirestoreSyncError(error, OperationType.GET, `users/${uid}/private/info`);
        }
      )
    );

    // 3. Own KYC Submission
    unsubs.push(
      onSnapshot(
        doc(db, 'kycSubmissions', uid),
        (snap) => {
          setOwnKycDoc(snap.exists() ? (snap.data() as Record<string, unknown>) : null);
        },
        (error) => {
          reportFirestoreSyncError(error, OperationType.GET, `kycSubmissions/${uid}`);
        }
      )
    );

    // 4. Incoming P2P Transfer Requests (PendingClaim)
    unsubs.push(
      onSnapshot(
        query(collection(db, 'transferRequests'), where('toUid', '==', uid)),
        (snap) => {
          const list: TransferRequestRecord[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: String(data.id || d.id),
              fromUid: String(data.fromUid),
              fromName: String(data.fromName),
              toUid: String(data.toUid),
              toName: String(data.toName),
              toRefCode: String(data.toRefCode),
              amount: Number(data.amount ?? 0),
              status: data.status === 'Completed' ? 'Completed' : 'PendingClaim',
              note: data.note ? String(data.note) : undefined,
            });
          });
          setIncomingTransfers(list.filter((t) => t.status === 'PendingClaim'));
        },
        (error) => {
          reportFirestoreSyncError(error, OperationType.LIST, 'transferRequests');
        }
      )
    );

    // 5. Admin-Managed Crypto Payment Wallets (graceful fallback to local store if unprovisioned in external rules)
    unsubs.push(
      onSnapshot(
        collection(db, 'cryptoWallets'),
        (snap) => {
          const list: CryptoWalletRecord[] = [];
          snap.forEach((d) => {
            const data = d.data();
            const rawStatus = String(data.status || 'Active');
            const status: WalletStatus =
              rawStatus === 'Inactive' || rawStatus === 'Maintenance' ? rawStatus : 'Active';
            list.push({
              id: String(data.id || d.id),
              cryptocurrency: String(data.cryptocurrency || 'Crypto'),
              symbol: String(data.symbol || 'CRYPTO'),
              network: String(data.network || 'Mainnet'),
              address: String(data.address || ''),
              label: String(data.label || 'Deposit Wallet'),
              status,
              minDeposit: Number(data.minDeposit ?? 50),
              maxDeposit: Number(data.maxDeposit ?? 250000),
              instructions: String(data.instructions || ''),
              createdAt: String(data.createdAt || formatNowStamp()),
              updatedAt: String(data.updatedAt || formatNowStamp()),
              updatedByAdminName: String(data.updatedByAdminName || 'Admin'),
              updatedByAdminEmail: String(data.updatedByAdminEmail || ''),
              assignedUserIds: Array.isArray(data.assignedUserIds)
                ? data.assignedUserIds.map(String)
                : [],
            });
          });
          list.sort((a, b) => a.cryptocurrency.localeCompare(b.cryptocurrency));
          setCryptoWallets(list);
        },
        () => {
          // Safe fallback: retain local store cryptoWallets when external Firestore rules disallow collection
        }
      )
    );

    if (isBootstrappedAdmin) {
      // Admin Listeners (full collection queries safe under isBootstrappedAdmin rule)
      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => {
            const map: Record<string, Record<string, unknown>> = {};
            snap.forEach((d) => {
              map[d.id] = d.data() as Record<string, unknown>;
            });
            setAllProfileDocs(map);
          },
          (error) => reportFirestoreSyncError(error, OperationType.LIST, 'users')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'kycSubmissions'),
          (snap) => {
            const map: Record<string, Record<string, unknown>> = {};
            snap.forEach((d) => {
              map[d.id] = d.data() as Record<string, unknown>;
            });
            setAllKycDocs(map);
          },
          (error) => reportFirestoreSyncError(error, OperationType.LIST, 'kycSubmissions')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'transactions'),
          (snap) => {
            const rows: TransactionRecord[] = [];
            snap.forEach((d) => {
              const data = d.data();
              rows.push({
                id: String(data.id || d.id),
                userId: String(data.userId),
                type: data.type as TransactionRecord['type'],
                method: String(data.method),
                amount: Number(data.amount ?? 0),
                status: data.status as TransactionRecord['status'],
                date: String(data.date),
                note: data.note ? String(data.note) : undefined,
                proofName: data.proofName ? String(data.proofName) : undefined,
                proofDataUrl: data.proofDataUrl ? String(data.proofDataUrl) : undefined,
              });
            });
            rows.sort((a, b) => b.date.localeCompare(a.date));
            setTransactions(rows);
          },
          (error) => reportFirestoreSyncError(error, OperationType.LIST, 'transactions')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'investments'),
          (snap) => {
            const rows: ActiveInvestment[] = [];
            snap.forEach((d) => {
              rows.push(mapFirestoreDocToInvestment(d.id, d.data()));
            });
            rows.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
            setInvestments(rows);
          },
          (error) => reportFirestoreSyncError(error, OperationType.LIST, 'investments')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'locationLogs'),
          (snap) => {
            const rows: VisitorLocationLog[] = [];
            snap.forEach((d) => {
              const data = d.data();
              rows.push({
                id: String(data.id || d.id),
                refCode: String(data.refCode),
                clickedUrl: String(data.clickedUrl),
                latitude: String(data.latitude),
                longitude: String(data.longitude),
                accuracyLabel: String(data.accuracyLabel),
                timezone: String(data.timezone),
                language: String(data.language),
                deviceSummary: String(data.deviceSummary),
                timestamp: String(data.timestamp),
              });
            });
            rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
            setLocationLogs(rows);
          },
          (error) => reportFirestoreSyncError(error, OperationType.LIST, 'locationLogs')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'tickets'),
          (snap) => {
            const rows: ContactTicket[] = [];
            snap.forEach((d) => {
              const data = d.data();
              rows.push({
                id: String(data.id || d.id),
                userId: String(data.userId),
                senderEmail: String(data.senderEmail),
                targetDeskEmail: String(data.targetDeskEmail),
                subject: String(data.subject),
                message: String(data.message),
                date: String(data.date),
              });
            });
            rows.sort((a, b) => b.date.localeCompare(a.date));
            setTickets(rows);
          },
          (error) => reportFirestoreSyncError(error, OperationType.LIST, 'tickets')
        )
      );
    } else {
      // Standard Investor Scoped Listeners (resource.data.userId == request.auth.uid)
      unsubs.push(
        onSnapshot(
          query(collection(db, 'transactions'), where('userId', '==', uid)),
          (snap) => {
            const rows: TransactionRecord[] = [];
            snap.forEach((d) => {
              const data = d.data();
              rows.push({
                id: String(data.id || d.id),
                userId: String(data.userId),
                type: data.type as TransactionRecord['type'],
                method: String(data.method),
                amount: Number(data.amount ?? 0),
                status: data.status as TransactionRecord['status'],
                date: String(data.date),
                note: data.note ? String(data.note) : undefined,
                proofName: data.proofName ? String(data.proofName) : undefined,
                proofDataUrl: data.proofDataUrl ? String(data.proofDataUrl) : undefined,
              });
            });
            rows.sort((a, b) => b.date.localeCompare(a.date));
            setTransactions(rows);
          },
          (error) => reportFirestoreSyncError(error, OperationType.LIST, 'transactions')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'investments'), where('userId', '==', uid)),
          (snap) => {
            const rows: ActiveInvestment[] = [];
            snap.forEach((d) => {
              rows.push(mapFirestoreDocToInvestment(d.id, d.data()));
            });
            rows.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
            setInvestments(rows);
          },
          (error) => reportFirestoreSyncError(error, OperationType.LIST, 'investments')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'tickets'), where('userId', '==', uid)),
          (snap) => {
            const rows: ContactTicket[] = [];
            snap.forEach((d) => {
              const data = d.data();
              rows.push({
                id: String(data.id || d.id),
                userId: String(data.userId),
                senderEmail: String(data.senderEmail),
                targetDeskEmail: String(data.targetDeskEmail),
                subject: String(data.subject),
                message: String(data.message),
                date: String(data.date),
              });
            });
            rows.sort((a, b) => b.date.localeCompare(a.date));
            setTickets(rows);
          },
          (error) => reportFirestoreSyncError(error, OperationType.LIST, 'tickets')
        )
      );
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, uid, isBootstrappedAdmin]);

  const cloudUser =
    uid && ownProfileDoc ? mapFirestoreDocToUser(uid, ownProfileDoc, ownPrivateDoc, ownKycDoc) : null;

  const mappedAllUsers: UserAccount[] = isBootstrappedAdmin
    ? Object.keys(allProfileDocs).map((id) =>
        mapFirestoreDocToUser(
          id,
          allProfileDocs[id],
          id === uid ? ownPrivateDoc : null,
          allKycDocs[id] || null
        )
      )
    : [];
  const allUsers: UserAccount[] = isBootstrappedAdmin
    ? mappedAllUsers.length > 0
      ? cloudUser && !mappedAllUsers.some((u) => u.id === cloudUser.id)
        ? [cloudUser, ...mappedAllUsers]
        : mappedAllUsers
      : cloudUser
      ? [cloudUser]
      : []
    : cloudUser
    ? [cloudUser]
    : [];

  const kycSubmissionsMap: Record<string, KycSubmission & { status: KycStatus }> = {};
  if (isBootstrappedAdmin) {
    Object.keys(allKycDocs).forEach((id) => {
      const k = allKycDocs[id];
      kycSubmissionsMap[id] = {
        legalName: String(k.legalName || ''),
        country: String(k.country || ''),
        documentType: (k.documentType as KycSubmission['documentType']) || 'Passport',
        documentNumber: String(k.documentNumber || ''),
        idFrontName: String(k.idFrontName || ''),
        idFrontDataUrl: String(k.idFrontDataUrl || ''),
        selfieName: String(k.selfieName || ''),
        selfieDataUrl: String(k.selfieDataUrl || ''),
        submittedAt: String(k.submittedAt || ''),
        reviewedAt: k.reviewedAt ? String(k.reviewedAt) : undefined,
        adminNote: k.adminNote ? String(k.adminNote) : undefined,
        status: (k.status as KycStatus) || 'Pending',
      };
    });
  }

  // Helper check to fetch single docs if needed in admin view
  void getDocs;

  return {
    authReady,
    firebaseUser,
    cloudUser,
    allUsers,
    kycSubmissionsMap,
    transactions,
    investments,
    tickets,
    locationLogs,
    incomingTransfers,
    cryptoWallets,
    isAdmin,
    isNewUserWelcome,
    dismissWelcome: () => setIsNewUserWelcome(false),
  };
}

export async function cloudSaveCryptoWallet(wallet: CryptoWalletRecord): Promise<boolean> {
  try {
    await setDoc(doc(db, 'cryptoWallets', wallet.id), {
      ...wallet,
      assignedUserIds: wallet.assignedUserIds || [],
      updatedAtServer: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.warn('Cloud crypto wallet save fell back to local store:', error);
    return false;
  }
}

export async function cloudDeleteCryptoWallet(walletId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'cryptoWallets', walletId));
    return true;
  } catch (error) {
    console.warn('Cloud crypto wallet delete fell back to local store:', error);
    return false;
  }
}
