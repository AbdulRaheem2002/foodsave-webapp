import React, { useState, useEffect } from 'react';
import type { DealItem } from '../../types';
import { ShoppingBag, Eye, Clock, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatTimeLeft, getDealSecondsRemaining } from '../../lib/utils';

interface DealCardProps {
  deal: DealItem;
  onReserve: (deal: DealItem) => void;
  onSelect: (deal: DealItem) => void;
  onExpired?: (dealId: string) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onReserve, onSelect, onExpired }) => {
  const { id, expiryDeadline, expiryHoursLeft } = deal;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() =>
    getDealSecondsRemaining({ expiryDeadline, expiryHoursLeft })
  );

  useEffect(() => {
    setSecondsRemaining(getDealSecondsRemaining({ expiryDeadline, expiryHoursLeft }));
    const timer = setInterval(() => {
      setSecondsRemaining((prev) =>
        expiryDeadline
          ? getDealSecondsRemaining({ expiryDeadline, expiryHoursLeft })
          : Math.max(0, prev - 1)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [id, expiryDeadline, expiryHoursLeft]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onExpired?.(id);
    }
  }, [secondsRemaining, id, onExpired]);

  if (secondsRemaining <= 0) {
    return null;
  }

  const isMystery = deal.isMysteryBag !== false;
  const savedAmountPkr = Math.max(0, deal.originalPricePkr - deal.currentPricePkr);

  const flavorLabels: Record<string, string> = {
    sweet: '🥐 Sweet',
    savory: '🌶️ Spicy & Savory',
    drinks: '☕ Coffee & Bake',
    mixed: '🍱 Assorted',
  };
  const flavorDescriptionWord: Record<string, string> = {
    sweet: 'sweet pastry',
    savory: 'spicy & savory',
    drinks: 'coffee & bake',
    mixed: 'assorted kitchen',
  };
  const flavorBadge = flavorLabels[deal.flavorProfile || 'mixed'] || '🍱 Assorted';
  const boxWord = flavorDescriptionWord[deal.flavorProfile || 'mixed'] || 'assorted kitchen';
  const areaLabel = deal.location.sector
    ? `${deal.location.sector}, ${deal.location.city}`
    : deal.location.city || 'Islamabad';

  return (
    <div className="bg-white border border-[#E7E2D8] rounded-[1.6rem] p-4 shadow-[0_8px_28px_-12px_rgba(23,25,22,0.06)] hover:shadow-[0_18px_40px_-14px_rgba(27,67,50,0.14)] hover:border-[#1B4332]/30 transition-all duration-300 flex flex-col justify-between group">
      
      {/* Top Image Container */}
      <div className="relative h-52 w-full rounded-2xl overflow-hidden bg-stone-100">
        <img
          src={deal.imageUrl}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />

        {/* Top-Left: Surprise Box or Direct Discount + Craving Tag */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isMystery ? (
            <span className="px-2.5 py-1 rounded-full bg-[#1B4332] text-white font-extrabold text-xs shadow-sm tracking-wide">
              Surprise Box
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-[#e53935] text-white font-extrabold text-xs shadow-sm tracking-wide">
              -{deal.discountPercent}% OFF
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-white/95 text-stone-800 font-bold text-xs shadow-sm">
            {flavorBadge}
          </span>
        </div>

        {/* Top-Right: Scarcity Badge */}
        <div
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#f37021] text-white font-bold text-xs shadow-sm flex items-center gap-1 ${
            deal.stockQuantity <= 2 ? 'animate-pulse' : ''
          }`}
        >
          <span>
            Only {deal.stockQuantity}{' '}
            {isMystery ? (deal.stockQuantity === 1 ? 'box left' : 'boxes left') : 'left'}
          </span>
        </div>

        {/* Bottom-Left: Store Name & Rating Capsule */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold border border-white/15 shadow-sm">
          <span className="truncate max-w-[155px]">{deal.storeName}</span>
          <span className="text-[#fbc02d] ml-1">★ {deal.storeRating}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="pt-3.5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Category & Area on Left, Countdown on Right */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-stone-500 font-semibold capitalize truncate max-w-[180px]">
              {deal.category} • {areaLabel}
            </span>
            <span className="text-[#e53935] font-bold font-mono text-xs flex items-center gap-1 shrink-0">
              <Clock className="size-3.5 text-[#e53935]" />
              <span>{formatTimeLeft(secondsRemaining)} left</span>
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(deal)}
            className="text-lg font-extrabold text-[#171916] hover:text-[#1b4332] cursor-pointer line-clamp-1 transition-colors leading-snug mb-1 tracking-tight"
          >
            {deal.title}
          </h3>

          {/* Listing Description */}
          <p className="text-[13px] text-stone-600 line-clamp-2 leading-relaxed font-medium">
            {isMystery
              ? deal.mysteryBagContents?.length
                ? `Assorted closing surprise box (worth ${formatCurrency(deal.originalPricePkr)}+): e.g. ${deal.mysteryBagContents.join(', ')}.`
                : `Fresh ${boxWord} assortment packed at closing from ${deal.storeName} (worth ${formatCurrency(deal.originalPricePkr)}+). Exact items vary daily.`
              : deal.mysteryBagContents?.length
              ? `Fresh closing deal from ${deal.storeName}: ${deal.mysteryBagContents.join(', ')}.`
              : `Fresh ${boxWord} meal prepared today by ${deal.storeName}. Claim your discount and pick up before closing.`}
          </p>

          {/* Pickup Window & Freshness Guarantee */}
          <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-stone-700 font-semibold">
              <Clock className="size-3.5 text-[#f37021]" />
              <span>{deal.pickupDeadline || 'Pick up today'}</span>
            </div>
            <span className="text-[#2e7d32] font-bold text-[11px] flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-[#2e7d32]" />
              <span>Fresh &amp; Halal</span>
            </span>
          </div>
        </div>

        {/* Box Value & Price Bar */}
        <div className="pt-1 flex flex-col gap-2">
          
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-stone-500 font-bold">
              {isMystery ? 'Worth ' : 'Was '}
              <span className="line-through text-stone-400 font-medium">{formatCurrency(deal.originalPricePkr)}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] text-[11px] font-bold">
              Save {formatCurrency(savedAmountPkr)}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 -mt-1">
            <span className="text-xs font-bold text-stone-500">{isMystery ? 'For' : 'Now'}</span>
            <span className="text-[1.65rem] font-extrabold text-[#171916] tracking-tight">
              {formatCurrency(deal.currentPricePkr)}
            </span>
          </div>

          {/* Full-Width Claim Box / Deal Button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onSelect(deal)}
              title="Store Details"
              className="p-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
            >
              <Eye className="size-4" />
            </button>

            <button
              onClick={() => onReserve(deal)}
              className="flex-1 py-3 px-4 rounded-full bg-[#1b4332] hover:bg-[#133326] text-white font-bold text-[13px] shadow-md shadow-[#1b4332]/20 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
            >
              <ShoppingBag className="size-4" />
              <span>{isMystery ? 'Reserve Surprise Box' : 'Claim Closing Deal'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
