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
  if (!mysteryDeal) return null;

  return (
    <div className="w-full rounded-[1.75rem] bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#fb923c] p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
      <div className="flex-1 max-w-xl">
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm border border-white/30 inline-flex items-center gap-1.5 mb-3 shadow-2xs">
          <Sparkles className="size-3 text-white" />
          Featured Surplus Mystery Bag
        </span>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-white">
          {mysteryDeal.title}
        </h2>

        <p className="text-xs sm:text-sm text-white/90 leading-relaxed mb-4 font-medium">
          Fresh surplus assortment packed before store closing at{' '}
          <strong>{mysteryDeal.storeName}</strong> ({mysteryDeal.location.city}).
        </p>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-xs font-bold text-white shadow-2xs">
          <span>{mysteryDeal.storeName}:</span>
          <span className="text-[#fff3b0] font-mono">{formatCurrency(mysteryDeal.currentPricePkr)}</span>
          <span className="text-white/80 text-[10px]">
            (Worth {formatCurrency(mysteryDeal.originalPricePkr)})
          </span>
        </div>
      </div>

      <div className="w-full lg:w-96 rounded-2xl bg-white text-stone-900 p-5 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
              Live Store Mystery Pick
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] text-[10px] font-bold">
              {mysteryDeal.stockQuantity} Bags Left
            </span>
          </div>

          <h3 className="text-base font-black text-stone-900 mb-3">{mysteryDeal.title}</h3>

          {mysteryDeal.mysteryBagContents && mysteryDeal.mysteryBagContents.length > 0 && (
            <ul className="space-y-1.5 text-xs text-stone-600 mb-4 font-medium">
              {mysteryDeal.mysteryBagContents.map((itemText) => (
                <li key={itemText} className="flex items-center gap-2">
                  <Check className="size-3.5 text-[#2e7d32] flex-shrink-0" />
                  <span>{itemText}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={() => onClaimMysteryBag(mysteryDeal)}
          className="w-full py-3 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-md transition-all transform active:scale-95"
        >
          Claim Surprise Bag — {formatCurrency(mysteryDeal.currentPricePkr)}
        </button>
      </div>
    </div>
  );
};
