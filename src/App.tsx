/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceWorkerRegistrar } from '@/src/backend/components/ServiceWorkerRegistrar';
import { OfflineIndicator } from '@/src/backend/components/OfflineIndicator';
import { ErrorBoundary } from '@/src/backend/components/ErrorBoundary';
import AssetCrestPortal from '@/src/backend/AssetCrestPortal';
import PublicHomePage from '@/src/backend/components/PublicHomePage';

export default function App() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\\/+$/, '') || '/' : '/';
  const isPublicHome = pathname === '/' || pathname === '/home';

  return (
    <>
      <ServiceWorkerRegistrar />
      <OfflineIndicator />
      <ErrorBoundary>
        {isPublicHome ? <PublicHomePage /> : <AssetCrestPortal />}
      </ErrorBoundary>
    </>
  );
}
