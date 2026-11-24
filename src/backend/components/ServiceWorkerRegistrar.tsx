'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // In Next.js development mode, unhashed chunk URLs change across edits;
    // unregister any active service worker and clear dev caches to prevent hydration mismatches.
    if (import.meta.env.DEV) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
      if ('caches' in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .catch(() => {});
      }
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update().catch(() => {});
      })
      .catch(() => {
        // Ignore registration failures in restricted preview contexts
      });
  }, []);

  return null;
}
