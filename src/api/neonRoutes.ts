import { Router, type Request, type Response } from 'express';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  adjustUserFundsInNeon,
  approveDepositInNeon,
  approveWithdrawalInNeon,
  authenticateUserInNeon,
  changePasswordInNeon,
  claimAdminPassword,
  claimTransferRequestInNeon,
  completePasswordResetInNeon,
  createPasswordResetCodeInNeon,
  createTicketInNeon,
  decideKycInNeon,
  declineDepositInNeon,
  declineWithdrawalInNeon,
  deleteCryptoWalletInNeon,
  distributeYieldsInNeon,
  executeSwapInNeon,
  getAdminSetupStatus,
  getSyncedStateForUser,
  getTransactionByIdInNeon,
  getTransferRequestByIdInNeon,
  getUserPublicByEmailInNeon,
  getUserPublicByIdInNeon,
  investPlanInNeon,
  logVisitorLocationInNeon,
  lookupTransferRecipientInNeon,
  registerUserInNeon,
  saveCryptoWalletInNeon,
  sendTransferInNeon,
  settleRoiPlanInNeon,
  submitDepositInNeon,
  submitKycInNeon,
  submitWithdrawalInNeon,
  toggleInvestmentSettingsInNeon,
  toggleUserStatusInNeon,
  updateAvatarInNeon,
  updateProfileAndJointInNeon,
  type RepoCryptoWallet,
  type RepoInvestment,
  type RepoTransaction,
} from '../db/neonRepo.ts';
import {
  appendAutomationDeliveryLog,
  deleteWebhookEndpointRecord,
  getPublicEmailDeliverySettings,
  getRawEmailDeliverySettings,
  listAutomationDeliveryLogs,
  listEmailTemplates,
  listPublicWebhookEndpoints,
  listRawWebhookEndpoints,
  saveWebhookEndpointRecord,
  updateEmailDeliverySettings,
  updateEmailTemplateRecord,
} from '../db/automationRepo.ts';
import { PORTAL_AUTOMATION_EVENTS } from '../lib/email-templates-seed.ts';
import {
  dispatchEmailWithSettings,
  dispatchPortalAutomation,
  isSafeWebhookTarget,
  sendTestTemplateEmail,
  sendTestWebhookEndpoint,
  verifyInboundWebhookHmac,
  verifyResendWebhookSignature,
} from '../lib/automation-mailer.ts';
import {
  clearSessionCookie,
  createSessionForUser,
  deleteSessionToken,
  extractAuthToken,
  lookupSessionUserId,
  setSessionCookie,
  verifyMutationOriginOrHeader,
} from '../lib/auth-session.ts';
import { requireAdmin, requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { fetchLiveCryptoPricesUsd, type CryptoMarketSymbol } from '../lib/market-prices.ts';

function parseJsonBody<T = Record<string, any>>(req: Request): T {
  const raw = req.body;
  if (!raw) return {} as T;
  if (Buffer.isBuffer(raw)) {
    const str = raw.toString('utf8').trim();
    if (!str) return {} as T;
    return JSON.parse(str) as T;
  }
  if (typeof raw === 'string') {
    const str = raw.trim();
    if (!str) return {} as T;
    return JSON.parse(str) as T;
  }
  if (typeof raw === 'object') {
    return raw as T;
  }
  return {} as T;
}

function sendError(res: Response, err: unknown, fallbackStatus = 400) {
  const message = err instanceof Error ? err.message : 'Request failed';
  res.status(fallbackStatus).json({ error: message });
}

export function createNeonApiRouter(): Router {
  const router = Router();

  // =========================================================================
  // AUTHENTICATION & ADMIN CLAIM ROUTES
  // =========================================================================
  router.get('/auth/admin-status', async (_req, res) => {
    try {
      const status = await getAdminSetupStatus();
      res.json(status);
    } catch (err) {
      sendError(res, err, 500);
    }
  });

  router.post('/auth/claim-admin', async (req, res) => {
    if (!verifyMutationOriginOrHeader(req)) {
      return res.status(403).json({ error: 'Forbidden: Invalid request origin' });
    }
    try {
      const body = parseJsonBody<{ password?: string; email?: string }>(req);
      const user = await claimAdminPassword(
        String(body.password || ''),
        body.email ? String(body.email) : undefined
      );
      const token = await createSessionForUser(user.id);
      setSessionCookie(req, res, token);
      res.status(200).json({ token, user });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/auth/register', async (req, res) => {
    if (!verifyMutationOriginOrHeader(req)) {
      return res.status(403).json({ error: 'Forbidden: Invalid request origin' });
    }
    try {
      const body = parseJsonBody<{
        username?: string;
        name?: string;
        email?: string;
        phoneNumber?: string;
        country?: string;
        referredBy?: string;
        password?: string;
      }>(req);

      const user = await registerUserInNeon({
        username: String(body.username || ''),
        name: String(body.name || ''),
        email: String(body.email || ''),
        phoneNumber: String(body.phoneNumber || ''),
        country: String(body.country || ''),
        referredBy: body.referredBy ? String(body.referredBy) : undefined,
        password: String(body.password || ''),
      });

      const token = await createSessionForUser(user.id);
      setSessionCookie(req, res, token);

      void dispatchPortalAutomation({
        eventKey: 'user.registered',
        recipientEmail: user.email,
        adminCopyEmail: BOOTSTRAPPED_ADMIN_EMAIL,
        variables: {
          name: user.name,
          username: user.username || user.name,
          email: user.email,
          country: user.country || 'Not specified',
          referralCode: user.referralCode,
        },
        webhookData: {
          userId: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          country: user.country,
          referralCode: user.referralCode,
        },
      });

      res.status(201).json({ token, user });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/auth/login', async (req, res) => {
    if (!verifyMutationOriginOrHeader(req)) {
      return res.status(403).json({ error: 'Forbidden: Invalid request origin' });
    }
    try {
      const body = parseJsonBody<{ identifier?: string; email?: string; password?: string }>(req);
      const identifier = String(body.identifier || body.email || '');
      const password = String(body.password || '');
      const user = await authenticateUserInNeon(identifier, password);
      const token = await createSessionForUser(user.id);
      setSessionCookie(req, res, token);
      const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      const ipAddress = forwardedFor || req.socket.remoteAddress || 'Unavailable';
      void dispatchPortalAutomation({
        eventKey: 'auth.login',
        recipientEmail: user.email,
        variables: {
          name: user.name,
          email: user.email,
          ipAddress,
          userAgent: String(req.headers['user-agent'] || 'Unavailable').slice(0, 240),
        },
        webhookData: {
          userId: user.id,
          email: user.email,
          ipAddress,
          userAgent: String(req.headers['user-agent'] || 'Unavailable').slice(0, 240),
          signedInAt: new Date().toISOString(),
        },
      });
      res.json({ token, user });
    } catch (err) {
      sendError(res, err, 401);
    }
  });

  router.post('/auth/logout', async (req, res) => {
    if (!verifyMutationOriginOrHeader(req)) {
      return res.status(403).json({ error: 'Forbidden: Invalid request origin' });
    }
    try {
      const { token } = extractAuthToken(req);
      if (token) {
        await deleteSessionToken(token);
      }
      clearSessionCookie(req, res);
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 500);
    }
  });

  router.post('/auth/forgot-password', async (req, res) => {
    if (!verifyMutationOriginOrHeader(req)) {
      return res.status(403).json({ error: 'Forbidden: Invalid request origin' });
    }
    try {
      const body = parseJsonBody<{ email?: string }>(req);
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: 'Registered email address is required.' });
      }
      const code = await createPasswordResetCodeInNeon(email);
      const targetUser = await getUserPublicByEmailInNeon(email);
      console.info(`[AssetCrest Recovery] Password reset code issued for ${email}`);

      void dispatchPortalAutomation({
        eventKey: 'auth.password_reset',
        recipientEmail: email,
        variables: {
          name: targetUser?.name || 'Investor',
          email,
          code,
        },
        webhookData: {
          email,
          userId: targetUser?.id || null,
          issuedAt: new Date().toISOString(),
        },
      });

      res.json({
        ok: true,
        message: 'If an AssetCrest account matches that email, a 6-digit verification code has been issued.',
      });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/auth/reset-password', async (req, res) => {
    if (!verifyMutationOriginOrHeader(req)) {
      return res.status(403).json({ error: 'Forbidden: Invalid request origin' });
    }
    try {
      const body = parseJsonBody<{ email?: string; code?: string; newPassword?: string }>(req);
      const user = await completePasswordResetInNeon({
        email: String(body.email || ''),
        code: String(body.code || ''),
        newPassword: String(body.newPassword || ''),
      });
      const token = await createSessionForUser(user.id);
      setSessionCookie(req, res, token);

      void dispatchPortalAutomation({
        eventKey: 'auth.password_changed',
        recipientEmail: user.email,
        variables: {
          name: user.name,
          email: user.email,
        },
        webhookData: {
          userId: user.id,
          email: user.email,
          method: 'otp_reset',
        },
      });

      res.json({ token, user });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  // =========================================================================
  // AUTHENTICATED INVESTOR & SHARED PORTAL DATA ROUTES
  // =========================================================================
  router.get('/neon/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const state = await getSyncedStateForUser(req.user.id, req.user.role === 'admin');
      res.json(state);
    } catch (err) {
      sendError(res, err, 500);
    }
  });

  router.post('/neon/deposit', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{
        method?: string;
        amount?: number;
        status?: 'Pending' | 'Cancelled';
        proofName?: string;
        proofDataUrl?: string;
        note?: string;
      }>(req);

      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Deposit amount must be positive.' });
      }
      const depositStatus = body.status === 'Cancelled' ? 'Cancelled' : 'Pending';
      const depositMethod = String(body.method || 'Crypto Deposit');
      const id = await submitDepositInNeon({
        userId: req.user.id,
        method: depositMethod,
        amount,
        status: depositStatus,
        proofName: body.proofName ? String(body.proofName) : undefined,
        proofDataUrl: body.proofDataUrl ? String(body.proofDataUrl) : undefined,
        note: body.note ? String(body.note) : undefined,
      });

      if (depositStatus === 'Pending') {
        const owner = await getUserPublicByIdInNeon(req.user.id);
        void dispatchPortalAutomation({
          eventKey: 'deposit.submitted',
          recipientEmail: owner?.email || req.user.email,
          adminCopyEmail: BOOTSTRAPPED_ADMIN_EMAIL,
          variables: {
            name: owner?.name || req.user.name,
            email: owner?.email || req.user.email,
            txId: id,
            amount: amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            method: depositMethod,
            status: depositStatus,
          },
          webhookData: {
            txId: id,
            userId: req.user.id,
            amount,
            method: depositMethod,
            status: depositStatus,
          },
        });
      }

      res.status(201).json({ id });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/withdraw', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{
        method?: string;
        amount?: number;
        destination?: string;
      }>(req);

      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 100) {
        return res.status(400).json({ error: 'Minimum withdrawal amount is $100.00.' });
      }
      const destination = String(body.destination || '').trim();
      if (!destination) {
        return res.status(400).json({ error: 'Destination address is required.' });
      }

      const method = String(body.method || 'USDC (BEP20)');
      const id = await submitWithdrawalInNeon({
        userId: req.user.id,
        method,
        amount,
        destination,
      });

      const owner = await getUserPublicByIdInNeon(req.user.id);
      void dispatchPortalAutomation({
        eventKey: 'withdrawal.requested',
        recipientEmail: owner?.email || req.user.email,
        adminCopyEmail: BOOTSTRAPPED_ADMIN_EMAIL,
        variables: {
          name: owner?.name || req.user.name,
          email: owner?.email || req.user.email,
          txId: id,
          amount: amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          method,
          destination,
        },
        webhookData: {
          txId: id,
          userId: req.user.id,
          amount,
          method,
          destination,
          status: 'Pending',
        },
      });

      res.status(201).json({ id });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.get('/neon/transfer/lookup', requireAuth, async (req: AuthRequest, res) => {
    try {
      const refCode = String(req.query.refCode || '');
      const entry = await lookupTransferRecipientInNeon(refCode);
      res.json({ recipient: entry });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/transfer/send', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{
        toRefCode?: string;
        amount?: number;
        note?: string;
      }>(req);

      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Transfer amount must be positive.' });
      }
      const id = await sendTransferInNeon({
        fromUserId: req.user.id,
        toRefCode: String(body.toRefCode || ''),
        amount,
        note: body.note ? String(body.note) : undefined,
      });
      res.status(201).json({ id });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/transfer/claim', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{ transferId?: string }>(req);
      if (!body.transferId) {
        return res.status(400).json({ error: 'transferId is required.' });
      }
      const transferId = String(body.transferId);
      const beforeClaim = await getTransferRequestByIdInNeon(transferId);
      await claimTransferRequestInNeon({
        transferId,
        claimingUserId: req.user.id,
      });

      if (beforeClaim && beforeClaim.toUid === req.user.id) {
        const recipient = await getUserPublicByIdInNeon(req.user.id);
        void dispatchPortalAutomation({
          eventKey: 'transfer.received',
          recipientEmail: recipient?.email || req.user.email,
          variables: {
            name: recipient?.name || req.user.name,
            fromName: beforeClaim.fromName,
            transferId,
            amount: beforeClaim.amount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            note: beforeClaim.note || 'P2P wallet transfer',
            newBalance: (recipient?.accountBalance ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          },
          webhookData: {
            transferId,
            fromUid: beforeClaim.fromUid,
            toUid: req.user.id,
            amount: beforeClaim.amount,
          },
        });
      }

      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/swap', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{
        fromSymbol?: string;
        toSymbol?: string;
        fromAmount?: number;
      }>(req);

      const allowedSymbols = new Set<CryptoMarketSymbol>([
        'USD',
        'USDC',
        'USDT',
        'BTC',
        'ETH',
        'BNB',
        'SOL',
        'XRP',
        'DOGE',
      ]);
      const fromSymbol = String(body.fromSymbol || '').toUpperCase() as CryptoMarketSymbol;
      const toSymbol = String(body.toSymbol || '').toUpperCase() as CryptoMarketSymbol;
      const fromAmount = Number(body.fromAmount);

      if (
        !allowedSymbols.has(fromSymbol) ||
        !allowedSymbols.has(toSymbol) ||
        fromSymbol === toSymbol ||
        !Number.isFinite(fromAmount) ||
        fromAmount <= 0
      ) {
        return res.status(400).json({ error: 'Invalid swap pair or amount.' });
      }

      const { prices } = await fetchLiveCryptoPricesUsd();
      const result = await executeSwapInNeon({
        userId: req.user.id,
        fromSymbol,
        toSymbol,
        fromAmount,
        prices,
      });
      res.status(201).json(result);
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/invest', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{
        category?: 'Standard' | 'Vacation' | 'Real Estate';
        planName?: string;
        amount?: number;
        dailyRate?: string;
        durationDays?: number;
        meta?: string;
        autoCompound?: boolean;
      }>(req);

      const amount = Number(body.amount);
      const durationDays = Math.max(1, Math.floor(Number(body.durationDays) || 1));
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Investment amount must be positive.' });
      }

      const category =
        body.category === 'Vacation' || body.category === 'Real Estate'
          ? body.category
          : 'Standard';

      const planName = String(body.planName || 'Investment Plan');
      if (category === 'Standard' && planName.trim().toLowerCase() === 'premium' && amount > 499999) {
        return res.status(400).json({ error: 'The Premium plan maximum investment is $499,999.' });
      }
      const dailyRate = String(body.dailyRate || '1.0%');
      const id = await investPlanInNeon({
        userId: req.user.id,
        category,
        planName,
        amount,
        dailyRate,
        durationDays,
        meta: body.meta ? String(body.meta) : undefined,
        autoCompound: Boolean(body.autoCompound),
      });

      const owner = await getUserPublicByIdInNeon(req.user.id);
      void dispatchPortalAutomation({
        eventKey: 'investment.activated',
        recipientEmail: owner?.email || req.user.email,
        variables: {
          name: owner?.name || req.user.name,
          investmentId: id,
          category,
          planName,
          amount: amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          dailyRate,
          durationDays,
        },
        webhookData: {
          investmentId: id,
          userId: req.user.id,
          category,
          planName,
          amount,
          dailyRate,
          durationDays,
        },
      });

      // Notify the investor that ROI accrual is pending its next verified settlement.
      // This is a status notice only; it does not claim that any return has been calculated or credited.
      void dispatchPortalAutomation({
        eventKey: 'roi.pending',
        recipientEmail: owner?.email || req.user.email,
        variables: {
          name: owner?.name || req.user.name,
          investmentId: id,
          planName,
          dailyRate,
          durationDays,
          status: 'Pending settlement',
        },
        webhookData: {
          investmentId: id,
          userId: req.user.id,
          category,
          planName,
          status: 'pending',
        },
      });

      res.status(201).json({ id });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.patch('/neon/investments/:id/settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{ autoCompound?: boolean; autoRoiEnabled?: boolean }>(req);
      const ok = await toggleInvestmentSettingsInNeon({
        invId: String(req.params.id),
        requesterId: req.user.id,
        isAdmin: req.user.role === 'admin',
        autoCompound: typeof body.autoCompound === 'boolean' ? body.autoCompound : undefined,
        autoRoiEnabled: typeof body.autoRoiEnabled === 'boolean' ? body.autoRoiEnabled : undefined,
      });
      if (!ok) return res.status(403).json({ error: 'Not permitted or investment not found.' });
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/roi/settle', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      // Client-submitted balances, profit deltas and transaction rows are not authoritative.
      // Disable this legacy settlement endpoint in production until ROI is calculated server-side.
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          error: 'Investment yield settlement is temporarily unavailable while server-side calculation is being implemented.',
        });
      }
      const body = parseJsonBody<{
        investmentUpdates?: Array<{ investment: RepoInvestment }>;
        transactions?: RepoTransaction[];
        userDeltas?: Record<string, { balanceDelta: number; profitDelta: number }>;
      }>(req);

      const invUpdates = Array.isArray(body.investmentUpdates) ? body.investmentUpdates : [];
      const userDeltas = body.userDeltas && typeof body.userDeltas === 'object' ? body.userDeltas : {};
      const result = await settleRoiPlanInNeon({
        requesterId: req.user.id,
        isAdmin: req.user.role === 'admin',
        investmentUpdates: invUpdates,
        transactions: Array.isArray(body.transactions) ? body.transactions : [],
        userDeltas,
      });

      if (result.settledCount > 0) {
        for (const [uid, delta] of Object.entries(userDeltas)) {
          if (req.user.role !== 'admin' && uid !== req.user.id) continue;
          if (!delta || delta.profitDelta <= 0) continue;
          const targetUser = await getUserPublicByIdInNeon(uid);
          if (!targetUser) continue;
          const planCount = invUpdates.filter((u) => u.investment.userId === uid).length || 1;
          void dispatchPortalAutomation({
            eventKey: 'roi.settled',
            recipientEmail: targetUser.email,
            variables: {
              name: targetUser.name,
              amount: Number(delta.profitDelta).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              planCount,
              newBalance: targetUser.accountBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            },
            webhookData: {
              userId: uid,
              profitDelta: delta.profitDelta,
              balanceDelta: delta.balanceDelta,
              planCount,
            },
          });
        }
      }

      res.json(result);
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.patch('/neon/profile/avatar', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{ avatarDataUrl?: string | null }>(req);
      await updateAvatarInNeon(req.user.id, body.avatarDataUrl || undefined);
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.patch('/neon/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{
        displayName?: string;
        accountType?: 'Individual' | 'Joint';
        coOwnerName?: string;
        coOwnerEmail?: string;
        relationship?: string;
        authorizationMode?: 'Either Owner' | 'Dual Notice';
      }>(req);

      if (!body.displayName || !String(body.displayName).trim()) {
        return res.status(400).json({ error: 'Display name is required.' });
      }
      await updateProfileAndJointInNeon({
        userId: req.user.id,
        email: req.user.email,
        displayName: String(body.displayName),
        accountType: body.accountType === 'Joint' ? 'Joint' : 'Individual',
        coOwnerName: body.coOwnerName ? String(body.coOwnerName) : undefined,
        coOwnerEmail: body.coOwnerEmail ? String(body.coOwnerEmail) : undefined,
        relationship: body.relationship ? String(body.relationship) : undefined,
        authorizationMode: body.authorizationMode === 'Dual Notice' ? 'Dual Notice' : 'Either Owner',
      });
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/profile/change-password', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{ currentPassword?: string; newPassword?: string }>(req);
      await changePasswordInNeon({
        userId: req.user.id,
        currentPassword: String(body.currentPassword || ''),
        newPassword: String(body.newPassword || ''),
      });

      void dispatchPortalAutomation({
        eventKey: 'auth.password_changed',
        recipientEmail: req.user.email,
        variables: {
          name: req.user.name,
          email: req.user.email,
        },
        webhookData: {
          userId: req.user.id,
          email: req.user.email,
          method: 'profile_change',
        },
      });

      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/kyc', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{
        submission?: {
          legalName: string;
          country: string;
          documentType: 'Passport' | 'National ID' | 'Driver License';
          documentNumber: string;
          idFrontDataUrl: string;
          idFrontName: string;
          selfieDataUrl: string;
          selfieName: string;
          submittedAt: string;
        };
      }>(req);

      if (!body.submission || !body.submission.legalName || !body.submission.documentNumber) {
        return res.status(400).json({ error: 'Incomplete KYC submission payload.' });
      }

      await submitKycInNeon({
        userId: req.user.id,
        submission: body.submission,
      });

      void dispatchPortalAutomation({
        eventKey: 'kyc.submitted',
        recipientEmail: req.user.email,
        adminCopyEmail: BOOTSTRAPPED_ADMIN_EMAIL,
        variables: {
          name: req.user.name,
          legalName: body.submission.legalName,
          documentType: body.submission.documentType,
          country: body.submission.country,
        },
        webhookData: {
          userId: req.user.id,
          legalName: body.submission.legalName,
          documentType: body.submission.documentType,
          country: body.submission.country,
        },
      });

      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/tickets', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const body = parseJsonBody<{
        senderEmail?: string;
        targetDeskEmail?: string;
        subject?: string;
        message?: string;
      }>(req);

      if (!body.subject?.trim() || !body.message?.trim()) {
        return res.status(400).json({ error: 'Subject and message are required.' });
      }

      const targetDeskEmail = String(body.targetDeskEmail || 'info@assetcrestonline.com');
      const subject = String(body.subject).trim();
      const message = String(body.message).trim();
      const id = await createTicketInNeon({
        userId: req.user.id,
        senderEmail: req.user.email,
        targetDeskEmail,
        subject,
        message,
      });

      void dispatchPortalAutomation({
        eventKey: 'ticket.created',
        recipientEmail: req.user.email,
        adminCopyEmail: targetDeskEmail,
        variables: {
          name: req.user.name,
          ticketId: id,
          senderEmail: req.user.email,
          targetDeskEmail,
          subject,
          message,
        },
        webhookData: {
          ticketId: id,
          userId: req.user.id,
          senderEmail: req.user.email,
          targetDeskEmail,
          subject,
        },
      });

      res.status(201).json({ id });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  // Referral / Visitor click telemetry (works authenticated or anonymous on ?ref= entry)
  router.post('/neon/location-logs', async (req, res) => {
    if (!verifyMutationOriginOrHeader(req)) {
      return res.status(403).json({ error: 'Forbidden: Invalid request origin' });
    }
    try {
      const { token } = extractAuthToken(req);
      const reporterUserId = token ? await lookupSessionUserId(token) : null;
      const body = parseJsonBody<{
        refCode?: string;
        clickedUrl?: string;
        latitude?: string;
        longitude?: string;
        accuracyLabel?: string;
        timezone?: string;
        language?: string;
        deviceSummary?: string;
        timestamp?: string;
      }>(req);

      const id = await logVisitorLocationInNeon(reporterUserId, {
        refCode: String(body.refCode || 'DIRECT'),
        clickedUrl: String(body.clickedUrl || ''),
        latitude: String(body.latitude || 'Unknown'),
        longitude: String(body.longitude || 'Unknown'),
        accuracyLabel: String(body.accuracyLabel || 'Browser telemetry'),
        timezone: String(body.timezone || 'UTC'),
        language: String(body.language || 'en-US'),
        deviceSummary: String(body.deviceSummary || 'Browser'),
        timestamp: String(body.timestamp || new Date().toISOString().slice(0, 16).replace('T', ' ')),
      });
      res.status(201).json({ id });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  // =========================================================================
  // ADMINISTRATOR ROUTES
  // =========================================================================
  router.post('/neon/admin/kyc/:userId', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const body = parseJsonBody<{ decision?: 'Approved' | 'Rejected'; adminNote?: string }>(req);
      const decision = body.decision === 'Approved' ? 'Approved' : 'Rejected';
      const targetUserId = String(req.params.userId);
      const adminNote = String(body.adminNote || '');
      await decideKycInNeon(targetUserId, decision, adminNote);

      const targetUser = await getUserPublicByIdInNeon(targetUserId);
      if (targetUser) {
        void dispatchPortalAutomation({
          eventKey: decision === 'Approved' ? 'kyc.approved' : 'kyc.rejected',
          recipientEmail: targetUser.email,
          variables: {
            name: targetUser.name,
            legalName: targetUser.kycSubmission?.legalName || targetUser.name,
            adminNote: adminNote || (decision === 'Approved' ? 'Approved by compliance desk.' : 'Please re-submit clear documents.'),
          },
          webhookData: {
            userId: targetUser.id,
            decision,
            adminNote,
          },
        });
      }

      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/admin/deposits/:txId/approve', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const txId = String(req.params.txId);
      await approveDepositInNeon(txId);

      const tx = await getTransactionByIdInNeon(txId);
      const owner = tx ? await getUserPublicByIdInNeon(tx.userId) : null;
      if (tx && owner) {
        void dispatchPortalAutomation({
          eventKey: 'deposit.approved',
          recipientEmail: owner.email,
          variables: {
            name: owner.name,
            txId: tx.id,
            amount: tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            method: tx.method,
            newBalance: owner.accountBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          },
          webhookData: {
            txId: tx.id,
            userId: owner.id,
            amount: tx.amount,
            method: tx.method,
            newBalance: owner.accountBalance,
          },
        });
      }

      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/admin/deposits/:txId/decline', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const txId = String(req.params.txId);
      await declineDepositInNeon(txId);

      const tx = await getTransactionByIdInNeon(txId);
      const owner = tx ? await getUserPublicByIdInNeon(tx.userId) : null;
      if (tx && owner) {
        void dispatchPortalAutomation({
          eventKey: 'deposit.declined',
          recipientEmail: owner.email,
          variables: {
            name: owner.name,
            txId: tx.id,
            amount: tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            method: tx.method,
            note: tx.note || 'Verification could not be matched on-chain.',
          },
          webhookData: {
            txId: tx.id,
            userId: owner.id,
            amount: tx.amount,
            method: tx.method,
            status: 'Cancelled',
          },
        });
      }

      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/admin/withdrawals/:txId/approve', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const txId = String(req.params.txId);
      await approveWithdrawalInNeon(txId);

      const tx = await getTransactionByIdInNeon(txId);
      const owner = tx ? await getUserPublicByIdInNeon(tx.userId) : null;
      if (tx && owner) {
        const destination = (tx.note || '').replace(/^Destination:\s*/i, '') || 'Designated payout address';
        void dispatchPortalAutomation({
          eventKey: 'withdrawal.approved',
          recipientEmail: owner.email,
          variables: {
            name: owner.name,
            txId: tx.id,
            amount: tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            method: tx.method,
            destination,
          },
          webhookData: {
            txId: tx.id,
            userId: owner.id,
            amount: tx.amount,
            method: tx.method,
            destination,
            status: 'Completed',
          },
        });
      }

      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/admin/withdrawals/:txId/decline', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const txId = String(req.params.txId);
      await declineWithdrawalInNeon(txId);

      const tx = await getTransactionByIdInNeon(txId);
      const owner = tx ? await getUserPublicByIdInNeon(tx.userId) : null;
      if (tx && owner) {
        void dispatchPortalAutomation({
          eventKey: 'withdrawal.declined',
          recipientEmail: owner.email,
          variables: {
            name: owner.name,
            txId: tx.id,
            amount: tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            method: tx.method,
            newBalance: owner.accountBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          },
          webhookData: {
            txId: tx.id,
            userId: owner.id,
            amount: tx.amount,
            method: tx.method,
            newBalance: owner.accountBalance,
            status: 'Cancelled',
          },
        });
      }

      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/admin/yields/distribute', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const body = parseJsonBody<{ payouts?: Array<{ inv: RepoInvestment; yieldAmt: number }> }>(req);
      const payouts = Array.isArray(body.payouts) ? body.payouts : [];
      const count = await distributeYieldsInNeon(payouts);

      if (count > 0) {
        const totalsByUser = new Map<string, { total: number; plans: number }>();
        for (const p of payouts) {
          const cur = totalsByUser.get(p.inv.userId) || { total: 0, plans: 0 };
          cur.total += Number(p.yieldAmt || 0);
          cur.plans += 1;
          totalsByUser.set(p.inv.userId, cur);
        }
        for (const [uid, info] of totalsByUser.entries()) {
          if (info.total <= 0) continue;
          const targetUser = await getUserPublicByIdInNeon(uid);
          if (!targetUser) continue;
          void dispatchPortalAutomation({
            eventKey: 'roi.settled',
            recipientEmail: targetUser.email,
            variables: {
              name: targetUser.name,
              amount: info.total.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              planCount: info.plans,
              newBalance: targetUser.accountBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            },
            webhookData: {
              userId: uid,
              totalYield: info.total,
              planCount: info.plans,
            },
          });
        }
      }

      res.json({ count });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.patch('/neon/admin/users/:userId/status', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const body = parseJsonBody<{ accountStatus?: 'Active' | 'Blocked' }>(req);
      const status = body.accountStatus === 'Blocked' ? 'Blocked' : 'Active';
      await toggleUserStatusInNeon(String(req.params.userId), status);
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/admin/users/:userId/funds', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const body = parseJsonBody<{
        accountBalance?: number;
        totalProfit?: number;
        bonus?: number;
        note?: string;
      }>(req);

      await adjustUserFundsInNeon({
        targetUserId: String(req.params.userId),
        accountBalance: Math.max(0, Number(body.accountBalance) || 0),
        totalProfit: Math.max(0, Number(body.totalProfit) || 0),
        bonus: Math.max(0, Number(body.bonus) || 0),
        note: body.note ? String(body.note) : undefined,
      });
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.post('/neon/admin/wallets', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const body = parseJsonBody<{ wallet?: RepoCryptoWallet }>(req);
      if (!body.wallet || !body.wallet.id || !body.wallet.address) {
        return res.status(400).json({ error: 'Invalid crypto wallet payload.' });
      }
      await saveCryptoWalletInNeon(body.wallet);
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  router.delete('/neon/admin/wallets/:walletId', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await deleteCryptoWalletInNeon(String(req.params.walletId));
      res.json({ ok: true });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  // =========================================================================
  // ADMIN EMAIL TEMPLATES, SMTP/RELAY & WEBHOOK AUTOMATION ENDPOINTS
  // =========================================================================
  router.get('/neon/admin/automation', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const [templates, webhooks, mailSettings, logs] = await Promise.all([
        listEmailTemplates(),
        listPublicWebhookEndpoints(),
        getPublicEmailDeliverySettings(),
        listAutomationDeliveryLogs(100),
      ]);
      res.json({
        templates,
        webhooks,
        mailSettings,
        logs,
        events: PORTAL_AUTOMATION_EVENTS,
        inboundWebhookPath: '/api/webhooks/inbound',
      });
    } catch (err) {
      sendError(res, err, 500);
    }
  });

  router.put(
    '/neon/admin/automation/templates/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const body = parseJsonBody<{
          name?: string;
          enabled?: boolean;
          subject?: string;
          preheader?: string;
          htmlBody?: string;
          textBody?: string;
        }>(req);

        const template = await updateEmailTemplateRecord(String(req.params.id), {
          name: body.name !== undefined ? String(body.name) : undefined,
          enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
          subject: body.subject !== undefined ? String(body.subject) : undefined,
          preheader: body.preheader !== undefined ? String(body.preheader) : undefined,
          htmlBody: body.htmlBody !== undefined ? String(body.htmlBody) : undefined,
          textBody: body.textBody !== undefined ? String(body.textBody) : undefined,
        });
        res.json({ template });
      } catch (err) {
        sendError(res, err, 400);
      }
    }
  );

  router.post(
    '/neon/admin/automation/templates/:id/test',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const body = parseJsonBody<{ toEmail?: string }>(req);
        const toEmail = String(body.toEmail || req.user?.email || '').trim();
        const log = await sendTestTemplateEmail(String(req.params.id), toEmail);
        res.json({ log });
      } catch (err) {
        sendError(res, err, 400);
      }
    }
  );

  router.put(
    '/neon/admin/automation/mail-settings',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const body = parseJsonBody<{
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
        }>(req);

        if (body.emailWebhookUrl && body.emailWebhookUrl.trim()) {
          const safe = isSafeWebhookTarget(body.emailWebhookUrl.trim());
          if (!safe.ok) {
            return res.status(400).json({ error: safe.reason || 'Invalid Email Webhook URL.' });
          }
        }

        const mailSettings = await updateEmailDeliverySettings(body);
        res.json({ mailSettings });
      } catch (err) {
        sendError(res, err, 400);
      }
    }
  );

  router.post(
    '/neon/admin/automation/webhooks',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const body = parseJsonBody<{
          id?: string;
          name?: string;
          url?: string;
          signingSecret?: string;
          subscribedEvents?: string[];
          isActive?: boolean;
          deliveryMode?: 'event' | 'email_relay';
          customHeaders?: Record<string, string>;
        }>(req);

        const url = String(body.url || '').trim();
        const safe = isSafeWebhookTarget(url);
        if (!safe.ok) {
          return res.status(400).json({ error: safe.reason || 'Invalid webhook URL.' });
        }

        const webhook = await saveWebhookEndpointRecord({
          id: body.id ? String(body.id) : undefined,
          name: String(body.name || ''),
          url,
          signingSecret: body.signingSecret !== undefined ? String(body.signingSecret) : undefined,
          subscribedEvents: Array.isArray(body.subscribedEvents)
            ? body.subscribedEvents.map((e) => String(e))
            : ['*'],
          isActive: body.isActive !== false,
          deliveryMode: body.deliveryMode === 'email_relay' ? 'email_relay' : 'event',
          customHeaders:
            body.customHeaders && typeof body.customHeaders === 'object' ? body.customHeaders : undefined,
        });
        res.status(201).json({ webhook });
      } catch (err) {
        sendError(res, err, 400);
      }
    }
  );

  router.delete(
    '/neon/admin/webhooks/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        await deleteWebhookEndpointRecord(String(req.params.id));
        res.json({ ok: true });
      } catch (err) {
        sendError(res, err, 400);
      }
    }
  );

  router.post(
    '/neon/admin/automation/webhooks/:id/test',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const log = await sendTestWebhookEndpoint(String(req.params.id));
        res.json({ log });
      } catch (err) {
        sendError(res, err, 400);
      }
    }
  );

  // =========================================================================
  // RESEND DELIVERY WEBHOOK RECEIVER (/api/webhooks/resend)
  // Configure this exact URL in Resend. The raw body is required for Svix verification.
  router.post('/webhooks/resend', async (req: Request, res: Response) => {
    try {
      const secret = process.env.RESEND_WEBHOOK_SECRET?.trim() || '';
      if (!secret) {
        return res.status(503).json({ error: 'Resend webhook signing secret is not configured.' });
      }

      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : typeof req.body === 'string'
          ? req.body
          : '';
      const messageId = String(req.headers['svix-id'] || '');
      const timestamp = String(req.headers['svix-timestamp'] || '');
      const signature = String(req.headers['svix-signature'] || '');

      if (!verifyResendWebhookSignature(secret, messageId, timestamp, signature, rawBody)) {
        return res.status(401).json({ error: 'Invalid Resend webhook signature.' });
      }

      let event: Record<string, any>;
      try {
        event = JSON.parse(rawBody);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON payload.' });
      }

      const eventType = String(event.type || 'unknown');
      const data = event.data && typeof event.data === 'object' ? event.data : {};
      const recipient = Array.isArray(data.to) ? data.to.join(', ') : String(data.to || data.email || 'unknown');
      const emailId = String(data.email_id || data.id || 'unknown');

      await appendAutomationDeliveryLog({
        kind: 'webhook',
        eventKey: `resend.${eventType}`,
        target: recipient,
        subjectOrMethod: `Resend email event (${emailId})`,
        status: eventType === 'email.delivered' ? 'Delivered' : eventType === 'email.bounced' || eventType === 'email.failed' || eventType === 'email.complained' ? 'Failed' : 'Queued',
        httpStatus: 200,
        payloadPreview: JSON.stringify({
          type: eventType,
          email_id: data.email_id,
          to: data.to,
          subject: data.subject,
          created_at: event.created_at,
          bounce: data.bounce,
        }).slice(0, 900),
      });

      return res.status(200).json({ ok: true, received: eventType });
    } catch (err) {
      sendError(res, err, 500);
    }
  });

  // INBOUND SIGNED WEBHOOK RECEIVER (/api/webhooks/inbound)
  // =========================================================================
  router.post('/webhooks/inbound', async (req: Request, res: Response) => {
    try {
      const rawBodyStr = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body || {});

      const sigHeader = (req.headers['x-assetcrest-signature'] as string | undefined)?.trim();
      const tsHeader = (req.headers['x-assetcrest-timestamp'] as string | undefined)?.trim();
      const eventHeader = (req.headers['x-assetcrest-event'] as string | undefined)?.trim();
      const deliveryId =
        (req.headers['x-assetcrest-delivery'] as string | undefined)?.trim() ||
        `INB-${Date.now()}`;

      const [settings, hooks] = await Promise.all([
        getRawEmailDeliverySettings(),
        listRawWebhookEndpoints(),
      ]);

      const activeSecrets = [
        settings.emailWebhookSecret,
        ...hooks.filter((h) => h.isActive && h.signingSecret).map((h) => h.signingSecret),
      ].filter(Boolean);

      if (activeSecrets.length === 0) {
        return res.status(401).json({ error: 'Inbound webhook signing secret is not configured.' });
      }

      if (!sigHeader) {
        return res.status(401).json({ error: 'Missing X-AssetCrest-Signature header.' });
      }

      const verified = activeSecrets.some((sec) =>
        verifyInboundWebhookHmac(sec, tsHeader, sigHeader, rawBodyStr)
      );
      if (!verified) {
        return res.status(401).json({ error: 'Invalid webhook HMAC signature.' });
      }

      let payload: Record<string, any> = {};
      if (rawBodyStr.trim()) {
        try {
          const parsed = JSON.parse(rawBodyStr);
          payload = parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
          return res.status(400).json({ error: 'Invalid JSON payload.' });
        }
      }
      const eventName = String(payload.event || eventHeader || 'webhook.inbound');

      await appendAutomationDeliveryLog({
        kind: 'webhook',
        eventKey: `inbound.${eventName}`,
        target: '/api/webhooks/inbound',
        subjectOrMethod: `Inbound Webhook (${deliveryId})`,
        status: 'Delivered',
        httpStatus: 200,
        payloadPreview: rawBodyStr.slice(0, 900),
      });

      if (eventName === 'email.send' && payload.to && payload.subject) {
        await dispatchEmailWithSettings({
          eventKey: String(payload.triggerEvent || 'inbound.email.send'),
          toEmail: String(payload.to),
          subject: String(payload.subject),
          html: String(payload.html || `<p>${String(payload.text || '')}</p>`),
          text: String(payload.text || ''),
          variables: payload.variables && typeof payload.variables === 'object' ? payload.variables : {},
        });
      }

      res.status(200).json({
        ok: true,
        deliveryId,
        event: eventName,
        receivedAt: new Date().toISOString(),
      });
    } catch (err) {
      sendError(res, err, 400);
    }
  });

  return router;
}
