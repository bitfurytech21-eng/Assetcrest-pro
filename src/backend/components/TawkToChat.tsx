import { useEffect } from 'react';

/**
 * Loads the official tawk.to widget on public pages and inside the customer portal.
 * Configure VITE_TAWK_PROPERTY_ID and VITE_TAWK_WIDGET_ID in the deployment environment.
 */
export default function TawkToChat() {
  useEffect(() => {
    // Public embed IDs supplied for the official AssetCrest Tawk.to property.
    // Environment variables may override these defaults for staging or a replacement widget.
    const propertyId = (import.meta.env.VITE_TAWK_PROPERTY_ID || '6b08ea3c7b5efd3cb09191e5').trim();
    const widgetId = (import.meta.env.VITE_TAWK_WIDGET_ID || '1k8dd5vd3').trim();

    if (!propertyId || !widgetId) return;

    const scriptId = 'assetcrest-tawkto-widget';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://embed.tawk.to/${encodeURIComponent(propertyId)}/${encodeURIComponent(widgetId)}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);

    return () => {
      // Keep the provider widget alive during client-side route changes.
    };
  }, []);

  return null;
}
