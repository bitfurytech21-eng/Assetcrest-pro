import React from 'react';

export interface SectorIconProps {
  className?: string;
  strokeWidth?: number;
  surfaceColor?: string;
}

const DEFAULT_STROKE = 2.4;

export function ForexScaleIcon({ className = '', strokeWidth = DEFAULT_STROKE }: SectorIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Top pivot ring and horizontal balance beam */}
      <circle cx="48" cy="18" r="4.2" />
      <path d="M18 18h25.8M52.2 18H78" />
      <path d="M22 18L12 46M22 18L32 46" />
      <path d="M74 18L64 46M74 18L84 46" />

      {/* Left & right weighing pans */}
      <path d="M10 46h24a12 12.5 0 0 1-24 0Z" />
      <path d="M62 46h24a12 12.5 0 0 1-24 0Z" />

      {/* Decorative dot triplets under each pan */}
      <circle cx="17.5" cy="64" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="22" cy="64" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="26.5" cy="64" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="69.5" cy="64" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="74" cy="64" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="78.5" cy="64" r="1.3" fill="currentColor" stroke="none" />

      {/* Central pillar and stepped base */}
      <path d="M45.5 22.2v50.8M50.5 22.2v50.8" />
      <rect x="33" y="73" width="30" height="5" rx="1" />
      <rect x="20" y="78" width="56" height="6" rx="1.5" />
    </svg>
  );
}

export function CryptoPieIcon({ className = '', strokeWidth = DEFAULT_STROKE }: SectorIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Top-left parallel connector stubs */}
      <path d="M12 22h11M12 27h9" />
      {/* Bottom-right parallel connector stubs */}
      <path d="M72 72h12M74 77h10" />

      {/* Main pie circle divided into left and bottom-right sectors */}
      <path d="M44 23A29 29 0 1 0 73 52H44V23Z" />
      <path d="M44 52L23.5 72.5" />

      {/* Inner dotted arc inside bottom-right sector */}
      <path d="M43 73.5a21.5 21.5 0 0 0 21.5-15" strokeDasharray="1.5 5.5" />

      {/* Popped-out hatched top-right wedge */}
      <g>
        <path d="M50 46V17a29 29 0 0 1 29 29H50Z" fill="none" />
        <path d="M50 27l10-10M50 35l17-17M50 43l22-22M55 46l21-21M63 46l14-14M71 46l7-7" strokeWidth={Math.max(1.8, strokeWidth - 0.35)} />
        <path d="M50 46V17a29 29 0 0 1 29 29H50Z" />
      </g>
    </svg>
  );
}

export function MedicalCannabisChatIcon({ className = '', strokeWidth = DEFAULT_STROKE, surfaceColor = 'white' }: SectorIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Back speech bubble (top-right) */}
      <path d="M45 20V13h28v17h-7l-4 5v-5h-7" />
      {/* Front speech bubble (top-left) */}
      <path d="M23 19h32v17H36l-5 5v-5h-8V19Z" fill={surfaceColor} />

      {/* Left person (woman) */}
      <path d="M18 66c-2-3-2.5-9-1.5-14 1.5-7 6-11 12.5-11s11 4 12.5 11c1 5 .5 11-1.5 14" />
      <path d="M22 54c0 6.2 3.1 10.5 7 10.5S36 60.2 36 54c0-4.5-2.6-7.5-7-7.5s-7 3-7 7.5Z" />
      <path d="M22.5 51c2.5 1.5 6.5 1 9.5-2" />
      <path d="M25 65v4M33 65v4" />
      <path d="M12 85v-8c0-4.5 4.5-8 10.5-8h13c6 0 10.5 3.5 10.5 8v8" />
      <path d="M23.5 69l5.5 8 5.5-8M29 77v8M19 79v6M39 79v6" />

      {/* Right person (man) */}
      <path d="M59 53c0 6.5 3.6 11.5 8 11.5s8-5 8-11.5-3.2-10-8-10-8 3.5-8 10Z" />
      <path d="M59 51c2.5-2.5 6-2 10-4 2.5 1 4.5 2 6 4" />
      <path d="M63 64.5v4.5M71 64.5v4.5" />
      <path d="M50 85v-8c0-4.5 4.5-8 10.5-8h13C79.5 69 84 72.5 84 77v8" />
      <path d="M61 69l6 6.5L73 69M65.5 74.5l1.5 10.5 1.5-10.5M57 79v6M77 79v6" />
    </svg>
  );
}

