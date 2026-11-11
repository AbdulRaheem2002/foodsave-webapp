import React from 'react';
import type { DealItem } from '../../types';
import { Sparkles, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface MysteryBagsBannerProps {
  mysteryDeal?: DealItem | null;
  onClaimMysteryBag: (deal: DealItem) => void;
}

export const MysteryBagsBanner: React.FC<MysteryBagsBannerProps> = ({
  mysteryDeal,
  onClaimMysteryBag,
}) => {
  // Fallback mystery deal if none passed
  const activeDeal: DealItem = mysteryDeal || {
    id: 'dl-mb-mock',
    storeId: 'ret-3',
    storeName: 'Tehzeeb Bakery',
    storeType: 'bakery',
    storeRating: 4.9,
    title: 'Tehzeeb Evening Magic Bag',
    category: 'bakery',
    originalPricePkr: 1500,
    currentPricePkr: 399,
    discountPercent: 73,
    expiryHoursLeft: 2.5,
    stockQuantity: 4,
    pickupDeadline: '9:00 PM - 10:00 PM tonight',
    distanceKm: 0.7,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    isVerified: true,
    isMysteryBag: true,
    mysteryBagContents: ['2x Artisan Loaves / Sandwiches', '4x Gourmet Pastries / Croissants'],
    location: { x: 50, y: 50, address: 'Blue Area', city: 'Islamabad' },
    decaySchedule: [],
    hoursRemaining: 2.5,
  };

  return (
    <div className="w-full rounded-[1.75rem] bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#fb923c] p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
      
      {/* Left Column Content */}
      <div className="flex-1 max-w-xl">
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm border border-white/30 inline-flex items-center gap-1.5 mb-3 shadow-2xs">
          <Sparkles className="size-3 text-white" />
          Surprise Mystery Bags • 3x Guaranteed Multiplier
        </span>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-white">
          Mystery Surprise Bags: What's Inside?
        </h2>

        <p className="text-xs sm:text-sm text-white/90 leading-relaxed mb-5 font-medium">
          Surplus inventory from premium bakeries packed fresh at closing. You don't know the exact pastries or savouries until you open it... but you are <strong>100% guaranteed triple the retail value!</strong>
        </p>

        {/* 2 Pills below */}
        <div className="flex flex-wrap gap-2.5">
          <div className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-xs font-bold text-white shadow-2xs flex items-center gap-1.5">
            <span>🥖 Tehzeeb Evening Magic:</span>
            <span className="text-[#fff3b0] font-mono">Rs 399</span>
            <span className="text-white/70 text-[10px]">(Worth Rs 1,500)</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-xs font-bold text-white shadow-2xs flex items-center gap-1.5">
            <span>🎁 Al-Fatah Mystery Box:</span>
            <span className="text-[#fff3b0] font-mono">Rs 899</span>
            <span className="text-white/70 text-[10px]">(Worth Rs 2,800)</span>
          </div>
        </div>
      </div>

      {/* Right Column: Today's Top Mystery Pick Card */}
      <div className="w-full lg:w-96 rounded-2xl bg-white text-stone-900 p-5 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
              Today's Top Mystery Pick
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] text-[10px] font-bold">
              {activeDeal.stockQuantity} Bags Left
            </span>
          </div>

          <h3 className="text-base font-black text-stone-900 mb-3">
            {activeDeal.title}
          </h3>

          <ul className="space-y-1.5 text-xs text-stone-600 mb-4 font-medium">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-[#2e7d32] flex-shrink-0" />
              <span>Includes 2x artisan loaves or savory sandwiches</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-[#2e7d32] flex-shrink-0" />
              <span>4 gourmet pastries or fresh croissants</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-[#2e7d32] flex-shrink-0" />
              <span>Pickup window: 9:00 PM - 10:00 PM tonight</span>
            </li>
          </ul>
        </div>

        {/* Pricing & Claim Button */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <div>
            <span className="text-[11px] text-stone-400 line-through block">
              Was {formatCurrency(activeDeal.originalPricePkr)}
            </span>
            <span className="text-xl font-black text-stone-900 tracking-tight">
              {formatCurrency(activeDeal.currentPricePkr)}
            </span>
          </div>

          <button
            onClick={() => onClaimMysteryBag(activeDeal)}
            className="px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#d94e08] text-white font-extrabold text-xs shadow-md transition-all transform active:scale-95"
          >
            Claim Mystery Bag
          </button>
        </div>
      </div>

    </div>
  );
};

