'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { OfficialLogoMark } from '@/src/backend/components/OfficialLogo';
import {
  Activity,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  Ban,
  BarChart3,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  Compass,
  Copy,
  CreditCard,
  Download,
  Eye,
  Globe,
  Home,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Moon,
  MoreVertical,
  Package,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  TrendingUp,
  Unlock,
  UserCheck,
  UserX,
  Users,
  Wallet,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import {
  type ActiveInvestment,
  appendActivityLog,
  type AssetCrestStore,
  captureVisitorLocationForAdmin,
  type CryptoWalletRecord,
  DEFAULT_INVESTMENT_PLANS,
  formatNowStamp,
  type InvestmentPlanConfig,
  nextRecordId,
  type PlatformSettings,
  setThemeMode,
  STANDARD_PLAN_FEATURES,
  type TransactionRecord,
  updateAssetCrestStore,
  type UserAccount,
  useThemeMode,
  type WalletStatus,
} from '@/src/backend/lib/assetcrest-store';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  cloudAdminAdjustUserFunds,
  cloudAdminApproveDeposit,
  cloudAdminApproveWithdrawal,
  cloudAdminDeclineDeposit,
  cloudAdminDeclineWithdrawal,
  cloudAdminToggleUserStatus,
  cloudDeleteCryptoWallet,
  cloudLogVisitorLocation,
  cloudSaveCryptoWallet,
  cloudSettleRoiPlan,
  cloudToggleInvestmentSettings,
  queuePendingLocationLog,
  signOutCloud,
} from '@/src/backend/lib/neon-client';
import {
  applyRoiSettlementToStore,
  computeRoiSettlementPlan,
  formatCountdown,
  getInvestmentRoiSnapshot,
} from '@/src/backend/lib/roi-engine';
import { AdminAutomationPanel } from '@/src/backend/components/AdminAutomationPanel';

export type AdminSection =
  | 'dashboard'
  | 'plans'
  | 'roi'
  | 'users-all'
  | 'users-active'
  | 'users-blocked'
  | 'sessions'
  | 'deposits'
  | 'wallets'
  | 'withdrawals'
  | 'transactions'
  | 'kyc'
  | 'settings'
  | 'automation'
  | 'platform';

export function parseAdminSectionFromPath(pathname: string): AdminSection {
  const p = pathname.toLowerCase();
  if (p.startsWith('/admin/plans') || p.startsWith('/app/admin/plans')) return 'plans';
  if (p.startsWith('/admin/roi') || p.startsWith('/app/admin/roi')) return 'roi';
  if (p.startsWith('/admin/users/active') || p.startsWith('/app/admin/users/active')) return 'users-active';
  if (p.startsWith('/admin/users/blocked') || p.startsWith('/app/admin/users/blocked')) return 'users-blocked';
  if (p.startsWith('/admin/users') || p.startsWith('/app/admin/users')) return 'users-all';
  if (p.startsWith('/admin/sessions') || p.startsWith('/app/admin/sessions')) return 'sessions';
  if (p.startsWith('/admin/deposits') || p.startsWith('/app/admin/deposits')) return 'deposits';
  if (p.startsWith('/admin/wallets') || p.startsWith('/app/admin/wallets')) return 'wallets';
  if (p.startsWith('/admin/withdrawals') || p.startsWith('/app/admin/withdrawals')) return 'withdrawals';
  if (p.startsWith('/admin/transactions') || p.startsWith('/app/admin/transactions')) return 'transactions';
  if (p.startsWith('/admin/kyc') || p.startsWith('/app/admin/kyc')) return 'kyc';
  if (p.startsWith('/admin/automation') || p.startsWith('/app/admin/automation')) return 'automation';
  if (p.startsWith('/admin/settings') || p.startsWith('/app/admin/settings')) return 'settings';
  if (p.startsWith('/admin/platform') || p.startsWith('/app/admin/platform')) return 'platform';
  return 'dashboard';
}

export function getPathForAdminSection(section: AdminSection): string {
  switch (section) {
    case 'dashboard':
      return '/admin/dashboard';
    case 'users-all':
      return '/admin/users';
    case 'users-active':
      return '/admin/users/active';
    case 'users-blocked':
      return '/admin/users/blocked';
    default:
      return `/admin/${section}`;
  }
}

interface AdminConsoleShellProps {
  user: UserAccount;
  store: AssetCrestStore;
  isCloudMode: boolean;
  initialSection?: AdminSection;
  onExitAdmin: () => void;
  onSignOut: () => void;
  onOpenAuthModal: () => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
  onInspectReceipt: (tx: TransactionRecord) => void;
  onInspectKyc: (target: UserAccount) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function AdminConsoleShell({
  user,
  store,
  isCloudMode,
  initialSection = 'dashboard',
  onExitAdmin,
  onSignOut,
  onOpenAuthModal,
  onNotify,
  onInspectReceipt,
  onInspectKyc,
}: AdminConsoleShellProps) {
  const theme = useThemeMode();
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [investmentMenuOpen, setInvestmentMenuOpen] = useState(true);
  const [usersMenuOpen, setUsersMenuOpen] = useState(true);

  // Dashboard filters & chart state
  const currentYearStr = String(new Date().getFullYear());
  const availableYears = useMemo(() => {
    const years = new Set<string>([currentYearStr]);
    store.users.forEach((u) => {
      if (u.createdAt && u.createdAt.length >= 4) years.add(u.createdAt.slice(0, 4));
    });
    store.transactions.forEach((t) => {
      if (t.date && t.date.length >= 4) years.add(t.date.slice(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [store.users, store.transactions, currentYearStr]);

  const [usersChartYear, setUsersChartYear] = useState<string>(currentYearStr);
  const [txChartYear, setTxChartYear] = useState<string>(currentYearStr);
  const [txChartFilter, setTxChartFilter] = useState<'All' | 'Deposit' | 'Withdrawal' | 'Investment'>('All');

  // Plans management state
  const [planBannerVisible, setPlanBannerVisible] = useState(true);
  const [planCategoryFilter, setPlanCategoryFilter] = useState<'All' | 'Standard' | 'Vacation' | 'Real Estate'>('All');
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlanCategory, setNewPlanCategory] = useState<'Standard' | 'Vacation' | 'Real Estate'>('Standard');
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanRate, setNewPlanRate] = useState('1.36%');
  const [newPlanDays, setNewPlanDays] = useState('30');
  const [newPlanMin, setNewPlanMin] = useState('200');
  const [newPlanMax, setNewPlanMax] = useState('4999');
  const [newPlanActive, setNewPlanActive] = useState(true);
  const [newPlanMeta, setNewPlanMeta] = useState('');

  // Users management state
  const [userSearch, setUserSearch] = useState('');
  const [inspectedUser, setInspectedUser] = useState<UserAccount | null>(null);
  const [editBalanceInput, setEditBalanceInput] = useState('');
  const [editProfitInput, setEditProfitInput] = useState('');
  const [editBonusInput, setEditBonusInput] = useState('');

  // Queues & transactions filters
  const [depositFilter, setDepositFilter] = useState<'All' | 'Pending' | 'Completed' | 'Cancelled'>('All');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'All' | 'Pending' | 'Completed' | 'Cancelled'>('All');
  const [kycFilter, setKycFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('All');
  const [txStatusFilter, setTxStatusFilter] = useState<'All' | 'Completed' | 'Pending' | 'Cancelled'>('All');
  const [activitySearch, setActivitySearch] = useState('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<PlatformSettings>(store.platformSettings);
  useEffect(() => {
    setSettingsForm(store.platformSettings);
  }, [store.platformSettings]);

  // Crypto Wallets management state
  const [walletSearch, setWalletSearch] = useState('');
  const [walletCryptoFilter, setWalletCryptoFilter] = useState<string>('All');
  const [walletStatusFilter, setWalletStatusFilter] = useState<'All' | WalletStatus>('All');
  const [copiedWalletId, setCopiedWalletId] = useState<string | null>(null);
  const [confirmDeleteWalletId, setConfirmDeleteWalletId] = useState<string | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [walletPresetCrypto, setWalletPresetCrypto] = useState<string>('Bitcoin');
  const [walletCustomCrypto, setWalletCustomCrypto] = useState('');
  const [walletSymbolInput, setWalletSymbolInput] = useState('BTC');
  const [walletNetworkInput, setWalletNetworkInput] = useState('BTC Mainnet');
  const [walletAddressInput, setWalletAddressInput] = useState('');
  const [walletLabelInput, setWalletLabelInput] = useState('');
  const [walletStatusInput, setWalletStatusInput] = useState<WalletStatus>('Active');
  const [walletMinDepositInput, setWalletMinDepositInput] = useState('50');
  const [walletMaxDepositInput, setWalletMaxDepositInput] = useState('250000');
  const [walletInstructionsInput, setWalletInstructionsInput] = useState('');
  const [walletAssignScope, setWalletAssignScope] = useState<'global' | 'specific'>('global');
  const [walletAssignedUserIds, setWalletAssignedUserIds] = useState<string[]>([]);
  const [walletUserSearch, setWalletUserSearch] = useState('');

  // Live ROI Engine clock
  const [roiClockMs, setRoiClockMs] = useState<number>(() => Date.now());
  useEffect(() => {
    if (section !== 'roi' && section !== 'dashboard') return;
    const timer = window.setInterval(() => setRoiClockMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [section]);

  // Live computed metrics (strictly from real records)
  const totalUsersCount = store.users.length;
  const blockedUsersCount = store.users.filter((u) => u.accountStatus === 'Blocked').length;
  const activeUsersCount = totalUsersCount - blockedUsersCount;

  const activeInvestments = store.investments.filter((i) => i.status === 'Active');
  const depositTransactions = store.transactions.filter((t) => t.type === 'Deposit');
  const withdrawalTransactions = store.transactions.filter((t) => t.type === 'Withdrawal');
  const kycUsers = store.users.filter((u) => u.kycSubmission || u.kycStatus !== 'Unverified');

  const totalDepositsUsd = depositTransactions
    .filter((t) => t.status === 'Completed')
    .reduce((acc, t) => acc + t.amount, 0);
  const pendingDepositsUsd = depositTransactions
    .filter((t) => t.status === 'Pending')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalWithdrawalsUsd = withdrawalTransactions
    .filter((t) => t.status === 'Completed')
    .reduce((acc, t) => acc + t.amount, 0);
  const pendingWithdrawalsUsd = withdrawalTransactions
    .filter((t) => t.status === 'Pending')
    .reduce((acc, t) => acc + t.amount, 0);

  // Monthly user registrations for selected year
  const monthlyUsersCounts = useMemo(() => {
    const counts = new Array(12).fill(0) as number[];
    store.users.forEach((u) => {
      if (!u.createdAt || !u.createdAt.startsWith(usersChartYear)) return;
      const monthIdx = parseInt(u.createdAt.slice(5, 7), 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) counts[monthIdx] += 1;
    });
    return counts;
  }, [store.users, usersChartYear]);

  const maxMonthlyUsers = Math.max(1, ...monthlyUsersCounts);

  // Transactions in $ breakdown from real records
  const txChartSeries = useMemo(() => {
    const yearTxs = store.transactions.filter((t) => !t.date || t.date.startsWith(txChartYear));
    const processedDeposits = yearTxs
      .filter((t) => t.type === 'Deposit' && t.status === 'Completed')
      .reduce((s, t) => s + t.amount, 0);
    const processedWithdrawals = yearTxs
      .filter((t) => t.type === 'Withdrawal' && t.status === 'Completed')
      .reduce((s, t) => s + t.amount, 0);
    const totalInvestments = yearTxs
      .filter((t) => t.type === 'Investment')
      .reduce((s, t) => s + t.amount, 0);

    const points = [
      { label: 'Processed Deposits', value: processedDeposits, type: 'Deposit' },
      { label: 'Withdrawals', value: processedWithdrawals, type: 'Withdrawal' },
      { label: 'Investments', value: totalInvestments, type: 'Investment' },
    ];
    return txChartFilter === 'All'
      ? points
      : points.filter((p) => p.type === txChartFilter);
  }, [store.transactions, txChartYear, txChartFilter]);

  const maxTxChartVal = Math.max(100, ...txChartSeries.map((p) => p.value));

  const topInvestments = useMemo(() => {
    return [...store.investments]
      .sort((a, b) => b.amount + (b.accruedProfit ?? 0) - (a.amount + (a.accruedProfit ?? 0)))
      .slice(0, 6);
  }, [store.investments]);

  // Guard non-admin accounts (kept after all hooks to preserve hook order)
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 max-w-md w-full text-center space-y-4">
          <Lock className="h-9 w-9 mx-auto text-amber-500" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Administrator Access Required
          </h2>
          {isCloudMode ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Admin controls are restricted to the verified AssetCrest operator account
              {BOOTSTRAPPED_ADMIN_EMAIL ? (
                <>
                  {' '}(<strong className="font-mono">{BOOTSTRAPPED_ADMIN_EMAIL}</strong>)
                </>
              ) : null}
              .
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sign in with a verified administrator account to unlock the Admin Console Shell.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={onExitAdmin}
              className="border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium px-4 py-2 rounded-md cursor-pointer"
            >
              Back to Investor Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navigateSection = (next: AdminSection) => {
    setSection(next);
    setMobileNavOpen(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', getPathForAdminSection(next));
    }
  };

  const openUserInspector = (target: UserAccount) => {
    setInspectedUser(target);
    setEditBalanceInput(String(target.accountBalance));
    setEditProfitInput(String(target.totalProfit));
    setEditBonusInput(String(target.bonus));
  };

  // --- Admin Action Handlers ---
  const handleApproveDeposit = async (tx: TransactionRecord) => {
    if (tx.status === 'Completed') return;
    if (isCloudMode) {
      const targetUser = store.users.find((u) => u.id === tx.userId);
      if (!targetUser) {
        onNotify('Target user profile not loaded yet.', 'error');
        return;
      }
      try {
        await cloudAdminApproveDeposit(tx, targetUser);
        updateAssetCrestStore((prev) => ({
          ...prev,
          activityLogs: appendActivityLog(prev, {
            actorId: user.id,
            actorName: user.name,
            action: `Credited deposit ${tx.id}`,
            category: 'deposit',
            detail: `$${tx.amount.toFixed(2)} for ${targetUser.name}`,
          }),
        }));
        onNotify(`Approved deposit ${tx.id} and credited $${tx.amount.toLocaleString('en-US')}.`, 'success');
      } catch {
        onNotify('Failed to approve deposit in Cloud.', 'error');
      }
      return;
    }

    const owner = store.users.find((u) => u.id === tx.userId);
    updateAssetCrestStore((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === tx.id ? { ...t, status: 'Completed' } : t
      ),
      users: prev.users.map((u) =>
        u.id === tx.userId
          ? {
              ...u,
              accountBalance: Number((u.accountBalance + tx.amount).toFixed(2)),
              totalDeposit: Number((u.totalDeposit + tx.amount).toFixed(2)),
            }
          : u
      ),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Credited deposit ${tx.id}`,
        category: 'deposit',
        detail: `$${tx.amount.toFixed(2)} for ${owner?.name || tx.userId}`,
      }),
    }));
    onNotify(`Approved deposit ${tx.id} and credited $${tx.amount.toLocaleString('en-US')}.`, 'success');
  };

  const handleRejectDeposit = async (tx: TransactionRecord) => {
    if (tx.status !== 'Pending') return;
    if (isCloudMode) {
      try {
        await cloudAdminDeclineDeposit(tx);
        updateAssetCrestStore((prev) => ({
          ...prev,
          activityLogs: appendActivityLog(prev, {
            actorId: user.id,
            actorName: user.name,
            action: `Declined deposit ${tx.id}`,
            category: 'deposit',
            detail: `$${tx.amount.toFixed(2)}`,
          }),
        }));
        onNotify(`Cancelled deposit ${tx.id}.`, 'info');
      } catch {
        onNotify('Failed to cancel deposit in Cloud.', 'error');
      }
      return;
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === tx.id ? { ...t, status: 'Cancelled' } : t
      ),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Declined deposit ${tx.id}`,
        category: 'deposit',
        detail: `$${tx.amount.toFixed(2)}`,
      }),
    }));
    onNotify(`Cancelled deposit ${tx.id}.`, 'info');
  };

  const handleApproveWithdrawal = async (tx: TransactionRecord) => {
    if (tx.status !== 'Pending') return;
    if (isCloudMode) {
      try {
        await cloudAdminApproveWithdrawal(tx);
        updateAssetCrestStore((prev) => ({
          ...prev,
          activityLogs: appendActivityLog(prev, {
            actorId: user.id,
            actorName: user.name,
            action: `Approved withdrawal ${tx.id}`,
            category: 'withdrawal',
            detail: `$${tx.amount.toFixed(2)}`,
          }),
        }));
        onNotify(`Approved withdrawal ${tx.id} ($${tx.amount.toLocaleString('en-US')}).`, 'success');
      } catch {
        onNotify('Failed to approve withdrawal in Cloud.', 'error');
      }
      return;
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === tx.id ? { ...t, status: 'Completed' } : t
      ),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Approved withdrawal ${tx.id}`,
        category: 'withdrawal',
        detail: `$${tx.amount.toFixed(2)}`,
      }),
    }));
    onNotify(`Approved withdrawal ${tx.id} ($${tx.amount.toLocaleString('en-US')}).`, 'success');
  };

  const handleDeclineWithdrawal = async (tx: TransactionRecord) => {
    if (tx.status !== 'Pending') return;
    if (isCloudMode) {
      const targetUser = store.users.find((u) => u.id === tx.userId);
      if (!targetUser) {
        onNotify('Target user profile not found.', 'error');
        return;
      }
      try {
        await cloudAdminDeclineWithdrawal(tx, targetUser);
        updateAssetCrestStore((prev) => ({
          ...prev,
          activityLogs: appendActivityLog(prev, {
            actorId: user.id,
            actorName: user.name,
            action: `Refunded declined withdrawal ${tx.id}`,
            category: 'withdrawal',
            detail: `$${tx.amount.toFixed(2)} returned to ${targetUser.name}`,
          }),
        }));
        onNotify(`Declined withdrawal ${tx.id} and refunded $${tx.amount.toLocaleString('en-US')} to user balance.`, 'info');
      } catch {
        onNotify('Failed to refund withdrawal in Cloud.', 'error');
      }
      return;
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === tx.id ? { ...t, status: 'Cancelled' } : t
      ),
      users: prev.users.map((u) =>
        u.id === tx.userId
          ? { ...u, accountBalance: Number((u.accountBalance + tx.amount).toFixed(2)) }
          : u
      ),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Refunded declined withdrawal ${tx.id}`,
        category: 'withdrawal',
        detail: `$${tx.amount.toFixed(2)}`,
      }),
    }));
    onNotify(`Declined withdrawal ${tx.id} and refunded $${tx.amount.toLocaleString('en-US')} to user balance.`, 'info');
  };

