import React, { useState, useEffect } from 'react';
import type { Reservation } from '../../types';
import { X, Clock, MapPin, ShoppingBag, AlertTriangle, CheckCircle2, Bike } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface ActivePassesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: Reservation[];
  onOpenBykeaTracker?: (res: Reservation) => void;
}

function PassCountdown({ endTime, status }: { endTime: string; status: string }) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
  });

  useEffect(() => {
    if (status !== 'pending') return;
    const interval = setInterval(() => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime, status]);

  if (status === 'collected') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4CAF50]/20 text-[#2D6A4F] dark:text-[#4CAF50] border border-[#4CAF50]/40 flex items-center gap-1">
        <CheckCircle2 className="size-3 text-[#4CAF50]" />
        COLLECTED
      </span>
    );
  }

  if (secondsLeft <= 0) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-500 border border-red-500/40 flex items-center gap-1">
        <AlertTriangle className="size-3" />
        HOLD EXPIRED
      </span>
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9800]/20 text-[#FF9800] border border-[#FF9800]/40 flex items-center gap-1 font-mono">
      <Clock className="size-3 text-[#FF9800]" />
      Hold: {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

export const ActivePassesDrawer: React.FC<ActivePassesDrawerProps> = ({
  isOpen,
  onClose,
  reservations,
  onOpenBykeaTracker,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#182230] border-l border-[#2D6A4F]/20 dark:border-white/10 h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
        
        <div>
          <div className="flex items-center justify-between border-b border-[#2D6A4F]/15 dark:border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-[#2D6A4F] dark:text-[#4CAF50]" />
              <h2 className="text-lg font-black text-[#1F2937] dark:text-[#F9F6F0] tracking-tight">My Surprise Bags</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2D6A4F]/15 text-[#2D6A4F] dark:text-[#4CAF50] border border-[#2D6A4F]/30">
                {reservations.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#F9F6F0] dark:bg-[#1F2937] hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-16">
              <div className="size-16 rounded-full bg-[#F9F6F0] dark:bg-[#1F2937] flex items-center justify-center mx-auto mb-3 text-3xl border border-[#2D6A4F]/20 shadow-2xs">
                🎟️
              </div>
              <h3 className="text-base font-bold text-[#1F2937] dark:text-[#F9F6F0] mb-1">No Active Passes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Reserve food surplus bags to generate your 15-minute pickup codes!
              </p>
            </div>
          ) : (

            <div className="flex flex-col gap-4">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl border border-[#2D6A4F]/20 bg-[#F9F6F0] dark:bg-[#1F2937] flex flex-col gap-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <PassCountdown endTime={res.pickupWindowEnd} status={res.status} />
                    <span className="font-mono text-xs font-black text-[#2D6A4F] dark:text-[#4CAF50]">
                      #{res.pickupCode}
                    </span>
                  </div>

                  <div className="flex gap-3 items-center">
                    <img
                      src={res.item.imageUrl}
                      alt={res.item.title}
                      className="size-14 rounded-xl object-cover border border-[#2D6A4F]/15"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#1F2937] dark:text-[#F9F6F0] truncate">
                        {res.item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="size-3 text-[#2D6A4F] dark:text-[#4CAF50]" />
                        {res.item.storeName}
                      </p>
                      <p className="text-xs font-black text-[#FF9800] mt-0.5">
                        {formatCurrency(res.totalPricePkr)} ({res.quantity}x)
                      </p>
                    </div>
                  </div>

                  {/* Rider Tracker Button if Bykea Delivery */}
                  {res.fulfillmentType === 'bykea-delivery' && onOpenBykeaTracker && (
                    <button
                      onClick={() => onOpenBykeaTracker(res)}
                      className="w-full py-2 rounded-xl bg-[#FF9800]/15 hover:bg-[#FF9800]/25 text-[#FF9800] border border-[#FF9800]/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Bike className="size-3.5" />
                      <span>Track Bykea Rider (ETA 12m)</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

          )}
        </div>

        <button
          onClick={onClose}
          className="btn-claim w-full py-3 text-xs font-bold mt-6"
        >
          Close Drawer
        </button>

      </div>
    </div>
  );
};
