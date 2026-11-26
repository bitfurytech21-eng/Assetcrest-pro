'use client';

import React, { useEffect, useState } from 'react';
import Image from '@/src/backend/components/NextImageShim';
import {
  Home,
  ChevronRight,
  Send,
  ArrowLeftRight,
  Plane,
  Lock,
  Unlock,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Upload,
  UserCheck,
  CheckCircle2,
  Users,
  KeyRound,
  Trash2,
  Search,
  Cloud,
} from 'lucide-react';
import {
  ActiveInvestment,
  appendActivityLog,
  AssetCrestStore,
  CRYPTO_ASSETS,
  CryptoAssetSymbol,
  formatNowStamp,
  InvestmentPlanConfig,
  KycSubmission,
  nextRecordId,
  PageTab,
  readAndCompressFile,
  TransactionRecord,
  updateAssetCrestStore,
  UserAccount,
  VACATION_QUALIFICATION_USD,
} from '@/src/backend/lib/assetcrest-store';
import {
  cloudChangePassword,
  cloudExecuteSwap,
  cloudInvestPlan,
  cloudLookupTransferRecipient,
  cloudSendTransfer,
  cloudSubmitKyc,
  cloudUpdateAvatar,
  cloudUpdateProfileAndJoint,
  type TransferDirectoryEntry,
} from '@/src/backend/lib/neon-client';
import { getInvestmentRoiSnapshot } from '@/src/backend/lib/roi-engine';
import { useLiveCryptoPrices } from '@/src/backend/lib/useLiveCryptoPrices';

interface CommonViewProps {
  user: UserAccount;
  store: AssetCrestStore;
  isCloudMode?: boolean;
  onNavigate: (tab: PageTab) => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
}

function BreadcrumbHeader({
  title,
  crumb,
  onDashboard,
}: {
  title: string;
  crumb: string;
  onDashboard: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">{title}</h2>
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
        <button
          type="button"
          onClick={onDashboard}
          className="hover:text-[#2b4865] dark:hover:text-sky-400 cursor-pointer"
        >
          <Home className="h-4 w-4 text-slate-400" />
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span>{crumb}</span>
      </div>
    </div>
  );
}

