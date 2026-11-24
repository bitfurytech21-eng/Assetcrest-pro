'use client';

import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '@/src/backend/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'full';
  onFallbackClick?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onFallbackClick,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="ac-badge ac-badge-success w-full justify-center py-2.5 px-4 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Installed as App</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    if (onFallbackClick) {
      onFallbackClick();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === 'full'
            ? 'ac-btn ac-btn-primary ac-btn-sm w-full'
            : 'ac-btn ac-btn-sm bg-white/15 hover:bg-white/25 border border-white/20 text-white'
        }
      >
        {isInstallable ? (
          <>
            <Download className="h-3.5 w-3.5" />
            <span>{variant === 'full' ? 'Install Native WebAPK' : 'Install App'}</span>
          </>
        ) : isIOS ? (
          <>
            <Smartphone className="h-3.5 w-3.5" />
            <span>Install on iOS</span>
          </>
        ) : (
          <>
            <Smartphone className="h-3.5 w-3.5" />
            <span>{variant === 'full' ? 'Install PWA on Android' : 'Install App'}</span>
          </>
        )}
      </button>

      {showGuide && (
        <div className="ac-modal-backdrop">
          <div className="ac-modal-panel max-w-md text-left">
            <div className="ac-modal-header">
              <h3 className="ac-section-title text-white flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-sky-300 shrink-0" />
                <span>{isIOS ? 'Install on iPhone / iPad' : 'Install on Android / Chrome'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="p-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/15 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {isIOS ? (
                <ol className="text-sm text-slate-700 dark:text-slate-200 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Open this app URL directly in Safari (outside embedded frames).</li>
                  <li>Tap the <strong>Share</strong> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                </ol>
              ) : (
                <ol className="text-sm text-slate-700 dark:text-slate-200 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Open this app URL directly in <strong>Chrome for Android</strong> (or scan the QR code in the APK Studio).</li>
                  <li>Tap the Chrome menu (<strong>⋮</strong>) and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                  <li>Android Chrome automatically compiles and installs a standalone <strong>WebAPK</strong> on your phone.</li>
                </ol>
              )}
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="ac-btn ac-btn-primary ac-btn-md w-full"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
