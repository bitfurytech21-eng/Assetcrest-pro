'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/src/backend/hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 lg:bottom-4 left-4 z-50 ac-alert ac-alert-warning shadow-[var(--ac-shadow-toast)] font-semibold text-xs"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Offline Mode — Cached data is being used.</span>
    </div>
  );
};