// ============================================================================
// 1. TRANSFER FUNDS BETWEEN USERS
// ============================================================================
export function TransferFundsView({
  user,
  store,
  isCloudMode = false,
  onNavigate,
  onNotify,
}: CommonViewProps) {
  const [recipientQuery, setRecipientQuery] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [cloudRecipient, setCloudRecipient] = useState<TransferDirectoryEntry | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [sendingBusy, setSendingBusy] = useState(false);

  const otherUsers = store.users.filter((u) => u.id !== user.id);
  const matchedLocalRecipient = otherUsers.find(
    (u) =>
      u.email.toLowerCase() === recipientQuery.trim().toLowerCase() ||
      u.referralCode.toLowerCase() === recipientQuery.trim().toLowerCase()
  );

  const handleLookupCloudRecipient = async (codeOverride?: string) => {
    const queryCode = (codeOverride ?? recipientQuery).trim().toUpperCase();
    if (!queryCode) {
      setCloudRecipient(null);
      return;
    }
    setLookupBusy(true);
    try {
      const found = await cloudLookupTransferRecipient(queryCode);
      if (!found) {
        setCloudRecipient(null);
        onNotify(`No registered Cloud investor found for Referral ID "${queryCode}".`, 'error');
      } else if (found.uid === user.id) {
        setCloudRecipient(null);
        onNotify('You cannot transfer funds to your own account.', 'error');
      } else {
        setCloudRecipient(found);
      }
    } catch {
      onNotify('Unable to verify recipient ID right now.', 'error');
    } finally {
      setLookupBusy(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountInput);
    if (!amount || amount <= 0) {
      onNotify('Enter a valid transfer amount greater than $0.00.', 'error');
      return;
    }
    if (amount > user.accountBalance) {
      onNotify('Insufficient USD account balance for this transfer.', 'error');
      return;
    }

    if (isCloudMode) {
      let recipient = cloudRecipient;
      if (!recipient && recipientQuery.trim()) {
        try {
          const found = await cloudLookupTransferRecipient(recipientQuery);
          if (found && found.uid !== user.id) {
            recipient = found;
            setCloudRecipient(found);
          }
        } catch {
          onNotify('Unable to verify recipient ID right now. Please try again.', 'error');
          return;
        }
      }
      if (!recipient) {
        onNotify('Enter and verify a valid recipient Referral ID first.', 'error');
        return;
      }

      setSendingBusy(true);
      try {
        await cloudSendTransfer({
          fromUser: user,
          recipient,
          amount,
          note: noteInput,
        });
        setAmountInput('');
        setNoteInput('');
        onNotify(
          `Sent $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${recipient.displayName}. Settlement completes when they open AssetCrest.`,
          'success'
        );
      } catch {
        onNotify('Cloud transfer failed. Verify balance and try again.', 'error');
      } finally {
        setSendingBusy(false);
      }
      return;
    }

    if (!matchedLocalRecipient) {
      onNotify('Recipient account not found. Select or enter a valid registered email or ID.', 'error');
      return;
    }

    const stamp = formatNowStamp();
    const outTx: TransactionRecord = {
      id: nextRecordId('TRF'),
      userId: user.id,
      type: 'Transfer Out',
      method: `To ${matchedLocalRecipient.name} (${matchedLocalRecipient.email})`,
      amount,
      status: 'Completed',
      date: stamp,
      note: noteInput.trim() || undefined,
    };
    const inTx: TransactionRecord = {
      id: nextRecordId('TRF'),
      userId: matchedLocalRecipient.id,
      type: 'Transfer In',
      method: `From ${user.name} (${user.email})`,
      amount,
      status: 'Completed',
      date: stamp,
      note: noteInput.trim() || undefined,
    };

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) => {
        if (u.id === user.id) {
          return { ...u, accountBalance: Number((u.accountBalance - amount).toFixed(2)) };
        }
        if (u.id === matchedLocalRecipient.id) {
          return { ...u, accountBalance: Number((u.accountBalance + amount).toFixed(2)) };
        }
        return u;
      }),
      transactions: [outTx, inTx, ...prev.transactions],
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Sent internal transfer to ${matchedLocalRecipient.name}`,
        category: 'withdrawal',
        detail: `$${amount.toFixed(2)}`,
      }),
    }));

    setAmountInput('');
    setNoteInput('');
    onNotify(
      `Transferred $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${matchedLocalRecipient.name}.`,
      'success'
    );
  };

  return (
    <div className="space-y-5">
      <BreadcrumbHeader
        title="Transfer Funds"
        crumb="Transfer Funds"
        onDashboard={() => onNavigate('dashboard')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <form
          onSubmit={handleTransfer}
          className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                User-to-User Internal Transfer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your Transfer ID:{' '}
                <strong className="font-mono text-[#2b4865] dark:text-sky-400">
                  {user.referralCode}
                </strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Available Balance</span>
              <span className="text-sm font-bold font-mono tabular-nums text-[#2b4865] dark:text-sky-400">
                ${user.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {isCloudMode ? 'Recipient Referral ID' : 'Recipient Email or Referral ID'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={recipientQuery}
                onChange={(e) => {
                  setRecipientQuery(e.target.value);
                  if (isCloudMode) setCloudRecipient(null);
                }}
                placeholder={isCloudMode ? 'e.g. AC102AB' : 'e.g. investor@example.com'}
                className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b4865]"
              />
              {isCloudMode && (
                <button
                  type="button"
                  disabled={lookupBusy}
                  onClick={() => void handleLookupCloudRecipient()}
                  className="px-3.5 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-[#2b4865] dark:text-sky-400 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Search className="h-3.5 w-3.5" />
                  {lookupBusy ? 'Checking...' : 'Verify ID'}
                </button>
              )}
            </div>
            {isCloudMode ? (
              cloudRecipient ? (
                <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Cloud recipient: <strong>{cloudRecipient.displayName}</strong> ({cloudRecipient.accountType})
                </p>
              ) : (
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  For privacy, Cloud transfers look up recipients strictly by Referral ID without exposing emails.
                </p>
              )
            ) : matchedLocalRecipient ? (
              <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified recipient: <strong>{matchedLocalRecipient.name}</strong> ({matchedLocalRecipient.accountType})
              </p>
            ) : recipientQuery.trim() ? (
              <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                No matching AssetCrest account found.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Transfer Amount (USD)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b4865]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Transfer Note (Optional)
              </label>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g. Portfolio settlement"
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b4865]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sendingBusy}
            className="bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium px-5 py-2.5 rounded-md inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sendingBusy ? 'Sending...' : 'Send Internal Transfer'}
          </button>
        </form>

        {/* Registered Directory Quick Select */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Registered Members Directory
          </h4>
          {otherUsers.length === 0 ? (
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p>
                Ask the receiving investor for their <strong>Transfer / Referral ID</strong> (visible at the top of their Transfer page), then paste it and click <strong>Verify ID</strong>.
              </p>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                Your ID: <strong>{user.referralCode}</strong>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click a member below to populate the recipient field.
              </p>
              <div className="space-y-2">
                {otherUsers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      const codeOrEmail = isCloudMode ? member.referralCode : member.email;
                      setRecipientQuery(codeOrEmail);
                      if (isCloudMode) void handleLookupCloudRecipient(member.referralCode);
                    }}
                    className="w-full text-left p-2.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-[#2b4865] dark:hover:border-sky-400 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {member.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {member.accountType}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {isCloudMode ? member.referralCode : member.email}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. CRYPTO SWAP DESK
// ============================================================================
export function CryptoSwapView({
  user,
  isCloudMode = false,
  onNavigate,
  onNotify,
}: CommonViewProps) {
  const [fromSymbol, setFromSymbol] = useState<CryptoAssetSymbol>('USD');
  const [toSymbol, setToSymbol] = useState<CryptoAssetSymbol>('BTC');
  const [fromAmountInput, setFromAmountInput] = useState('');
  const [swapping, setSwapping] = useState(false);
  const { prices: livePrices, loading: pricesLoading, error: pricesError } = useLiveCryptoPrices();

  const getAssetBalance = (sym: CryptoAssetSymbol): number => {
    if (sym === 'USD') return user.accountBalance;
    return user.cryptoBalances[sym] ?? 0;
  };

  const fromPrice = livePrices[fromSymbol];
  const toPrice = livePrices[toSymbol];
  const quotesReady =
    typeof fromPrice === 'number' &&
    fromPrice > 0 &&
    typeof toPrice === 'number' &&
    toPrice > 0;

  const parsedFrom = Math.max(0, Number(fromAmountInput) || 0);
  const grossUsdValue = quotesReady ? parsedFrom * fromPrice : 0;
  const feeUsd = grossUsdValue * 0.0025; // 0.25% platform conversion spread
  const netUsdValue = Math.max(0, grossUsdValue - feeUsd);
  const estimatedReceive = quotesReady && toPrice > 0 ? netUsdValue / toPrice : 0;

  const handleFlipPair = () => {
    const prevFrom = fromSymbol;
    setFromSymbol(toSymbol);
    setToSymbol(prevFrom);
  };

  const handleSetMax = () => {
    setFromAmountInput(String(getAssetBalance(fromSymbol)));
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (swapping) return;
    if (fromSymbol === toSymbol) {
      onNotify('Select two different assets to perform a swap.', 'error');
      return;
    }
    if (!quotesReady) {
      onNotify('Live exchange price feed is unavailable. Please wait and retry.', 'error');
      return;
    }
    if (!parsedFrom || parsedFrom <= 0) {
      onNotify('Enter a valid amount to swap.', 'error');
      return;
    }
    const available = getAssetBalance(fromSymbol);
    if (parsedFrom > available) {
      onNotify(`Insufficient ${fromSymbol} balance available for swap.`, 'error');
      return;
    }

    if (isCloudMode) {
      setSwapping(true);
      try {
        const result = await cloudExecuteSwap({
          fromSymbol,
          toSymbol,
          fromAmount: parsedFrom,
        });
        setFromAmountInput('');
        onNotify(
          `Swapped ${parsedFrom} ${fromSymbol} into ${result.toAmount.toFixed(6)} ${toSymbol} (Live Rate Synced).`,
          'success'
        );
      } catch (err: any) {
        onNotify(err?.message || 'Swap failed. Please verify available balance and live feed.', 'error');
      } finally {
        setSwapping(false);
      }
      return;
    }

    let nextUsd = user.accountBalance;
    const nextCrypto = { ...user.cryptoBalances };

    if (fromSymbol === 'USD') {
      nextUsd = Number((nextUsd - parsedFrom).toFixed(2));
    } else {
      nextCrypto[fromSymbol] = Number((nextCrypto[fromSymbol] - parsedFrom).toFixed(8));
    }

    if (toSymbol === 'USD') {
      nextUsd = Number((nextUsd + estimatedReceive).toFixed(2));
    } else {
      nextCrypto[toSymbol] = Number((nextCrypto[toSymbol] + estimatedReceive).toFixed(8));
    }

    const method = `${parsedFrom} ${fromSymbol} → ${estimatedReceive.toFixed(6)} ${toSymbol}`;
    const note = `Live Rate: 1 ${fromSymbol} = ${(fromPrice / toPrice).toFixed(6)} ${toSymbol}`;

    const txRecord: TransactionRecord = {
      id: nextRecordId('SWP'),
      userId: user.id,
      type: 'Swap',
      method,
      amount: Number(grossUsdValue.toFixed(2)),
      status: 'Completed',
      date: formatNowStamp(),
      note,
    };

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) => {
        if (u.id !== user.id) return u;
        return {
          ...u,
          accountBalance: nextUsd,
          cryptoBalances: nextCrypto,
        };
      }),
      transactions: [txRecord, ...prev.transactions],
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Executed crypto swap (${fromSymbol} → ${toSymbol})`,
        category: 'plan',
        detail: method,
      }),
    }));

    setFromAmountInput('');
    onNotify(
      `Swapped ${parsedFrom} ${fromSymbol} into ${estimatedReceive.toFixed(6)} ${toSymbol}.`,
      'success'
    );
  };

  return (
    <div className="space-y-5">
      <BreadcrumbHeader
        title="Crypto Swap"
        crumb="Crypto Swap"
        onDashboard={() => onNavigate('dashboard')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <form
          onSubmit={handleExecuteSwap}
          className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Instant Asset Converter
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              0.25% Swap Fee
            </span>
          </div>

          {/* From Box */}
          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>From</span>
              <button
                type="button"
                onClick={handleSetMax}
                className="font-mono tabular-nums text-[#2b4865] dark:text-sky-400 hover:underline cursor-pointer"
              >
                Available: {getAssetBalance(fromSymbol).toLocaleString('en-US', { maximumFractionDigits: 6 })} {fromSymbol} (MAX)
              </button>
            </div>
            <div className="flex gap-2.5">
              <select
                value={fromSymbol}
                onChange={(e) => setFromSymbol(e.target.value as CryptoAssetSymbol)}
                className="w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                {CRYPTO_ASSETS.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} — {a.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="any"
                value={fromAmountInput}
                onChange={(e) => setFromAmountInput(e.target.value)}
                placeholder="0.00"
                className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-right font-mono tabular-nums text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b4865]"
              />
            </div>
          </div>

          {/* Flip button */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={handleFlipPair}
              className="h-9 w-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-[#2b4865] dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              aria-label="Reverse swap direction"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          {/* To Box */}
          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>To (Estimated Output)</span>
              <span className="font-mono tabular-nums">
                Balance: {getAssetBalance(toSymbol).toLocaleString('en-US', { maximumFractionDigits: 6 })} {toSymbol}
              </span>
            </div>
            <div className="flex gap-2.5">
              <select
                value={toSymbol}
                onChange={(e) => setToSymbol(e.target.value as CryptoAssetSymbol)}
                className="w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                {CRYPTO_ASSETS.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} — {a.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                readOnly
                value={estimatedReceive > 0 ? estimatedReceive.toFixed(6) : '0.000000'}
                className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/60 px-3.5 py-2.5 text-right font-mono tabular-nums text-sm font-bold text-[#2b4865] dark:text-sky-400"
              />
            </div>
          </div>

          {/* Summary lines */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-1">
            <div className="flex justify-between">
              <span>Live Exchange Rate</span>
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                {quotesReady
                  ? `1 ${fromSymbol} = ${(fromPrice / toPrice).toFixed(6)} ${toSymbol}`
                  : pricesLoading
                    ? 'Fetching live quote…'
                    : pricesError || 'Quote unavailable'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated USD Value / Fee (0.25%)</span>
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                ${grossUsdValue.toFixed(2)} / ${feeUsd.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!quotesReady || swapping}
            className="w-full bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium py-2.5 rounded-md transition cursor-pointer disabled:opacity-60"
          >
            {swapping ? 'Executing Swap...' : `Execute Swap (${fromSymbol} → ${toSymbol})`}
          </button>
        </form>

        {/* Wallet Holdings Matrix */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Multi-Asset Wallet Balances
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {CRYPTO_ASSETS.map((asset) => {
              const bal = getAssetBalance(asset.symbol);
              const liveUnitPrice = livePrices[asset.symbol];
              const usdVal = typeof liveUnitPrice === 'number' ? bal * liveUnitPrice : null;
              return (
                <div key={asset.symbol} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{asset.symbol}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {asset.name} ·{' '}
                      {typeof liveUnitPrice === 'number'
                        ? `$${liveUnitPrice.toLocaleString('en-US', {
                            minimumFractionDigits: liveUnitPrice < 10 ? 4 : 2,
                            maximumFractionDigits: liveUnitPrice < 10 ? 4 : 2,
                          })}`
                        : pricesLoading
                          ? 'Loading quote…'
                          : 'Quote unavailable'}
                    </p>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {bal.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {usdVal !== null
                        ? `≈ $${usdVal.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. DEDICATED VACATION PORTAL ($5,000+ GATED ACCESS PAGE)
// ============================================================================
export function VacationPortalView({
  user,
  store,
  isCloudMode = false,
  onNavigate,
  onNotify,
}: CommonViewProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({
    'vac-spring': '55000',
    'vac-summer': '35000',
    'vac-autumn': '45000',
    'vac-winter': '25000',
  });

  const userActiveInvested = store.investments
    .filter((i) => i.userId === user.id && i.status === 'Active')
    .reduce((acc, i) => acc + i.amount, 0);

  const qualifyingCapital = user.accountBalance + userActiveInvested;
  const isQualified = qualifyingCapital >= VACATION_QUALIFICATION_USD;
  const progressPercent = Math.min(100, Math.round((qualifyingCapital / VACATION_QUALIFICATION_USD) * 100));
  const shortfall = Math.max(0, VACATION_QUALIFICATION_USD - qualifyingCapital);

  const activeVacationPlans = store.investmentPlans.filter(
    (p) => p.category === 'Vacation' && p.isActive
  );
  const activeVacationInvestments = store.investments.filter(
    (i) => i.userId === user.id && i.category === 'Vacation'
  );

  const handleActivateVacationPlan = async (plan: InvestmentPlanConfig) => {
    if (!plan.isActive) {
      onNotify('This Vacation plan is currently inactive.', 'error');
      return;
    }
    const amount = Number(amounts[plan.id] || plan.min);
    if (!amount || amount < plan.min || amount > plan.max) {
      onNotify(
        `Enter an allocation between $${plan.min.toLocaleString('en-US')} and $${plan.max.toLocaleString('en-US')}.`,
        'error'
      );
      return;
    }
    if (amount > user.accountBalance) {
      onNotify('Insufficient liquid account balance to activate this Vacation package.', 'error');
      return;
    }

    if (isCloudMode) {
      try {
        await cloudInvestPlan({
          uid: user.id,
          currentBalance: user.accountBalance,
          category: 'Vacation',
          planName: plan.name,
          amount,
          dailyRate: plan.dailyRate,
          durationDays: plan.durationDays,
          meta: plan.destination || plan.location || 'Executive Retreat',
        });
        updateAssetCrestStore((prev) => ({
          ...prev,
          activityLogs: appendActivityLog(prev, {
            actorId: user.id,
            actorName: user.name,
            action: `Subscribed to Vacation plan (${plan.name})`,
            category: 'plan',
            detail: `$${amount.toFixed(2)}`,
          }),
        }));
        onNotify(`${plan.name} activated in your Vacation Portfolio!`, 'success');
      } catch {
        onNotify('Could not activate Vacation plan in Cloud.', 'error');
      }
      return;
    }

    const nowMs = Date.now();
    const newInv: ActiveInvestment = {
      id: nextRecordId('VAC'),
      userId: user.id,
      category: 'Vacation',
      planName: plan.name,
      amount,
      dailyRate: plan.dailyRate,
      durationDays: plan.durationDays,
      status: 'Active',
      startedAt: formatNowStamp(),
      startedAtMs: nowMs,
      lastAccrualMs: nowMs,
      payoutCyclesCompleted: 0,
      accruedProfit: 0,
      principalReturned: false,
      autoCompound: false,
      autoRoiEnabled: true,
      meta: plan.destination || plan.location || 'Executive Retreat',
    };

    const newTx: TransactionRecord = {
      id: nextRecordId('TX'),
      userId: user.id,
      type: 'Investment',
      method: `Vacation Portal — ${plan.name}`,
      amount,
      status: 'Completed',
      date: formatNowStamp(),
    };

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === user.id
          ? { ...u, accountBalance: Number((u.accountBalance - amount).toFixed(2)) }
          : u
      ),
      investments: [newInv, ...prev.investments],
      transactions: [newTx, ...prev.transactions],
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Subscribed to Vacation plan (${plan.name})`,
        category: 'plan',
        detail: `$${amount.toFixed(2)}`,
      }),
    }));

    onNotify(`${plan.name} activated in your Vacation Portfolio!`, 'success');
  };

  return (
    <div className="space-y-5">
      <BreadcrumbHeader
        title="Vacation Portal"
        crumb="Vacation Portal"
        onDashboard={() => onNavigate('dashboard')}
      />

      {!isQualified ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 max-w-2xl mx-auto space-y-5 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold">
              $5,000.00 Minimum Qualification Required
            </span>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Vacation Portal Access Locked
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              Entry to the AssetCrest Vacation Portal is strictly reserved for qualified investors holding at least{' '}
              <strong className="font-mono">$5,000.00</strong> in account equity.
            </p>
          </div>

          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300">Qualification Progress</span>
              <span className="font-mono tabular-nums text-[#2b4865] dark:text-sky-400">
                ${qualifyingCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })} / $5,000.00 ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-[#2b4865] dark:bg-sky-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              Remaining needed to unlock portal: ${shortfall.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('deposit')}
              className="bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium px-5 py-2.5 rounded-md cursor-pointer"
            >
              Deposit Funds Now
            </button>
            <button
              type="button"
              onClick={() => onNavigate('transfer')}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium px-5 py-2.5 rounded-md cursor-pointer"
            >
              Receive Internal Transfer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Unlock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Vacation Portal Access Unlocked
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
                  Verified Qualifying Equity: ${qualifyingCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-bold">
              Qualified Tier ($5,000+)
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-100">Holiday &amp; Vacation Offer:</strong>{' '}
            Sponsored three-week holiday trip available through open batch slots (Spring, Summer, Autumn, and Winter). Select an open batch slot below to allocate toward its targeted reach and earn the instant batch reward alongside daily ROI.
          </div>

          {activeVacationPlans.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No active Vacation Portal plans are currently published by the Admin desk. Existing subscribers continue earning ROI until maturity.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeVacationPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 flex flex-col justify-between space-y-4 border-t-4 border-t-[#2b4865]"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                          <Plane className="h-3.5 w-3.5" />
                          {plan.batchLabel || plan.destination || 'Holiday Batch'}
                        </p>
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                          {plan.name}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-[#2b4865]/10 dark:bg-sky-500/20 text-[#2b4865] dark:text-sky-300 text-xs font-bold font-mono shrink-0">
                        {plan.instantReward ? `${plan.instantReward} Reward` : `${plan.dailyRate}/d`}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {plan.applicationPeriod && (
                        <div className="flex justify-between">
                          <span>Application Period</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {plan.applicationPeriod}
                          </span>
                        </div>
                      )}
                      {plan.migrationPeriod && (
                        <div className="flex justify-between">
                          <span>Migration Period</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {plan.migrationPeriod}
                          </span>
                        </div>
                      )}
                      {plan.accountQualification !== undefined && (
                        <div className="flex justify-between">
                          <span>Account Qualification</span>
                          <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                            {plan.accountQualification}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Targeted Reach</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                          ${(plan.targetedReach ?? plan.min).toLocaleString('en-US')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Instant Reward / Monthly ROI</span>
                        <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                          {plan.instantReward || plan.monthlyRate || `${plan.dailyRate}/d`} ({plan.dailyRate}/day)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration / Allocation Range</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                          {plan.durationDays}d · ${plan.min.toLocaleString('en-US')} – ${plan.max.toLocaleString('en-US')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="number"
                      min={plan.min}
                      max={plan.max}
                      value={amounts[plan.id] ?? String(plan.min)}
                      onChange={(e) => setAmounts((p) => ({ ...p, [plan.id]: e.target.value }))}
                      className="flex-1 min-w-0 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleActivateVacationPlan(plan)}
                      className="bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium px-3.5 py-2 rounded cursor-pointer shrink-0"
                    >
                      Join Batch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeVacationInvestments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Vacation Portfolio &amp; Automatic ROI
              </h4>
              <div className="space-y-2">
                {activeVacationInvestments.map((item) => {
                  const snap = getInvestmentRoiSnapshot(item);
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{item.planName}</p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              snap.isMatured
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {snap.isMatured ? 'Completed' : 'Auto ROI Active'}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">
                          {item.meta} · {item.dailyRate}/day · Cycle {snap.cyclesCompleted}/{item.durationDays} · Accrued +$
                          {snap.earnedSoFar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <span className="font-mono tabular-nums font-bold text-[#2b4865] dark:text-sky-400">
                        ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. DEDICATED REAL ESTATE PLAN SECTION
// ============================================================================
export function RealEstatePortalView({
  user,
  store,
  isCloudMode = false,
  onNavigate,
  onNotify,
}: CommonViewProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({
    're-metro-reit': '1000',
    're-coastal-luxury': '5000',
    're-logistics': '15000',
  });

  const activeRealEstate = store.investments.filter(
    (i) => i.userId === user.id && i.category === 'Real Estate'
  );

  const activeRealEstatePlans = store.investmentPlans.filter(
    (p) => p.category === 'Real Estate' && p.isActive
  );

  const handleSubscribeProperty = async (plan: InvestmentPlanConfig) => {
    if (!plan.isActive) {
      onNotify('This Real Estate plan is currently inactive.', 'error');
      return;
    }
    const amount = Number(amounts[plan.id] || plan.min);
    if (!amount || amount < plan.min || amount > plan.max) {
      onNotify(
        `Enter a valid property allocation between $${plan.min.toLocaleString('en-US')} and $${plan.max.toLocaleString('en-US')}.`,
        'error'
      );
      return;
    }
    if (amount > user.accountBalance) {
      onNotify('Insufficient USD account balance for this Real Estate allocation.', 'error');
      return;
    }

    if (isCloudMode) {
      try {
        await cloudInvestPlan({
          uid: user.id,
          currentBalance: user.accountBalance,
          category: 'Real Estate',
          planName: plan.name,
          amount,
          dailyRate: plan.dailyRate,
          durationDays: plan.durationDays,
          meta: plan.location || 'Global Portfolio',
        });
        updateAssetCrestStore((prev) => ({
          ...prev,
          activityLogs: appendActivityLog(prev, {
            actorId: user.id,
            actorName: user.name,
            action: `Allocated to Real Estate plan (${plan.name})`,
            category: 'plan',
            detail: `$${amount.toFixed(2)}`,
          }),
        }));
        onNotify(`Allocated $${amount.toLocaleString('en-US')} to ${plan.name}.`, 'success');
      } catch {
        onNotify('Could not complete Real Estate allocation in Cloud.', 'error');
      }
      return;
    }

    const nowMs = Date.now();
    const newInv: ActiveInvestment = {
      id: nextRecordId('RE'),
      userId: user.id,
      category: 'Real Estate',
      planName: plan.name,
      amount,
      dailyRate: plan.dailyRate,
      durationDays: plan.durationDays,
      status: 'Active',
      startedAt: formatNowStamp(),
      startedAtMs: nowMs,
      lastAccrualMs: nowMs,
      payoutCyclesCompleted: 0,
      accruedProfit: 0,
      principalReturned: false,
      autoCompound: false,
      autoRoiEnabled: true,
      meta: plan.location || 'Global Portfolio',
    };

    const newTx: TransactionRecord = {
      id: nextRecordId('TX'),
      userId: user.id,
      type: 'Investment',
      method: `Real Estate Plan — ${plan.name}`,
      amount,
      status: 'Completed',
      date: formatNowStamp(),
    };

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === user.id
          ? { ...u, accountBalance: Number((u.accountBalance - amount).toFixed(2)) }
          : u
      ),
      investments: [newInv, ...prev.investments],
      transactions: [newTx, ...prev.transactions],
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Allocated to Real Estate plan (${plan.name})`,
        category: 'plan',
        detail: `$${amount.toFixed(2)}`,
      }),
    }));

    onNotify(`Allocated $${amount.toLocaleString('en-US')} to ${plan.name}.`, 'success');
  };

  return (
    <div className="space-y-5">
      <BreadcrumbHeader
        title="Real Estate Plan"
        crumb="Real Estate Plan"
        onDashboard={() => onNavigate('dashboard')}
      />

      {activeRealEstatePlans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          No active Real Estate funds are currently accepting new allocations. Existing holders continue earning scheduled ROI until maturity.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeRealEstatePlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-[#2b4865] dark:text-sky-400 flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {plan.sector || 'Managed Property Fund'}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {plan.location || 'Global Portfolio'}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono shrink-0">
                    {plan.dailyRate}/d
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>Monthly / Term Yield</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {plan.monthlyRate ? `${plan.monthlyRate}/mo · ` : ''}
                      {plan.annualized || `${plan.dailyRate}/day`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Occupancy Rate</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {plan.occupancy || '97.0%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lock Term</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {plan.durationDays} Days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min / Max</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                      ${plan.min.toLocaleString('en-US')} – ${plan.max.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min={plan.min}
                  max={plan.max}
                  value={amounts[plan.id] ?? String(plan.min)}
                  onChange={(e) => setAmounts((p) => ({ ...p, [plan.id]: e.target.value }))}
                  className="flex-1 min-w-0 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => handleSubscribeProperty(plan)}
                  className="bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium px-3.5 py-2 rounded cursor-pointer shrink-0"
                >
                  Allocate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeRealEstate.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Real Estate Portfolio &amp; Automatic ROI
          </h4>
          <div className="space-y-2">
            {activeRealEstate.map((item) => {
              const snap = getInvestmentRoiSnapshot(item);
              return (
                <div
                  key={item.id}
                  className="p-3 rounded border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{item.planName}</p>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          snap.isMatured
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {snap.isMatured ? 'Completed' : 'Auto ROI Active'}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {item.meta} · {item.dailyRate}/day · Cycle {snap.cyclesCompleted}/{item.durationDays} · Accrued +$
                      {snap.earnedSoFar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-[#2b4865] dark:text-sky-400">
                    ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. ACCOUNT PROFILE, AVATAR, JOINT SETTINGS & CHANGE PASSWORD + KYC VIEW
// ============================================================================
export function AccountProfileView({
  user,
  isCloudMode = false,
  onNavigate,
  onNotify,
}: CommonViewProps) {
  const [fullName, setFullName] = useState(user.name);
  const [accountType, setAccountType] = useState(user.accountType);
  const [coOwnerName, setCoOwnerName] = useState(user.jointDetails?.coOwnerName || '');
  const [coOwnerEmail, setCoOwnerEmail] = useState(user.jointDetails?.coOwnerEmail || '');
  const [relationship, setRelationship] = useState(user.jointDetails?.relationship || 'Spouse');
  const [authMode, setAuthMode] = useState<'Either Owner' | 'Dual Notice'>(
    user.jointDetails?.authorizationMode || 'Either Owner'
  );

  // Change Password (Local Mode)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onNotify('Please upload a valid PNG/JPG/WEBP image.', 'error');
      return;
    }
    try {
      const dataUrl = await readAndCompressFile(file, 180, 100000);
      if (isCloudMode) {
        await cloudUpdateAvatar(user.id, dataUrl);
        onNotify('Profile picture synced to Cloud.', 'success');
        return;
      }
      updateAssetCrestStore((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === user.id ? { ...u, avatarDataUrl: dataUrl } : u)),
      }));
      onNotify('Profile picture updated.', 'success');
    } catch {
      onNotify('Failed to upload profile photo.', 'error');
    }
  };

  const handleRemoveAvatar = async () => {
    if (isCloudMode) {
      try {
        await cloudUpdateAvatar(user.id, undefined);
        onNotify('Profile picture removed from Cloud.', 'info');
      } catch {
        onNotify('Could not remove profile photo.', 'error');
      }
      return;
    }
    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === user.id ? { ...u, avatarDataUrl: undefined } : u)),
    }));
    onNotify('Profile picture removed.', 'info');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      onNotify('Full name cannot be empty.', 'error');
      return;
    }
    if (accountType === 'Joint' && (!coOwnerName.trim() || !coOwnerEmail.trim())) {
      onNotify('Please complete co-owner name and email for your Joint Account.', 'error');
      return;
    }

    if (isCloudMode) {
      try {
        await cloudUpdateProfileAndJoint({
          uid: user.id,
          referralCode: user.referralCode,
          email: user.email,
          displayName: fullName,
          accountType,
          coOwnerName,
          coOwnerEmail,
          relationship,
          authorizationMode: authMode,
        });
        onNotify('Account details saved to Cloud.', 'success');
      } catch {
        onNotify('Could not save profile changes to Cloud.', 'error');
      }
      return;
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === user.id
          ? {
              ...u,
              name: fullName.trim(),
              accountType,
              jointDetails:
                accountType === 'Joint'
                  ? {
                      coOwnerName: coOwnerName.trim(),
                      coOwnerEmail: coOwnerEmail.trim().toLowerCase(),
                      relationship,
                      authorizationMode: authMode,
                    }
                  : undefined,
            }
          : u
      ),
    }));
    onNotify('Account details saved.', 'success');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      onNotify('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify('New passwords do not match.', 'error');
      return;
    }

    if (isCloudMode) {
      try {
        await cloudChangePassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onNotify('Password updated in Neon Cloud.', 'success');
      } catch (err: any) {
        onNotify(err?.message || 'Could not update password.', 'error');
      }
      return;
    }

    if (currentPassword !== user.password) {
      onNotify('Current password is incorrect.', 'error');
      return;
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === user.id ? { ...u, password: newPassword } : u
      ),
    }));

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onNotify('Password changed successfully.', 'success');
  };

  return (
    <div className="space-y-5">
      <BreadcrumbHeader
        title="Profile & Security"
        crumb="Profile & Security"
        onDashboard={() => onNavigate('dashboard')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile Photo + Account Ownership */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4"
        >
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-16 w-16 rounded-full bg-[#2b4865] text-white font-bold text-xl flex items-center justify-center overflow-hidden shrink-0">
              {user.avatarDataUrl ? (
                <Image
                  src={user.avatarDataUrl}
                  alt={user.name}
                  width={64}
                  height={64}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 object-cover"
                />
              ) : (
                <span>{user.name[0]?.toUpperCase() || 'A'}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium px-3 py-1.5 rounded inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Profile Picture</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                {user.avatarDataUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Account Ownership Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setAccountType('Individual')}
                className={`py-2 px-3 rounded border text-xs font-semibold cursor-pointer ${
                  accountType === 'Individual'
                    ? 'border-[#2b4865] bg-[#2b4865]/10 text-[#2b4865] dark:border-sky-400 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Individual Account
              </button>
              <button
                type="button"
                onClick={() => setAccountType('Joint')}
                className={`py-2 px-3 rounded border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  accountType === 'Joint'
                    ? 'border-[#2b4865] bg-[#2b4865]/10 text-[#2b4865] dark:border-sky-400 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Joint Account
              </button>
            </div>
          </div>

          {accountType === 'Joint' && (
            <div className="p-3.5 rounded-md bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-2.5">
              <p className="text-xs font-bold text-[#2b4865] dark:text-sky-300">
                Joint Co-Owner Configuration
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={coOwnerName}
                  onChange={(e) => setCoOwnerName(e.target.value)}
                  placeholder="Co-Owner Name"
                  className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                />
                <input
                  type="email"
                  value={coOwnerEmail}
                  onChange={(e) => setCoOwnerEmail(e.target.value)}
                  placeholder="Co-Owner Email"
                  className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                />
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Business Partner">Business Partner</option>
                  <option value="Family Member">Family Member</option>
                  <option value="Co-Trustee">Trust Co-Trustee</option>
                </select>
                <select
                  value={authMode}
                  onChange={(e) => setAuthMode(e.target.value as 'Either Owner' | 'Dual Notice')}
                  className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="Either Owner">Either Owner Can Transact</option>
                  <option value="Dual Notice">Dual Owner Notification</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium px-4 py-2.5 rounded-md cursor-pointer"
          >
            Save Profile Settings
          </button>
        </form>

        {/* Change Password & Neon Cloud Security */}
        <div className="space-y-4">
          {isCloudMode && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Cloud className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Neon Cloud Database Active
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your session ({user.email}) is backed by <strong>Neon PostgreSQL</strong> with encrypted credentials and multi-device synchronization.
              </p>
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                <p className="font-semibold">Cloud Transfer Referral ID: {user.referralCode}</p>
                <p className="text-[11px]">
                  All deposits, KYC approvals, swaps, investments, and P2P transfers persist in Neon PostgreSQL across devices.
                </p>
              </div>
            </div>
          )}
          <form
            onSubmit={handleChangePassword}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <KeyRound className="h-4 w-4 text-[#2b4865] dark:text-sky-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Change Password</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                New Password (min 8 characters)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="bg-[#2b4865] hover:bg-[#223a52] text-white text-xs font-medium px-4 py-2.5 rounded-md cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. KYC VERIFICATION PORTAL (STRICT GATE FOR WITHDRAWALS)
// ============================================================================
export function KycVerificationView({
  user,
  isCloudMode = false,
  onNavigate,
  onNotify,
}: CommonViewProps) {
  const [legalName, setLegalName] = useState(user.kycSubmission?.legalName || user.name);
  const [country, setCountry] = useState(user.kycSubmission?.country || 'United Kingdom');
  const [docType, setDocType] = useState<'Passport' | 'National ID' | 'Driver License'>(
    user.kycSubmission?.documentType || 'Passport'
  );
  const [docNumber, setDocNumber] = useState(user.kycSubmission?.documentNumber || '');
  const [idFrontDataUrl, setIdFrontDataUrl] = useState(user.kycSubmission?.idFrontDataUrl || '');
  const [idFrontName, setIdFrontName] = useState(user.kycSubmission?.idFrontName || '');
  const [selfieDataUrl, setSelfieDataUrl] = useState(user.kycSubmission?.selfieDataUrl || '');
  const [selfieName, setSelfieName] = useState(user.kycSubmission?.selfieName || '');

  const handleUploadDoc = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'front' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onNotify('Please select an image file (JPG/PNG).', 'error');
      return;
    }
    try {
      const compressed = await readAndCompressFile(file, 480, 220000);
      if (kind === 'front') {
        setIdFrontDataUrl(compressed);
        setIdFrontName(file.name);
      } else {
        setSelfieDataUrl(compressed);
        setSelfieName(file.name);
      }
    } catch {
      onNotify('Failed to process uploaded verification image.', 'error');
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName.trim() || !country.trim() || !docNumber.trim()) {
      onNotify('Please complete all legal identity fields.', 'error');
      return;
    }
    if (!idFrontName || !selfieName) {
      onNotify('Please upload both your government ID image and verification selfie.', 'error');
      return;
    }

    const submission: KycSubmission = {
      legalName: legalName.trim(),
      country: country.trim(),
      documentType: docType,
      documentNumber: docNumber.trim(),
      idFrontDataUrl,
      idFrontName,
      selfieDataUrl,
      selfieName,
      submittedAt: formatNowStamp(),
    };

    if (isCloudMode) {
      try {
        await cloudSubmitKyc({ uid: user.id, submission });
        updateAssetCrestStore((prev) => ({
          ...prev,
          activityLogs: appendActivityLog(prev, {
            actorId: user.id,
            actorName: user.name,
            action: 'Submitted KYC verification documents',
            category: 'kyc',
            detail: `${submission.documentType} · ${submission.country}`,
          }),
        }));
        onNotify('KYC documents submitted to Cloud. Withdrawals unlock once Admin approves.', 'success');
      } catch {
        onNotify('Failed to submit KYC to Cloud.', 'error');
      }
      return;
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === user.id ? { ...u, kycStatus: 'Pending', kycSubmission: submission } : u
      ),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: 'Submitted KYC verification documents',
        category: 'kyc',
        detail: `${submission.documentType} · ${submission.country}`,
      }),
    }));

    onNotify('KYC documents submitted. Withdrawals will unlock once Admin approves.', 'success');
  };

  return (
    <div className="space-y-5">
      <BreadcrumbHeader
        title="KYC Verification"
        crumb="KYC Verification"
        onDashboard={() => onNavigate('dashboard')}
      />

      {/* Current Status Banner */}
      <div
        className={`rounded-md border p-4 flex flex-wrap items-center justify-between gap-3 ${
          user.kycStatus === 'Approved'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : user.kycStatus === 'Pending'
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            : user.kycStatus === 'Rejected'
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {user.kycStatus === 'Approved' ? (
            <ShieldCheck className="h-6 w-6 shrink-0" />
          ) : user.kycStatus === 'Pending' ? (
            <Clock className="h-6 w-6 shrink-0" />
          ) : (
            <ShieldAlert className="h-6 w-6 shrink-0" />
          )}
          <div className="text-xs">
            <p className="font-bold text-sm">KYC Status: {user.kycStatus}</p>
            <p>
              {user.kycStatus === 'Approved'
                ? 'Your identity is verified. Withdrawals are unlocked on your account.'
                : user.kycStatus === 'Pending'
                ? 'Your documents are awaiting strict Admin approval before withdrawals unlock.'
                : user.kycStatus === 'Rejected'
                ? `Rejected: ${user.kycSubmission?.adminNote || 'Please re-submit clear documents.'}`
                : 'Submit your government ID and selfie below. Strict Admin approval is required before making withdrawals.'}
            </p>
          </div>
        </div>
        {user.kycStatus === 'Approved' && (
          <button
            type="button"
            onClick={() => onNavigate('withdraw')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded cursor-pointer"
          >
            Go to Withdraw
          </button>
        )}
      </div>

      {user.kycStatus !== 'Approved' && (
        <form
          onSubmit={handleSubmitKyc}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Full Legal Name (matching ID)
              </label>
              <input
                type="text"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Country of Residence
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) =>
                  setDocType(e.target.value as 'Passport' | 'National ID' | 'Driver License')
                }
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              >
                <option value="Passport">International Passport</option>
                <option value="National ID">National Identity Card</option>
                <option value="Driver License">Driver License</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Document Number
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. P92837102"
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="p-4 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-[#2b4865]">
              <Upload className="h-5 w-5 text-[#2b4865] dark:text-sky-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {idFrontName ? `ID Uploaded: ${idFrontName}` : 'Upload Government ID Photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadDoc(e, 'front')}
                className="hidden"
              />
            </label>

            <label className="p-4 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-[#2b4865]">
              <UserCheck className="h-5 w-5 text-[#2b4865] dark:text-sky-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {selfieName ? `Selfie Uploaded: ${selfieName}` : 'Upload Selfie Holding ID'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadDoc(e, 'selfie')}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            className="bg-[#2b4865] hover:bg-[#223a52] text-white text-sm font-medium px-5 py-2.5 rounded-md cursor-pointer"
          >
            {user.kycStatus === 'Pending' ? 'Update Pending KYC Submission' : 'Submit KYC for Admin Approval'}
          </button>
        </form>
      )}
    </div>
  );
}


