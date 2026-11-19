import React, { useState, useEffect } from 'react';
import type { DealItem, Reservation } from '../../types';
import { X, MapPin, QrCode, CheckCircle2, Sparkles, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { PickupDirectionsLink } from './PickupDirectionsLink';
import confetti from 'canvas-confetti';
import { createReservationApi } from '../../services/api';
import { sounds } from '../../lib/soundEffects';

interface ReservationModalProps {
  deal: DealItem | null;
  onClose: () => void;
  onConfirmReservation: (reservation: Reservation) => void;
  onOpenWhatsApp: (reservation: Reservation) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  deal,
  onClose,
  onConfirmReservation,
  onOpenWhatsApp,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'EasyPaisa' | 'Cash on Pickup'>('Cash on Pickup');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    setQuantity(1);
    setPaymentReference('');
    setReserveError(null);
    setIsConfirmed(false);
    setConfirmedReservation(null);
  }, [deal?.id]);

  if (!deal) return null;

  const itemTotalPkr = deal.currentPricePkr * quantity;
  const totalPricePkr = itemTotalPkr;
  const originalTotalPkr = deal.originalPricePkr * quantity;
  const totalSavingsPkr = Math.max(0, originalTotalPkr - itemTotalPkr);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setReserveError(null);
    sounds.playCashChime();

    try {
      const cleanRef = paymentMethod === 'Cash on Pickup' ? '' : paymentReference.trim();
      const apiRes = await createReservationApi(deal.id, quantity, paymentMethod, cleanRef || undefined);

      const newReservation: Reservation = {
        id: apiRes.reservation?.id || apiRes.reservation?._id || `res-${Date.now()}`,
        item: deal,
        quantity,
        totalPricePkr,
        savedPkr: apiRes.savedPkr ?? totalSavingsPkr,
        pickupWindowEnd: apiRes.pickupWindowEnd || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'pending',
        pickupCode: apiRes.pickupCode,
        fulfillmentType: 'self-pickup',
        paymentMethod,
        paymentStatus: 'pending',
        paymentReference: cleanRef,
        createdAt: new Date().toISOString(),
      };

      setConfirmedReservation(newReservation);
      setIsConfirmed(true);
      onConfirmReservation(newReservation);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2D6A4F', '#4CAF50', '#FF9800', '#F9F6F0'],
      });
    } catch (error: any) {
      setReserveError(error?.message || 'Unable to lock reservation. Please sign in and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-[#2D6A4F]/20 rounded-[2rem] p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F9F6F0] hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <X className="size-5" />
        </button>

        {!isConfirmed ? (
          <div className="flex flex-col gap-4">
            
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#FF9800]/15 text-[#FF9800] border border-[#FF9800]/30 shadow-2xs flex items-center gap-1.5">
                <span>⚡</span> 15-Minute Guaranteed Hold
              </span>
            </div>

            {/* Item Summary Card */}
            <div className="flex gap-4 p-3.5 rounded-2xl bg-[#F9F6F0] border border-[#2D6A4F]/15 items-center">
              <img
                src={deal.imageUrl}
                alt={deal.title}
                className="size-20 rounded-2xl object-cover border border-[#2D6A4F]/15 flex-shrink-0 shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#1F2937] truncate mb-1">
                  {deal.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <MapPin className="size-3.5 text-[#2D6A4F]" />
                    {deal.storeName} ({deal.distanceKm} km away)
                  </p>
                  <PickupDirectionsLink
                    storeName={deal.storeName}
                    address={deal.location.address}
                    sector={deal.location.sector}
                    city={deal.location.city}
                    label="Maps"
                    variant="compact"
                  />
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-lg font-black text-[#1B4332]">
                    {formatCurrency(deal.currentPricePkr)}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    (Worth <span className="line-through text-slate-400">{formatCurrency(deal.originalPricePkr)}</span>)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#edf7ed] text-[#1B4332] border border-[#c8e6c9]">
                    Surprise Box
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1 font-medium">
                  Packed fresh at closing from unsold assortment — exact items vary daily.
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F9F6F0] border border-[#2D6A4F]/15">
              <span className="text-xs font-semibold text-[#1F2937]">Quantity (Max {deal.stockQuantity}):</span>
              <div className="flex items-center gap-3">
                <button
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="size-8 rounded-full bg-white text-slate-700 font-bold border border-[#2D6A4F]/20 disabled:opacity-40 hover:bg-slate-100 shadow-2xs"
                >
                  -
                </button>
                <span className="font-black text-[#1F2937] text-sm w-4 text-center">{quantity}</span>
                <button
                  disabled={quantity >= deal.stockQuantity}
                  onClick={() => setQuantity((q) => Math.min(deal.stockQuantity, q + 1))}
                  className="size-8 rounded-full bg-white text-slate-700 font-bold border border-[#2D6A4F]/20 disabled:opacity-40 hover:bg-slate-100 shadow-2xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fulfillment Info */}
            <div className="p-3 rounded-2xl bg-[#edf7ed] border border-[#c8e6c9] text-xs font-semibold text-[#1b4332] flex items-center justify-between">
              <span>Counter Self-Pickup ({deal.location.city})</span>
              <span className="font-bold text-[#2e7d32]">Free</span>
            </div>

            {reserveError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="size-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{reserveError}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1.5 flex items-center gap-1">
                <Wallet className="size-3.5 text-[#2D6A4F]" />
                Select Counter Payment Method:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('JazzCash')}
                  className={`py-2.5 px-1.5 rounded-xl border text-center transition-all text-[11px] sm:text-xs font-bold ${
                    paymentMethod === 'JazzCash'
                      ? 'bg-[#d32f2f] text-white border-[#d32f2f] shadow-sm'
                      : 'bg-[#F9F6F0] text-slate-700 border-[#2D6A4F]/15'
                  }`}
                >
                  🔴 JazzCash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('EasyPaisa')}
                  className={`py-2.5 px-1.5 rounded-xl border text-center transition-all text-[11px] sm:text-xs font-bold ${
                    paymentMethod === 'EasyPaisa'
                      ? 'bg-[#2e7d32] text-white border-[#2e7d32] shadow-sm'
                      : 'bg-[#F9F6F0] text-slate-700 border-[#2D6A4F]/15'
                  }`}
                >
                  🟢 EasyPaisa
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash on Pickup')}
                  className={`py-2.5 px-1.5 rounded-xl border text-center transition-all text-[11px] sm:text-xs font-bold ${
                    paymentMethod === 'Cash on Pickup'
                      ? 'bg-[#FF9800] text-white border-[#FF9800] shadow-sm'
                      : 'bg-[#F9F6F0] text-slate-700 border-[#2D6A4F]/15'
                  }`}
                >
                  💵 Cash
                </button>
              </div>

              {paymentMethod !== 'Cash on Pickup' && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#fff8e1] border border-[#ffecb3] space-y-2 text-[11px] text-amber-900">
                  <p className="font-semibold leading-snug">
                    <strong>Verify at Counter:</strong> Send {formatCurrency(totalPricePkr)} to the store's {paymentMethod} at pickup and <strong>show the transaction receipt SMS/screen</strong> to the cashier.
                  </p>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Optional: Paste TID / Reference after paying"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-stone-900 text-[11px] font-mono placeholder-stone-400 focus:outline-none focus:border-[#1b4332]"
                  />
                </div>
              )}
            </div>

            {/* Order Summary Breakdown */}
            <div className="p-3.5 rounded-2xl bg-[#FF9800]/10 border border-[#FF9800]/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-[#FF9800] font-black block text-sm">Savings: {formatCurrency(totalSavingsPkr)}</span>
                <span className="text-[#2e7d32] text-[10px] block font-bold">100% Fresh &amp; Halal Verified</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Total Payable</span>
                <span className="text-2xl font-black text-[#1F2937]">{formatCurrency(totalPricePkr)}</span>
              </div>
            </div>

            {/* Confirm Reservation Action */}
            <button
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="btn-claim w-full py-4 text-base font-black shadow-lg shadow-[#2D6A4F]/30"
            >
              <Sparkles className="size-5" />
              <span>{isSubmitting ? 'Securing Your Bag...' : `Claim Bag with ${paymentMethod}`}</span>
            </button>

          </div>
        ) : (

          /* Reserved Confirmation View (Boarding-Pass Ticket) */
          <div className="flex flex-col items-center text-center gap-4 py-2 animate-in zoom-in-95 duration-300">
            
            <div className="size-16 rounded-full bg-[#4CAF50]/15 text-[#2D6A4F] flex items-center justify-center border border-[#4CAF50]/30">
              <CheckCircle2 className="size-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#1F2937] mb-1">Surprise Box Reserved!</h2>
              <p className="text-xs text-slate-600">
                Present your pickup code at <strong>{deal.storeName}</strong> counter within 15 minutes.
              </p>
            </div>

            {/* Pickup Code Voucher Boarding-Pass Card */}
            <div className="w-full p-5 rounded-3xl bg-[#F9F6F0] text-slate-900 border-2 border-dashed border-[#2D6A4F]/30 flex flex-col items-center gap-2.5 shadow-sm">
              <div className="p-3 bg-white text-[#2D6A4F] rounded-2xl shadow-xs border border-[#2D6A4F]/20">
                <QrCode className="size-24" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Store Pickup Pass Code
              </span>
              <span className="font-mono text-3xl font-black tracking-widest text-[#2D6A4F] bg-white px-6 py-1.5 rounded-full border border-[#2D6A4F]/30 shadow-xs">
                {confirmedReservation?.pickupCode}
              </span>
              <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-bold">
                {confirmedReservation?.paymentMethod === 'Cash on Pickup'
                  ? `Pay ${formatCurrency(totalPricePkr)} Cash at Counter`
                  : `Show ${confirmedReservation?.paymentMethod} Receipt for ${formatCurrency(totalPricePkr)} at Counter`}
              </span>
              {confirmedReservation?.paymentReference && (
                <span className="text-[11px] font-mono text-stone-600">
                  Ref: {confirmedReservation.paymentReference}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5 w-full pt-2">
              <PickupDirectionsLink
                storeName={deal.storeName}
                address={deal.location.address}
                sector={deal.location.sector}
                city={deal.location.city}
                label="Google Maps Directions"
                variant="button"
                className="flex-1 min-w-[160px]"
              />

              <button
                onClick={() => {
                  onClose();
                  if (confirmedReservation) onOpenWhatsApp(confirmedReservation);
                }}
                className="flex-1 min-w-[150px] py-3 rounded-full bg-[#25D366] hover:bg-[#20bd59] text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>💬 WhatsApp Voucher</span>
              </button>

              <button
                onClick={onClose}
                className="btn-claim w-full sm:w-auto sm:min-w-[96px] py-3 text-xs font-bold"
              >
                Done
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
