import React, { useState, useEffect } from 'react';
import type { Reservation, DealItem } from '../../types';
import { X, Clock, MapPin, ShoppingBag, AlertTriangle, CheckCircle2, Bike, Star, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface ActivePassesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: Reservation[];
  onOpenBykeaTracker?: (res: Reservation) => void;
  onCancelReservation?: (reservationId: string) => void;
  onRateDeal?: (deal: DealItem) => void;
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
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] flex items-center gap-1">
        <CheckCircle2 className="size-3 text-[#2e7d32]" />
        COLLECTED
      </span>
    );
  }

  if (status === 'cancelled') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 border border-stone-200 flex items-center gap-1">
        CANCELLED
      </span>
    );
  }

  if (secondsLeft <= 0) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 flex items-center gap-1">
        <AlertTriangle className="size-3" />
        HOLD EXPIRED
      </span>
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fff8e1] text-[#b78103] border border-[#ffecb3] flex items-center gap-1 font-mono">
      <Clock className="size-3 text-[#f37021]" />
      Hold: {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

export const ActivePassesDrawer: React.FC<ActivePassesDrawerProps> = ({
  isOpen,
  onClose,
  reservations,
  onOpenBykeaTracker,
  onCancelReservation,
  onRateDeal,
}) => {
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FAFAF8] border-l border-[#e5e0d8] h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
        
        <div>
          <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-[#1b4332]" />
              <h2 className="text-lg font-black text-stone-900 tracking-tight">My Surprise Bags</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9]">
                {reservations.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              title="Close Drawer"
            >
              <X className="size-5" />
            </button>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-16">
              <div className="size-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-3xl border border-stone-200 shadow-2xs">
                🎟️
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">No Active Passes</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Reserve food surplus bags on the marketplace to generate your 15-minute pickup codes!
              </p>
            </div>
          ) : (

            <div className="flex flex-col gap-4">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl border border-stone-200 bg-white flex flex-col gap-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <PassCountdown endTime={res.pickupWindowEnd} status={res.status} />
                    <span className="font-mono text-xs font-black text-[#1b4332]">
                      #{res.pickupCode}
                    </span>
                  </div>

                  <div className="flex gap-3 items-center">
                    <img
                      src={res.item.imageUrl}
                      alt={res.item.title}
                      className="size-14 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 truncate">
                        {res.item.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 truncate flex items-center gap-1">
                        <MapPin className="size-3 text-[#1b4332]" />
                        {res.item.storeName}
                      </p>
                      <p className="text-xs font-black text-[#f37021] mt-0.5">
                        {formatCurrency(res.totalPricePkr)} ({res.quantity}x)
                      </p>
                    </div>
                  </div>

                  {/* Rider Tracker Button if Bykea Delivery */}
                  {res.fulfillmentType === 'bykea-delivery' && onOpenBykeaTracker && res.status === 'pending' && (
                    <button
                      onClick={() => onOpenBykeaTracker(res)}
                      className="w-full py-2 rounded-xl bg-[#fff8e1] hover:bg-[#ffecb3] text-[#b78103] border border-[#ffecb3] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Bike className="size-3.5" />
                      <span>Track Bykea Rider (ETA 12m)</span>
                    </button>
                  )}

                  {/* Collected State: Rate Review Button */}
                  {res.status === 'collected' && onRateDeal && (
                    <button
                      onClick={() => {
                        onClose();
                        onRateDeal(res.item);
                      }}
                      className="w-full py-2 rounded-xl bg-[#fff8e1] hover:bg-[#ffecb3] text-[#b78103] border border-[#ffecb3] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Star className="size-3.5 fill-[#fbc02d] text-[#fbc02d]" />
                      <span>Rate Store &amp; Food Quality</span>
                    </button>
                  )}

                  {/* Pending State: Cancel Hold / Delete Pass */}
                  {res.status === 'pending' && onCancelReservation && (
                    <div>
                      {confirmCancelId === res.id ? (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex flex-col gap-2 animate-in fade-in duration-150">
                          <p className="text-[11px] text-red-700 font-semibold leading-tight">
                            Release bag? The food will be returned to the store's surplus stock.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                onCancelReservation(res.id);
                                setConfirmCancelId(null);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-colors"
                            >
                              Yes, Release Bag
                            </button>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-[11px] transition-colors"
                            >
                              Keep Bag
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => setConfirmCancelId(res.id)}
                            className="text-[11px] font-semibold text-stone-400 hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="size-3" />
                            <span>Cancel Hold</span>
                          </button>
                        </div>
                      )}
                    </div>
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
