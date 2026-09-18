/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // If rendered in client-side SPA mode, redirect directly to root proxy
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.location.replace('/');
    }
  }, []);

  return null;
}

