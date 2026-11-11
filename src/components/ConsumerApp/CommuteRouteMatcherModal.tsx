import React, { useState } from 'react';
import type { DealItem } from '../../types';
import { X, Car, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { sounds } from '../../lib/soundEffects';

interface CommuteRouteMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  deals: DealItem[];
  onReserveDeal: (deal: DealItem) => void;
}

const PRESET_ROUTES = [
  {
    id: 'lhr-1',
    city: 'Lahore',
    origin: 'Office (Gulberg III Main Blvd)',
    destination: 'Home (DHA Phase 5)',
    distanceKm: 9.4,
    commuteMinutes: 22,
    storeId: 'ret-1',
    storeName: 'Al-Fatah Gourmet',
    detourMins: 0,
    fuelSavedPkr: 240,
  },
  {
    id: 'isb-1',
    city: 'Islamabad',
    origin: 'Office (Blue Area)',
    destination: 'Home (F-10 / F-11 Markaz)',
    distanceKm: 8.1,
    commuteMinutes: 18,
    storeId: 'ret-3',
    storeName: 'Tehzeeb Bakery',
    detourMins: 0,
    fuelSavedPkr: 210,
  },
  {
    id: 'khi-1',
    city: 'Karachi',
    origin: 'Bank (I.I. Chundrigar Road)',
    destination: 'Home (Clifton Block 4)',
    distanceKm: 11.2,
    commuteMinutes: 28,
    storeId: 'ret-6',
    storeName: 'Espresso Bistro & Grill',
    detourMins: 1,
    fuelSavedPkr: 280,
  },
];

export const CommuteRouteMatcherModal: React.FC<CommuteRouteMatcherModalProps> = ({
  isOpen,
  onClose,
  deals,
  onReserveDeal,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('lhr-1');
  const activeRoute = PRESET_ROUTES.find((r) => r.id === selectedRouteId) || PRESET_ROUTES[0];

  const matchedDeals = deals.filter((d) =>
    d.storeName.toLowerCase().includes(activeRoute.storeName.split(' ')[0].toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center shadow-md flex-shrink-0 font-bold">
            <Car className="size-7 text-[#85e3a8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">Smart Commute Route Matcher</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30">
                0-Min Detour AI
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Pick up tonight’s dinner on your drive home without adding a single extra minute
            </p>
          </div>
        </div>

        {/* Preset Commute Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PRESET_ROUTES.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedRouteId(r.id);
                sounds.playLaserBeep();
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedRouteId === r.id
                  ? 'bg-[#1b4332] text-white shadow-xs font-black'
                  : 'bg-[#f7f5f0] dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-[#e8e2d8] dark:border-stone-800'
              }`}
            >
              <span>{r.city}: {r.origin.split(' ')[0]} ➔ {r.destination.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Route Telemetry Card */}
        <div className="p-5 rounded-3xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-200">
              <span className="font-bold text-[#f37021]">{activeRoute.origin}</span>
              <ArrowRight className="size-3 text-[#2e7d32]" />
              <span className="font-bold text-[#2e7d32]">{activeRoute.destination}</span>
            </div>
            <span className="text-[11px] text-stone-400 font-mono">
              {activeRoute.distanceKm} km • ~{activeRoute.commuteMinutes} mins drive
            </span>
          </div>

          {/* Savings Metric Pills */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] text-stone-400 font-semibold uppercase block">Detour Added</span>
              <span className="font-black text-[#f37021] text-base">+{activeRoute.detourMins} Mins (Zero)</span>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] text-stone-400 font-semibold uppercase block">Fuel Saved</span>
              <span className="font-black text-[#2e7d32] dark:text-[#81c784] text-base">₨ {activeRoute.fuelSavedPkr}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] text-stone-400 font-semibold uppercase block">Curbside Handover</span>
              <span className="font-black text-stone-800 dark:text-stone-200 text-base">Car Trunk Ready</span>
            </div>
          </div>
        </div>

        {/* Deals Directly on Route */}
        <div>
          <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ShoppingBag className="size-4 text-[#f37021]" />
            <span>Surplus Bags Directly Along Your Driving Path:</span>
          </h3>

          <div className="space-y-3">
            {matchedDeals.length > 0 ? (
              matchedDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 rounded-2xl bg-[#fcfbf9] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 transition-all flex items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={deal.imageUrl}
                      alt={deal.title}
                      className="size-14 rounded-xl object-cover border border-stone-200 dark:border-stone-700 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white">{deal.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30">
                          {deal.discountPercent}% OFF
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">{deal.storeName} • {deal.pickupDeadline}</p>
                      <span className="font-mono text-xs font-black text-stone-900 dark:text-white mt-0.5 block">
                        {formatCurrency(deal.currentPricePkr)}{' '}
                        <span className="line-through text-stone-400 text-[10px] font-normal">{formatCurrency(deal.originalPricePkr)}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onReserveDeal(deal);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1"
                  >
                    <span>Reserve for Drive</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                No active deals directly on this route at this minute. Checking surrounding branches...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
