'use client';

import React, { useState } from 'react';
import Image from '@/src/backend/components/NextImageShim';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UserPlus,
  LogIn,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle,
  Lock,
  Cloud,
  CloudOff,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import {
  appendActivityLog,
  appendSessionLog,
  AssetCrestStore,
  EMPTY_CRYPTO_BALANCES,
  formatNowStamp,
  nextRecordId,
  TransactionRecord,
  updateAssetCrestStore,
  UserAccount,
  PageTab,
} from '@/src/backend/lib/assetcrest-store';
import {
  neonClaimAdmin,
  neonForgotPassword,
  neonLogin,
  neonRegister,
  neonResetPassword,
  signOutCloud,
} from '@/src/backend/lib/neon-client';
import { EmptyState, ErrorAlertBanner } from '@/src/backend/components/UIStates';

const SIGNUP_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
  'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece',
  'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati',
  'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
  'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
  'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe',
];

function computePasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function getStrengthBarColor(score: number, index: number): string {
  if (index >= score) return 'bg-[#d8dde6]';
  if (score <= 1) return 'bg-red-500';
  if (score === 2) return 'bg-orange-500';
  if (score === 3) return 'bg-amber-500';
  if (score === 4) return 'bg-[#345485]';
  return 'bg-emerald-500';
}

function getInitialReferralParam(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || params.get('track') || '';
}

interface SignUpFormProps {
  store: AssetCrestStore;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
  onAuthSuccess?: () => void;
  onSwitchToSignIn: () => void;
  onErrorChange?: (err: string) => void;
  showInlineError?: boolean;
}

