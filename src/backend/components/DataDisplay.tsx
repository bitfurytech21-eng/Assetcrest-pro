'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ActiveInvestment,
  CRYPTO_ASSETS,
  TransactionRecord,
  UserAccount,
} from '@/src/backend/lib/assetcrest-store';

// Module-level memory so count-up runs once per metric per session load
const animatedStatKeys = new Set<string>();

export function formatCurrencyFull(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `$${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyCompact(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAxisCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
}

export function AnimatedCurrencyNumber({
  statKey,
  value,
  compact = false,
}: {
  statKey: string;
  value: number;
  compact?: boolean;
}) {
  const shouldAnimate = !animatedStatKeys.has(statKey);
  const [displayValue, setDisplayValue] = useState<number>(shouldAnimate ? 0 : value);
  const latestTargetRef = useRef(value);
  latestTargetRef.current = value;

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(value);
      return;
    }

    animatedStatKeys.add(statKey);

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplayValue(value);
      return;
    }

    const durationMs = 700;
    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Smooth cubic ease-out settling
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(latestTargetRef.current * eased);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(latestTargetRef.current);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // Run count-up strictly once on initial load for this statKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statKey]);

  // Keep target synchronized after initial animation finishes when user or balance updates
  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(value);
    }
  }, [value, shouldAnimate]);

  return (
    <span className="tabular-nums" title={formatCurrencyFull(value)}>
      {compact ? formatCurrencyCompact(displayValue) : formatCurrencyFull(displayValue)}
    </span>
  );
}

export function TrendBadge({
  percent,
  contextLabel,
}: {
  percent: number;
  contextLabel: string;
}) {
  const isNegative = percent < -0.05;
  const formattedPct = `${Math.abs(percent).toFixed(1)}%`;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span
        className={`ac-badge font-mono tabular-nums ${
          isNegative ? 'ac-badge-danger' : 'ac-badge-success'
        }`}
      >
        <span aria-hidden="true">{isNegative ? '▼' : '▲'}</span>
        <span>{formattedPct}</span>
      </span>
      <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
        {contextLabel}
      </span>
    </div>
  );
}

interface ChartTooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

function CustomChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="ac-dropdown px-3.5 py-2.5 text-xs">
      {label && (
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || '#2b4865' }}
              />
              {entry.name}
            </span>
            <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {formatCurrencyFull(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardAnalyticsCharts({
  user,
  transactions,
  investments,
  isDark,
}: {
  user: UserAccount;
  transactions: TransactionRecord[];
  investments: ActiveInvestment[];
  isDark: boolean;
}) {
  const primaryLineColor = isDark ? '#38bdf8' : '#2b4865';
  const yieldLineColor = isDark ? '#34d399' : '#059669';
  const mutedTickColor = isDark ? '#94a3b8' : '#64748b';
  const gridStrokeColor = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.12)';

  const cryptoUsdTotal = useMemo(() => {
    return CRYPTO_ASSETS.reduce((sum, asset) => {
      if (asset.symbol === 'USD') return sum;
      const qty = user.cryptoBalances[asset.symbol] ?? 0;
      return sum + qty * asset.usdPrice;
    }, 0);
  }, [user.cryptoBalances]);

  const activePrincipal = useMemo(
    () => investments.filter((i) => i.status === 'Active').reduce((acc, i) => acc + i.amount, 0),
    [investments]
  );

  // Build 6-step portfolio progression derived cleanly from real account balance, deposits & yield
  const equitySeries = useMemo(() => {
    const baseDeposit = user.totalDeposit;
    const currentEquity =
      user.accountBalance + activePrincipal + cryptoUsdTotal;
    const accruedProfit = user.totalProfit + user.bonus + user.referralBonus;

    // Derive cumulative transaction checkpoints when available, or clean step curve ending at exact values
    const completedAsc = [...transactions]
      .filter((t) => t.status === 'Completed')
      .reverse();

    if (completedAsc.length >= 2) {
      let runningEquity = 0;
      let runningYield = 0;
      const points = completedAsc.slice(-6).map((tx, idx) => {
        if (tx.type === 'Deposit' || tx.type === 'Transfer In') {
          runningEquity += tx.amount;
        } else if (tx.type === 'Withdrawal' || tx.type === 'Transfer Out') {
          runningEquity = Math.max(0, runningEquity - tx.amount);
        } else if (tx.type === 'Bonus') {
          runningYield += tx.amount;
          runningEquity += tx.amount;
        }
        const label = tx.date.slice(5, 10) || `T${idx + 1}`;
        return {
          period: label,
          equity: Number(runningEquity.toFixed(2)),
          yield: Number(runningYield.toFixed(2)),
        };
      });
      // Anchor final point to actual current total portfolio value & total accrued profit
      points[points.length - 1] = {
        period: 'Current',
        equity: Number(currentEquity.toFixed(2)),
        yield: Number(accruedProfit.toFixed(2)),
      };
      return points;
    }

    const startEquity = Math.max(0, baseDeposit * 0.35);
    const weights = [0.22, 0.4, 0.58, 0.74, 0.89, 1];
    const labels = ['P1', 'P2', 'P3', 'P4', 'P5', 'Current'];
    return labels.map((period, idx) => {
      const w = weights[idx];
      const equity =
        idx === labels.length - 1
          ? currentEquity
          : startEquity + (currentEquity - startEquity) * w;
      const yld = accruedProfit * w;
      return {
        period,
        equity: Number(equity.toFixed(2)),
        yield: Number(yld.toFixed(2)),
      };
    });
  }, [user, transactions, activePrincipal, cryptoUsdTotal]);

  const breakdownData = useMemo(
    () => [
      {
        name: 'Liquid USD',
        amount: Number(user.accountBalance.toFixed(2)),
        fill: isDark ? '#38bdf8' : '#2b4865',
      },
      {
        name: 'Crypto',
        amount: Number(cryptoUsdTotal.toFixed(2)),
        fill: isDark ? '#0ea5e9' : '#3b648c',
      },
      {
        name: 'Invested',
        amount: Number(activePrincipal.toFixed(2)),
        fill: isDark ? '#60a5fa' : '#4a78a3',
      },
      {
        name: 'Profit',
        amount: Number(user.totalProfit.toFixed(2)),
        fill: isDark ? '#34d399' : '#059669',
      },
      {
        name: 'Bonuses',
        amount: Number((user.bonus + user.referralBonus).toFixed(2)),
        fill: isDark ? '#94a3b8' : '#64748b',
      },
    ],
    [user.accountBalance, user.totalProfit, user.bonus, user.referralBonus, cryptoUsdTotal, activePrincipal, isDark]
  );

  return (
    <div className="col-span-12 grid grid-cols-12 gap-4 lg:gap-6">
      {/* Smooth Line / Area Progression Chart */}
      <div className="col-span-12 lg:col-span-7 ac-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="ac-section-title text-slate-900 dark:text-white">
              Portfolio Trajectory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Total capital equity vs. cumulative profit &amp; bonus yield
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: primaryLineColor }}
              />
              Equity
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: yieldLineColor }}
              />
              Yield
            </span>
          </div>
        </div>

        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={equitySeries} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="acEquityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryLineColor} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={primaryLineColor} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="acYieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={yieldLineColor} stopOpacity={0.24} />
                  <stop offset="95%" stopColor={yieldLineColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridStrokeColor}
              />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: mutedTickColor, fontSize: 12 }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={58}
                tickFormatter={formatAxisCurrency}
                tick={{ fill: mutedTickColor, fontSize: 12 }}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Area
                type="monotone"
                dataKey="equity"
                name="Total Equity"
                stroke={primaryLineColor}
                strokeWidth={2.25}
                fillOpacity={1}
                fill="url(#acEquityGradient)"
                activeDot={{ r: 4.5, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="yield"
                name="Cumulative Yield"
                stroke={yieldLineColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#acYieldGradient)"
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rounded Bar Capital Allocation Chart */}
      <div className="col-span-12 lg:col-span-5 ac-card p-5 space-y-4">
        <div>
          <h2 className="ac-section-title text-slate-900 dark:text-white">
            Capital Distribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active USD, crypto assets, plan principal, and accrued returns
          </p>
        </div>

        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={breakdownData} margin={{ top: 8, right: 6, left: 0, bottom: 0 }} barSize={32}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridStrokeColor}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: mutedTickColor, fontSize: 12 }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={formatAxisCurrency}
                tick={{ fill: mutedTickColor, fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(43, 72, 101, 0.05)' }}
                content={<CustomChartTooltip />}
              />
              <Bar dataKey="amount" name="Allocation" radius={[8, 8, 2, 2]}>
                {breakdownData.map((item, idx) => (
                  <Cell key={idx} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export type SortDirection = 'asc' | 'desc';

export function SortableTh({
  label,
  active,
  direction,
  onClick,
  align = 'left',
  className = '',
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th
      className={`sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm px-4 py-3 font-semibold border-b border-slate-200/80 dark:border-slate-700 ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold hover:text-[#2b4865] dark:hover:text-sky-300 transition cursor-pointer whitespace-nowrap ${
          align === 'right' ? 'flex-row-reverse' : ''
        } ${
          active
            ? 'text-[#2b4865] dark:text-sky-300'
            : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        <span>{label}</span>
        {active ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 shrink-0" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-65 shrink-0" />
        )}
      </button>
    </th>
  );
}

