import React from 'react';

export const OFFICIAL_COMPANY_LOGO_PATH = '/favicon-512.png';

export function OfficialLogoMark({
  className = 'h-10 w-10',
  variant = 'light',
}: {
  className?: string;
  variant?: 'light' | 'badge' | 'blend';
}) {
  const frameClass =
    variant === 'badge'
      ? 'overflow-hidden rounded-md bg-[#032237] p-0.5 shadow-sm'
      : variant === 'blend'
        ? 'overflow-hidden bg-[#032237]'
        : 'overflow-hidden bg-[#032237]';

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
