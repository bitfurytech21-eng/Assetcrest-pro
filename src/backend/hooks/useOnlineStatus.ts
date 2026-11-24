'use client';

import { useSyncExternalStore } from 'react';

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribeOnlineStatus, getOnlineSnapshot, () => true);
}
