'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Code2,
  Copy,
  Eye,
  KeyRound,
  Mail,
  Plus,
  RefreshCw,
  Send,
  Server,
  Trash2,
  Webhook,
  XCircle,
} from 'lucide-react';
import {
  type AutomationAdminSnapshot,
  type EmailTemplateCategory,
  type EmailTemplateRecord,
  type WebhookEndpointRecord,
  cloudDeleteWebhookEndpoint,
  cloudGetAutomationConfig,
  cloudSaveEmailTemplate,
  cloudSaveMailSettings,
  cloudSaveWebhookEndpoint,
  cloudSendTestTemplateEmail,
  cloudTestWebhookEndpoint,
} from '@/src/backend/lib/neon-client';

interface AdminAutomationPanelProps {
  adminEmail: string;
  isCloudMode: boolean;
  onOpenAuthModal: () => void;
  onNotify: (msg: string, tone?: 'success' | 'info' | 'error') => void;
}

type AutomationSubTab = 'templates' | 'webhooks' | 'smtp' | 'logs';

const SAMPLE_PREVIEW_VALUES: Record<string, string> = {
  name: 'Marcus Vance',
  username: 'marcusvance',
  email: 'marcus.vance@assetcrest.co',
  country: 'United Kingdom',
  referralCode: 'MARCUS',
  code: '482910',
  txId: 'DEP-2026-8841',
  amount: '5,000.00',
  method: 'USDC (BEP20)',
  status: 'Completed',
  newBalance: '11,450.00',
  destination: '0xD0E2f9e3c73A4aaDF4436F2b7cef9255b8a41E92',
  note: 'Verified institutional settlement',
  legalName: 'Marcus Vance',
  documentType: 'Passport',
  adminNote: 'Documents verified cleanly.',
  investmentId: 'INV-2026-4410',
  category: 'Standard',
  planName: 'Prime',
  dailyRate: '1.72%',
  durationDays: '30',
  fromName: 'Elena Vance',
  transferId: 'TRF-2026-9902',
  ticketId: 'MSG-2026-318',
  senderEmail: 'marcus.vance@assetcrest.co',
  targetDeskEmail: 'support@assetcrest.co',
  subject: 'Account Settlement Inquiry',
  message: 'Please confirm settlement receipt for my recent wire.',
  planCount: '2',
  dashboardUrl: 'https://app.assetcrest.co/dashboard',
  resetUrl: 'https://app.assetcrest.co/forgot-password',
  timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC',
};

function renderPreviewHtml(html: string): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    return SAMPLE_PREVIEW_VALUES[key] ?? `[${key}]`;
  });
}

