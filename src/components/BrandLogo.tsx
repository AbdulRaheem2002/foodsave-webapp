import React from 'react';

interface BiteHourBadgeProps {
  className?: string;
}

/** Official Option B Bitten-Clock plate SVG emblem for BiteHour. */
export const BiteHourBadgeIcon: React.FC<BiteHourBadgeProps> = ({ className = 'size-9' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 128 128"
    aria-hidden="true"
    className={className}
  >
    <rect x="4" y="4" width="120" height="120" rx="30" fill="#1B4332" />
    <circle cx="64" cy="64" r="39" fill="#FFFFFF" />
    <circle cx="90" cy="40" r="11.5" fill="#1B4332" />
    <circle cx="79" cy="31" r="10.5" fill="#1B4332" />
    <circle cx="97" cy="52" r="9.5" fill="#1B4332" />
    <path d="M64,64 L64,37 A27,27 0 0,1 91,64 Z" fill="#F37021" />
    <circle cx="64" cy="64" r="5.5" fill="#1B4332" />
  </svg>
);

interface BiteHourLogoProps {
  showTagline?: boolean;
  compact?: boolean;
}

/** Shared Option B brand lockup rendered across Navbar and Footer. */
export const BiteHourLogo: React.FC<BiteHourLogoProps> = ({
  showTagline = false,
  compact = false,
}) => (
  <div className="flex items-center gap-2.5 text-left">
    <BiteHourBadgeIcon className={compact ? 'size-8 shrink-0' : 'size-9 shrink-0 shadow-xs rounded-xl'} />
    <div className="leading-tight">
      <div className="flex items-center gap-1.5">
        <span className={compact ? 'text-base font-black tracking-tight text-stone-900' : 'text-lg font-black tracking-tight text-[#1B4332]'}>
          BiteHour
        </span>
        {!compact && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#edf7ed] text-[#1b4332] border border-[#c8e6c9] rounded">
            PK
          </span>
        )}
      </div>
      {showTagline && (
        <p className="text-[11px] text-stone-500 font-medium hidden sm:block whitespace-nowrap">
          Closing Hour Food Deals
        </p>
      )}
    </div>
  </div>
);
