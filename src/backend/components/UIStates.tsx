'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, RefreshCw, X } from 'lucide-react';

export interface ToastNotification {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'error';
}

export function PortalToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastNotification[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Portal notifications"
      className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-xs w-[calc(100vw-2rem)] sm:w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className={`ac-toast ${
              toast.tone === 'success'
                ? 'ac-toast-success'
                : toast.tone === 'error'
                ? 'ac-toast-error'
                : 'ac-toast-info'
            }`}
          >
            <div className="flex items-start gap-2 min-w-0">
              {toast.tone === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              ) : toast.tone === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <span className="break-words">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-md opacity-85 hover:opacity-100 hover:bg-white/15 shrink-0 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ErrorAlertBanner({
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  onDismiss,
  className = '',
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={`ac-alert ac-alert-error justify-between ${className}`}>
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 space-y-0.5">
          {title && <p className="font-bold text-xs uppercase tracking-wide">{title}</p>}
          <p className="text-xs leading-relaxed break-words">{message}</p>
        </div>
      </div>
      {(onRetry || onDismiss) && (
        <div className="flex items-center gap-1.5 shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ac-btn ac-btn-secondary ac-btn-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{retryLabel}</span>
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="ac-btn ac-btn-ghost p-1.5 rounded-md"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center border border-dashed border-slate-300/90 dark:border-slate-700/80 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 ${
        compact ? 'px-4 py-8' : 'px-6 py-12'
      }`}
    >
      <div className="h-12 w-12 rounded-2xl bg-[var(--ac-accent-soft)] border border-[var(--ac-accent-border)] text-[#2b4865] dark:text-sky-400 flex items-center justify-center mb-3.5">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="ac-btn ac-btn-primary ac-btn-sm"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="ac-btn ac-btn-secondary ac-btn-sm"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading table data"
      className="p-4 space-y-3"
    >
      <div className="grid gap-3 pb-2 border-b border-slate-200/70 dark:border-slate-800" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, c) => (
          <div key={c} className="ac-skeleton h-4 w-3/4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-3 py-2 items-center"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, c) => (
            <div
              key={c}
              className={`ac-skeleton h-4 ${c === columns - 1 ? 'w-1/2 ml-auto' : 'w-full'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading AssetCrest dashboard"
      className="grid grid-cols-12 gap-4 lg:gap-6"
    >
      {/* Page Header Skeleton */}
      <div className="col-span-12 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="ac-skeleton h-8 w-56" />
          <div className="ac-skeleton h-4 w-72 max-w-full" />
        </div>
        <div className="ac-skeleton h-9 w-48" />
      </div>

      {/* Welcome Banner Skeleton */}
      <div className="col-span-12 ac-card px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="ac-skeleton h-8 w-8 rounded-xl" />
          <div className="ac-skeleton h-4 w-48" />
        </div>
        <div className="ac-skeleton h-6 w-6 rounded-md" />
      </div>

      {/* 5 KPI Stat Cards Skeleton matching exact 12-col layout */}
      {[
        'col-span-12 sm:col-span-6 xl:col-span-4',
        'col-span-12 sm:col-span-6 xl:col-span-4',
        'col-span-12 sm:col-span-6 xl:col-span-4',
        'col-span-12 sm:col-span-6',
        'col-span-12 sm:col-span-12 xl:col-span-6',
      ].map((spanClass, idx) => (
        <div key={idx} className={`${spanClass} ac-card p-5 flex items-start justify-between gap-3`}>
          <div className="space-y-3 flex-1 min-w-0">
            <div className="ac-skeleton h-3.5 w-28" />
            <div className="ac-skeleton h-10 w-44" />
            <div className="ac-skeleton h-5 w-36" />
          </div>
          <div className="ac-skeleton h-11 w-11 rounded-xl shrink-0" />
        </div>
      ))}

      {/* 2 Chart Panels Skeleton matching exact h-64 heights */}
      <div className="col-span-12 lg:col-span-7 ac-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="ac-skeleton h-5 w-40" />
            <div className="ac-skeleton h-3.5 w-60" />
          </div>
          <div className="ac-skeleton h-4 w-24" />
        </div>
        <div className="ac-skeleton h-64 w-full rounded-xl" />
      </div>

      <div className="col-span-12 lg:col-span-5 ac-card p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="ac-skeleton h-5 w-40" />
          <div className="ac-skeleton h-3.5 w-52" />
        </div>
        <div className="ac-skeleton h-64 w-full rounded-xl" />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="col-span-12 ac-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="ac-skeleton h-5 w-32" />
          <div className="ac-skeleton h-4 w-64 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="ac-skeleton h-9 w-24" />
          <div className="ac-skeleton h-9 w-28" />
          <div className="ac-skeleton h-9 w-28" />
          <div className="ac-skeleton h-9 w-28" />
        </div>
      </div>
    </div>
  );
}
