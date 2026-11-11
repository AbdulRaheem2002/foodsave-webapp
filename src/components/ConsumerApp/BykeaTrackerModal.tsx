import React, { useState, useEffect } from 'react';
import type { Reservation } from '../../types';
import { X, Bike, MapPin, Phone, ShieldCheck, Navigation, MessageCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface BykeaTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

const STAGES = [
  { stage: 'Assigned', title: 'Bykea Express Rider Assigned', desc: 'Rider moving to merchant store' },
  { stage: 'Pickup', title: 'Arrived at Merchant Store', desc: 'Merchant verifying code and packing items' },
  { stage: 'EnRoute', title: 'On Road (Main Boulevard)', desc: 'Rider speeding to your delivery drop-off' },
  { stage: 'Arrived', title: 'Arrived at Customer Doorstep', desc: 'Please meet rider and collect your package' },
];

export const BykeaTrackerModal: React.FC<BykeaTrackerModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [riderSpeedKmh, setRiderSpeedKmh] = useState<number>(38);
  const [etaMinutes, setEtaMinutes] = useState<number>(12);

  useEffect(() => {
    if (!isOpen) return;

    // Simulate animated ride progression across 4 stages
    const timer1 = setTimeout(() => {
      setCurrentStageIdx(1);
      setEtaMinutes(9);
    }, 3500);

    const timer2 = setTimeout(() => {
      setCurrentStageIdx(2);
      setEtaMinutes(5);
      setRiderSpeedKmh(46);
    }, 7500);

    const timer3 = setTimeout(() => {
      setCurrentStageIdx(3);
      setEtaMinutes(0);
      setRiderSpeedKmh(0);
    }, 12000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  if (!isOpen || !reservation) return null;

  const riderName = reservation.bykeaRiderName || 'Tariq Mahmood';
  const riderPhone = reservation.bykeaRiderPhone || '+92 312 8889900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-[#f37021] to-[#e53935] text-white flex items-center justify-center shadow-md flex-shrink-0 font-bold">
            <Bike className="size-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-stone-900 dark:text-white tracking-tight">Bykea Express Live Tracker</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff8e1] dark:bg-[#FF9800]/20 text-[#b78103] dark:text-[#FF9800] border border-[#ffecb3] dark:border-[#FF9800]/40">
                LIVE GPS
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Order #{reservation.pickupCode} • Delivery in Progress
            </p>
          </div>
        </div>

        {/* Animated Map Route Visualizer */}
        <div className="relative w-full h-44 rounded-2xl bg-[#071710] border border-[#1b3d2b] overflow-hidden mb-4 p-4 flex flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(#1e4530_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
          
          <div className="relative z-10 flex items-center justify-between text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-black/80 text-[#81c784] border border-[#2e7d32] font-mono text-[11px]">
              Speed: <strong className="text-[#fbc02d]">{riderSpeedKmh} km/h</strong>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-[#f37021] text-white font-bold text-[11px]">
              ETA: {etaMinutes > 0 ? `${etaMinutes} mins` : 'Arrived!'}
            </span>
          </div>

          {/* Animated Rider Marker Moving on Map */}
          <div className="relative z-10 w-full py-4">
            <div className="relative w-full h-2 rounded-full bg-stone-800 flex items-center">
              <div
                style={{ width: `${(currentStageIdx + 1) * 25}%` }}
                className="h-full bg-gradient-to-r from-[#2e7d32] to-[#f37021] rounded-full transition-all duration-700 shadow-sm"
              />
              <div
                style={{ left: `${(currentStageIdx + 1) * 25 - 4}%` }}
                className="absolute size-7 rounded-full bg-[#f37021] text-white border-2 border-white shadow-xl flex items-center justify-center transition-all duration-700 -translate-y-0.5 font-bold"
              >
                <Bike className="size-3.5 animate-bounce" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-stone-400 mt-2 font-mono font-medium">
              <span>🏪 {reservation.item.storeName.split(' ')[0]}</span>
              <span>🛣️ Main Blvd</span>
              <span>📍 {reservation.item.location.city}</span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-stone-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Navigation className="size-3 text-[#4CAF50]" />
              <span>Status: <strong className="text-white">{STAGES[currentStageIdx].title}</strong></span>
            </span>
            <span className="text-[10px] text-stone-400 font-medium">{STAGES[currentStageIdx].desc}</span>
          </div>
        </div>

        {/* Rider Profile Card */}
        <div className="p-3.5 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-[#1b4332] text-white font-black flex items-center justify-center text-sm shadow-xs">
              TM
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-stone-900 dark:text-white">{riderName}</h4>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/40 flex items-center gap-0.5 font-bold">
                  <ShieldCheck className="size-2.5 text-[#2e7d32]" /> 4.9 ★
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Vehicle: Suzuki GD110 (LEB-8921)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${riderPhone}`}
              className="p-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 transition-colors shadow-2xs"
              title="Call Rider"
            >
              <Phone className="size-4" />
            </a>
            <a
              href={`https://wa.me/?text=Hi%20${encodeURIComponent(riderName)},%20tracking%20my%20Foodsave%20order%20pass%20${reservation.pickupCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold shadow-xs transition-colors"
              title="WhatsApp Rider"
            >
              <MessageCircle className="size-4" />
            </a>
          </div>
        </div>

        {/* Order Details Summary */}
        <div className="p-3.5 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="size-4 text-[#2e7d32] flex-shrink-0" />
            <span className="text-stone-700 dark:text-stone-300 truncate font-medium">
              {reservation.item.title} (Qty: {reservation.quantity})
            </span>
          </div>
          <span className="font-black text-[#f37021] flex-shrink-0 ml-2">
            {formatCurrency(reservation.totalPricePkr)}
          </span>
        </div>

      </div>
    </div>
  );
};