export function ChessClusterIcon({ className = '', strokeWidth = DEFAULT_STROKE, surfaceColor = 'white' }: SectorIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Left chess piece */}
      <circle cx="25" cy="17" r="2.6" />
      <path d="M19 31c0-6.2 2.6-11.4 6-11.4s6 5.2 6 11.4" />
      <rect x="17.5" y="31" width="15" height="3.8" rx="1.9" />
      <path d="M20.5 34.8c0 11-2 22-4.5 31.2h18c-2.5-9.2-4.5-20.2-4.5-31.2" />
      <rect x="12" y="66" width="26" height="4.5" rx="1.5" />
      <rect x="9" y="70.5" width="32" height="5" rx="1.5" />

      {/* Right chess piece */}
      <circle cx="71" cy="17" r="2.6" />
      <path d="M65 31c0-6.2 2.6-11.4 6-11.4s6 5.2 6 11.4" />
      <rect x="63.5" y="31" width="15" height="3.8" rx="1.9" />
      <path d="M66.5 34.8c0 11-2 22-4.5 31.2h18c-2.5-9.2-4.5-20.2-4.5-31.2" />
      <rect x="58" y="66" width="26" height="4.5" rx="1.5" />
      <rect x="55" y="70.5" width="32" height="5" rx="1.5" />

      {/* Center foreground chess piece (surfaceColor fill cleanly overlaps left/right) */}
      <circle cx="48" cy="22.5" r="2.6" fill={surfaceColor} />
      <path d="M40.5 39c0-7.5 3.3-13.8 7.5-13.8s7.5 6.3 7.5 13.8Z" fill={surfaceColor} />
      <rect x="38.5" y="39" width="19" height="4.2" rx="2.1" fill={surfaceColor} />
      <path d="M42.2 43.2c0 11.2-2.2 22-5.2 31.3h22c-3-9.3-5.2-20.1-5.2-31.3Z" fill={surfaceColor} />
      <rect x="33" y="74.5" width="30" height="5" rx="1.5" fill={surfaceColor} />
      <rect x="29" y="79.5" width="38" height="5.5" rx="1.5" fill={surfaceColor} />
    </svg>
  );
}

export function MountainFlagCircleIcon({ className = '', strokeWidth = DEFAULT_STROKE }: SectorIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Broken outer ring */}
      <path d="M22.5 29A34 34 0 1 0 76 34" />
      {/* Inner bottom subtle arc */}
      <path d="M28 73.5a26.5 26.5 0 0 0 40 0" />

      {/* Flag at summit */}
      <path d="M48 25V9h14v7.5H48" />

      {/* Main & secondary mountain peaks */}
      <path d="M18 64L48 25l19 25" />
      <path d="M58 56l11-14 13 18" />

      {/* Snowline & ridge detail */}
      <path d="M39 37l5 4 4-4 5 4 3.5-3" />
      <path d="M48 41l-2.5 6 4 5-2 6" />
      <circle cx="47.5" cy="64" r="1.2" fill="currentColor" stroke="none" />

      {/* Sky dashes & cloud */}
      <path d="M20 23h7" />
      <circle cx="31.5" cy="23" r="1.2" fill="currentColor" stroke="none" />
      <path d="M62 27h9c2 0 3.5 1.3 3.5 3h-16" />
      <circle cx="79" cy="30" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TeamThreeIcon({ className = '', strokeWidth = DEFAULT_STROKE, surfaceColor = 'white' }: SectorIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Left background person */}
      <circle cx="21" cy="43" r="6.8" />
      <path d="M10 68v-6c0-4.5 4.2-8 10.5-8h4" />
      <path d="M16 64v4" />

      {/* Right background person */}
      <circle cx="75" cy="43" r="6.8" />
      <path d="M86 68v-6c0-4.5-4.2-8-10.5-8h-4" />
      <path d="M80 64v4" />

      {/* Center foreground person */}
      <path d="M29 78V62c0-6 5.5-10.5 12.5-10.5h13C61.5 51.5 67 56 67 62v16" fill={surfaceColor} />
      <circle cx="48" cy="33" r="9.5" fill={surfaceColor} />
      <path d="M39 30.5c3.2-2.2 7.5-2.5 12-1 2.5.8 4.5 1.5 6.3 2.5" />
      <path d="M43 42.5v5.5M53 42.5v5.5" />
      <path d="M41.5 51.5L48 60l6.5-8.5" />
      <path d="M48 60v6M38 66v12M58 66v12" />
      <circle cx="48" cy="72" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EnergyTradingIcon({ className = '', strokeWidth = DEFAULT_STROKE }: SectorIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Top exchange arc & arrow */}
      <path d="M22 36a29 29 0 0 1 49-7" />
      <path d="M72 20l1 9.5-9.5-1" />

      {/* Bottom exchange arc & arrow */}
      <path d="M74 60a29 29 0 0 1-49 7" />
      <path d="M24 76l-1-9.5 9.5 1" />

      {/* Central renewable energy bolt inside node ring */}
      <circle cx="48" cy="48" r="17" />
      <path d="M50 36l-9 13h7l-2 11 9-13h-7l2-11Z" />

      {/* Corner tick dots matching AssetCrest line-art style */}
      <circle cx="15" cy="48" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="81" cy="48" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
