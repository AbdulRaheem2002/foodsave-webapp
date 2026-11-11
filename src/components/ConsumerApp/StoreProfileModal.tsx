import React from 'react';
import { X, MapPin, Star, ShieldCheck, ArrowLeft } from 'lucide-react';
import type { DealItem, RetailerStore } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface StoreProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: RetailerStore | null;
  storeDeals: DealItem[];
  onReserveDeal: (deal: DealItem) => void;
}

export const StoreProfileModal: React.FC<StoreProfileModalProps> = ({
  isOpen,
  onClose,
  store,
  storeDeals,
  onReserveDeal,
}) => {
  if (!isOpen || !store) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-[#e5e0d8] rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Top-Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          title="Close"
        >
          <X className="size-5" />
        </button>

        {/* Store Banner */}
        <div className="relative h-44 -mx-6 -mt-6 mb-4 bg-gradient-to-r from-[#1b4332] via-[#24523a] to-[#2D6A4F] p-6 flex flex-col justify-between text-white">
          
          {/* Top-Left Back Button */}
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold backdrop-blur-sm transition-all"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to all deals</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="size-14 rounded-2xl bg-white/15 backdrop-blur-md text-white border border-white/20 flex items-center justify-center text-3xl font-bold shadow-md">
              🏪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">{store.name}</h2>
                {store.isVerified && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-[#2e7d32]" />
                    Verified Store
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80 flex items-center gap-1.5 mt-0.5 font-medium">
                <MapPin className="size-3.5 text-[#85e3a8]" />
                {store.address}, {store.city}
              </p>
            </div>
          </div>
        </div>

        {/* Store Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-[#f7f5f0] border border-[#e8e2d8] text-center">
            <span className="text-[10px] text-stone-400 font-semibold block uppercase">Rating</span>
            <span className="text-base font-black text-stone-900 flex items-center justify-center gap-1">
              <Star className="size-4 fill-[#fbc02d] text-[#fbc02d]" /> {store.rating}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#f7f5f0] border border-[#e8e2d8] text-center">
            <span className="text-[10px] text-stone-400 font-semibold block uppercase">Active Deals</span>
            <span className="text-base font-black text-[#2e7d32]">
              {storeDeals.length} Listings
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#f7f5f0] border border-[#e8e2d8] text-center">
            <span className="text-[10px] text-stone-400 font-semibold block uppercase">Revenue Recovered</span>
            <span className="text-base font-black text-[#f37021]">
              {formatCurrency(store.totalRecoveredPkr)}
            </span>
          </div>
        </div>

        {/* Store Active Deals Section */}
        <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center justify-between border-b border-stone-200 pb-2">
          <span>Active Surplus Deals by {store.name}</span>
          <span className="text-xs text-stone-400 font-medium">{storeDeals.length} active</span>
        </h3>

        {storeDeals.length === 0 ? (
          <p className="text-xs text-stone-400 py-6 text-center">No active surplus listings right now for this store.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {storeDeals.map((deal) => (
              <div key={deal.id} className="p-3 rounded-2xl border border-stone-200 bg-[#fcfbf9] flex gap-3 items-center shadow-2xs">
                <img src={deal.imageUrl} alt={deal.title} className="size-16 rounded-xl object-cover border border-stone-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 truncate">{deal.title}</h4>
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-sm font-black text-[#1b4332]">{formatCurrency(deal.currentPricePkr)}</span>
                    <span className="text-[10px] line-through text-stone-400">{formatCurrency(deal.originalPricePkr)}</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onReserveDeal(deal);
                    }}
                    className="w-full py-1.5 rounded-lg bg-[#1b4332] hover:bg-[#133326] text-white font-bold text-[11px] shadow-xs transition-colors"
                  >
                    Reserve Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Back Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 font-bold text-xs transition-colors"
        >
          ← Back to Marketplace
        </button>

      </div>
    </div>
  );
};