function SignUpFormFields({
  store,
  onNotify,
  onAuthSuccess,
  onSwitchToSignIn,
  onErrorChange,
  showInlineError = true,
}: SignUpFormProps) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [referralId, setReferralId] = useState(getInitialReferralParam);
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strengthScore = computePasswordStrength(password);

  const reportError = (msg: string) => {
    setFormError(msg);
    onErrorChange?.(msg);
    onNotify(msg, 'error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');
    onErrorChange?.('');

    if (!store.platformSettings.allowNewRegistrations) {
      reportError('New investor registrations are currently paused by Platform Administration.');
      return;
    }

    const cleanUsername = username.trim();
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();
    const cleanCountry = country.trim();
    const cleanReferral = referralId.trim();

    if (!cleanUsername || !cleanName || !cleanEmail || !cleanPhone || !cleanCountry || !password) {
      reportError('Please complete all required registration fields.');
      return;
    }

    if (cleanUsername.length < 3) {
      reportError('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 8) {
      reportError('Password must be 8 or more characters long.');
      return;
    }

    if (password !== repeatPassword) {
      reportError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await neonRegister({
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        country: cleanCountry,
        referredBy: cleanReferral || undefined,
        password,
      });

      const localFallbackUser: UserAccount = {
        ...created,
        password: '',
      };

      updateAssetCrestStore((prev) => ({
        ...prev,
        users: prev.users.some((u) => u.id === localFallbackUser.id)
          ? prev.users
          : [...prev.users, localFallbackUser],
        activeUserId: localFallbackUser.id,
        welcomeModalUserId: localFallbackUser.id,
        sessionLogs: appendSessionLog(prev, localFallbackUser),
        activityLogs: appendActivityLog(prev, {
          actorId: localFallbackUser.id,
          actorName: localFallbackUser.name,
          action: 'Registered new investor account',
          category: 'user',
          detail: `${localFallbackUser.email} (@${cleanUsername}, ${cleanCountry})`,
        }),
      }));

      onNotify('Registration successful! Welcome to AssetCrest.', 'success');
      onAuthSuccess?.();
    } catch (err: any) {
      reportError(err?.message || 'Unable to complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full h-14 sm:h-[76px] px-5 sm:px-7 rounded-xl border border-[#e2e8f0] bg-white text-[17px] sm:text-[24px] text-[#1e293b] placeholder:text-[#8b95a5] focus:outline-none focus:border-[#345485] focus:ring-2 focus:ring-[#345485]/15 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
      {showInlineError && formError && (
        <ErrorAlertBanner message={formError} onDismiss={() => setFormError('')} />
      )}

      <div>
        <input
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Unique Username"
          aria-label="Enter Unique Username"
          className={inputClass}
        />
      </div>

      <div>
        <input
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Fullname"
          aria-label="Fullname"
          className={inputClass}
        />
      </div>

      <div>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          aria-label="Email Address"
          className={inputClass}
        />
      </div>

      <div>
        <input
          type="tel"
          required
          autoComplete="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Phone Number"
          aria-label="Phone Number"
          className={inputClass}
        />
      </div>

      <div className="relative">
        <select
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label="Choose Country"
          className={`${inputClass} appearance-none pr-10 cursor-pointer ${
            country ? 'text-[#1e293b]' : 'text-[#334155]'
          }`}
        >
          <option value="">Choose Country</option>
          {SIGNUP_COUNTRIES.map((countryName) => (
            <option key={countryName} value={countryName}>
              {countryName}
            </option>
          ))}
        </select>
        <ChevronDown
          className="h-4 w-4 text-[#64748b] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
      </div>

      <div>
        <input
          type="text"
          value={referralId}
          onChange={(e) => setReferralId(e.target.value)}
          placeholder="Referral ID optional"
          aria-label="Referral ID optional"
          className={inputClass}
        />
      </div>

      <div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#8b95a5] hover:text-[#334155] transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-6 w-6 sm:h-7 sm:w-7" /> : <Eye className="h-6 w-6 sm:h-7 sm:w-7" />}
          </button>
        </div>

        {/* 5-segment password strength indicator */}
        <div
          className="grid grid-cols-5 gap-2 mt-2.5"
          role="progressbar"
          aria-valuenow={strengthScore}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-label="Password strength"
        >
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className={`h-[3px] rounded-full transition-colors duration-200 ${getStrengthBarColor(
                strengthScore,
                idx
              )}`}
            />
          ))}
        </div>

        <p className="text-[15px] sm:text-[22px] leading-snug text-[#8b95a5] mt-3">
          Use 8 or more characters with a mix of letters numbers and symbols
        </p>
      </div>

      <div>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          placeholder="Repeat Password"
          aria-label="Repeat Password"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-14 sm:h-[76px] mt-2 rounded-xl bg-[#345485] hover:bg-[#2a4570] active:scale-[0.99] text-white text-[18px] sm:text-[26px] font-medium transition cursor-pointer disabled:opacity-60"
      >
        {submitting ? 'Creating Account...' : 'Sign Up'}
      </button>

      <div className="pt-5 sm:pt-8 text-center text-[16px] sm:text-[24px] text-[#8b95a5]">
        <span>Already have an Account</span>{' '}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-[#8b95a5] hover:text-[#345485] font-medium transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}

interface SignUpPageProps {
  store: AssetCrestStore;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
  onAuthSuccess: () => void;
  onSwitchToSignIn: () => void;
}

export function AssetCrestAuthBanner({ fullWidth = false, large = false }: { fullWidth?: boolean; large?: boolean }) {
  return (
    <div
      className={`w-full bg-[#e8f1f8] ${large ? 'py-14 sm:py-20' : 'py-8 sm:py-16'} px-6 flex items-center justify-center ${
        fullWidth ? '' : 'rounded-[2px]'
      }`}
    >
      <a href="/" className="inline-flex items-center gap-2.5 select-none">
        <svg width="72" height="72" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <polygon points="32,4 58,19 58,45 32,60 6,45 6,19" fill="#991b1b" />
          <polygon points="32,4 58,19 32,34 6,19" fill="#dc2626" />
          <polygon points="32,34 58,19 58,45 32,60" fill="#7f1d1d" />
          <polygon points="6,19 32,34 32,60 6,45" fill="#b91c1c" />
          <polygon points="32,15 48,45 38,45 32,31 26,45 16,45" fill="#ffffff" />
        </svg>
        <span className="text-[30px] sm:text-[42px] tracking-[0.02em] leading-none inline-flex items-baseline">
          <span className="font-normal text-[#dc5264]">ΛSSET</span>
          <span className="font-bold text-[#9f2638]">CREST</span>
        </span>
      </a>
    </div>
  );
}

export function SignUpPage({
  store,
  onNotify,
  onAuthSuccess,
  onSwitchToSignIn,
}: SignUpPageProps) {
  return (
    <div className="min-h-screen bg-white text-[#141824] flex flex-col">
      <div className="w-full max-w-[860px] mx-auto px-6 sm:px-10 pt-7 sm:pt-10 pb-12 flex-1 flex flex-col justify-start">
        <AssetCrestAuthBanner large />

        <h1 className="text-[28px] sm:text-[40px] font-bold text-[#141824] text-center mt-10 sm:mt-14 mb-10 sm:mb-14 tracking-tight">
          Sign Up
        </h1>

        <SignUpFormFields
          store={store}
          onNotify={onNotify}
          onAuthSuccess={onAuthSuccess}
          onSwitchToSignIn={onSwitchToSignIn}
          showInlineError
        />
      </div>
    </div>
  );
}

const REMEMBER_IDENTIFIER_KEY = 'assetcrest_remember_login_v1';

function readRememberedIdentifier(): { identifier: string; remember: boolean } {
  if (typeof window === 'undefined') return { identifier: '', remember: false };
  try {
    const raw = window.localStorage.getItem(REMEMBER_IDENTIFIER_KEY);
    if (!raw) return { identifier: '', remember: false };
    const parsed = JSON.parse(raw) as { identifier?: string; remember?: boolean };
    return {
      identifier: typeof parsed.identifier === 'string' ? parsed.identifier : '',
      remember: Boolean(parsed.remember),
    };
  } catch {
    return { identifier: '', remember: false };
  }
}

interface SignInPageProps {
  store: AssetCrestStore;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
  onAuthSuccess: () => void;
  onSwitchToSignUp: () => void;
  onForgotPassword: (prefillEmail?: string) => void;
}

export function SignInPage({
  onNotify,
  onAuthSuccess,
  onSwitchToSignUp,
  onForgotPassword,
}: SignInPageProps) {
  const initialRemember = readRememberedIdentifier();
  const [identifier, setIdentifier] = useState(initialRemember.identifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(initialRemember.remember);
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showClaimAdmin, setShowClaimAdmin] = useState(false);
  const [claimPassword, setClaimPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setLoginError('');
    setSubmitting(true);

    try {
      const target = await neonLogin(identifier.trim(), password);

      if (typeof window !== 'undefined') {
        if (rememberMe) {
          window.localStorage.setItem(
            REMEMBER_IDENTIFIER_KEY,
            JSON.stringify({ identifier: identifier.trim(), remember: true })
          );
        } else {
          window.localStorage.removeItem(REMEMBER_IDENTIFIER_KEY);
        }
      }

      const stamp = formatNowStamp();
      updateAssetCrestStore((prev) => ({
        ...prev,
        activeUserId: target.id,
        users: prev.users.some((u) => u.id === target.id)
          ? prev.users.map((u) => (u.id === target.id ? { ...target, lastLoginAt: stamp } : u))
          : [...prev.users, { ...target, lastLoginAt: stamp }],
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
      onAuthSuccess();
    } catch (err: any) {
      const errMsg = err?.message || 'Invalid email/username or password.';
      setLoginError(errMsg);
      if (errMsg.toLowerCase().includes('claimed')) {
        setShowClaimAdmin(true);
      }
      onNotify(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setLoginError('');
    setSubmitting(true);
    try {
      const adminUser = await neonClaimAdmin(claimPassword);
      setShowClaimAdmin(false);
      setClaimPassword('');
      onNotify(`Administrator account claimed and signed in (${adminUser.email}).`, 'success');
      onAuthSuccess();
    } catch (err: any) {
      const msg = err?.message || 'Failed to claim Admin password.';
      setLoginError(msg);
      onNotify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full h-14 sm:h-[88px] px-5 sm:px-7 rounded-xl border border-[#c9cbd8] bg-white text-[17px] sm:text-[28px] text-[#1e293b] placeholder:text-[#8b95a5] focus:outline-none focus:border-[#345485] focus:ring-2 focus:ring-[#345485]/15 transition-colors';

  return (
    <div className="min-h-screen bg-white text-[#141824] flex flex-col">
      {/* Full-Width Pale Ice-Blue Brand Header Banner */}
      <AssetCrestAuthBanner fullWidth />

      <div className="w-full max-w-[860px] mx-auto px-6 sm:px-10 pt-10 sm:pt-16 pb-12 flex-1 flex flex-col justify-start">
        <h1 className="text-[28px] sm:text-[40px] font-bold text-[#141824] text-center mb-10 sm:mb-14 tracking-tight">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {loginError && (
            <ErrorAlertBanner message={loginError} onDismiss={() => setLoginError('')} />
          )}

          <div>
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or Username"
              aria-label="Email or Username"
              className={inputClass}
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#8b95a5] hover:text-[#334155] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="pt-0.5">
            <label className="inline-flex items-center gap-3 sm:gap-5 text-[16px] sm:text-[26px] text-[#334155] cursor-pointer select-none min-h-[44px] sm:min-h-[52px]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-6 w-6 sm:h-11 sm:w-11 rounded-lg border border-[#d1d9e4] text-[#345485] focus:ring-[#345485]/25 accent-[#345485] cursor-pointer"
              />
              <span>Remember me</span>
            </label>
          </div>

          <div className="flex justify-end pt-1 pb-2">
            <button
              type="button"
              onClick={() => onForgotPassword(identifier.includes('@') ? identifier.trim() : '')}
              className="text-[16px] sm:text-[26px] text-[#284577] hover:underline font-medium cursor-pointer"
            >
              Forgot Password ?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-14 sm:h-[86px] rounded-xl bg-[#345485] hover:bg-[#2a4570] active:scale-[0.99] text-white text-[18px] sm:text-[28px] font-medium transition cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="pt-7 sm:pt-9 text-center text-[16px] sm:text-[26px]">
            <span className="text-[#8b95a5]">Not a Member yet?</span>{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-[#284577] hover:underline font-medium transition-colors cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </form>

        {showClaimAdmin && (
          <form
            onSubmit={handleClaimAdmin}
            className="mt-6 p-4 rounded-lg border border-amber-200 bg-amber-50 space-y-3"
          >
            <p className="text-xs font-semibold text-amber-900">
              First-Run Administrator Setup: Set an initial password (min 8 chars) to claim the Admin account.
            </p>
            <input
              type="password"
              required
              minLength={8}
              value={claimPassword}
              onChange={(e) => setClaimPassword(e.target.value)}
              placeholder="New Admin Password (min 8 chars)"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Claiming Admin...' : 'Set Admin Password & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

interface AuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onAuthSuccess?: () => void;
  onSwitchToRegisterPage?: () => void;
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
  onSwitchToRegisterPage,
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

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<'email' | 'verify'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [enteredResetCode, setEnteredResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  if (!open) return null;

  const handleNeonSignOut = async () => {
    setAuthError('');
    setCloudBusy(true);
    try {
      await signOutCloud();
      onNotify('Signed out of Neon Cloud Sync.', 'info');
      onClose();
    } catch {
      const errMsg = 'Failed to sign out cleanly.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
    } finally {
      setCloudBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cloudBusy) return;
    setAuthError('');
    setCloudBusy(true);
    try {
      const target = await neonLogin(loginEmail.trim(), loginPassword);
      const stamp = formatNowStamp();
      updateAssetCrestStore((prev) => ({
        ...prev,
        activeUserId: target.id,
        users: prev.users.some((u) => u.id === target.id)
          ? prev.users.map((u) => (u.id === target.id ? { ...target, lastLoginAt: stamp } : u))
          : [...prev.users, { ...target, lastLoginAt: stamp }],
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
    } catch (err: any) {
      const errMsg = err?.message || 'Invalid email/username or password.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
    } finally {
      setCloudBusy(false);
    }
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

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cloudBusy) return;
    setAuthError('');
    setCloudBusy(true);
    try {
      const res = await neonForgotPassword(forgotEmail.trim());
      setForgotStep('verify');
      onNotify(res.message || 'Verification code issued.', 'info');
    } catch (err: any) {
      const errMsg = err?.message || 'No AssetCrest account found with that email address.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
    } finally {
      setCloudBusy(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cloudBusy) return;
    setAuthError('');
    if (resetNewPassword.length < 8) {
      const errMsg = 'New password must be at least 8 characters.';
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

    setCloudBusy(true);
    try {
      const updatedUser = await neonResetPassword(
        forgotEmail.trim(),
        enteredResetCode.trim(),
        resetNewPassword
      );
      updateAssetCrestStore((prev) => ({
        ...prev,
        activeUserId: updatedUser.id,
      }));
      onNotify('Password updated and account unlocked.', 'success');
      onAuthSuccess?.();
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || 'Verification code is invalid or expired.';
      setAuthError(errMsg);
      onNotify(errMsg, 'error');
    } finally {
      setCloudBusy(false);
    }
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
              if (onSwitchToRegisterPage) {
                onSwitchToRegisterPage();
                return;
              }
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
                    Neon Cloud Sync Active
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[230px]">
                    {cloudEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={cloudBusy}
                onClick={handleNeonSignOut}
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
                    Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Email or Username"
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
                <button
                  type="submit"
                  disabled={cloudBusy}
                  className="ac-btn ac-btn-primary ac-btn-md w-full"
                >
                  {cloudBusy ? 'Signing In...' : 'Sign In to Account'}
                </button>
              </form>

              {!isCloudMode && store.users.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Quick Local Preview Account Switcher
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
              )}
            </>
          )}

          {mode === 'register' && (
            <SignUpFormFields
              store={store}
              onNotify={onNotify}
              onAuthSuccess={() => {
                onAuthSuccess?.();
                onClose();
              }}
              onSwitchToSignIn={() => {
                setMode('login');
                setAuthError('');
              }}
              onErrorChange={setAuthError}
              showInlineError={false}
            />
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
                  <div className="ac-alert ac-alert-info">
                    <div>
                      A 6-digit verification code was issued for <strong>{forgotEmail}</strong>. Enter the code below along with your new password (8+ characters).
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
                        minLength={8}
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
                        minLength={8}
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className="ac-input"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={cloudBusy}
                    className="ac-btn ac-btn-primary ac-btn-md w-full"
                  >
                    {cloudBusy ? 'Updating Password...' : 'Verify & Reset Password'}
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