  const handleToggleUserStatus = async (target: UserAccount) => {
    if (target.id === user.id) {
      onNotify('You cannot block your active administrator session.', 'error');
      return;
    }
    const nextStatus = target.accountStatus === 'Blocked' ? 'Active' : 'Blocked';
    if (isCloudMode) {
      try {
        await cloudAdminToggleUserStatus(target.id, nextStatus);
      } catch {
        onNotify('Failed to update user status in Cloud.', 'error');
        return;
      }
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === target.id ? { ...u, accountStatus: nextStatus } : u
      ),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `${nextStatus === 'Blocked' ? 'Blocked' : 'Unblocked'} user account`,
        category: 'user',
        detail: `${target.name} (${target.email})`,
      }),
    }));
    if (inspectedUser?.id === target.id) {
      setInspectedUser({ ...target, accountStatus: nextStatus });
    }
    onNotify(
      `${target.name} is now ${nextStatus}.`,
      nextStatus === 'Blocked' ? 'info' : 'success'
    );
  };

  const handleSaveUserAdjustments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedUser) return;
    const nextBal = Math.max(0, Number(editBalanceInput) || 0);
    const nextProf = Math.max(0, Number(editProfitInput) || 0);
    const nextBonus = Math.max(0, Number(editBonusInput) || 0);

    if (isCloudMode) {
      try {
        await cloudAdminAdjustUserFunds({
          targetUid: inspectedUser.id,
          accountBalance: nextBal,
          totalProfit: nextProf,
          bonus: nextBonus,
          note: `Admin adjustment by ${user.name}`,
        });
      } catch {
        onNotify('Failed to adjust user balances in Cloud.', 'error');
        return;
      }
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === inspectedUser.id
          ? {
              ...u,
              accountBalance: Number(nextBal.toFixed(2)),
              totalProfit: Number(nextProf.toFixed(2)),
              bonus: Number(nextBonus.toFixed(2)),
            }
          : u
      ),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: 'Adjusted member balances',
        category: 'user',
        detail: `${inspectedUser.name} · Bal $${nextBal.toFixed(2)}, Profit $${nextProf.toFixed(2)}`,
      }),
    }));
    setInspectedUser({
      ...inspectedUser,
      accountBalance: Number(nextBal.toFixed(2)),
      totalProfit: Number(nextProf.toFixed(2)),
      bonus: Number(nextBonus.toFixed(2)),
    });
    onNotify(`Updated balances for ${inspectedUser.name}.`, 'success');
  };

  const openCreatePlanModal = () => {
    setEditingPlanId(null);
    setNewPlanCategory('Standard');
    setNewPlanName('');
    setNewPlanRate('1.36%');
    setNewPlanDays('30');
    setNewPlanMin('200');
    setNewPlanMax('4999');
    setNewPlanActive(true);
    setNewPlanMeta('');
    setAddPlanOpen(true);
  };

  const openEditPlanModal = (plan: InvestmentPlanConfig) => {
    setEditingPlanId(plan.id);
    setNewPlanCategory(plan.category);
    setNewPlanName(plan.name);
    setNewPlanRate(plan.dailyRate);
    setNewPlanDays(String(plan.durationDays));
    setNewPlanMin(String(plan.min));
    setNewPlanMax(String(plan.max));
    setNewPlanActive(plan.isActive);
    setNewPlanMeta(plan.destination || plan.location || plan.batchLabel || '');
    setAddPlanOpen(true);
  };

  const handleSyncFrontendPlans = () => {
    updateAssetCrestStore((prev) => {
      const customPlans = prev.investmentPlans.filter(
        (p) => !DEFAULT_INVESTMENT_PLANS.some((d) => d.id === p.id)
      );
      return {
        ...prev,
        investmentPlans: [...DEFAULT_INVESTMENT_PLANS, ...customPlans],
        activityLogs: appendActivityLog(prev, {
          actorId: user.id,
          actorName: user.name,
          action: 'Synced investment plans to live frontend figures',
          category: 'plan',
          detail: `${DEFAULT_INVESTMENT_PLANS.length} frontend plans synchronized`,
        }),
      };
    });
    onNotify('Plans synchronized with live AssetCrest frontend specifications.', 'success');
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = Number(newPlanMin) || 0;
    const maxVal = Number(newPlanMax) || 0;
    const isPremiumPlan = editingPlanId === 'premium' || (newPlanCategory === 'Standard' && newPlanName.trim().toLowerCase() === 'premium');
    const effectiveMaxVal = isPremiumPlan ? 499999 : maxVal;
    const daysVal = Math.max(1, Math.round(Number(newPlanDays) || 30));
    const rateNum = parseFloat(newPlanRate.replace('%', '')) || 0;

    if (!newPlanName.trim() || rateNum <= 0 || minVal <= 0 || effectiveMaxVal < minVal) {
      onNotify('Provide a valid plan name, positive daily ROI %, and min/max range.', 'error');
      return;
    }

    const formattedRate = `${rateNum.toFixed(2)}%`;
    const computedMonthly = `${(rateNum * 30).toFixed(1)}%`;
    const refPct = store.platformSettings.referralBonusPct || 5;

    if (editingPlanId) {
      updateAssetCrestStore((prev) => ({
        ...prev,
        investmentPlans: prev.investmentPlans.map((p) =>
          p.id === editingPlanId
            ? {
                ...p,
                name: newPlanName.trim(),
                category: newPlanCategory,
                price: minVal,
                dailyRate: formattedRate,
                monthlyRate: computedMonthly,
                referralBonusPct: p.referralBonusPct ?? refPct,
                durationDays: daysVal,
                min: minVal,
                max: effectiveMaxVal,
                isActive: newPlanActive,
                destination:
                  newPlanCategory === 'Vacation'
                    ? newPlanMeta.trim() || p.destination || 'Any War-Free City or State of Preference'
                    : undefined,
                location:
                  newPlanCategory === 'Real Estate'
                    ? newPlanMeta.trim() || p.location || 'Global Portfolio'
                    : undefined,
                annualized:
                  newPlanCategory === 'Real Estate'
                    ? `${(rateNum * daysVal).toFixed(1)}% Term Yield (${daysVal}d)`
                    : undefined,
              }
            : p
        ),
        activityLogs: appendActivityLog(prev, {
          actorId: user.id,
          actorName: user.name,
          action: `Updated ${newPlanCategory} plan`,
          category: 'plan',
          detail: `${newPlanName.trim()} · ${formattedRate}/day (${computedMonthly}/mo) · ${minVal.toLocaleString('en-US')}–${effectiveMaxVal.toLocaleString('en-US')}`,
        }),
      }));
      setEditingPlanId(null);
      setNewPlanName('');
      setNewPlanMeta('');
      setAddPlanOpen(false);
      onNotify(`Investment plan "${newPlanName.trim()}" updated.`, 'success');
      return;
    }

    const newPlan: InvestmentPlanConfig = {
      id: nextRecordId('PLN').toLowerCase(),
      name: newPlanName.trim(),
      category: newPlanCategory,
      price: minVal,
      dailyRate: formattedRate,
      monthlyRate: computedMonthly,
      referralBonusPct: refPct,
      durationDays: daysVal,
      min: minVal,
      max: maxVal,
      isActive: newPlanActive,
      features: newPlanCategory === 'Standard' ? STANDARD_PLAN_FEATURES : undefined,
      destination: newPlanCategory === 'Vacation' ? newPlanMeta.trim() || 'Any War-Free City or State of Preference' : undefined,
      perk: newPlanCategory === 'Vacation' ? 'Fully sponsored three-week holiday trip' : undefined,
      sector: newPlanCategory === 'Real Estate' ? 'Managed Property Fund' : undefined,
      location: newPlanCategory === 'Real Estate' ? newPlanMeta.trim() || 'Global Portfolio' : undefined,
      annualized:
        newPlanCategory === 'Real Estate'
          ? `${(rateNum * daysVal).toFixed(1)}% Term Yield (${daysVal}d)`
          : undefined,
      occupancy: newPlanCategory === 'Real Estate' ? '97.0%' : undefined,
    };

    updateAssetCrestStore((prev) => ({
      ...prev,
      investmentPlans: [newPlan, ...prev.investmentPlans],
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Created ${newPlan.category} plan (${newPlan.isActive ? 'Active' : 'Inactive'})`,
        category: 'plan',
        detail: `${newPlan.name} · ${newPlan.dailyRate}/day (${computedMonthly}/mo) · $${newPlan.min.toLocaleString('en-US')}–$${newPlan.max.toLocaleString('en-US')}`,
      }),
    }));

    setNewPlanName('');
    setNewPlanMeta('');
    setAddPlanOpen(false);
    onNotify(`Investment plan "${newPlan.name}" added.`, 'success');
  };

  const handleTogglePlanStatus = (plan: InvestmentPlanConfig) => {
    const nextActive = !plan.isActive;
    updateAssetCrestStore((prev) => ({
      ...prev,
      investmentPlans: prev.investmentPlans.map((p) =>
        p.id === plan.id ? { ...p, isActive: nextActive } : p
      ),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Marked plan ${nextActive ? 'Active' : 'Inactive'}`,
        category: 'plan',
        detail: plan.name,
      }),
    }));
    onNotify(
      `"${plan.name}" is now ${nextActive ? 'Active (open to new subscribers)' : 'Inactive (existing ROI continues)'}.`,
      'info'
    );
  };

  const handleToggleAutoRoi = async (inv: ActiveInvestment) => {
    const nextEnabled = inv.autoRoiEnabled === false;
    if (isCloudMode) {
      const ok = await cloudToggleInvestmentSettings(inv.id, { autoRoiEnabled: nextEnabled });
      if (!ok) {
        onNotify('Could not update Auto-ROI status in Cloud.', 'error');
        return;
      }
    } else {
      updateAssetCrestStore((prev) => ({
        ...prev,
        investments: prev.investments.map((item) =>
          item.id === inv.id ? { ...item, autoRoiEnabled: nextEnabled } : item
        ),
      }));
    }
    updateAssetCrestStore((prev) => ({
      ...prev,
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `${nextEnabled ? 'Resumed' : 'Paused'} Auto-ROI`,
        category: 'roi',
        detail: `${inv.planName} (${inv.id})`,
      }),
    }));
    onNotify(
      `${nextEnabled ? 'Resumed' : 'Paused'} automatic ROI accrual for ${inv.planName}.`,
      'info'
    );
  };

  const handlePayoutInvestmentYield = async (inv: ActiveInvestment) => {
    const existingTxIds = new Set(store.transactions.map((t) => t.id));
    const plan = computeRoiSettlementPlan(store.investments, {
      nowMs: Date.now(),
      forceOneCycleForIds: new Set([inv.id]),
      existingTxIds,
    });
    if (plan.settledCount === 0) {
      onNotify('This plan has already completed all scheduled ROI cycles.', 'info');
      return;
    }

    if (isCloudMode) {
      try {
        await cloudSettleRoiPlan(plan, store.users);
      } catch {
        onNotify('Failed to credit yield cycle in Cloud.', 'error');
        return;
      }
    } else {
      updateAssetCrestStore((prev) => applyRoiSettlementToStore(prev, plan));
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Settled ROI cycle for ${inv.planName}`,
        category: 'roi',
        detail: `+$${plan.totalYieldCredited.toFixed(2)}`,
      }),
    }));
    onNotify(
      `Settled +$${plan.totalYieldCredited.toFixed(2)} ROI${
        plan.maturedCount > 0 ? ' and unlocked matured principal' : ''
      } for ${inv.planName}.`,
      'success'
    );
  };

  const handleDistributeAllYields = async () => {
    if (activeInvestments.length === 0) {
      onNotify('No active investments to distribute yield for.', 'info');
      return;
    }
    const existingTxIds = new Set(store.transactions.map((t) => t.id));
    const plan = computeRoiSettlementPlan(store.investments, {
      nowMs: Date.now(),
      forceOneCycleForIds: new Set(activeInvestments.map((i) => i.id)),
      existingTxIds,
    });
    if (plan.settledCount === 0) {
      onNotify('All plans have completed their scheduled cycles.', 'info');
      return;
    }

    if (isCloudMode) {
      try {
        await cloudSettleRoiPlan(plan, store.users);
      } catch {
        onNotify('Failed to distribute batch yields in Cloud.', 'error');
        return;
      }
    } else {
      updateAssetCrestStore((prev) => applyRoiSettlementToStore(prev, plan));
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: 'Settled batch ROI cycle',
        category: 'roi',
        detail: `+$${plan.totalYieldCredited.toFixed(2)} across ${plan.settledCount} plan(s)`,
      }),
    }));
    onNotify(
      `Settled $${plan.totalYieldCredited.toFixed(2)} across ${plan.settledCount} active plan(s).`,
      'success'
    );
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PlatformSettings = {
      ...settingsForm,
      platformName: settingsForm.platformName.trim() || 'AssetCrest',
      referralBonusPct: Math.max(0, Math.min(50, Number(settingsForm.referralBonusPct) || 0)),
      updatedAt: formatNowStamp(),
    };
    updateAssetCrestStore((prev) => ({
      ...prev,
      platformSettings: updated,
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: 'Updated Platform Settings',
        category: 'settings',
        detail: `Auto-ROI: ${updated.autoRoiGlobalEnabled ? 'ON' : 'OFF'}, Regs: ${
          updated.allowNewRegistrations ? 'Open' : 'Paused'
        }, Ref Bonus: ${updated.referralBonusPct}%`,
      }),
    }));
    onNotify('Platform settings saved.', 'success');
  };

  const handleExportAllTransactionsCsv = () => {
    const header = 'Reference,User,Type,Method,Amount,Status,Date,Note\n';
    const rows = store.transactions
      .map((tx) => {
        const owner = store.users.find((u) => u.id === tx.userId);
        return `${tx.id},"${owner?.name || tx.userId}",${tx.type},"${tx.method}",${tx.amount.toFixed(2)},${tx.status},"${tx.date}","${(tx.note || '').replace(/"/g, '""')}"`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assetcrest-admin-transactions-${formatNowStamp().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onNotify('Exported platform ledger CSV.', 'success');
  };

  // --- Crypto Wallet Management Handlers ---
  const CRYPTO_WALLET_PRESETS: Record<string, { symbol: string; defaultNetwork: string }> = {
    Bitcoin: { symbol: 'BTC', defaultNetwork: 'BTC Mainnet' },
    Ethereum: { symbol: 'ETH', defaultNetwork: 'ERC20' },
    USDT: { symbol: 'USDT', defaultNetwork: 'TRC20' },
    USDC: { symbol: 'USDC', defaultNetwork: 'BEP20' },
    BNB: { symbol: 'BNB', defaultNetwork: 'BEP20' },
    Solana: { symbol: 'SOL', defaultNetwork: 'SOL' },
    Ripple: { symbol: 'XRP', defaultNetwork: 'XRP Ledger' },
  };

  const openCreateWalletModal = (preAssignedUserId?: string) => {
    setEditingWalletId(null);
    setWalletPresetCrypto('Bitcoin');
    setWalletCustomCrypto('');
    setWalletSymbolInput('BTC');
    setWalletNetworkInput('BTC Mainnet');
    setWalletAddressInput('');
    setWalletLabelInput('');
    setWalletStatusInput('Active');
    setWalletMinDepositInput('50');
    setWalletMaxDepositInput('250000');
    setWalletInstructionsInput(
      'Send only on the specified network and upload a clear transaction screenshot or PDF confirmation.'
    );
    if (preAssignedUserId) {
      setWalletAssignScope('specific');
      setWalletAssignedUserIds([preAssignedUserId]);
    } else {
      setWalletAssignScope('global');
      setWalletAssignedUserIds([]);
    }
    setWalletUserSearch('');
    setWalletModalOpen(true);
  };

  const openEditWalletModal = (w: CryptoWalletRecord) => {
    setEditingWalletId(w.id);
    if (CRYPTO_WALLET_PRESETS[w.cryptocurrency]) {
      setWalletPresetCrypto(w.cryptocurrency);
      setWalletCustomCrypto('');
    } else {
      setWalletPresetCrypto('Other');
      setWalletCustomCrypto(w.cryptocurrency);
    }
    setWalletSymbolInput(w.symbol);
    setWalletNetworkInput(w.network);
    setWalletAddressInput(w.address);
    setWalletLabelInput(w.label);
    setWalletStatusInput(w.status);
    setWalletMinDepositInput(String(w.minDeposit));
    setWalletMaxDepositInput(String(w.maxDeposit));
    setWalletInstructionsInput(w.instructions);
    if (w.assignedUserIds && w.assignedUserIds.length > 0) {
      setWalletAssignScope('specific');
      setWalletAssignedUserIds(w.assignedUserIds);
    } else {
      setWalletAssignScope('global');
      setWalletAssignedUserIds([]);
    }
    setWalletUserSearch('');
    setWalletModalOpen(true);
  };

  const handleSelectWalletPreset = (preset: string) => {
    setWalletPresetCrypto(preset);
    if (preset === 'Other') {
      setWalletSymbolInput('');
      setWalletNetworkInput('');
    } else if (CRYPTO_WALLET_PRESETS[preset]) {
      setWalletSymbolInput(CRYPTO_WALLET_PRESETS[preset].symbol);
      setWalletNetworkInput(CRYPTO_WALLET_PRESETS[preset].defaultNetwork);
    }
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const cryptoName =
      walletPresetCrypto === 'Other' ? walletCustomCrypto.trim() : walletPresetCrypto;
    const symbol = walletSymbolInput.trim().toUpperCase();
    const network = walletNetworkInput.trim();
    const address = walletAddressInput.trim();
    const label = walletLabelInput.trim() || `${cryptoName} (${network}) Wallet`;
    const minDep = Math.max(0, Number(walletMinDepositInput) || 0);
    const maxDep = Number(walletMaxDepositInput) || 0;
    const instructions = walletInstructionsInput.trim();

    if (!cryptoName || !symbol || !network || !address) {
      onNotify(
        'Please provide Cryptocurrency, Symbol, Blockchain/Network, and Wallet Address.',
        'error'
      );
      return;
    }
    if (maxDep <= 0 || maxDep < minDep) {
      onNotify('Maximum deposit must be greater than zero and at least equal to Minimum deposit.', 'error');
      return;
    }
    if (walletAssignScope === 'specific' && walletAssignedUserIds.length === 0) {
      onNotify('Select at least one investor or switch assignment scope to Global.', 'error');
      return;
    }

    const now = formatNowStamp();
    const existing = editingWalletId
      ? store.cryptoWallets.find((w) => w.id === editingWalletId)
      : undefined;

    const record: CryptoWalletRecord = {
      id: existing ? existing.id : nextRecordId('WAL').toLowerCase(),
      cryptocurrency: cryptoName,
      symbol,
      network,
      address,
      label,
      status: walletStatusInput,
      minDeposit: Number(minDep.toFixed(2)),
      maxDeposit: Number(maxDep.toFixed(2)),
      instructions,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      updatedByAdminName: user.name,
      updatedByAdminEmail: user.email,
      assignedUserIds: walletAssignScope === 'specific' ? walletAssignedUserIds : [],
    };

    if (isCloudMode) {
      try {
        await cloudSaveCryptoWallet(record);
      } catch (err: any) {
        onNotify(err?.message || 'Failed to save crypto wallet in Cloud.', 'error');
        return;
      }
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      cryptoWallets: existing
        ? prev.cryptoWallets.map((w) => (w.id === existing.id ? record : w))
        : [record, ...prev.cryptoWallets],
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: existing
          ? `Updated crypto wallet: ${record.label}`
          : `Assigned new crypto wallet: ${record.label}`,
        category: 'wallet',
        detail: `${record.cryptocurrency} (${record.network}) · ${record.status}`,
      }),
    }));

    setWalletModalOpen(false);
    setEditingWalletId(null);
    onNotify(
      existing
        ? `Updated ${record.label} (${record.status}).`
        : `Created ${record.label} (${record.network}).`,
      'success'
    );
  };

  const handleQuickWalletStatus = async (wallet: CryptoWalletRecord, nextStatus: WalletStatus) => {
    if (wallet.status === nextStatus) return;
    const updated: CryptoWalletRecord = {
      ...wallet,
      status: nextStatus,
      updatedAt: formatNowStamp(),
      updatedByAdminName: user.name,
      updatedByAdminEmail: user.email,
    };
    if (isCloudMode) {
      try {
        await cloudSaveCryptoWallet(updated);
      } catch (err: any) {
        onNotify(err?.message || 'Failed to update wallet status in Cloud.', 'error');
        return;
      }
    }
    updateAssetCrestStore((prev) => ({
      ...prev,
      cryptoWallets: prev.cryptoWallets.map((w) => (w.id === wallet.id ? updated : w)),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Set wallet status to ${nextStatus}`,
        category: 'wallet',
        detail: `${wallet.label} (${wallet.network})`,
      }),
    }));
    onNotify(`${wallet.label} marked ${nextStatus}.`, 'info');
  };

  const handleDeleteWallet = async (wallet: CryptoWalletRecord) => {
    if (isCloudMode) {
      try {
        await cloudDeleteCryptoWallet(wallet.id);
      } catch (err: any) {
        onNotify(err?.message || 'Failed to remove crypto wallet in Cloud.', 'error');
        return;
      }
    }
    updateAssetCrestStore((prev) => ({
      ...prev,
      cryptoWallets: prev.cryptoWallets.filter((w) => w.id !== wallet.id),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action: `Removed crypto wallet: ${wallet.label}`,
        category: 'wallet',
        detail: `${wallet.cryptocurrency} (${wallet.network})`,
      }),
    }));
    setConfirmDeleteWalletId(null);
    onNotify(`Removed ${wallet.label}.`, 'info');
  };

  const handleCopyWalletAddress = async (wallet: CryptoWalletRecord) => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopiedWalletId(wallet.id);
      onNotify(`Copied ${wallet.label} address.`, 'success');
      window.setTimeout(() => setCopiedWalletId(null), 1800);
    } catch {
      onNotify(`Address: ${wallet.address}`, 'info');
    }
  };

  // Filtered lists
  const filteredUsers = store.users.filter((u) => {
    const isBlocked = u.accountStatus === 'Blocked';
    if (section === 'users-active' && isBlocked) return false;
    if (section === 'users-blocked' && !isBlocked) return false;
    if (userSearch.trim()) {
      const q = userSearch.trim().toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.referralCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categoryOrder: Record<InvestmentPlanConfig['category'], number> = {
    Standard: 0,
    Vacation: 1,
    'Real Estate': 2,
  };
  const filteredPlans = [...store.investmentPlans]
    .filter((p) => (planCategoryFilter === 'All' ? true : p.category === planCategoryFilter))
    .sort((a, b) => {
      if (categoryOrder[a.category] !== categoryOrder[b.category]) {
        return categoryOrder[a.category] - categoryOrder[b.category];
      }
      return (b.price ?? b.min) - (a.price ?? a.min);
    });

  const filteredDeposits = depositTransactions.filter((t) =>
    depositFilter === 'All' ? true : t.status === depositFilter
  );

  const filteredWithdrawals = withdrawalTransactions.filter((t) =>
    withdrawalFilter === 'All' ? true : t.status === withdrawalFilter
  );

  const filteredKycUsers = kycUsers.filter((u) =>
    kycFilter === 'All' ? true : u.kycStatus === kycFilter
  );

  const filteredAllTxs = store.transactions.filter((t) => {
    if (txTypeFilter !== 'All' && t.type !== txTypeFilter) return false;
    if (txStatusFilter !== 'All' && t.status !== txStatusFilter) return false;
    if (txSearch.trim()) {
      const q = txSearch.trim().toLowerCase();
      const owner = store.users.find((u) => u.id === t.userId);
      return (
        t.id.toLowerCase().includes(q) ||
        t.method.toLowerCase().includes(q) ||
        (owner?.name || '').toLowerCase().includes(q) ||
        (owner?.email || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredActivities = store.activityLogs.filter((act) => {
    if (!activitySearch.trim()) return true;
    const q = activitySearch.trim().toLowerCase();
    return (
      act.action.toLowerCase().includes(q) ||
      act.actorName.toLowerCase().includes(q) ||
      act.detail.toLowerCase().includes(q)
    );
  });

  const navLinkCls = (active: boolean) =>
    `w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
      active
        ? 'bg-[#2b4865] text-white shadow-sm'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  const subNavLinkCls = (active: boolean) =>
    `w-full flex items-center gap-2 pl-9 pr-3 py-2 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
      active
        ? 'text-[#2b4865] dark:text-sky-400 font-semibold bg-slate-100/80 dark:bg-slate-800/80'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {user.name}
          </p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            Admin
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
        </div>

        <nav className="p-3 space-y-1">
          <button
            type="button"
            onClick={() => navigateSection('dashboard')}
            className={navLinkCls(section === 'dashboard')}
          >
            <span className="flex items-center gap-2.5">
              <Home className="h-4 w-4 shrink-0" />
              <span>Dashboard</span>
            </span>
          </button>

          <div>
            <button
              type="button"
              onClick={() => setInvestmentMenuOpen((v) => !v)}
              className={navLinkCls(section === 'plans' || section === 'roi')}
            >
              <span className="flex items-center gap-2.5">
                <Boxes className="h-4 w-4 shrink-0" />
                <span>Investment</span>
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  investmentMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {investmentMenuOpen && (
              <div className="mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => navigateSection('plans')}
                  className={subNavLinkCls(section === 'plans')}
                >
                  <span>Investment Plans</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateSection('roi')}
                  className={subNavLinkCls(section === 'roi')}
                >
                  <span>ROI Engine ({activeInvestments.length})</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setUsersMenuOpen((v) => !v)}
              className={navLinkCls(
                section === 'users-all' ||
                  section === 'users-active' ||
                  section === 'users-blocked' ||
                  section === 'sessions'
              )}
            >
              <span className="flex items-center gap-2.5">
                <Users className="h-4 w-4 shrink-0" />
                <span>Manage Users</span>
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  usersMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {usersMenuOpen && (
              <div className="mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => navigateSection('users-all')}
                  className={subNavLinkCls(section === 'users-all')}
                >
                  <span>All Users ({totalUsersCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateSection('users-active')}
                  className={subNavLinkCls(section === 'users-active')}
                >
                  <span>Active Users ({activeUsersCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateSection('users-blocked')}
                  className={subNavLinkCls(section === 'users-blocked')}
                >
                  <span>Blocked Users ({blockedUsersCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateSection('sessions')}
                  className={subNavLinkCls(section === 'sessions')}
                >
                  <span>Recent Sessions ({store.sessionLogs.length})</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigateSection('deposits')}
            className={navLinkCls(section === 'deposits')}
          >
            <span className="flex items-center gap-2.5">
              <ArrowDownCircle className="h-4 w-4 shrink-0" />
              <span>Manage Deposits</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateSection('wallets')}
            className={navLinkCls(section === 'wallets')}
          >
            <span className="flex items-center gap-2.5">
              <Wallet className="h-4 w-4 shrink-0" />
              <span>Crypto Wallets ({store.cryptoWallets.length})</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateSection('withdrawals')}
            className={navLinkCls(section === 'withdrawals')}
          >
            <span className="flex items-center gap-2.5">
              <ArrowUpCircle className="h-4 w-4 shrink-0" />
              <span>Manage Withdrawal</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateSection('transactions')}
            className={navLinkCls(section === 'transactions')}
          >
            <span className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span>Transactions</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateSection('kyc')}
            className={navLinkCls(section === 'kyc')}
          >
            <span className="flex items-center gap-2.5">
              <UserCheck className="h-4 w-4 shrink-0" />
              <span>KYC Application(s)</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateSection('settings')}
            className={navLinkCls(section === 'settings')}
          >
            <span className="flex items-center gap-2.5">
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateSection('automation')}
            className={navLinkCls(section === 'automation')}
          >
            <span className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0" />
              <span>Email &amp; Webhooks</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateSection('platform')}
            className={navLinkCls(section === 'platform')}
          >
            <span className="flex items-center gap-2.5">
              <Package className="h-4 w-4 shrink-0" />
              <span>Platform Administration</span>
            </span>
          </button>
        </nav>
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
        <button
          type="button"
          onClick={onExitAdmin}
          className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          <span>Investor Portal View</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Navy Admin Bar */}
      <header className="h-14 bg-[#23446c] dark:bg-slate-900 border-b border-[#1c3657] dark:border-slate-800 text-white px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle admin sidebar"
            className="p-1.5 rounded hover:bg-white/10 transition cursor-pointer lg:hidden"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
          <button
            type="button"
            onClick={() => navigateSection('dashboard')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <OfficialLogoMark className="h-7 w-7" variant="badge" />
            <span className="text-base font-extrabold tracking-tight leading-none whitespace-nowrap">
              <span className="text-white">ASSET</span>
              <span className="text-[#ef4444]">CREST</span>
            </span>
          </button>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={onExitAdmin}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition cursor-pointer whitespace-nowrap"
          >
            Investor View
          </button>
          <button
            type="button"
            onClick={() => setThemeMode(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle color mode"
            className="p-1.5 rounded hover:bg-white/10 transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-300" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-slate-100" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setHeaderMenuOpen((v) => !v)}
            aria-label="Admin menu options"
            className="p-1.5 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <MoreVertical className="h-5 w-5 text-white" />
          </button>

          {headerMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setHeaderMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-40 w-60 bg-white dark:bg-slate-900 rounded-md shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 text-slate-700 dark:text-slate-200 text-xs">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    onExitAdmin();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Home className="h-3.5 w-3.5 text-slate-400" />
                  Switch to Investor View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5 text-slate-400" />
                  Switch Admin Account
                </button>
                {!isCloudMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer"
                  >
                    <Cloud className="h-3.5 w-3.5" />
                    Sign In Admin Cloud Sync
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      void signOutCloud();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Cloud className="h-3.5 w-3.5" />
                    Sign Out Neon Sync
                  </button>
                )}
                <a
                  href="/trading"
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Live Trading Terminal
                </a>
                <a
                  href="/"
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  AssetCrest Website
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 font-semibold cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1 pt-2"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Layout: Dedicated Desktop Sidebar + Mobile Drawer + Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop Persistent Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          {sidebarContent}
        </aside>

        {/* Mobile Slide-Out Sidebar */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full overflow-y-auto z-10 shadow-2xl">
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-[1440px] mx-auto w-full space-y-6">
          {/* ============================================================== */}
          {/* 1. DASHBOARD OVERVIEW                                          */}
          {/* ============================================================== */}
          {section === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome + Quote + Quick Action Bar */}
              <div className="space-y-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Welcome, {user.name}!
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    {store.platformSettings.welcomeQuote}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigateSection('deposits')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 rounded inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDownCircle className="h-3.5 w-3.5" />
                    Deposits
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateSection('withdrawals')}
                    className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-3.5 py-2 rounded inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                    Withdrawals
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateSection('users-all')}
                    className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold px-3.5 py-2 rounded inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Users
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateSection('wallets')}
                    className="bg-[#23446c] hover:bg-[#1c3657] text-white text-xs font-semibold px-3.5 py-2 rounded inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Crypto Wallets
                  </button>
                </div>
              </div>

              {/* 8 KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total users',
                    value: String(totalUsersCount),
                    icon: Users,
                    bg: 'bg-[#23446c]',
                    onClick: () => navigateSection('users-all'),
                  },
                  {
                    label: 'Active Investments',
                    value: String(activeInvestments.length),
                    icon: TrendingUp,
                    bg: 'bg-[#2596be]',
                    onClick: () => navigateSection('roi'),
                  },
                  {
                    label: 'Total withdrawals',
                    value: `$${totalWithdrawalsUsd.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    icon: ArrowUpCircle,
                    bg: 'bg-[#ef4444]',
                    onClick: () => navigateSection('withdrawals'),
                  },
                  {
                    label: 'Total deposits',
                    value: `$${totalDepositsUsd.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    icon: ArrowDownCircle,
                    bg: 'bg-[#22c55e]',
                    onClick: () => navigateSection('deposits'),
                  },
                  {
                    label: 'Blocked users',
                    value: String(blockedUsersCount),
                    icon: UserX,
                    bg: 'bg-[#ef4444]',
                    onClick: () => navigateSection('users-blocked'),
                  },
                  {
                    label: 'Active users',
                    value: String(activeUsersCount),
                    icon: UserCheck,
                    bg: 'bg-[#22c55e]',
                    onClick: () => navigateSection('users-active'),
                  },
                  {
                    label: 'Pending withdrawals',
                    value: `$${pendingWithdrawalsUsd.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    icon: Clock,
                    bg: 'bg-[#f59e0b]',
                    onClick: () => navigateSection('withdrawals'),
                  },
                  {
                    label: 'Pending deposits',
                    value: `$${pendingDepositsUsd.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    icon: CheckCircle2,
                    bg: 'bg-[#23446c]',
                    onClick: () => navigateSection('deposits'),
                  },
                ].map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <button
                      key={kpi.label}
                      type="button"
                      onClick={kpi.onClick}
                      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-4 flex items-center gap-4 text-left hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
                    >
                      <div
                        className={`w-12 h-12 rounded-md ${kpi.bg} text-white flex items-center justify-center shrink-0`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {kpi.label}
                        </p>
                        <p className="text-lg font-bold font-mono tabular-nums text-slate-800 dark:text-white mt-0.5 truncate">
                          {kpi.value}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Analytics Charts Row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Users Statistics Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Users Statistics
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Monthly registrations from live user records
                      </p>
                    </div>
                    <select
                      value={usersChartYear}
                      onChange={(e) => setUsersChartYear(e.target.value)}
                      className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-200"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2">
                    <div className="h-44 flex items-end gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 px-1">
                      {monthlyUsersCounts.map((cnt, idx) => {
                        const heightPct = cnt > 0 ? Math.max(10, Math.round((cnt / maxMonthlyUsers) * 100)) : 3;
                        return (
                          <div
                            key={MONTHS[idx]}
                            className="flex-1 flex flex-col items-center justify-end h-full group"
                            title={`${MONTHS[idx]} ${usersChartYear}: ${cnt} user(s)`}
                          >
                            <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mb-1">
                              {cnt > 0 ? cnt : ''}
                            </span>
                            <div
                              className={`w-full rounded-t transition-all ${
                                cnt > 0
                                  ? 'bg-[#23446c] dark:bg-sky-500'
                                  : 'bg-slate-100 dark:bg-slate-800'
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between pt-1.5 px-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {MONTHS.map((m) => (
                        <span key={m} className="flex-1 text-center">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transactions in $ Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Transactions
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Transactions in $ across live platform records
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={txChartYear}
                        onChange={(e) => setTxChartYear(e.target.value)}
                        className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-200"
                      >
                        {availableYears.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                      <select
                        value={txChartFilter}
                        onChange={(e) =>
                          setTxChartFilter(
                            e.target.value as 'All' | 'Deposit' | 'Withdrawal' | 'Investment'
                          )
                        }
                        className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
                      >
                        <option value="All">All</option>
                        <option value="Deposit">Deposits</option>
                        <option value="Withdrawal">Withdrawals</option>
                        <option value="Investment">Investments</option>
                      </select>
                    </div>
                  </div>

                  {(() => {
                    const padLeft = 72;
                    const padRight = 24;
                    const padTop = 16;
                    const padBottom = 30;
                    const svgW = 520;
                    const svgH = 210;
                    const plotW = svgW - padLeft - padRight;
                    const plotH = svgH - padTop - padBottom;

                    const niceMax =
                      maxTxChartVal <= 100
                        ? 100
                        : Math.ceil(maxTxChartVal / Math.pow(10, Math.floor(Math.log10(maxTxChartVal)))) *
                          Math.pow(10, Math.floor(Math.log10(maxTxChartVal)));

                    const seriesPoints =
                      txChartFilter === 'All'
                        ? txChartSeries.map((item) => ({
                            label: item.label,
                            value: item.value,
                          }))
                        : MONTHS.map((mLabel, mIdx) => {
                            const monthPrefix = `${txChartYear}-${String(mIdx + 1).padStart(2, '0')}`;
                            const monthSum = store.transactions
                              .filter(
                                (t) =>
                                  t.type === txChartFilter &&
                                  (txChartFilter === 'Investment' || t.status === 'Completed') &&
                                  t.date?.startsWith(monthPrefix)
                              )
                              .reduce((s, t) => s + t.amount, 0);
                            return { label: mLabel, value: monthSum };
                          });

                    const activeMax = Math.max(
                      100,
                      niceMax,
                      ...seriesPoints.map((p) => p.value)
                    );

                    const coords = seriesPoints.map((pt, idx) => {
                      const x =
                        seriesPoints.length <= 1
                          ? padLeft + plotW / 2
                          : padLeft + (idx / (seriesPoints.length - 1)) * plotW;
                      const y = padTop + plotH - (pt.value / activeMax) * plotH;
                      return { ...pt, x, y };
                    });

                    const polylineStr = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
                    const yTicks = [0, 0.25, 0.5, 0.75, 1];

                    return (
                      <div className="space-y-3 pt-1">
                        <p className="text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                          Transactions in $
                        </p>
                        <div className="w-full overflow-x-auto">
                          <svg
                            viewBox={`0 0 ${svgW} ${svgH}`}
                            className="w-full min-w-[320px] h-48 select-none"
                            role="img"
                            aria-label="Transactions in US Dollars line chart"
                          >
                            {yTicks.map((ratio) => {
                              const yPos = padTop + plotH - ratio * plotH;
                              const tickVal = activeMax * ratio;
                              return (
                                <g key={ratio}>
                                  <line
                                    x1={padLeft}
                                    y1={yPos}
                                    x2={svgW - padRight}
                                    y2={yPos}
                                    stroke="currentColor"
                                    className="text-slate-200 dark:text-slate-800"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={padLeft - 8}
                                    y={yPos + 3.5}
                                    textAnchor="end"
                                    className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono tabular-nums"
                                  >
                                    {tickVal >= 1000000
                                      ? `${(tickVal / 1000000).toFixed(1)}M`
                                      : tickVal.toLocaleString('en-US', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                  </text>
                                </g>
                              );
                            })}

                            {coords.length > 1 && (
                              <polyline
                                fill="none"
                                stroke="#0ea5e9"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={polylineStr}
                              />
                            )}

                            {coords.map((pt, idx) => {
                              const showLabel =
                                coords.length <= 4 || idx % 2 === 0 || idx === coords.length - 1;
                              return (
                                <g key={`${pt.label}-${idx}`}>
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="4"
                                    className="fill-[#0ea5e9] stroke-white dark:stroke-slate-900"
                                    strokeWidth="2"
                                  >
                                    <title>
                                      {`${pt.label}: $${pt.value.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}`}
                                    </title>
                                  </circle>
                                  {showLabel && (
                                    <text
                                      x={pt.x}
                                      y={svgH - 8}
                                      textAnchor={
                                        idx === 0
                                          ? 'start'
                                          : idx === coords.length - 1
                                          ? 'end'
                                          : 'middle'
                                      }
                                      className="fill-slate-500 dark:fill-slate-400 text-[10px] font-medium"
                                    >
                                      {pt.label}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </svg>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {txChartSeries.map((item, idx) => {
                            const dotColor =
                              item.type === 'Deposit'
                                ? 'bg-emerald-500'
                                : item.type === 'Withdrawal'
                                ? 'bg-rose-500'
                                : 'bg-[#0ea5e9]';
                            return (
                              <div
                                key={`${item.label}-${idx}`}
                                className="flex items-center justify-between sm:flex-col sm:items-start gap-0.5 rounded bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5"
                              >
                                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                                  {item.label}
                                </span>
                                <span className="text-xs font-mono tabular-nums font-bold text-slate-800 dark:text-white">
                                  $
                                  {item.value.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Bottom 3-Column Overview Row: Top Investments, Recent Sessions, Activity Log */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Top Performing Investments */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Top Performing Investments
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateSection('roi')}
                      className="text-xs font-semibold text-[#23446c] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>

                  {topInvestments.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                      No active or completed investments recorded yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {topInvestments.map((inv) => {
                        const owner = store.users.find((u) => u.id === inv.userId);
                        const snap = getInvestmentRoiSnapshot(inv, roiClockMs);
                        return (
                          <div
                            key={inv.id}
                            className="py-2.5 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {owner?.name || inv.userId}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {inv.planName} · {inv.dailyRate}/d
                              </p>
                            </div>
                            <div className="text-right shrink-0 font-mono tabular-nums">
                              <p className="font-bold text-[#0ea5e9]">
                                ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                +${snap.earnedSoFar.toFixed(2)} ROI
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Sessions */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-2">
                      <span>Recent Sessions</span>
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"
                        aria-hidden="true"
                      />
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateSection('sessions')}
                      className="text-xs font-semibold text-[#23446c] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  {store.sessionLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                      No new sign-in sessions recorded yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {store.sessionLogs.slice(0, 6).map((ses) => {
                        const matched = store.users.find((u) => u.id === ses.userId);
                        return (
                          <button
                            key={ses.id}
                            type="button"
                            onClick={() => {
                              if (matched) openUserInspector(matched);
                            }}
                            className="w-full py-2.5 flex items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 px-1 rounded transition cursor-pointer"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {ses.userName}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {ses.userEmail}
                              </p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Activity Log Timeline */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Activity Log
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateSection('platform')}
                      className="text-xs font-semibold text-[#23446c] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  {store.activityLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                      Platform events will appear here as users sign in or transact.
                    </p>
                  ) : (
                    <div className="space-y-3 border-l border-slate-200 dark:border-slate-700 ml-2 pl-4">
                      {store.activityLogs.slice(0, 6).map((act) => (
                        <div key={act.id} className="relative text-xs">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
                          <p className="text-[10px] font-mono text-slate-400">
                            {act.timestamp}
                          </p>
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {act.action}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {act.actorName} · {act.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. INVESTMENT PLANS MANAGEMENT                                 */}
          {/* ============================================================== */}
          {section === 'plans' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    Investment Plans
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <button
                      type="button"
                      onClick={() => navigateSection('dashboard')}
                      className="hover:text-[#23446c] cursor-pointer"
                    >
                      <Home className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight className="h-3 w-3" />
                    <span>Investment Plans</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncFrontendPlans}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Sync Frontend Defaults
                  </button>
                  <button
                    type="button"
                    onClick={openCreatePlanModal}
                    className="bg-[#23446c] hover:bg-[#1c3657] text-white text-xs font-semibold px-4 py-2.5 rounded inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add New
                  </button>
                </div>
              </div>

              {planBannerVisible && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex items-start justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <p className="leading-relaxed">
                    <strong>Users cannot invest in an inactive plan.</strong> Plan status is useful
                    when you want to pause new subscriptions cleanly: investors already subscribed to
                    an inactive plan will continue earning their scheduled ROI until maturity, while
                    new purchases are disabled.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPlanBannerVisible(false)}
                    aria-label="Dismiss notice"
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {(['All', 'Standard', 'Vacation', 'Real Estate'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPlanCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                      planCategoryFilter === cat
                        ? 'bg-[#23446c] text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Minimum Deposit</th>
                      <th className="px-4 py-3 font-semibold">Maximum Deposit</th>
                      <th className="px-4 py-3 font-semibold">Daily / Monthly ROI</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPlans.map((plan) => {
                      const dailyNum = parseFloat(String(plan.dailyRate).replace(/[^0-9.-]/g, '')) || 0;
                      const monthlyDisplay = plan.monthlyRate || `${(dailyNum * 30).toFixed(1)}%`;
                      const entryPrice = plan.price ?? plan.min;

                      return (
                        <tr key={plan.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {plan.name}
                            </p>
                            {plan.batchLabel && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {plan.batchLabel} · Reward {plan.instantReward || monthlyDisplay}
                              </p>
                            )}
                            {plan.sector && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {plan.sector}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                            ${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                            {plan.category}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums">
                            ${plan.min.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums">
                            ${plan.max.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums">
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {plan.dailyRate}/d · {monthlyDisplay}/mo
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {plan.durationDays}d · {plan.referralBonusPct ?? 5}% ref bonus
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded font-semibold ${
                                plan.isActive
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {plan.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                            <button
                              type="button"
                              onClick={() => openEditPlanModal(plan)}
                              className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePlanStatus(plan)}
                              className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
                                plan.isActive
                                  ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {plan.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. ROI ENGINE & ALLOCATIONS                                    */}
          {/* ============================================================== */}
          {section === 'roi' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <RefreshCw className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Automatic ROI Engine</strong> —{' '}
                    {store.platformSettings.autoRoiGlobalEnabled ? 'Active (24h Cycles)' : 'Globally Paused'}
                    . Credits returns to <strong>Total Profit</strong> &amp; <strong>Account Balance</strong>{' '}
                    and returns principal upon maturity.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDistributeAllYields}
                  className="bg-[#23446c] hover:bg-[#1c3657] text-white text-xs font-medium px-3.5 py-2 rounded inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Advance &amp; Settle 1 Cycle All
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Investor</th>
                      <th className="px-4 py-3 font-semibold">Plan &amp; Schedule</th>
                      <th className="px-4 py-3 font-semibold">Principal / Accrued</th>
                      <th className="px-4 py-3 font-semibold">Daily Yield &amp; Next Auto</th>
                      <th className="px-4 py-3 font-semibold text-right">Engine Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {store.investments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          No investor allocations yet.
                        </td>
                      </tr>
                    ) : (
                      store.investments.map((inv) => {
                        const owner = store.users.find((u) => u.id === inv.userId);
                        const snap = getInvestmentRoiSnapshot(inv, roiClockMs);
                        const autoOn = inv.autoRoiEnabled !== false;
                        return (
                          <tr key={inv.id}>
                            <td className="px-4 py-3">{owner?.name || inv.userId}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                  {inv.planName}
                                </p>
                                {inv.autoCompound && (
                                  <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] font-semibold">
                                    Compound
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {inv.category} · {inv.dailyRate}/day · Cycle {snap.cyclesCompleted}/
                                {inv.durationDays}
                              </p>
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums">
                              <p className="font-semibold">
                                ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                Earned: +${snap.earnedSoFar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums">
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                +${snap.dailyYield.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {snap.isMatured
                                  ? 'Matured'
                                  : autoOn
                                  ? `Next in ${formatCountdown(snap.nextPayoutInMs)}`
                                  : 'Auto Paused'}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right space-x-1.5">
                              {!snap.isMatured ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAutoRoi(inv)}
                                    className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    {autoOn ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                    {autoOn ? 'Pause' : 'Resume'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePayoutInvestmentYield(inv)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Settle Cycle
                                  </button>
                                </>
                              ) : (
                                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold">
                                  Completed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. MANAGE USERS (ALL / ACTIVE / BLOCKED)                       */}
          {/* ============================================================== */}
          {(section === 'users-all' || section === 'users-active' || section === 'users-blocked') && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    {section === 'users-active'
                      ? 'Active Users'
                      : section === 'users-blocked'
                      ? 'Blocked Users'
                      : 'All Users'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inspect investor balances, verify KYC status, or block/unblock account access.
                  </p>
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name, email, ref..."
                    className="pl-8 pr-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Member</th>
                      <th className="px-4 py-3 font-semibold">Ownership / KYC</th>
                      <th className="px-4 py-3 font-semibold">USD Balance</th>
                      <th className="px-4 py-3 font-semibold">Total Profit</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          No matching member records found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isBlocked = u.accountStatus === 'Blocked';
                        return (
                          <tr key={u.id}>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800 dark:text-slate-100">{u.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p>{u.accountType}</p>
                              <p className="text-[11px] text-slate-500">KYC: {u.kycStatus}</p>
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums font-bold">
                              ${u.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                              ${u.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded font-semibold ${
                                  isBlocked
                                    ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                                    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {isBlocked ? 'Blocked' : 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-1.5">
                              <button
                                type="button"
                                onClick={() => openUserInspector(u)}
                                className="bg-[#23446c] hover:bg-[#1c3657] text-white px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                Inspect
                              </button>
                              {u.id !== user.id && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer ${
                                    isBlocked
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                                  }`}
                                >
                                  {isBlocked ? <Unlock className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                                  {isBlocked ? 'Unblock' : 'Block'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. RECENT SESSIONS                                             */}
          {/* ============================================================== */}
          {section === 'sessions' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  Recent Sessions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real authentication and session entry records from signed-in users.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Timestamp</th>
                      <th className="px-4 py-3 font-semibold">Member</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Client Agent</th>
                      <th className="px-4 py-3 font-semibold text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {store.sessionLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          No session records logged yet.
                        </td>
                      </tr>
                    ) : (
                      store.sessionLogs.map((ses) => {
                        const matched = store.users.find((u) => u.id === ses.userId);
                        return (
                          <tr key={ses.id}>
                            <td className="px-4 py-3 font-mono tabular-nums">{ses.timestamp}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800 dark:text-slate-100">
                                {ses.userName}
                              </p>
                              <p className="text-[11px] text-slate-500">{ses.userEmail}</p>
                            </td>
                            <td className="px-4 py-3 capitalize">{ses.role}</td>
                            <td className="px-4 py-3 text-[11px] text-slate-500 max-w-xs truncate">
                              {ses.deviceSummary}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {matched && (
                                <button
                                  type="button"
                                  onClick={() => openUserInspector(matched)}
                                  className="text-[#23446c] dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  Inspect <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 6. MANAGE DEPOSITS                                             */}
          {/* ============================================================== */}
          {section === 'deposits' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  Manage Deposits
                </h2>
                <div className="flex gap-1.5">
                  {(['All', 'Pending', 'Completed', 'Cancelled'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setDepositFilter(f)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                        depositFilter === f
                          ? 'bg-[#23446c] text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Deposit ID</th>
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Method</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Receipt</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDeposits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          No deposit transactions found.
                        </td>
                      </tr>
                    ) : (
                      filteredDeposits.map((tx) => {
                        const owner = store.users.find((u) => u.id === tx.userId);
                        return (
                          <tr key={tx.id}>
                            <td className="px-4 py-3 font-mono">{tx.id}</td>
                            <td className="px-4 py-3">{owner?.name || tx.userId}</td>
                            <td className="px-4 py-3">{tx.method}</td>
                            <td className="px-4 py-3 font-mono tabular-nums font-bold">
                              ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => onInspectReceipt(tx)}
                                className="text-[#23446c] dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                {tx.proofName || 'View'}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              <span
                                className={
                                  tx.status === 'Completed'
                                    ? 'text-emerald-600'
                                    : tx.status === 'Pending'
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-1.5">
                              {tx.status === 'Pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveDeposit(tx)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Credit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectDeposit(tx)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Decline
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 6B. CRYPTO WALLET MANAGEMENT (MANUAL WALLET ASSIGNMENT)        */}
          {/* ============================================================== */}
          {section === 'wallets' && (() => {
            const totalWallets = store.cryptoWallets.length;
            const activeWalletsCount = store.cryptoWallets.filter((w) => w.status === 'Active').length;
            const maintenanceWalletsCount = store.cryptoWallets.filter(
              (w) => w.status === 'Maintenance'
            ).length;
            const inactiveWalletsCount = store.cryptoWallets.filter(
              (w) => w.status === 'Inactive'
            ).length;

            const coreCryptos = ['Bitcoin', 'Ethereum', 'USDT', 'USDC'];
            const filteredWallets = store.cryptoWallets.filter((w) => {
              if (walletStatusFilter !== 'All' && w.status !== walletStatusFilter) return false;
              if (walletCryptoFilter === 'Other') {
                if (coreCryptos.includes(w.cryptocurrency)) return false;
              } else if (walletCryptoFilter !== 'All' && w.cryptocurrency !== walletCryptoFilter) {
                return false;
              }
              if (walletSearch.trim()) {
                const q = walletSearch.trim().toLowerCase();
                return (
                  w.cryptocurrency.toLowerCase().includes(q) ||
                  w.symbol.toLowerCase().includes(q) ||
                  w.network.toLowerCase().includes(q) ||
                  w.label.toLowerCase().includes(q) ||
                  w.address.toLowerCase().includes(q) ||
                  w.updatedByAdminName.toLowerCase().includes(q)
                );
              }
              return true;
            });

            return (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                      Crypto Wallet Management
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <button
                        type="button"
                        onClick={() => navigateSection('dashboard')}
                        className="hover:text-[#23446c] cursor-pointer"
                      >
                        <Home className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className="h-3 w-3" />
                      <span>Manual Crypto Wallet Assignment</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateWalletModal()}
                    className="bg-[#23446c] hover:bg-[#1c3657] text-white text-xs font-semibold px-4 py-2.5 rounded inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add Payment Wallet
                  </button>
                </div>

                {/* Wallet Status Summary Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Wallets', value: totalWallets, color: 'text-slate-800 dark:text-white' },
                    { label: 'Active Wallets', value: activeWalletsCount, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Maintenance', value: maintenanceWalletsCount, color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Inactive Wallets', value: inactiveWalletsCount, color: 'text-rose-600 dark:text-rose-400' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4"
                    >
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {stat.label}
                      </p>
                      <p className={`text-xl font-bold font-mono tabular-nums mt-1 ${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Search & Filters */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['All', 'Bitcoin', 'Ethereum', 'USDT', 'USDC', 'Other'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setWalletCryptoFilter(c)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                          walletCryptoFilter === c
                            ? 'bg-[#23446c] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={walletStatusFilter}
                      onChange={(e) =>
                        setWalletStatusFilter(e.target.value as 'All' | WalletStatus)
                      }
                      aria-label="Filter wallet status"
                      className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={walletSearch}
                        onChange={(e) => setWalletSearch(e.target.value)}
                        placeholder="Search label, address, network..."
                        className="pl-8 pr-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-56"
                      />
                    </div>
                  </div>
                </div>

                {/* Wallets Registry */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Cryptocurrency & Network</th>
                        <th className="px-4 py-3 font-semibold">Label & Assignment</th>
                        <th className="px-4 py-3 font-semibold">Wallet Address</th>
                        <th className="px-4 py-3 font-semibold">Deposit Limits</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Audit Trail</th>
                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredWallets.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                            No crypto wallets match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredWallets.map((w) => {
                          const assignedCount = w.assignedUserIds?.length || 0;
                          const assignedPreviewNames = assignedCount
                            ? w.assignedUserIds!
                                .map((uid) => store.users.find((u) => u.id === uid)?.name || uid)
                                .slice(0, 2)
                                .join(', ')
                            : 'All Investors (Global)';
                          return (
                            <tr key={w.id} className="align-top">
                              <td className="px-4 py-3.5">
                                <p className="font-bold text-slate-800 dark:text-slate-100">
                                  {w.cryptocurrency}{' '}
                                  <span className="font-mono text-[11px] text-slate-500">
                                    ({w.symbol})
                                  </span>
                                </p>
                                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                                  {w.network}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 max-w-[240px]">
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                  {w.label}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Scope:{' '}
                                  <span
                                    className={
                                      assignedCount > 0
                                        ? 'font-semibold text-sky-600 dark:text-sky-400'
                                        : ''
                                    }
                                  >
                                    {assignedCount > 0
                                      ? `Manual (${assignedCount}): ${assignedPreviewNames}${
                                          assignedCount > 2 ? '…' : ''
                                        }`
                                      : 'All Investors (Global)'}
                                  </span>
                                </p>
                                {w.instructions && (
                                  <p
                                    className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2"
                                    title={w.instructions}
                                  >
                                    {w.instructions}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <code
                                    className="font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded max-w-[190px] truncate"
                                    title={w.address}
                                  >
                                    {w.address}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyWalletAddress(w)}
                                    title="Copy wallet address"
                                    className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                                  >
                                    {copiedWalletId === w.id ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 font-mono tabular-nums whitespace-nowrap">
                                <p className="text-slate-700 dark:text-slate-200">
                                  Min: ${w.minDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">
                                  Max: ${w.maxDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                              </td>
                              <td className="px-4 py-3.5">
                                <select
                                  value={w.status}
                                  onChange={(e) =>
                                    handleQuickWalletStatus(w, e.target.value as WalletStatus)
                                  }
                                  aria-label={`Status for ${w.label}`}
                                  className={`rounded px-2 py-1 text-[11px] font-semibold border cursor-pointer ${
                                    w.status === 'Active'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : w.status === 'Maintenance'
                                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <option value="Active">Active</option>
                                  <option value="Maintenance">Maintenance</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </td>
                              <td className="px-4 py-3.5 text-[11px] whitespace-nowrap">
                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                  {w.updatedByAdminName}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400 font-mono">
                                  Upd: {w.updatedAt}
                                </p>
                                <p className="text-slate-400 dark:text-slate-500 font-mono">
                                  Cr: {w.createdAt}
                                </p>
                              </td>
                              <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditWalletModal(w)}
                                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit
                                </button>
                                {confirmDeleteWalletId === w.id ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWallet(w)}
                                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteWalletId(w.id)}
                                    title="Remove wallet"
                                    className="px-2 py-1 rounded border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* 7. MANAGE WITHDRAWALS                                          */}
          {/* ============================================================== */}
          {section === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  Manage Withdrawal
                </h2>
                <div className="flex gap-1.5">
                  {(['All', 'Pending', 'Completed', 'Cancelled'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setWithdrawalFilter(f)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                        withdrawalFilter === f
                          ? 'bg-[#23446c] text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Withdrawal ID</th>
                      <th className="px-4 py-3 font-semibold">Investor</th>
                      <th className="px-4 py-3 font-semibold">Method &amp; Destination</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          No withdrawal requests found.
                        </td>
                      </tr>
                    ) : (
                      filteredWithdrawals.map((tx) => {
                        const owner = store.users.find((u) => u.id === tx.userId);
                        return (
                          <tr key={tx.id}>
                            <td className="px-4 py-3 font-mono">{tx.id}</td>
                            <td className="px-4 py-3">{owner?.name || tx.userId}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-800 dark:text-slate-100">{tx.method}</p>
                              {tx.note && (
                                <p className="text-[11px] font-mono text-slate-500 truncate max-w-xs">
                                  {tx.note}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums font-bold">
                              ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              <span
                                className={
                                  tx.status === 'Completed'
                                    ? 'text-emerald-600'
                                    : tx.status === 'Pending'
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-1.5">
                              {tx.status === 'Pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveWithdrawal(tx)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeclineWithdrawal(tx)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Refund
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 8. FULL PLATFORM TRANSACTIONS LEDGER                           */}
          {/* ============================================================== */}
          {section === 'transactions' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  Transactions
                </h2>
                <button
                  type="button"
                  onClick={handleExportAllTransactionsCsv}
                  className="bg-[#23446c] hover:bg-[#1c3657] text-white text-xs font-medium px-3.5 py-2 rounded inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
                  >
                    <option value="All">All Types</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Investment">Investment</option>
                    <option value="Bonus">Bonus / ROI</option>
                    <option value="Transfer In">Transfer In</option>
                    <option value="Transfer Out">Transfer Out</option>
                    <option value="Swap">Swap</option>
                  </select>
                  <select
                    value={txStatusFilter}
                    onChange={(e) =>
                      setTxStatusFilter(
                        e.target.value as 'All' | 'Completed' | 'Pending' | 'Cancelled'
                      )
                    }
                    className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Search reference, investor, method..."
                    className="pl-8 pr-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Reference</th>
                      <th className="px-4 py-3 font-semibold">Investor</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Details</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAllTxs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          No matching transactions found.
                        </td>
                      </tr>
                    ) : (
                      filteredAllTxs.map((tx) => {
                        const owner = store.users.find((u) => u.id === tx.userId);
                        return (
                          <tr key={tx.id}>
                            <td className="px-4 py-3 font-mono">{tx.id}</td>
                            <td className="px-4 py-3">{owner?.name || tx.userId}</td>
                            <td className="px-4 py-3">{tx.type}</td>
                            <td className="px-4 py-3">
                              <p>{tx.method}</p>
                              {tx.note && (
                                <p className="text-[11px] text-slate-500 truncate max-w-xs">
                                  {tx.note}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums font-semibold">
                              ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              <span
                                className={
                                  tx.status === 'Completed'
                                    ? 'text-emerald-600'
                                    : tx.status === 'Pending'
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-500">{tx.date}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 9. KYC APPLICATIONS                                            */}
          {/* ============================================================== */}
          {section === 'kyc' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  KYC Application(s)
                </h2>
                <div className="flex gap-1.5">
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setKycFilter(f)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                        kycFilter === f
                          ? 'bg-[#23446c] text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Investor</th>
                      <th className="px-4 py-3 font-semibold">Document</th>
                      <th className="px-4 py-3 font-semibold">Submitted</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredKycUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          No KYC applications match this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredKycUsers.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-slate-500">{item.email}</p>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {item.kycSubmission
                              ? `${item.kycSubmission.documentType} · ${item.kycSubmission.documentNumber}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">
                            {item.kycSubmission?.submittedAt || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded font-semibold ${
                                item.kycStatus === 'Approved'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                  : item.kycStatus === 'Pending'
                                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {item.kycStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.kycSubmission && (
                              <button
                                type="button"
                                onClick={() => onInspectKyc(item)}
                                className="bg-[#23446c] hover:bg-[#1c3657] text-white px-3 py-1.5 rounded inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Inspect &amp; Decide
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 10. SETTINGS                                                   */}
          {/* ============================================================== */}
          {section === 'settings' && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  Settings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure live AssetCrest Admin branding, registration rules, referral commission, and global ROI engine controls.
                </p>
              </div>

              <form
                onSubmit={handleSaveSettings}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={settingsForm.platformName}
                      onChange={(e) =>
                        setSettingsForm((p) => ({ ...p, platformName: e.target.value }))
                      }
                      className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      Referral Bonus (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={settingsForm.referralBonusPct}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          referralBonusPct: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Admin Welcome Quote
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.welcomeQuote}
                    onChange={(e) =>
                      setSettingsForm((p) => ({ ...p, welcomeQuote: e.target.value }))
                    }
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Investor Announcement / Maintenance Notice (optional)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.maintenanceNotice}
                    onChange={(e) =>
                      setSettingsForm((p) => ({ ...p, maintenanceNotice: e.target.value }))
                    }
                    placeholder="Leave blank when normal operations are active"
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="p-3 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        Global Automatic ROI Engine
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Auto-settle 24h investment cycles across plans
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.autoRoiGlobalEnabled}
                      onChange={(e) =>
                        setSettingsForm((p) => ({ ...p, autoRoiGlobalEnabled: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#23446c]"
                    />
                  </label>

                  <label className="p-3 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        Allow New Registrations
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Enable or pause public investor sign-ups
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.allowNewRegistrations}
                      onChange={(e) =>
                        setSettingsForm((p) => ({ ...p, allowNewRegistrations: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#23446c]"
                    />
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Last updated: {store.platformSettings.updatedAt}
                  </span>
                  <button
                    type="submit"
                    className="bg-[#23446c] hover:bg-[#1c3657] text-white font-semibold px-5 py-2.5 rounded inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* 11. PLATFORM ADMINISTRATION                                    */}
          {/* ============================================================== */}
          {section === 'platform' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  Platform Administration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Operator directory, full system Activity Log, and referral tracking location telemetry.
                </p>
              </div>

              {/* Admin Operators */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#23446c] dark:text-sky-400" />
                  Administrator Operators
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {store.users
                    .filter((u) => u.role === 'admin')
                    .map((adm) => (
                      <div
                        key={adm.id}
                        className="p-3 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{adm.name}</p>
                          <p className="text-[11px] text-slate-500">{adm.email}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                          Admin
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Full Activity Log */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    System Activity Log ({filteredActivities.length})
                  </h3>
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      placeholder="Filter activity..."
                      className="pl-8 pr-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                {filteredActivities.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No activity records logged yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                    {filteredActivities.map((act) => (
                      <div key={act.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">
                            {act.action}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {act.actorName} · {act.detail}
                          </p>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">{act.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visitor Location Telemetry */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <MapPin className="h-4 w-4 text-[#23446c] dark:text-sky-400 shrink-0" />
                    <span>
                      Referral Link Visitor Location Telemetry (<code className="font-mono">?ref=...</code>)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      captureVisitorLocationForAdmin(
                        'ADMIN-TEST',
                        `${window.location.origin}/?ref=${user.referralCode}`,
                        (entry) => {
                          if (isCloudMode) {
                            void cloudLogVisitorLocation(user.id, entry).catch(() => {
                              queuePendingLocationLog(entry);
                            });
                          } else {
                            queuePendingLocationLog(entry);
                          }
                        }
                      );
                      onNotify('Captured current browser click telemetry into Admin Location Log.', 'success');
                    }}
                    className="bg-[#23446c] hover:bg-[#1c3657] text-white text-xs font-medium px-3.5 py-2 rounded inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    Capture Test Link Visit
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Timestamp</th>
                        <th className="px-4 py-3 font-semibold">Ref Code</th>
                        <th className="px-4 py-3 font-semibold">Coordinates</th>
                        <th className="px-4 py-3 font-semibold">Timezone &amp; Accuracy</th>
                        <th className="px-4 py-3 font-semibold">Device</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {store.locationLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                            No referral link clicks captured yet.
                          </td>
                        </tr>
                      ) : (
                        store.locationLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-3 font-mono tabular-nums">{log.timestamp}</td>
                            <td className="px-4 py-3 font-mono font-bold text-[#23446c] dark:text-sky-400">
                              {log.refCode}
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums">
                              {log.latitude}, {log.longitude}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold">{log.timezone}</p>
                              <p className="text-[11px] text-slate-500">{log.accuracyLabel}</p>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-slate-500 max-w-xs truncate">
                              {log.deviceSummary}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section === 'automation' && (
            <AdminAutomationPanel
              adminEmail={user.email}
              isCloudMode={isCloudMode}
              onOpenAuthModal={onOpenAuthModal}
              onNotify={onNotify}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Investment Plan Modal */}
      {addPlanOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-[#23446c] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingPlanId ? 'Edit Investment Plan' : 'Add New Investment Plan'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setAddPlanOpen(false);
                  setEditingPlanId(null);
                }}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={newPlanCategory}
                  onChange={(e) =>
                    setNewPlanCategory(e.target.value as 'Standard' | 'Vacation' | 'Real Estate')
                  }
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                >
                  <option value="Standard">Standard Plan</option>
                  <option value="Vacation">Vacation Portal</option>
                  <option value="Real Estate">Real Estate Plan</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. Prime, Executive, Masters"
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Daily ROI (%)</label>
                  <input
                    type="text"
                    required
                    value={newPlanRate}
                    onChange={(e) => setNewPlanRate(e.target.value)}
                    placeholder="1.36%"
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPlanDays}
                    onChange={(e) => setNewPlanDays(e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Calculated Monthly ROI (30d)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {((parseFloat(newPlanRate.replace('%', '')) || 0) * 30).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Minimum Deposit ($)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPlanMin}
                    onChange={(e) => setNewPlanMin(e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Maximum Deposit ($)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPlanMax}
                    onChange={(e) => setNewPlanMax(e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>
              </div>
              {newPlanCategory !== 'Standard' && (
                <div>
                  <label className="block font-semibold mb-1">
                    {newPlanCategory === 'Vacation' ? 'Batch / Destination' : 'Property Location'}
                  </label>
                  <input
                    type="text"
                    value={newPlanMeta}
                    onChange={(e) => setNewPlanMeta(e.target.value)}
                    placeholder={
                      newPlanCategory === 'Vacation'
                        ? 'e.g. Batch A: Spring'
                        : 'e.g. London & Manchester, UK'
                    }
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  />
                </div>
              )}
              <label className="flex items-center justify-between pt-1 cursor-pointer">
                <span className="font-semibold">Publish as Active Plan</span>
                <input
                  type="checkbox"
                  checked={newPlanActive}
                  onChange={(e) => setNewPlanActive(e.target.checked)}
                  className="h-4 w-4 accent-[#23446c]"
                />
              </label>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAddPlanOpen(false);
                    setEditingPlanId(null);
                  }}
                  className="px-4 py-2 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#23446c] hover:bg-[#1c3657] text-white font-semibold cursor-pointer"
                >
                  {editingPlanId ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Crypto Wallet Modal */}
      {walletModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-[#23446c] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold">
                  {editingWalletId ? 'Edit Crypto Payment Wallet' : 'Add Crypto Payment Wallet'}
                </h3>
                <p className="text-[11px] text-white/75">
                  Manual crypto wallet assignment, network instructions & deposit thresholds
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWalletModalOpen(false);
                  setEditingWalletId(null);
                }}
                aria-label="Close wallet modal"
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWallet} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Cryptocurrency</label>
                  <select
                    value={walletPresetCrypto}
                    onChange={(e) => handleSelectWalletPreset(e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  >
                    <option value="Bitcoin">Bitcoin (BTC)</option>
                    <option value="Ethereum">Ethereum (ETH)</option>
                    <option value="USDT">USDT (Tether)</option>
                    <option value="USDC">USDC (USD Coin)</option>
                    <option value="BNB">BNB</option>
                    <option value="Solana">Solana (SOL)</option>
                    <option value="Ripple">Ripple (XRP)</option>
                    <option value="Other">Other Cryptocurrency</option>
                  </select>
                </div>

                {walletPresetCrypto === 'Other' && (
                  <div>
                    <label className="block font-semibold mb-1">Custom Crypto Name</label>
                    <input
                      type="text"
                      required
                      value={walletCustomCrypto}
                      onChange={(e) => setWalletCustomCrypto(e.target.value)}
                      placeholder="e.g. Litecoin, Polygon, Tron"
                      className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1">Ticker Symbol</label>
                  <input
                    type="text"
                    required
                    value={walletSymbolInput}
                    onChange={(e) => setWalletSymbolInput(e.target.value.toUpperCase())}
                    placeholder="e.g. BTC, ETH, LTC"
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={walletStatusInput}
                    onChange={(e) => setWalletStatusInput(e.target.value as WalletStatus)}
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-semibold"
                  >
                    <option value="Active">Active (Available to investors)</option>
                    <option value="Maintenance">Maintenance (Paused with notice)</option>
                    <option value="Inactive">Inactive (Hidden from deposit page)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Blockchain / Network</label>
                  <input
                    type="text"
                    required
                    value={walletNetworkInput}
                    onChange={(e) => setWalletNetworkInput(e.target.value)}
                    placeholder="e.g. BTC Mainnet, ERC20, TRC20, BEP20"
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['BTC Mainnet', 'ERC20', 'TRC20', 'BEP20', 'Polygon', 'Arbitrum', 'SOL'].map(
                      (net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setWalletNetworkInput(net)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          {net}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Wallet Label</label>
                  <input
                    type="text"
                    required
                    value={walletLabelInput}
                    onChange={(e) => setWalletLabelInput(e.target.value)}
                    placeholder="e.g. USDT TRC20 Desk #1"
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Wallet Address</label>
                <input
                  type="text"
                  required
                  value={walletAddressInput}
                  onChange={(e) => setWalletAddressInput(e.target.value)}
                  placeholder="Paste destination deposit address"
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Minimum Deposit ($ USD)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={walletMinDepositInput}
                    onChange={(e) => setWalletMinDepositInput(e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Maximum Deposit ($ USD)</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={walletMaxDepositInput}
                    onChange={(e) => setWalletMaxDepositInput(e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Deposit Instructions</label>
                <textarea
                  rows={2}
                  value={walletInstructionsInput}
                  onChange={(e) => setWalletInstructionsInput(e.target.value)}
                  placeholder="Network confirmations, tag/memo requirements, receipt instructions..."
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                />
              </div>

              {/* Manual Assignment Scope */}
              <div className="p-3 rounded border border-slate-200 dark:border-slate-700 space-y-2.5 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    Investor Assignment Scope
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setWalletAssignScope('global')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        walletAssignScope === 'global'
                          ? 'bg-[#23446c] text-white'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      All Investors (Global)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletAssignScope('specific')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        walletAssignScope === 'specific'
                          ? 'bg-[#23446c] text-white'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Specific Users ({walletAssignedUserIds.length})
                    </button>
                  </div>
                </div>

                {walletAssignScope === 'specific' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={walletUserSearch}
                      onChange={(e) => setWalletUserSearch(e.target.value)}
                      placeholder="Filter investors by name or email..."
                      className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                    />
                    <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      {store.users
                        .filter((u) => {
                          if (!walletUserSearch.trim()) return true;
                          const q = walletUserSearch.trim().toLowerCase();
                          return (
                            u.name.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q)
                          );
                        })
                        .map((u) => {
                          const checked = walletAssignedUserIds.includes(u.id);
                          return (
                            <label
                              key={u.id}
                              className="px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                              <span className="truncate">
                                <strong>{u.name}</strong>{' '}
                                <span className="text-slate-500">({u.email})</span>
                              </span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setWalletAssignedUserIds((prev) => [...prev, u.id]);
                                  } else {
                                    setWalletAssignedUserIds((prev) =>
                                      prev.filter((id) => id !== u.id)
                                    );
                                  }
                                }}
                                className="h-3.5 w-3.5 accent-[#23446c]"
                              />
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {editingWalletId && (() => {
                const current = store.cryptoWallets.find((w) => w.id === editingWalletId);
                if (!current) return null;
                return (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1 font-mono bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded">
                    <span>Created: {current.createdAt}</span>
                    <span>Updated: {current.updatedAt}</span>
                    <span>
                      Admin: {current.updatedByAdminName} ({current.updatedByAdminEmail})
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setWalletModalOpen(false);
                    setEditingWalletId(null);
                  }}
                  className="px-4 py-2 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#23446c] hover:bg-[#1c3657] text-white font-semibold cursor-pointer"
                >
                  {editingWalletId ? 'Save Wallet Changes' : 'Create Payment Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Inspection & Balance Adjustment Modal */}
      {inspectedUser && (() => {
        const userInvestments = store.investments.filter((i) => i.userId === inspectedUser.id);
        const userTransactions = store.transactions.filter((t) => t.userId === inspectedUser.id);
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="bg-[#23446c] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{inspectedUser.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inspectedUser.accountStatus === 'Blocked'
                          ? 'bg-rose-500 text-white'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {inspectedUser.accountStatus ?? 'Active'}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/75">{inspectedUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedUser(null)}
                  aria-label="Close inspector"
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-5 text-xs overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <p>
                      <span className="text-slate-500">Referral Code:</span>{' '}
                      <strong className="font-mono">{inspectedUser.referralCode}</strong>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="text-slate-500">Total Deposited:</span>{' '}
                      <strong className="font-mono tabular-nums">
                        ${inspectedUser.totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </strong>
                    </p>
                    <p>
                      <span className="text-slate-500">Ownership / KYC:</span>{' '}
                      <strong>
                        {inspectedUser.accountType} · {inspectedUser.kycStatus}
                      </strong>
                      {inspectedUser.lastLoginAt && (
                        <>
                          <span className="mx-2 text-slate-300">|</span>
                          <span className="text-slate-500">Last Session:</span>{' '}
                          <span className="font-mono">{inspectedUser.lastLoginAt}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(inspectedUser.kycSubmission || inspectedUser.kycStatus !== 'Unverified') && (
                      <button
                        type="button"
                        onClick={() => {
                          onInspectKyc(inspectedUser);
                        }}
                        className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                        Inspect KYC
                      </button>
                    )}
                    {inspectedUser.id !== user.id && (
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(inspectedUser)}
                        className={`px-3 py-1.5 rounded font-semibold inline-flex items-center gap-1 cursor-pointer ${
                          inspectedUser.accountStatus === 'Blocked'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                      >
                        {inspectedUser.accountStatus === 'Blocked' ? (
                          <>
                            <Unlock className="h-3.5 w-3.5" /> Unblock Account
                          </>
                        ) : (
                          <>
                            <Ban className="h-3.5 w-3.5" /> Block Account
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSaveUserAdjustments} className="space-y-3">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    Account Ledger Adjustment
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Balance ($)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={editBalanceInput}
                        onChange={(e) => setEditBalanceInput(e.target.value)}
                        className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Total Profit ($)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={editProfitInput}
                        onChange={(e) => setEditProfitInput(e.target.value)}
                        className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Bonus ($)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={editBonusInput}
                        onChange={(e) => setEditBonusInput(e.target.value)}
                        className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded bg-[#23446c] hover:bg-[#1c3657] text-white font-semibold cursor-pointer"
                    >
                      Save Balances
                    </button>
                  </div>
                </form>

                {/* User Active & Completed Investments */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      Investments ({userInvestments.length})
                    </p>
                  </div>
                  {userInvestments.length === 0 ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      No active or historical investments for this account.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded">
                      {userInvestments.slice(0, 5).map((inv) => {
                        const snap = getInvestmentRoiSnapshot(inv, roiClockMs);
                        return (
                          <div
                            key={inv.id}
                            className="px-3 py-2 flex items-center justify-between gap-2"
                          >
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">
                                {inv.planName}{' '}
                                <span className="font-mono text-[10px] text-slate-500">
                                  ({inv.dailyRate}/d)
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Status: {inv.status} · Started {inv.startedAt}
                              </p>
                            </div>
                            <div className="text-right font-mono tabular-nums">
                              <p className="font-bold text-slate-800 dark:text-slate-100">
                                ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                +${snap.earnedSoFar.toFixed(2)} ROI
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent User Transactions */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    Recent Transactions ({userTransactions.length})
                  </p>
                  {userTransactions.length === 0 ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      No transactions recorded for this account.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded">
                      {userTransactions.slice(0, 5).map((tx) => (
                        <div
                          key={tx.id}
                          className="px-3 py-2 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {tx.type} · {tx.method}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500">
                              {tx.id} · {tx.date} · {tx.status}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-100">
                              ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              type="button"
                              onClick={() => onInspectReceipt(tx)}
                              title="Inspect receipt"
                              className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manually Assigned Dedicated Crypto Wallets */}
                {(() => {
                  const dedicatedWallets = store.cryptoWallets.filter(
                    (w) => w.assignedUserIds && w.assignedUserIds.includes(inspectedUser.id)
                  );
                  return (
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          Dedicated Crypto Wallets ({dedicatedWallets.length})
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = inspectedUser.id;
                            setInspectedUser(null);
                            navigateSection('wallets');
                            openCreateWalletModal(targetId);
                          }}
                          className="text-[11px] font-semibold text-[#23446c] dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          Assign Dedicated Wallet
                        </button>
                      </div>
                      {dedicatedWallets.length === 0 ? (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Uses global Active payment wallets. Click &ldquo;Assign Dedicated Wallet&rdquo; to bind a custom address to this user.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded">
                          {dedicatedWallets.map((w) => (
                            <div
                              key={w.id}
                              className="px-3 py-2 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                  {w.label} · {w.cryptocurrency} ({w.network})
                                </p>
                                <p className="text-[10px] font-mono text-slate-500 truncate">
                                  {w.address}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                                  w.status === 'Active'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                    : w.status === 'Maintenance'
                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {w.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInspectedUser(null)}
                    className="px-4 py-1.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
