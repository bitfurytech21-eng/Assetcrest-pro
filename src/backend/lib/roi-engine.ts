import {
  type ActiveInvestment,
  type AssetCrestStore,
  formatNowStamp,
  type TransactionRecord,
  type UserAccount,
} from './assetcrest-store';

export const ROI_CYCLE_MS = 24 * 60 * 60 * 1000;

export interface InvestmentRoiSnapshot {
  dailyRatePct: number;
  dailyYield: number;
  cyclesCompleted: number;
  remainingCycles: number;
  cyclesDue: number;
  earnedSoFar: number;
  totalProjectedRoi: number;
  termProgressPct: number;
  cycleProgressPct: number;
  nextPayoutInMs: number;
  livePendingYield: number;
  isMatured: boolean;
}

export interface RoiInvestmentUpdate {
  investment: ActiveInvestment;
  roiCreditToBalance: number;
  profitCredited: number;
  principalReturnedAmount: number;
  cyclesSettled: number;
  maturedNow: boolean;
}

export interface RoiSettlementPlan {
  investmentUpdates: RoiInvestmentUpdate[];
  userDeltas: Record<string, { balanceDelta: number; profitDelta: number }>;
  transactions: TransactionRecord[];
  totalYieldCredited: number;
  totalPrincipalReturned: number;
  settledCount: number;
  maturedCount: number;
}

