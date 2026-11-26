import { useEffect } from 'react';

/**
 * Loads the official tawk.to widget on public pages and inside the customer portal.
 * Configure VITE_TAWK_PROPERTY_ID and VITE_TAWK_WIDGET_ID in the deployment environment.
 */
export default function TawkToChat() {
  useEffect(() => {
    const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID?.trim();
    const widgetId = import.meta.env.VITE_TAWK_WIDGET_ID?.trim();

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
