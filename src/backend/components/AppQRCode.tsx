'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface AppQRCodeProps {
  url: string;
  size?: number;
}

export const AppQRCode: React.FC<AppQRCodeProps> = ({ url, size = 132 }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');

  useEffect(() => {
    let active = true;
    const target = url || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!target) return;
    QRCode.toString(target, {
      type: 'svg',
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (active) setSvgHtml(svg);
      })
      .catch(() => {
        if (active) setSvgHtml('');
      });
    return () => {
      active = false;
    };
  }, [url, size]);

  if (!svgHtml) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-white/10 animate-pulse shrink-0"
      />
    );
  }

  return (
    <div
      className="p-2 bg-white rounded-xl shrink-0 shadow-md"
      dangerouslySetInnerHTML={{ __html: svgHtml }}
      aria-label="QR code to open and install app on Android"
    />
  );
};
