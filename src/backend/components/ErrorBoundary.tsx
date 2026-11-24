'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage) as {
          error?: string;
          operationType?: string;
          path?: string;
        };
        if (parsed && parsed.error) {
          friendly = `${parsed.error} (${parsed.operationType || 'operation'} on ${parsed.path || 'database'})`;
        }
      } catch {
        // Plain error string
      }

      return (
        <div className="ac-canvas-surface min-h-screen flex items-center justify-center p-4">
          <div
            role="alert"
            className="relative z-10 ac-card max-w-md w-full p-6 space-y-4 text-center"
          >
            <div className="mx-auto h-12 w-12 rounded-2xl bg-[var(--ac-danger-bg)] border border-[var(--ac-danger-border)] text-[var(--ac-danger-text)] flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <span className="ac-badge ac-badge-danger">Application Error</span>
              <h2 className="ac-section-title text-slate-900 dark:text-white">
                Cloud Data Access Notice
              </h2>
            </div>
            <div className="ac-alert ac-alert-error text-left">
              <p className="text-xs leading-relaxed break-words">{friendly}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="ac-btn ac-btn-primary ac-btn-md w-full"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reload AssetCrest</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