export function buildPaginationTokens(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const tokens: (number | 'ellipsis')[] = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) tokens.push('ellipsis');
  for (let p = left; p <= right; p += 1) {
    tokens.push(p);
  }
  if (right < totalPages - 1) tokens.push('ellipsis');
  tokens.push(totalPages);
  return tokens;
}

export function PaginationBar({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
}: {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (nextPage: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);
  const tokens = buildPaginationTokens(safePage, totalPages);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/70 dark:border-slate-800 text-xs">
      <p className="text-slate-600 dark:text-slate-300 font-mono tabular-nums">
        Showing <span className="font-semibold text-slate-900 dark:text-white">{start}</span>–
        <span className="font-semibold text-slate-900 dark:text-white">{end}</span> of{' '}
        <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
          className="ac-btn ac-btn-secondary h-8 min-h-0 px-2.5 text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {tokens.map((tok, idx) =>
          tok === 'ellipsis' ? (
            <span
              key={`el-${idx}`}
              className="px-2 text-slate-500 dark:text-slate-400 select-none font-mono"
            >
              …
            </span>
          ) : (
            <button
              key={tok}
              type="button"
              onClick={() => onPageChange(tok)}
              aria-current={tok === safePage ? 'page' : undefined}
              className={`ac-btn h-8 min-h-0 min-w-8 px-2.5 font-mono tabular-nums text-xs ${
                tok === safePage
                  ? 'ac-btn-primary'
                  : 'ac-btn-secondary'
              }`}
            >
              {tok}
            </button>
          )
        )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
          className="ac-btn ac-btn-secondary h-8 min-h-0 px-2.5 text-xs"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
