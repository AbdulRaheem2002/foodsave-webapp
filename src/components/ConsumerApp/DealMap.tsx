import React from 'react';
import type { DealItem, PakistanCity } from '../../types';
import { ShoppingBag, MapPin, Navigation } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { PickupDirectionsLink } from './PickupDirectionsLink';

interface DealMapProps {
  deals: DealItem[];
  selectedDeal: DealItem | null;
  selectedCity?: PakistanCity;
  onSelectDeal: (deal: DealItem) => void;
  onReserveDeal: (deal: DealItem) => void;
}

/**
 * Interactive warm-canvas Store & Sector Locator showing live drop pins when deals exist.
 * Hides automatically when 0 deals match so customers land directly on listings/actions.
 */
export const DealMap: React.FC<DealMapProps> = ({
  deals,
  selectedDeal,
  selectedCity = 'All Pakistan',
  onSelectDeal,
  onReserveDeal,
}) => {
  if (deals.length === 0) return null;

  const cityLabel = selectedCity === 'All Pakistan' ? 'Islamabad & Pakistan' : selectedCity;

  return (
    <section className="relative w-full rounded-[1.75rem] overflow-hidden bg-white border border-[#e5e0d8] shadow-2xs p-4 sm:p-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#2e7d32] animate-pulse" />
            <h2 className="text-base sm:text-lg font-black tracking-tight text-stone-900">
              Live Pickup Map ({cityLabel})
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            Tap any store pin to inspect today's closing-hour bag and lock your 15-minute counter hold.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf7ed] border border-[#c8e6c9] text-[#1b4332] text-xs font-bold self-start sm:self-auto">
          <Navigation className="size-3.5 text-[#f37021]" />
          <span>{deals.length} Pickup Location{deals.length === 1 ? '' : 's'}</span>
        </span>
      </div>

      {/* Warm Light Map Canvas */}
      <div className="relative w-full h-[260px] sm:h-[310px] rounded-2xl overflow-hidden bg-[#f7f5f0] border border-[#e8e2d8] flex items-center justify-center">
        {/* Subtle Architectural Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#d6d0c4_1px,transparent_1px)] [background-size:22px_22px] opacity-60" />

        {/* Distance Rings */}
        <div className="absolute size-[440px] rounded-full border border-[#1b4332]/10 pointer-events-none" />
        <div className="absolute size-[280px] rounded-full border border-[#1b4332]/15 pointer-events-none" />
        <div className="absolute size-[140px] rounded-full border border-[#f37021]/25 pointer-events-none" />

        {/* Crosshair Axes */}
        <div className="absolute inset-x-0 h-px bg-[#e2ddd3] pointer-events-none" />
        <div className="absolute inset-y-0 w-px bg-[#e2ddd3] pointer-events-none" />

        {/* Center Marker */}
        <div className="relative z-10 flex flex-col items-center pointer-events-none">
          <div className="size-6 rounded-full bg-[#1b4332] border-2 border-white text-white flex items-center justify-center shadow-md">
            <MapPin className="size-3.5" />
          </div>
          <span className="mt-1 text-[10px] font-bold text-[#1b4332] bg-white/95 px-2.5 py-0.5 rounded-full border border-[#c8e6c9] shadow-2xs">
            {cityLabel}
          </span>
        </div>

        {/* Store Pins */}
        {deals.map((deal) => {
          const isSelected = selectedDeal?.id === deal.id;
          return (
            <div
              key={deal.id}
              style={{ left: `${deal.location.x}%`, top: `${deal.location.y}%` }}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => onSelectDeal(deal)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all shadow-sm ${
                  isSelected
                    ? 'bg-[#f37021] text-white border-[#c2410c] scale-110 ring-4 ring-[#f37021]/25 z-30'
                    : 'bg-white hover:bg-[#edf7ed] text-stone-900 border-stone-300 hover:border-[#1b4332]'
                }`}
              >
                <span className={`size-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#2e7d32]'}`} />
                <span className="truncate max-w-[115px]">{deal.storeName}</span>
                <span className={`font-mono text-[10px] ${isSelected ? 'text-white' : 'text-[#1b4332]'}`}>
                  {formatCurrency(deal.currentPricePkr)}
                </span>
              </button>
            </div>
          );
        })}

        {/* Selected Deal Preview Card */}
        {selectedDeal && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 z-30 bg-white/95 backdrop-blur-md border border-stone-200 p-3 rounded-2xl shadow-xl flex items-center gap-3">
            <img
              src={selectedDeal.imageUrl}
              alt={selectedDeal.title}
              className="size-13 rounded-xl object-cover border border-stone-200 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-[#e53935] uppercase block">
                {selectedDeal.discountPercent}% OFF • {selectedDeal.location.sector || selectedDeal.location.city}
              </span>
              <h4 className="text-xs font-bold text-stone-900 truncate">{selectedDeal.title}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-[#1b4332]">
                  {formatCurrency(selectedDeal.currentPricePkr)}
                </span>
                <span className="text-[10px] line-through text-stone-400">
                  {formatCurrency(selectedDeal.originalPricePkr)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <PickupDirectionsLink
                storeName={selectedDeal.storeName}
                address={selectedDeal.location.address}
                sector={selectedDeal.location.sector}
                city={selectedDeal.location.city}
                label="Map"
                variant="compact"
              />
              <button
                type="button"
                onClick={() => onReserveDeal(selectedDeal)}
                className="px-3 py-2 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-bold text-[11px] shadow-xs flex items-center gap-1 shrink-0"
              >
                <ShoppingBag className="size-3" />
                <span>Claim</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
