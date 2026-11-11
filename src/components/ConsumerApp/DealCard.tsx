import React, { useState, useEffect } from 'react';
import type { DealItem } from '../../types';
import { ShoppingBag, Eye } from 'lucide-react';
import { formatCurrency, formatTimeLeft } from '../../lib/utils';

interface DealCardProps {
  deal: DealItem;
  onReserve: (deal: DealItem) => void;
  onSelect: (deal: DealItem) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onReserve, onSelect }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    Math.floor(deal.expiryHoursLeft * 3600)
  );

  useEffect(() => {
    setSecondsRemaining(Math.max(0, Math.floor(deal.expiryHoursLeft * 3600)));
  }, [deal.id, deal.expiryHoursLeft]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const savedAmountPkr = Math.max(0, deal.originalPricePkr - deal.currentPricePkr);

  // Approximate decay checkpoints for visual timeline
  const step1Price = Math.round(deal.originalPricePkr * 0.8);
  const step2Price = Math.round(deal.originalPricePkr * 0.6);
  const step3Price = deal.currentPricePkr;

  return (
    <div className="bg-white dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-[1.4rem] p-3.5 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
      
      {/* Top Image Container */}
      <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900">
        <img
          src={deal.imageUrl}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

        {/* Top-Left: Red Discount Badge matching exact mockup */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#e53935] text-white font-black text-[11px] shadow-sm tracking-wide">
          {deal.discountPercent}% OFF
        </div>

        {/* Top-Right: Surplus Gold Scarcity Badge */}
        <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#f37021] text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1 animate-pulse">
          <span>Only {deal.stockQuantity} left!</span>
        </div>

        {/* Bottom-Left: Store Name & Rating Capsule */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/15 shadow-sm">
          <span className="truncate max-w-[140px]">{deal.storeName}</span>
          <span className="text-[#fbc02d] ml-1">★ {deal.storeRating}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="pt-3 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          {/* Category & City on Left, Countdown on Right */}
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-stone-500 dark:text-stone-400 font-medium capitalize">
              {deal.category} • {deal.location.city || 'Lahore'} ({deal.distanceKm} km)
            </span>
            <span className="text-[#e53935] font-bold font-mono text-[11px]">
              Expiring in: {formatTimeLeft(secondsRemaining)}
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(deal)}
            className="text-[15px] font-black text-stone-900 dark:text-[#F9F6F0] hover:text-[#1b4332] dark:hover:text-[#4CAF50] cursor-pointer line-clamp-1 transition-colors leading-tight mb-1"
          >
            {deal.title}
          </h3>

          {/* Short Description */}
          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
            {deal.isMysteryBag && deal.mysteryBagContents
              ? `Surplus mystery bag containing: ${deal.mysteryBagContents.join(', ')}.`
              : `Fresh bakery & grocery surplus from ${deal.storeName}. Prepared fresh today, rescued before closing.`}
          </p>

          {/* Dynamic Decay Rate Timeline (from mockup) */}
          <div className="mt-2.5 p-2 rounded-xl bg-[#f7f5f0] dark:bg-[#1f2937]/80 border border-[#e8e3d8] dark:border-white/5">
            <span className="text-[9px] uppercase font-black text-stone-500 dark:text-stone-400 tracking-wider block mb-1">
              Dynamic Decay Rate
            </span>
            <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 font-mono">
              <span>00:00 (Rs {step1Price})</span>
              <span>12:00 (Rs {step2Price})</span>
              <span className="text-[#e53935] font-bold">18:00 (Rs {step3Price}, {deal.discountPercent}%)</span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-full mt-1.5 overflow-hidden flex">
              <div className="w-1/3 bg-stone-400" />
              <div className="w-1/3 bg-[#f37021]" />
              <div className="w-1/3 bg-[#e53935]" />
            </div>
          </div>
        </div>

        {/* Pricing & Savings Bar */}
        <div className="pt-1 flex flex-col gap-2">
          
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-stone-400 line-through">
              {formatCurrency(deal.originalPricePkr)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30 text-[10px] font-bold">
              Save {formatCurrency(savedAmountPkr)}
            </span>
          </div>

          <div className="flex items-baseline justify-between -mt-1">
            <span className="text-2xl font-black text-stone-900 dark:text-[#F9F6F0] tracking-tight">
              {formatCurrency(deal.currentPricePkr)}
            </span>
          </div>

          {/* Full-Width Claim Bag Button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onSelect(deal)}
              title="Inspect Details"
              className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-white/10 transition-colors"
            >
              <Eye className="size-4" />
            </button>

            <button
              onClick={() => onReserve(deal)}
              className="flex-1 py-3 px-4 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-md shadow-[#1b4332]/25 flex items-center justify-center gap-2 transition-all transform active:scale-98"
            >
              <ShoppingBag className="size-4" />
              <span>Claim Bag (15m Hold)</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