export function parseDailyRatePct(dailyRate: string): number {
  const numeric = parseFloat(String(dailyRate || '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return numeric;
}

export function parseStampToMs(stamp?: string): number {
  if (!stamp) return Date.now();
  const normalized = stamp.trim();
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(normalized)) {
    const parsed = Date.parse(`${normalized.replace(/\s+/, 'T')}:00Z`);
    if (Number.isFinite(parsed)) return parsed;
  }
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function formatCountdown(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

export function calculateDailyYieldAmount(amount: number, dailyRate: string): number {
  const ratePct = parseDailyRatePct(dailyRate);
  return Number(((amount * ratePct) / 100).toFixed(2));
}

export function getInvestmentRoiSnapshot(
  inv: ActiveInvestment,
  nowMs: number = Date.now()
): InvestmentRoiSnapshot {
  const dailyRatePct = parseDailyRatePct(inv.dailyRate);
  const dailyYield = calculateDailyYieldAmount(inv.amount, inv.dailyRate);
  const duration = Math.max(1, inv.durationDays || 1);
  const cyclesCompleted = Math.min(duration, Math.max(0, inv.payoutCyclesCompleted ?? 0));
  const remainingCycles = Math.max(0, duration - cyclesCompleted);
  const isMatured = inv.status === 'Completed' || remainingCycles === 0;

  const baseStartMs = inv.startedAtMs ?? parseStampToMs(inv.startedAt);
  const lastAccrualMs = inv.lastAccrualMs ?? baseStartMs + cyclesCompleted * ROI_CYCLE_MS;
  const elapsedMs = Math.max(0, nowMs - lastAccrualMs);

  const rawDue = !isMatured ? Math.floor(elapsedMs / ROI_CYCLE_MS) : 0;
  const cyclesDue = Math.min(remainingCycles, rawDue);

  const cycleElapsedMs = isMatured ? ROI_CYCLE_MS : elapsedMs % ROI_CYCLE_MS;
  const cycleProgressPct = isMatured
    ? 100
    : Math.min(99.9, Number(((cycleElapsedMs / ROI_CYCLE_MS) * 100).toFixed(1)));
  const nextPayoutInMs = isMatured ? 0 : Math.max(0, ROI_CYCLE_MS - cycleElapsedMs);
  const livePendingYield = isMatured
    ? 0
    : Number((dailyYield * Math.min(1, cycleElapsedMs / ROI_CYCLE_MS)).toFixed(4));

  const earnedSoFar = Number((inv.accruedProfit ?? cyclesCompleted * dailyYield).toFixed(2));
  const totalProjectedRoi = Number((earnedSoFar + dailyYield * remainingCycles).toFixed(2));
  const termProgressPct = Math.min(100, Math.round((cyclesCompleted / duration) * 100));

  return {
    dailyRatePct,
    dailyYield,
    cyclesCompleted,
    remainingCycles,
    cyclesDue,
    earnedSoFar,
    totalProjectedRoi,
    termProgressPct,
    cycleProgressPct,
    nextPayoutInMs,
    livePendingYield,
    isMatured,
  };
}

export function computeRoiSettlementPlan(
  investments: ActiveInvestment[],
  options?: {
    nowMs?: number;
    onlyUserId?: string;
    forceOneCycleForIds?: Set<string>;
    existingTxIds?: Set<string>;
  }
): RoiSettlementPlan {
  const nowMs = options?.nowMs ?? Date.now();
  const stamp = formatNowStamp();
  const forceIds = options?.forceOneCycleForIds;
  const existingTxIds = options?.existingTxIds;

  const investmentUpdates: RoiInvestmentUpdate[] = [];
  const userDeltas: Record<string, { balanceDelta: number; profitDelta: number }> = {};
  const transactions: TransactionRecord[] = [];

  let totalYieldCredited = 0;
  let totalPrincipalReturned = 0;
  let maturedCount = 0;

  for (const inv of investments) {
    if (options?.onlyUserId && inv.userId !== options.onlyUserId) continue;
    if (inv.status !== 'Active') continue;

    const duration = Math.max(1, inv.durationDays || 1);
    const prevCycles = Math.min(duration, Math.max(0, inv.payoutCyclesCompleted ?? 0));
    const remainingCycles = Math.max(0, duration - prevCycles);
    const baseStartMs = inv.startedAtMs ?? parseStampToMs(inv.startedAt);
    const prevLastAccrualMs = inv.lastAccrualMs ?? baseStartMs + prevCycles * ROI_CYCLE_MS;

    const isForced = Boolean(forceIds?.has(inv.id));
    if (!isForced && inv.autoRoiEnabled === false) continue;

    const elapsedMs = Math.max(0, nowMs - prevLastAccrualMs);
    const naturalDue = Math.min(remainingCycles, Math.floor(elapsedMs / ROI_CYCLE_MS));
    const cyclesToSettle = isForced
      ? Math.min(remainingCycles, Math.max(1, naturalDue))
      : naturalDue;

    const needsMaturitySettlement =
      remainingCycles === 0 && !inv.principalReturned;

    if (cyclesToSettle <= 0 && !needsMaturitySettlement) {
      continue;
    }

    const ratePct = parseDailyRatePct(inv.dailyRate);
    let workingPrincipal = inv.amount;
    let totalCycleProfit = 0;

    for (let i = 0; i < cyclesToSettle; i += 1) {
      const cycleYield = Number(((workingPrincipal * ratePct) / 100).toFixed(2));
      totalCycleProfit = Number((totalCycleProfit + cycleYield).toFixed(2));
      if (inv.autoCompound) {
        workingPrincipal = Number((workingPrincipal + cycleYield).toFixed(2));
      }
    }

    const nextCycles = prevCycles + cyclesToSettle;
    const maturedNow = nextCycles >= duration;
    const nextLastAccrualMs =
      cyclesToSettle > 0
        ? isForced && naturalDue === 0
          ? nowMs
          : prevLastAccrualMs + cyclesToSettle * ROI_CYCLE_MS
        : prevLastAccrualMs;

    const shouldReturnPrincipal = maturedNow && !inv.principalReturned;
    const principalReturnedAmount = shouldReturnPrincipal ? Number(workingPrincipal.toFixed(2)) : 0;
    const roiCreditToBalance = inv.autoCompound ? 0 : totalCycleProfit;

    const nextAccruedProfit = Number(
      ((inv.accruedProfit ?? prevCycles * calculateDailyYieldAmount(inv.amount, inv.dailyRate)) +
        totalCycleProfit).toFixed(2)
    );

    const updatedInv: ActiveInvestment = {
      ...inv,
      amount: inv.autoCompound ? Number(workingPrincipal.toFixed(2)) : inv.amount,
      status: maturedNow ? 'Completed' : 'Active',
      startedAtMs: baseStartMs,
      lastAccrualMs: nextLastAccrualMs,
      lastPayoutAt: cyclesToSettle > 0 ? stamp : inv.lastPayoutAt,
      payoutCyclesCompleted: nextCycles,
      accruedProfit: nextAccruedProfit,
      principalReturned: shouldReturnPrincipal ? true : Boolean(inv.principalReturned),
    };

    investmentUpdates.push({
      investment: updatedInv,
      roiCreditToBalance,
      profitCredited: totalCycleProfit,
      principalReturnedAmount,
      cyclesSettled: cyclesToSettle,
      maturedNow: shouldReturnPrincipal,
    });

    if (!userDeltas[inv.userId]) {
      userDeltas[inv.userId] = { balanceDelta: 0, profitDelta: 0 };
    }
    userDeltas[inv.userId].profitDelta = Number(
      (userDeltas[inv.userId].profitDelta + totalCycleProfit).toFixed(2)
    );
    userDeltas[inv.userId].balanceDelta = Number(
      (userDeltas[inv.userId].balanceDelta + roiCreditToBalance + principalReturnedAmount).toFixed(2)
    );

    totalYieldCredited = Number((totalYieldCredited + totalCycleProfit).toFixed(2));
    totalPrincipalReturned = Number((totalPrincipalReturned + principalReturnedAmount).toFixed(2));
    if (shouldReturnPrincipal) maturedCount += 1;

    if (cyclesToSettle > 0 && totalCycleProfit > 0) {
      const roiTxId = `ROI-${inv.id}-C${prevCycles + 1}-${nextCycles}`;
      if (!existingTxIds?.has(roiTxId)) {
        const modeLabel = isForced && naturalDue === 0 ? 'Manual Cycle' : 'Auto ROI';
        const compoundLabel = inv.autoCompound ? ' · Compounded' : '';
        transactions.push({
          id: roiTxId,
          userId: inv.userId,
          type: 'Bonus',
          method: `${modeLabel} — ${inv.planName}`,
          amount: totalCycleProfit,
          status: 'Completed',
          date: stamp,
          note: `${cyclesToSettle}d @ ${inv.dailyRate}/day · Cycle ${nextCycles}/${duration}${compoundLabel}`,
        });
      }
    }

    if (shouldReturnPrincipal && principalReturnedAmount > 0) {
      const matTxId = `ROI-MAT-${inv.id}`;
      if (!existingTxIds?.has(matTxId)) {
        transactions.push({
          id: matTxId,
          userId: inv.userId,
          type: 'Investment',
          method: `Maturity Principal Return — ${inv.planName}`,
          amount: principalReturnedAmount,
          status: 'Completed',
          date: stamp,
          note: `${duration}-day plan matured · Principal unlocked to balance`,
        });
      }
    }
  }

  return {
    investmentUpdates,
    userDeltas,
    transactions,
    totalYieldCredited,
    totalPrincipalReturned,
    settledCount: investmentUpdates.length,
    maturedCount,
  };
}

export function applyRoiSettlementToStore(
  prev: AssetCrestStore,
  plan: RoiSettlementPlan
): AssetCrestStore {
  if (plan.investmentUpdates.length === 0) return prev;

  const updatedInvMap = new Map<string, ActiveInvestment>();
  for (const upd of plan.investmentUpdates) {
    updatedInvMap.set(upd.investment.id, upd.investment);
  }

  const existingTxIds = new Set(prev.transactions.map((t) => t.id));
  const freshTxs = plan.transactions.filter((t) => !existingTxIds.has(t.id));

  return {
    ...prev,
    users: prev.users.map((u: UserAccount) => {
      const delta = plan.userDeltas[u.id];
      if (!delta) return u;
      return {
        ...u,
        totalProfit: Number((u.totalProfit + delta.profitDelta).toFixed(2)),
        accountBalance: Number((u.accountBalance + delta.balanceDelta).toFixed(2)),
      };
    }),
    investments: prev.investments.map((inv) => updatedInvMap.get(inv.id) ?? inv),
    transactions: [...freshTxs, ...prev.transactions],
  };
}
