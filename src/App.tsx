/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceWorkerRegistrar } from '@/src/backend/components/ServiceWorkerRegistrar';
import { OfflineIndicator } from '@/src/backend/components/OfflineIndicator';
import { ErrorBoundary } from '@/src/backend/components/ErrorBoundary';
import AssetCrestPortal from '@/src/backend/AssetCrestPortal';

export default function App() {
  return (
    <>
      <ServiceWorkerRegistrar />
      <OfflineIndicator />
      <ErrorBoundary>
        <AssetCrestPortal />
      </ErrorBoundary>
    </>
  );
}
