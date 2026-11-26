/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceWorkerRegistrar } from '@/src/backend/components/ServiceWorkerRegistrar';
import { OfflineIndicator } from '@/src/backend/components/OfflineIndicator';
import { ErrorBoundary } from '@/src/backend/components/ErrorBoundary';
import AssetCrestPortal from '@/src/backend/AssetCrestPortal';
import PublicSitePage from '@/src/backend/components/PublicSitePage';

const PUBLIC_PATHS = new Set([
  '/', '/home', '/about-us', '/company-history',
  '/investment-plans', '/our-process', '/offer', '/contact-us',
]);

export default function App() {
  const pathname = typeof window !== 'undefined'
    ? window.location.pathname.replace(/\/+$/, '') || '/'
    : '/';
  const isPublicPage = PUBLIC_PATHS.has(pathname);

  return (
    <>
      <ServiceWorkerRegistrar />
      <OfflineIndicator />
      <ErrorBoundary>
        {isPublicPage ? <PublicSitePage /> : <AssetCrestPortal />}
      </ErrorBoundary>
    </>
  );
}
