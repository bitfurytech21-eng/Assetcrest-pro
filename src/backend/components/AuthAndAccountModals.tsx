'use client';

import React, { useState } from 'react';
import Image from '@/src/backend/components/NextImageShim';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UserPlus,
  LogIn,
  KeyRound,
  Users,
  User,
  Upload,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle,
  Lock,
  Cloud,
  CloudOff,
} from 'lucide-react';
import {
  AccountType,
  appendActivityLog,
  appendSessionLog,
  AssetCrestStore,
  EMPTY_CRYPTO_BALANCES,
  formatNowStamp,
  nextRecordId,
  readAndCompressFile,
  TransactionRecord,
  updateAssetCrestStore,
  UserAccount,
  PageTab,
} from '@/src/backend/lib/assetcrest-store';
import { signOutCloud } from '@/src/backend/lib/firebase';
import { EmptyState, ErrorAlertBanner } from '@/src/backend/components/UIStates';

interface AuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onAuthSuccess?: () => void;
  store: AssetCrestStore;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
  isCloudMode?: boolean;
  cloudEmail?: string | null;
}

export function AuthModal({
  open,
  initialMode = 'login',
  onClose,
  onAuthSuccess,
  store,
  onNotify,
  isCloudMode = false,
  cloudEmail = null,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAccountType, setRegAccountType] = useState<AccountType>('Individual');
  const [coOwnerName, setCoOwnerName] = useState('');
  const [coOwnerEmail, setCoOwnerEmail] = useState('');
  const [coOwnerRelationship, setCoOwnerRelationship] = useState('Spouse');
  const [authMode, setAuthMode] = useState<'Either Owner' | 'Dual Notice'>('Either Owner');
  const [regAvatar, setRegAvatar] = useState<string>('');

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<'email' | 'verify'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedResetCode, setGeneratedResetCode] = useState('');
  const [enteredResetCode, setEnteredResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  if (!open) return null;

  const handleGoogleSignOut = async () => {
    setAuthError('');
    setCloudBusy(true);
    try {
      await signOutCloud();
      onNotify('Signed out of Google Cloud Sync. Returned to Single-Device Demo mode.', 'info');
      onClose();
    } catch {
      const errMsg = 'Failed to sign out cleanly.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
    } finally {
      setCloudBusy(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      const errMsg = 'Please choose an image file for your profile photo.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    try {
      const dataUrl = await readAndCompressFile(file, 180, 100000);
      setRegAvatar(dataUrl);
      setAuthError('');
    } catch {
      const errMsg = 'Could not process profile photo.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const target = store.users.find(
      (u) => u.email.trim().toLowerCase() === loginEmail.trim().toLowerCase()
    );
    if (!target || target.password !== loginPassword) {
      const errMsg = 'Invalid email or password. Please verify your credentials or select a demo account below.';
      setAuthError(errMsg);
      onNotify('Invalid email or password.', 'error');
      return;
    }
    if (target.accountStatus === 'Blocked') {
      const errMsg = 'This account has been blocked by Platform Administration. Contact support@assetcrest.co.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    const stamp = formatNowStamp();
    updateAssetCrestStore((prev) => ({
      ...prev,
      activeUserId: target.id,
      users: prev.users.map((u) => (u.id === target.id ? { ...u, lastLoginAt: stamp } : u)),
      sessionLogs: appendSessionLog(prev, target),
      activityLogs: appendActivityLog(prev, {
        actorId: target.id,
        actorName: target.name,
        action:
          target.role === 'admin'
            ? 'Admin dashboard logged in to account'
            : 'Logged in to account',
        category: 'auth',
        detail: target.email,
      }),
    }));
    onNotify(`Signed in as ${target.name}.`, 'success');
    onAuthSuccess?.();
    onClose();
  };

  const handleQuickSwitch = (user: UserAccount) => {
    setAuthError('');
    if (user.accountStatus === 'Blocked') {
      const errMsg = `${user.name} is currently blocked. Unblock from Manage Users before switching.`;
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    const stamp = formatNowStamp();
    updateAssetCrestStore((prev) => ({
      ...prev,
      activeUserId: user.id,
      users: prev.users.map((u) => (u.id === user.id ? { ...u, lastLoginAt: stamp } : u)),
      sessionLogs: appendSessionLog(prev, user),
      activityLogs: appendActivityLog(prev, {
        actorId: user.id,
        actorName: user.name,
        action:
          user.role === 'admin'
            ? 'Admin dashboard logged in to account'
            : 'Logged in to account',
        category: 'auth',
        detail: user.email,
      }),
    }));
    onNotify(`Switched active session to ${user.name}.`, 'success');
    onAuthSuccess?.();
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!store.platformSettings.allowNewRegistrations) {
      const errMsg = 'New investor registrations are currently paused by Platform Administration.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      const errMsg = 'Please complete all required registration fields.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    if (regPassword.length < 6) {
      const errMsg = 'Password must be at least 6 characters long.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      const errMsg = 'Passwords do not match.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    const exists = store.users.some(
      (u) => u.email.trim().toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (exists) {
      const errMsg = 'An account with this email already exists.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    if (regAccountType === 'Joint' && (!coOwnerName.trim() || !coOwnerEmail.trim())) {
      const errMsg = 'Please enter co-owner name and email for a Joint Account.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }

    const newId = nextRecordId('USR');
    const cleanRefPrefix = regName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    const refSuffix = newId.split('-')[1] || '101';

    const newUser: UserAccount = {
      id: newId,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: 'investor',
      accountType: regAccountType,
      jointDetails:
        regAccountType === 'Joint'
          ? {
              coOwnerName: coOwnerName.trim(),
              coOwnerEmail: coOwnerEmail.trim().toLowerCase(),
              relationship: coOwnerRelationship,
              authorizationMode: authMode,
            }
          : undefined,
      avatarDataUrl: regAvatar || undefined,
      referralCode: `${cleanRefPrefix || 'INVESTOR'}${refSuffix}`,
      accountBalance: 0,
      totalProfit: 0,
      bonus: 0,
      referralBonus: 0,
      totalDeposit: 0,
      cryptoBalances: { ...EMPTY_CRYPTO_BALANCES },
      kycStatus: 'Unverified',
      createdAt: formatNowStamp().slice(0, 10),
      accountStatus: 'Active',
      lastLoginAt: formatNowStamp(),
    };

    updateAssetCrestStore((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      activeUserId: newUser.id,
      welcomeModalUserId: newUser.id,
      sessionLogs: appendSessionLog(prev, newUser),
      activityLogs: appendActivityLog(prev, {
        actorId: newUser.id,
        actorName: newUser.name,
        action: 'Registered new investor account',
        category: 'user',
        detail: `${newUser.email} (${newUser.accountType})`,
      }),
    }));

    onNotify('Registration successful! Welcome to AssetCrest.', 'success');
    onAuthSuccess?.();
    onClose();
  };

  const handleRequestResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const user = store.users.find(
      (u) => u.email.trim().toLowerCase() === forgotEmail.trim().toLowerCase()
    );
    if (!user) {
      const errMsg = 'No AssetCrest account found with that email address.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedResetCode(code);
    setForgotStep('verify');
    onNotify('Recovery verification code generated below.', 'info');
  };

  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (enteredResetCode.trim() !== generatedResetCode) {
      const errMsg = 'Verification code does not match.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    if (resetNewPassword.length < 6) {
      const errMsg = 'New password must be at least 6 characters.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      const errMsg = 'New passwords do not match.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }

    const emailKey = forgotEmail.trim().toLowerCase();
    const matched = store.users.find((u) => u.email.toLowerCase() === emailKey);
    if (!matched) {
      const errMsg = 'Account could not be found.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
      return;
    }

    updateAssetCrestStore((prev) => ({
      ...prev,
      activeUserId: matched.id,
      users: prev.users.map((u) =>
        u.id === matched.id ? { ...u, password: resetNewPassword } : u
      ),
    }));

    onNotify('Password updated and account unlocked.', 'success');
    onAuthSuccess?.();
    onClose();
  };

  return (
    <div className="ac-modal-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="ac-modal-panel max-w-lg my-auto"
      >
        <div className="ac-modal-header">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sky-300 shrink-0" />
            <h3 className="ac-section-title text-white tracking-tight">AssetCrest Account Access</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/15 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setAuthError('');
            }}
            className={`py-3 inline-flex items-center justify-center gap-1.5 cursor-pointer transition ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-[#2b4865] dark:text-sky-300 border-b-2 border-[#2b4865] dark:border-sky-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setAuthError('');
            }}
            className={`py-3 inline-flex items-center justify-center gap-1.5 cursor-pointer transition ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-[#2b4865] dark:text-sky-300 border-b-2 border-[#2b4865] dark:border-sky-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Register</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setForgotStep('email');
              setAuthError('');
            }}
            className={`py-3 inline-flex items-center justify-center gap-1.5 cursor-pointer transition ${
              mode === 'forgot'
                ? 'bg-white dark:bg-slate-900 text-[#2b4865] dark:text-sky-300 border-b-2 border-[#2b4865] dark:border-sky-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Forgot Password</span>
          </button>
        </div>

        {isCloudMode && (
          <div className="px-5 pt-4 pb-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-7 w-7 rounded-full bg-[var(--ac-success-bg)] border border-[var(--ac-success-border)] text-[var(--ac-success-text)] flex items-center justify-center shrink-0">
                  <Cloud className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-bold text-[var(--ac-success-text)]">
                    Firebase Cloud Sync Active
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[230px]">
                    {cloudEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={cloudBusy}
                onClick={handleGoogleSignOut}
                className="ac-btn ac-btn-secondary ac-btn-sm"
              >
                <CloudOff className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        <div className="p-5 max-h-[68vh] overflow-y-auto space-y-5">
          {authError && (
            <ErrorAlertBanner
              message={authError}
              onDismiss={() => setAuthError('')}
            />
          )}

          {mode === 'login' && (
            <>
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`ac-input ${authError ? 'ac-input-error' : ''}`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotEmail(loginEmail);
                        setForgotStep('email');
                        setAuthError('');
                      }}
                      className="text-xs font-medium text-[#2b4865] dark:text-sky-300 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className={`ac-input ${authError ? 'ac-input-error' : ''}`}
                  />
                </div>
                <button type="submit" className="ac-btn ac-btn-primary ac-btn-md w-full">
                  Sign In to Account
                </button>
              </form>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Quick Single-Device Demo Account Switcher
                </p>
                <div className="space-y-2">
                  {store.users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickSwitch(u)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                        store.activeUserId === u.id
                          ? 'border-[#2b4865] bg-[#2b4865]/5 dark:border-sky-400 dark:bg-sky-500/10'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                          <span>{u.name}</span>
                          {u.role === 'admin' && (
                            <span className="ac-badge ac-badge-warning">ADMIN</span>
                          )}
                          {u.accountType === 'Joint' && (
                            <span className="ac-badge ac-badge-info">JOINT</span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{u.email}</p>
                      </div>
                      <span className="font-mono tabular-nums font-semibold text-[#2b4865] dark:text-sky-300">
                        ${u.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Account Ownership Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegAccountType('Individual')}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      regAccountType === 'Individual'
                        ? 'border-[#2b4865] bg-[#2b4865]/5 dark:border-sky-400 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-slate-100">
                      <User className="h-4 w-4 text-[#2b4865] dark:text-sky-400" />
                      <span>Individual Account</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Single primary investor
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegAccountType('Joint')}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      regAccountType === 'Joint'
                        ? 'border-[#2b4865] bg-[#2b4865]/5 dark:border-sky-400 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-slate-100">
                      <Users className="h-4 w-4 text-[#2b4865] dark:text-sky-400" />
                      <span>Joint Account</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Shared with co-owner
                    </p>
                  </button>
                </div>
              </div>

              {/* Optional Profile Picture */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <div className="h-12 w-12 rounded-full bg-[#2b4865] text-white flex items-center justify-center font-bold overflow-hidden shrink-0">
                  {regAvatar ? (
                    <Image
                      src={regAvatar}
                      alt="Profile avatar preview"
                      width={48}
                      height={48}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 object-cover"
                    />
                  ) : (
                    <span>{(regName.trim()[0] || 'A').toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Profile Picture (Optional)
                  </p>
                  <label className="inline-flex items-center gap-1.5 mt-1 text-xs text-[#2b4865] dark:text-sky-300 font-medium cursor-pointer hover:underline">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{regAvatar ? 'Change Photo' : 'Upload Avatar Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Primary Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Sophia Carter"
                    className="ac-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="sophia@domain.com"
                    className="ac-input"
                  />
                </div>
              </div>

              {regAccountType === 'Joint' && (
                <div className="p-3.5 rounded-lg border border-[var(--ac-info-border)] bg-[var(--ac-info-bg)] space-y-3">
                  <p className="text-xs font-bold text-[var(--ac-info-text)] flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>Joint Co-Owner Details</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={coOwnerName}
                      onChange={(e) => setCoOwnerName(e.target.value)}
                      placeholder="Co-owner Full Name"
                      className="ac-input ac-input-sm"
                    />
                    <input
                      type="email"
                      required
                      value={coOwnerEmail}
                      onChange={(e) => setCoOwnerEmail(e.target.value)}
                      placeholder="Co-owner Email"
                      className="ac-input ac-input-sm"
                    />
                    <select
                      value={coOwnerRelationship}
                      onChange={(e) => setCoOwnerRelationship(e.target.value)}
                      className="ac-select ac-input-sm"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Business Partner">Business Partner</option>
                      <option value="Family Member">Family Member</option>
                      <option value="Co-Trustee">Trust Co-Trustee</option>
                    </select>
                    <select
                      value={authMode}
                      onChange={(e) =>
                        setAuthMode(e.target.value as 'Either Owner' | 'Dual Notice')
                      }
                      className="ac-select ac-input-sm"
                    >
                      <option value="Either Owner">Either Owner Can Transact</option>
                      <option value="Dual Notice">Dual Owner Notification</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create password"
                    className="ac-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="ac-input"
                  />
                </div>
              </div>

              <button type="submit" className="ac-btn ac-btn-primary ac-btn-md w-full">
                Create {regAccountType} Account
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <div className="space-y-4">
              {forgotStep === 'email' ? (
                <form onSubmit={handleRequestResetCode} className="space-y-3.5">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Enter your registered AssetCrest email address to generate a 6-digit password recovery code.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Registered Email
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="bitfurytech21@gmail.com"
                      className="ac-input"
                    />
                  </div>
                  <button type="submit" className="ac-btn ac-btn-primary ac-btn-md w-full">
                    Send Recovery Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteReset} className="space-y-3.5">
                  <div className="ac-alert ac-alert-success">
                    <div>
                      Single-Device Recovery Code for <strong>{forgotEmail}</strong>:{' '}
                      <span className="font-mono font-bold text-sm tracking-widest ml-1">
                        {generatedResetCode}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      value={enteredResetCode}
                      onChange={(e) => setEnteredResetCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="ac-input font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="ac-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className="ac-input"
                      />
                    </div>
                  </div>
                  <button type="submit" className="ac-btn ac-btn-primary ac-btn-md w-full">
                    Verify &amp; Reset Password
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface WelcomeModalProps {
  user: UserAccount | null;
  onDismiss: () => void;
  onNavigate: (tab: PageTab) => void;
}

export function WelcomeRegistrationModal({ user, onDismiss, onNavigate }: WelcomeModalProps) {
  if (!user) return null;

  return (
    <AnimatePresence>
      <div className="ac-modal-backdrop">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94 }}
          className="ac-modal-panel max-w-md"
        >
          <div className="bg-[var(--ac-bg-header)] border-b border-[var(--ac-header-border)] text-white p-6 text-center space-y-2 relative">
            <div className="mx-auto h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-amber-300" />
            </div>
            <h3 className="ac-section-title text-white">Welcome to AssetCrest, {user.name}!</h3>
            <p className="text-xs text-slate-200">
              {user.accountType === 'Joint' && user.jointDetails
                ? `Your Joint Investor Account with ${user.jointDetails.coOwnerName} is now active and secured.`
                : 'Your Individual Investor Account has been created and secured.'}
            </p>
          </div>

          <div className="p-5 space-y-4 text-sm text-slate-700 dark:text-slate-200">
            <p className="leading-relaxed">
              We are delighted to have you on board. Complete these quick steps to unlock your full AssetCrest experience:
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onNavigate('deposit');
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2b4865] dark:hover:border-sky-400 transition text-left cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    1. Fund Your Account
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Deposit via 8 crypto rails and upload your payment receipt
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#2b4865] dark:text-sky-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onNavigate('kyc');
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2b4865] dark:hover:border-sky-400 transition text-left cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    2. Pass KYC Verification
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Required before making any withdrawals from your wallet
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#2b4865] dark:text-sky-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onNavigate('vacation-portal');
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2b4865] dark:hover:border-sky-400 transition text-left cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    3. Explore Vacation ($5,000+) &amp; Real Estate Portals
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Access specialized wealth &amp; lifestyle yield tiers
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#2b4865] dark:text-sky-400 shrink-0" />
              </button>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="ac-btn ac-btn-primary ac-btn-md w-full"
            >
              Go to My Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function ReceiptPreviewModal({
  transaction,
  onClose,
}: {
  transaction: TransactionRecord | null;
  onClose: () => void;
}) {
  if (!transaction) return null;

  const isPdf = transaction.proofDataUrl?.startsWith('data:application/pdf');

  return (
    <div className="ac-modal-backdrop">
      <div className="ac-modal-panel max-w-md">
        <div className="ac-modal-header">
          <h3 className="ac-section-title text-white">Payment Receipt — {transaction.id}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt modal"
            className="p-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/15 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3.5 text-xs">
          <div className="flex justify-between text-slate-700 dark:text-slate-200">
            <span>Method: {transaction.method}</span>
            <span className="font-mono font-bold tabular-nums">
              ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {transaction.proofDataUrl ? (
            isPdf ? (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center space-y-2.5">
                <FileText className="h-8 w-8 mx-auto text-[#2b4865] dark:text-sky-400" />
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {transaction.proofName || 'receipt.pdf'}
                </p>
                <a
                  href={transaction.proofDataUrl}
                  download={transaction.proofName || 'payment-receipt.pdf'}
                  className="ac-btn ac-btn-primary ac-btn-sm"
                >
                  Download PDF Receipt
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 flex justify-center p-2">
                <Image
                  src={transaction.proofDataUrl}
                  alt={transaction.proofName || 'Payment Receipt'}
                  width={420}
                  height={420}
                  referrerPolicy="no-referrer"
                  className="max-h-80 w-auto object-contain rounded"
                />
              </div>
            )
          ) : (
            <EmptyState
              compact
              icon={AlertCircle}
              title="No Preview Image Attached"
              description={`Receipt file recorded (${transaction.proofName || 'N/A'}), without an embedded preview image.`}
              actionLabel="Close Preview"
              onAction={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function KycInspectModal({
  user,
  onClose,
  onApprove,
  onReject,
}: {
  user: UserAccount | null;
  onClose: () => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState('Document details unclear or mismatched');

  if (!user || !user.kycSubmission) return null;
  const sub = user.kycSubmission;

  return (
    <div className="ac-modal-backdrop">
      <div className="ac-modal-panel max-w-lg my-auto">
        <div className="ac-modal-header">
          <div className="flex items-center gap-2">
            <Lock className="h-4.5 w-4.5 text-sky-300 shrink-0" />
            <h3 className="ac-section-title text-white">Admin KYC Inspection — {user.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close KYC inspection modal"
            className="p-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/15 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-slate-600 dark:text-slate-300 block">Legal Name</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{sub.legalName}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-300 block">Country</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{sub.country}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-300 block">Document Type</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{sub.documentType}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-300 block">Document Number</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {sub.documentNumber}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 space-y-1.5">
              <p className="font-semibold text-slate-700 dark:text-slate-200">ID Document Front</p>
              {sub.idFrontDataUrl ? (
                <Image
                  src={sub.idFrontDataUrl}
                  alt="ID Document"
                  width={240}
                  height={160}
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover rounded"
                />
              ) : (
                <div className="h-32 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  {sub.idFrontName}
                </div>
              )}
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 space-y-1.5">
              <p className="font-semibold text-slate-700 dark:text-slate-200">Verification Selfie</p>
              {sub.selfieDataUrl ? (
                <Image
                  src={sub.selfieDataUrl}
                  alt="Verification Selfie"
                  width={240}
                  height={160}
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover rounded"
                />
              ) : (
                <div className="h-32 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  {sub.selfieName}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Rejection Note (if rejecting)
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="ac-input ac-input-sm"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                onApprove(user.id);
                onClose();
              }}
              className="ac-btn ac-btn-success ac-btn-md flex-1 text-xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve KYC &amp; Unlock Withdrawals</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onReject(user.id, rejectReason);
                onClose();
              }}
              className="ac-btn ac-btn-destructive ac-btn-md px-4 text-xs"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