export function AdminAutomationPanel({
  adminEmail,
  isCloudMode,
  onOpenAuthModal,
  onNotify,
}: AdminAutomationPanelProps) {
  const [subTab, setSubTab] = useState<AutomationSubTab>('templates');
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [snapshot, setSnapshot] = useState<AutomationAdminSnapshot | null>(null);

  // Templates state
  const [tplCategory, setTplCategory] = useState<'All' | EmailTemplateCategory>('All');
  const [tplSearch, setTplSearch] = useState('');
  const [selectedTplId, setSelectedTplId] = useState<string>('');
  const [editTplName, setEditTplName] = useState('');
  const [editTplEnabled, setEditTplEnabled] = useState(true);
  const [editTplSubject, setEditTplSubject] = useState('');
  const [editTplPreheader, setEditTplPreheader] = useState('');
  const [editTplHtml, setEditTplHtml] = useState('');
  const [editTplText, setEditTplText] = useState('');
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');
  const [testEmailTarget, setTestEmailTarget] = useState(adminEmail);
  const [savingTpl, setSavingTpl] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Webhooks state
  const [editingHookId, setEditingHookId] = useState<string | null>(null);
  const [hookName, setHookName] = useState('');
  const [hookUrl, setHookUrl] = useState('');
  const [hookSecret, setHookSecret] = useState('');
  const [hookMode, setHookMode] = useState<'event' | 'email_relay'>('event');
  const [hookActive, setHookActive] = useState(true);
  const [hookEvents, setHookEvents] = useState<string[]>(['*']);
  const [savingHook, setSavingHook] = useState(false);
  const [testingHookId, setTestingHookId] = useState<string | null>(null);

  // SMTP / Mail relay settings state
  const [mailMode, setMailMode] = useState<'auto' | 'smtp' | 'webhook'>('auto');
  const [fromName, setFromName] = useState('AssetCrest');
  const [fromEmail, setFromEmail] = useState('noreply@assetcrest.co');
  const [replyTo, setReplyTo] = useState('support@assetcrest.co');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [emailWebhookUrl, setEmailWebhookUrl] = useState('');
  const [emailWebhookSecret, setEmailWebhookSecret] = useState('');
  const [notifyAdminOnEvents, setNotifyAdminOnEvents] = useState(true);
  const [savingMail, setSavingMail] = useState(false);

  // Delivery logs filter
  const [logKindFilter, setLogKindFilter] = useState<'all' | 'email' | 'webhook'>('all');

  const hydrateTemplateForm = useCallback((tpl: EmailTemplateRecord) => {
    setSelectedTplId(tpl.id);
    setEditTplName(tpl.name);
    setEditTplEnabled(tpl.enabled);
    setEditTplSubject(tpl.subject);
    setEditTplPreheader(tpl.preheader);
    setEditTplHtml(tpl.htmlBody);
    setEditTplText(tpl.textBody);
  }, []);

  const loadAutomation = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cloudGetAutomationConfig();
      setSnapshot(data);
      setAuthRequired(false);

      if (data.templates.length > 0) {
        const current =
          data.templates.find((t) => t.id === selectedTplId) || data.templates[0];
        hydrateTemplateForm(current);
      }

      setMailMode(data.mailSettings.mode);
      setFromName(data.mailSettings.fromName);
      setFromEmail(data.mailSettings.fromEmail);
      setReplyTo(data.mailSettings.replyTo);
      setSmtpHost(data.mailSettings.smtpHost);
      setSmtpPort(String(data.mailSettings.smtpPort || 587));
      setSmtpSecure(data.mailSettings.smtpSecure);
      setSmtpUser(data.mailSettings.smtpUser);
      setSmtpPass(data.mailSettings.hasSmtpPass ? '********' : '');
      setEmailWebhookUrl(data.mailSettings.emailWebhookUrl);
      setEmailWebhookSecret(data.mailSettings.hasEmailWebhookSecret ? '********' : '');
      setNotifyAdminOnEvents(data.mailSettings.notifyAdminOnEvents);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        setAuthRequired(true);
      } else {
        onNotify(err?.message || 'Could not load email templates and webhooks.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [hydrateTemplateForm, onNotify, selectedTplId]);

  useEffect(() => {
    void loadAutomation();
  }, [isCloudMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTemplates = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.templates.filter((t) => {
      if (tplCategory !== 'All' && t.category !== tplCategory) return false;
      if (tplSearch.trim()) {
        const q = tplSearch.trim().toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.eventKey.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [snapshot, tplCategory, tplSearch]);

  const activeTemplate = useMemo(
    () => snapshot?.templates.find((t) => t.id === selectedTplId) || null,
    [snapshot, selectedTplId]
  );

  const filteredLogs = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.logs.filter((l) =>
      logKindFilter === 'all' ? true : l.kind === logKindFilter
    );
  }, [snapshot, logKindFilter]);

  const inboundWebhookFullUrl = useMemo(() => {
    const path = snapshot?.inboundWebhookPath || '/api/webhooks/inbound';
    if (typeof window === 'undefined') return path;
    return `${window.location.origin}${path}`;
  }, [snapshot]);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate) return;
    setSavingTpl(true);
    try {
      const updated = await cloudSaveEmailTemplate(activeTemplate.id, {
        name: editTplName,
        enabled: editTplEnabled,
        subject: editTplSubject,
        preheader: editTplPreheader,
        htmlBody: editTplHtml,
        textBody: editTplText,
      });
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              templates: prev.templates.map((t) => (t.id === updated.id ? updated : t)),
            }
          : prev
      );
      onNotify(`Saved template "${updated.name}".`, 'success');
    } catch (err: any) {
      onNotify(err?.message || 'Failed to save template.', 'error');
    } finally {
      setSavingTpl(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!activeTemplate) return;
    setSendingTestEmail(true);
    try {
      const log = await cloudSendTestTemplateEmail(activeTemplate.id, testEmailTarget);
      onNotify(
        log.status === 'Sent'
          ? `Test email delivered to ${testEmailTarget}.`
          : log.status === 'Queued'
          ? `Test template rendered & logged (${log.errorMessage || 'Queued'}).`
          : `Test email failed: ${log.errorMessage || 'Check SMTP/Relay settings.'}`,
        log.status === 'Failed' ? 'error' : 'success'
      );
      await loadAutomation();
    } catch (err: any) {
      onNotify(err?.message || 'Failed to send test email.', 'error');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleSaveMailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMail(true);
    try {
      const saved = await cloudSaveMailSettings({
        mode: mailMode,
        fromName,
        fromEmail,
        replyTo,
        smtpHost,
        smtpPort: Number(smtpPort) || 587,
        smtpSecure,
        smtpUser,
        smtpPass,
        emailWebhookUrl,
        emailWebhookSecret,
        notifyAdminOnEvents,
      });
      setSnapshot((prev) => (prev ? { ...prev, mailSettings: saved } : prev));
      setSmtpPass(saved.hasSmtpPass ? '********' : '');
      setEmailWebhookSecret(saved.hasEmailWebhookSecret ? '********' : '');
      onNotify('SMTP and Email Relay Webhook settings saved.', 'success');
    } catch (err: any) {
      onNotify(err?.message || 'Failed to update mail delivery settings.', 'error');
    } finally {
      setSavingMail(false);
    }
  };

  const resetWebhookForm = () => {
    setEditingHookId(null);
    setHookName('');
    setHookUrl('');
    setHookSecret('');
    setHookMode('event');
    setHookActive(true);
    setHookEvents(['*']);
  };

  const handleEditWebhook = (hook: WebhookEndpointRecord) => {
    setEditingHookId(hook.id);
    setHookName(hook.name);
    setHookUrl(hook.url);
    setHookSecret(hook.hasSigningSecret ? '********' : '');
    setHookMode(hook.deliveryMode);
    setHookActive(hook.isActive);
    setHookEvents(hook.subscribedEvents.length > 0 ? hook.subscribedEvents : ['*']);
  };

  const handleToggleHookEvent = (eventKey: string) => {
    if (eventKey === '*') {
      setHookEvents(['*']);
      return;
    }
    setHookEvents((prev) => {
      const cleaned = prev.filter((k) => k !== '*');
      if (cleaned.includes(eventKey)) {
        const next = cleaned.filter((k) => k !== eventKey);
        return next.length === 0 ? ['*'] : next;
      }
      return [...cleaned, eventKey];
    });
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHook(true);
    try {
      await cloudSaveWebhookEndpoint({
        id: editingHookId || undefined,
        name: hookName,
        url: hookUrl,
        signingSecret: hookSecret,
        subscribedEvents: hookEvents,
        isActive: hookActive,
        deliveryMode: hookMode,
      });
      resetWebhookForm();
      onNotify('Webhook endpoint saved and active.', 'success');
      await loadAutomation();
    } catch (err: any) {
      onNotify(err?.message || 'Failed to save webhook endpoint.', 'error');
    } finally {
      setSavingHook(false);
    }
  };

  const handleDeleteWebhook = async (hook: WebhookEndpointRecord) => {
    try {
      await cloudDeleteWebhookEndpoint(hook.id);
      onNotify(`Removed webhook "${hook.name}".`, 'info');
      await loadAutomation();
    } catch (err: any) {
      onNotify(err?.message || 'Failed to delete webhook.', 'error');
    }
  };

  const handleTestWebhook = async (hook: WebhookEndpointRecord) => {
    setTestingHookId(hook.id);
    try {
      const log = await cloudTestWebhookEndpoint(hook.id);
      onNotify(
        log.status === 'Delivered'
          ? `Webhook "${hook.name}" returned HTTP ${log.httpStatus}.`
          : `Webhook test failed: ${log.errorMessage || `HTTP ${log.httpStatus}`}`,
        log.status === 'Delivered' ? 'success' : 'error'
      );
      await loadAutomation();
    } catch (err: any) {
      onNotify(err?.message || 'Webhook test failed.', 'error');
    } finally {
      setTestingHookId(null);
    }
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`Copied ${label}.`, 'success');
    } catch {
      onNotify(text, 'info');
    }
  };

  if (authRequired) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 text-center space-y-3">
        <KeyRound className="h-8 w-8 mx-auto text-amber-500" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Server Admin Session Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Email templates, SMTP credentials, and webhook endpoints are persisted on the server. Sign in as Admin to configure and test automated deliveries.
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-4 py-2 rounded bg-[#23446c] hover:bg-[#1c3657] text-white text-xs font-semibold cursor-pointer"
          >
            Sign In as Admin
          </button>
          <button
            type="button"
            onClick={() => void loadAutomation()}
            className="px-4 py-2 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Automated Email Templates &amp; Webhooks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Site-wide transactional notifications across auth, deposits, withdrawals, KYC, investments, P2P transfers, ROI payouts, and support tickets
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAutomation()}
          disabled={loading}
          className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overview Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
            Scanned Templates
          </p>
          <p className="text-lg font-bold font-mono mt-1">
            {snapshot?.templates.filter((t) => t.enabled).length ?? 0} /{' '}
            {snapshot?.templates.length ?? 16} Active
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
            Outbound Webhooks
          </p>
          <p className="text-lg font-bold font-mono mt-1">
            {snapshot?.webhooks.filter((w) => w.isActive).length ?? 0} Active
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
            Mail Transport
          </p>
          <p className="text-lg font-bold uppercase font-mono mt-1">
            {snapshot?.mailSettings.hasSmtpPass
              ? 'SMTP Ready'
              : snapshot?.mailSettings.emailWebhookUrl
              ? 'Relay Ready'
              : snapshot?.mailSettings.mode || 'AUTO'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
            Logged Dispatches
          </p>
          <p className="text-lg font-bold font-mono mt-1">{snapshot?.logs.length ?? 0}</p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'templates' as const, label: 'Email Templates (16)', icon: Mail },
          { id: 'webhooks' as const, label: 'Webhooks & Signing', icon: Webhook },
          { id: 'smtp' as const, label: 'SMTP & Relay Config', icon: Server },
          { id: 'logs' as const, label: 'Delivery Logs', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                active
                  ? 'bg-[#23446c] text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: EMAIL TEMPLATES */}
      {subTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Template Selector List */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden flex flex-col max-h-[760px]">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <input
                type="text"
                value={tplSearch}
                onChange={(e) => setTplSearch(e.target.value)}
                placeholder="Search event or template..."
                className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
              />
              <div className="flex flex-wrap gap-1">
                {(['All', 'Authentication', 'Treasury', 'Compliance', 'Investments', 'Support'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTplCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                        tplCategory === cat
                          ? 'bg-[#23446c] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
              {filteredTemplates.map((tpl) => {
                const selected = tpl.id === selectedTplId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => hydrateTemplateForm(tpl)}
                    className={`w-full text-left px-3.5 py-3 transition cursor-pointer ${
                      selected
                        ? 'bg-[#23446c]/10 dark:bg-sky-950/40 border-l-4 border-l-[#23446c]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {tpl.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          tpl.enabled
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {tpl.enabled ? 'Auto ON' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                      {tpl.eventKey} · {tpl.category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Editor & Live Preview */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-4">
            {!activeTemplate ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                Select an automated email template on the left to inspect or customize.
              </p>
            ) : (
              <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[11px] font-mono text-slate-500">
                      Trigger Event: <strong className="text-[#23446c] dark:text-sky-400">{activeTemplate.eventKey}</strong>
                    </p>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {activeTemplate.name}
                    </h2>
                  </div>
                  <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editTplEnabled}
                      onChange={(e) => setEditTplEnabled(e.target.checked)}
                      className="h-4 w-4 accent-[#23446c]"
                    />
                    <span>Automatic Sending Enabled</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Template Name</label>
                    <input
                      type="text"
                      value={editTplName}
                      onChange={(e) => setEditTplName(e.target.value)}
                      className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Preheader Text</label>
                    <input
                      type="text"
                      value={editTplPreheader}
                      onChange={(e) => setEditTplPreheader(e.target.value)}
                      className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={editTplSubject}
                    onChange={(e) => setEditTplSubject(e.target.value)}
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-medium"
                  />
                </div>

                {/* Merge variables */}
                <div>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Click any variable token to copy into clipboard:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTemplate.variables.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => void handleCopyText(`{{${v}}}`, `{{${v}}}`)}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-[11px] text-[#23446c] dark:text-sky-400 cursor-pointer"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle Live Preview vs HTML Source */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('preview')}
                      className={`px-3 py-1 rounded font-semibold inline-flex items-center gap-1 cursor-pointer ${
                        previewMode === 'preview'
                          ? 'bg-[#23446c] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Rendered Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('code')}
                      className={`px-3 py-1 rounded font-semibold inline-flex items-center gap-1 cursor-pointer ${
                        previewMode === 'code'
                          ? 'bg-[#23446c] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      HTML &amp; Plain Text
                    </button>
                  </div>
                </div>

                {previewMode === 'preview' ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden bg-slate-100">
                    <iframe
                      title="Email Template Preview"
                      sandbox=""
                      srcDoc={renderPreviewHtml(editTplHtml)}
                      className="w-full h-[360px] bg-white"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold mb-1">HTML Body</label>
                      <textarea
                        rows={10}
                        value={editTplHtml}
                        onChange={(e) => setEditTplHtml(e.target.value)}
                        className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Plain-Text Fallback</label>
                      <textarea
                        rows={4}
                        value={editTplText}
                        onChange={(e) => setEditTplText(e.target.value)}
                        className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="email"
                      value={testEmailTarget}
                      onChange={(e) => setTestEmailTarget(e.target.value)}
                      placeholder="recipient@example.com"
                      className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs w-56"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSendTestEmail()}
                      disabled={sendingTestEmail}
                      className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5 text-sky-600" />
                      {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={savingTpl}
                    className="px-4 py-2 rounded bg-[#23446c] hover:bg-[#1c3657] text-white font-semibold cursor-pointer"
                  >
                    {savingTpl ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: OUTBOUND & INBOUND WEBHOOKS */}
      {subTab === 'webhooks' && (
        <div className="space-y-4">
          {/* Inbound Receiver Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Inbound Signed Webhook Receiver
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                POST JSON events signed with <code className="font-mono">X-AssetCrest-Signature</code> (<code className="font-mono">sha256=...</code>) and <code className="font-mono">X-AssetCrest-Timestamp</code>. Also usable as a verified self-test destination.
              </p>
              <p className="text-xs font-mono text-[#23446c] dark:text-sky-400 break-all">
                {inboundWebhookFullUrl}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleCopyText(inboundWebhookFullUrl, 'Inbound Webhook URL')}
                className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setHookName(hookName || 'Portal Self-Test Receiver');
                  setHookUrl(inboundWebhookFullUrl);
                }}
                className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Use in Form
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Create / Edit Webhook Form */}
            <form
              onSubmit={handleSaveWebhook}
              className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {editingHookId ? 'Edit Webhook Endpoint' : 'Register Outbound Webhook'}
                </h3>
                {editingHookId && (
                  <button
                    type="button"
                    onClick={resetWebhookForm}
                    className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">Endpoint Name</label>
                <input
                  type="text"
                  required
                  value={hookName}
                  onChange={(e) => setHookName(e.target.value)}
                  placeholder="e.g. CRM Compliance Sync or Resend Relay"
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Destination URL</label>
                <input
                  type="url"
                  required
                  value={hookUrl}
                  onChange={(e) => setHookUrl(e.target.value)}
                  placeholder="https://hooks.example.com/assetcrest"
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Payload Mode</label>
                  <select
                    value={hookMode}
                    onChange={(e) => setHookMode(e.target.value as 'event' | 'email_relay')}
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                  >
                    <option value="event">JSON Event Notification</option>
                    <option value="email_relay">Email Relay (HTML + Text)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">HMAC Signing Secret</label>
                  <input
                    type="password"
                    value={hookSecret}
                    onChange={(e) => setHookSecret(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold">Subscribed Events</label>
                  <button
                    type="button"
                    onClick={() => handleToggleHookEvent('*')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                      hookEvents.includes('*')
                        ? 'bg-[#23446c] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    All Events (*)
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded p-2 space-y-1">
                  {(snapshot?.events || []).map((ev) => {
                    const checked = hookEvents.includes('*') || hookEvents.includes(ev.eventKey);
                    return (
                      <label key={ev.eventKey} className="flex items-center justify-between gap-2 cursor-pointer py-0.5">
                        <span className="truncate">
                          <span className="font-semibold">{ev.label}</span>{' '}
                          <span className="font-mono text-[10px] text-slate-500">({ev.eventKey})</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleHookEvent(ev.eventKey)}
                          className="h-3.5 w-3.5 accent-[#23446c]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center justify-between pt-1 cursor-pointer">
                <span className="font-semibold">Endpoint Active</span>
                <input
                  type="checkbox"
                  checked={hookActive}
                  onChange={(e) => setHookActive(e.target.checked)}
                  className="h-4 w-4 accent-[#23446c]"
                />
              </label>

              <button
                type="submit"
                disabled={savingHook}
                className="w-full py-2 rounded bg-[#23446c] hover:bg-[#1c3657] text-white font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                {savingHook
                  ? 'Saving...'
                  : editingHookId
                  ? 'Update Webhook Endpoint'
                  : 'Save Webhook Endpoint'}
              </button>
            </form>

            {/* Registered Webhooks List */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Configured Webhook Endpoints ({snapshot?.webhooks.length ?? 0})
                </h3>
              </div>

              {!snapshot?.webhooks.length ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No outbound webhooks registered yet. Add an endpoint on the left or click &ldquo;Use in Form&rdquo; above to test signed event delivery.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {snapshot.webhooks.map((hook) => (
                    <div key={hook.id} className="p-4 space-y-2 text-xs">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              {hook.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                hook.isActive
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {hook.isActive ? 'Active' : 'Paused'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                              {hook.deliveryMode}
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-slate-500 break-all mt-0.5">
                            {hook.url}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => void handleTestWebhook(hook)}
                            disabled={testingHookId === hook.id}
                            className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="h-3 w-3 text-sky-600" />
                            {testingHookId === hook.id ? 'Testing...' : 'Test'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditWebhook(hook)}
                            className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteWebhook(hook)}
                            aria-label={`Delete ${hook.name}`}
                            className="p-1.5 rounded border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono">
                        <span>Events: {hook.subscribedEvents.join(', ')}</span>
                        <span>Secret: {hook.signingSecretPreview}</span>
                        {hook.lastTriggeredAt && (
                          <span>
                            Last: HTTP {hook.lastStatusCode ?? '—'} ({hook.lastTriggeredAt})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SMTP & EMAIL RELAY SETTINGS */}
      {subTab === 'smtp' && (
        <form
          onSubmit={handleSaveMailSettings}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4 text-xs max-w-3xl"
        >
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Email Transport &amp; Delivery Settings
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Deliver automatic emails directly over SMTP or forward rendered HTML/text payloads to an Email Relay Webhook.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Delivery Mode</label>
              <select
                value={mailMode}
                onChange={(e) => setMailMode(e.target.value as 'auto' | 'smtp' | 'webhook')}
                className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              >
                <option value="auto">Auto (SMTP if configured, else Email Webhook)</option>
                <option value="smtp">SMTP Server Only</option>
                <option value="webhook">Email Relay Webhook Only</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">From Display Name</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">From Email Address</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Reply-To Address</label>
              <input
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">SMTP Credentials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.resend.com / smtp.postmarkapp.com / smtp.gmail.com"
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">SMTP Username</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">SMTP Password / API Token</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="Leave blank or ******** to keep existing"
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={smtpSecure}
                onChange={(e) => setSmtpSecure(e.target.checked)}
                className="h-4 w-4 accent-[#23446c]"
              />
              <span>Force TLS / SSL (port 465)</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              Email Relay Webhook (Optional HTTPS Forwarder)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Email Relay Webhook URL</label>
                <input
                  type="url"
                  value={emailWebhookUrl}
                  onChange={(e) => setEmailWebhookUrl(e.target.value)}
                  placeholder="https://worker.example.com/send-email"
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Relay HMAC Signing Secret</label>
                <input
                  type="password"
                  value={emailWebhookSecret}
                  onChange={(e) => setEmailWebhookSecret(e.target.value)}
                  placeholder="Leave ******** to keep existing"
                  className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
            <span className="font-semibold">
              Send admin alert copy on new registrations, deposits, withdrawals, KYC &amp; tickets
            </span>
            <input
              type="checkbox"
              checked={notifyAdminOnEvents}
              onChange={(e) => setNotifyAdminOnEvents(e.target.checked)}
              className="h-4 w-4 accent-[#23446c]"
            />
          </label>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingMail}
              className="px-5 py-2 rounded bg-[#23446c] hover:bg-[#1c3657] text-white font-semibold cursor-pointer"
            >
              {savingMail ? 'Saving...' : 'Save Delivery Settings'}
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 4: DELIVERY LOGS */}
      {subTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Recent Automated Email &amp; Webhook Dispatches
            </h3>
            <div className="flex gap-1.5">
              {(['all', 'email', 'webhook'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setLogKindFilter(k)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase cursor-pointer ${
                    logKindFilter === k
                      ? 'bg-[#23446c] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                  <th className="px-4 py-2.5 font-semibold">Channel</th>
                  <th className="px-4 py-2.5 font-semibold">Event</th>
                  <th className="px-4 py-2.5 font-semibold">Target</th>
                  <th className="px-4 py-2.5 font-semibold">Subject / Endpoint</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No email or webhook deliveries logged yet. Trigger a test or portal event to inspect live dispatches.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="align-top">
                      <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">
                        {log.createdAt}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.kind === 'webhook'
                              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                              : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                          }`}
                        >
                          {log.kind}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px]">{log.eventKey}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] max-w-[200px] truncate">
                        {log.target}
                      </td>
                      <td className="px-4 py-2.5 max-w-xs">
                        <p className="font-semibold truncate">{log.subjectOrMethod}</p>
                        {log.errorMessage && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                            {log.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            log.status === 'Sent' || log.status === 'Delivered'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : log.status === 'Failed'
                              ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {log.status === 'Failed' ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {log.status}
                          {log.httpStatus ? ` (${log.httpStatus})` : ''}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
