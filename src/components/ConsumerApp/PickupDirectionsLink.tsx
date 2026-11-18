import React from 'react';
import { Navigation } from 'lucide-react';
import { cn, getGoogleMapsDirectionsUrl } from '../../lib/utils';

interface PickupDirectionsLinkProps {
  storeName: string;
  address?: string;
  sector?: string;
  city?: string;
  label?: string;
  variant?: 'pill' | 'button' | 'compact' | 'overlay';
  className?: string;
  stopPropagation?: boolean;
}

export const PickupDirectionsLink: React.FC<PickupDirectionsLinkProps> = ({
  storeName,
  address,
  sector,
  city,
  label = 'Directions',
  variant = 'pill',
  className,
  stopPropagation = false,
}) => {
  const href = getGoogleMapsDirectionsUrl(storeName, address, sector, city);

  const variantClasses: Record<NonNullable<PickupDirectionsLinkProps['variant']>, string> = {
    pill: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#F6F2EA] hover:bg-[#EAE3D5] text-[#1B4332] border border-[#E7E2D8] transition-colors',
    button:
      'inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-full text-xs font-extrabold bg-[#F6F2EA] hover:bg-[#EAE3D5] text-[#1B4332] border border-[#1B4332]/20 transition-colors',
    compact:
      'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[#F6F2EA] hover:bg-[#EAE3D5] text-[#1B4332] border border-[#E7E2D8] transition-colors',
    overlay:
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/95 hover:bg-white text-[#1B4332] shadow-sm transition-colors',
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open Google Maps pickup directions to ${storeName}`}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
      }}
      className={cn(variantClasses[variant], className)}
    >
      <Navigation className="size-3.5 shrink-0" />
      <span>{label}</span>
    </a>
  );
};
