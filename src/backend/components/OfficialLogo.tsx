import React from 'react';

export const OFFICIAL_COMPANY_LOGO_PATH = '/assets/aistudio/IMG_8418_a25e751f.jpeg';

export function OfficialLogoMark({
  className = 'h-10 w-10',
  variant = 'light',
}: {
  className?: string;
  variant?: 'light' | 'badge' | 'blend';
}) {
  const frameClass =
    variant === 'badge'
      ? 'overflow-hidden rounded-md bg-white p-0.5 shadow-sm'
      : variant === 'blend'
        ? 'overflow-hidden mix-blend-multiply'
        : 'overflow-hidden bg-white';

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${frameClass} ${className}`}>
      <img
        src={OFFICIAL_COMPANY_LOGO_PATH}
        alt="AssetCrest"
        className="assetcrest-official-logo-img select-none"
      />
    </span>
  );
}
