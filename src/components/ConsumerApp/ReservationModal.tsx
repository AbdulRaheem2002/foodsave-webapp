import React, { useState } from 'react';
import type { DealItem, Reservation } from '../../types';
import { X, MapPin, QrCode, CheckCircle2, Sparkles, Wallet, Bike, Users } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import confetti from 'canvas-confetti';
import { createReservationApi } from '../../services/api';
import { sounds } from '../../lib/soundEffects';

interface ReservationModalProps {
  deal: DealItem | null;
  onClose: () => void;
  onConfirmReservation: (reservation: Reservation) => void;
  onOpenWhatsApp: (reservation: Reservation) => void;
  userWalletBalancePkr?: number;
  onOpenGroupSlash?: (deal: DealItem) => void;
  onOpenBykeaTracker?: (res: Reservation) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  deal,
  onClose,
  onConfirmReservation,
  onOpenWhatsApp,
  userWalletBalancePkr = 650,
  onOpenGroupSlash,
  onOpenBykeaTracker,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [fulfillmentType, setFulfillmentType] = useState<'self-pickup' | 'bykea-delivery'>('self-pickup');
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'EasyPaisa' | 'Cash on Pickup' | 'Rescue Wallet'>('JazzCash');
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  if (!deal) return null;

  const deliveryFeePkr = fulfillmentType === 'bykea-delivery' ? 150 : 0;
  const itemTotalPkr = deal.currentPricePkr * quantity;
  const rawTotalPkr = itemTotalPkr + deliveryFeePkr;
  const walletDiscountPkr = useWalletBalance ? Math.min(userWalletBalancePkr, rawTotalPkr) : 0;
  const totalPricePkr = Math.max(0, rawTotalPkr - walletDiscountPkr);
  const originalTotalPkr = deal.originalPricePkr * quantity;
  const totalSavingsPkr = originalTotalPkr - itemTotalPkr + walletDiscountPkr;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    sounds.playCashChime();

    try {
      const apiRes = await createReservationApi(deal.id, quantity, paymentMethod);
      
      const newReservation: Reservation = {
        id: apiRes.reservation?.id || `res-${Date.now()}`,
        item: deal,
        quantity,
        totalPricePkr,
        savedPkr: totalSavingsPkr,
        pickupWindowEnd: apiRes.pickupWindowEnd || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'pending',
        pickupCode: apiRes.pickupCode || `PK-${Math.floor(10000 + Math.random() * 90000)}`,
        fulfillmentType,
        bykeaRiderName: fulfillmentType === 'bykea-delivery' ? 'Tariq Mahmood (Suzuki GD110)' : undefined,
        bykeaRiderPhone: fulfillmentType === 'bykea-delivery' ? '+92 312 8889900' : undefined,
        bykeaEtaMinutes: fulfillmentType === 'bykea-delivery' ? 12 : undefined,
        paymentMethod,
        paymentStatus: paymentMethod === 'Cash on Pickup' ? 'pending' : 'paid',
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
    } catch (error) {
      console.error('Reservation API error:', error);
      const fallbackCode = `PK-${Math.floor(10000 + Math.random() * 90000)}`;
      const newReservation: Reservation = {
        id: `res-${Date.now()}`,
        item: deal,
        quantity,
        totalPricePkr,
        savedPkr: totalSavingsPkr,
        pickupWindowEnd: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'pending',
        pickupCode: fallbackCode,
        fulfillmentType,
        bykeaRiderName: fulfillmentType === 'bykea-delivery' ? 'Tariq Mahmood (Suzuki GD110)' : undefined,
        bykeaRiderPhone: fulfillmentType === 'bykea-delivery' ? '+92 312 8889900' : undefined,
        bykeaEtaMinutes: fulfillmentType === 'bykea-delivery' ? 12 : undefined,
        paymentMethod,
        paymentStatus: paymentMethod === 'Cash on Pickup' ? 'pending' : 'paid',
        createdAt: new Date().toISOString(),
      };

      setConfirmedReservation(newReservation);
      setIsConfirmed(true);
      onConfirmReservation(newReservation);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#182230] border border-[#2D6A4F]/20 dark:border-white/10 rounded-[2rem] p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F9F6F0] dark:bg-[#1F2937] hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        {!isConfirmed ? (
          <div className="flex flex-col gap-4">
            
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#FF9800]/15 text-[#FF9800] border border-[#FF9800]/30 shadow-2xs flex items-center gap-1.5">
                <span>⚡</span> 15-Minute Guaranteed Hold
              </span>
              {onOpenGroupSlash && (
                <button
                  onClick={() => onOpenGroupSlash(deal)}
                  className="px-3 py-1 rounded-full bg-[#FF9800] text-white text-[11px] font-black flex items-center gap-1 shadow-sm hover:scale-102 transition-all"
                >
                  <Users className="size-3" />
                  <span>Group Slash (-15%)</span>
                </button>
              )}
            </div>

            {/* Item Summary Card */}
            <div className="flex gap-4 p-3.5 rounded-2xl bg-[#F9F6F0] dark:bg-[#1F2937] border border-[#2D6A4F]/15 dark:border-white/10 items-center">
              <img
                src={deal.imageUrl}
                alt={deal.title}
                className="size-20 rounded-2xl object-cover border border-[#2D6A4F]/15 flex-shrink-0 shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#1F2937] dark:text-[#F9F6F0] truncate mb-1">
                  {deal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1 font-medium">
                  <MapPin className="size-3.5 text-[#2D6A4F] dark:text-[#4CAF50]" />
                  {deal.storeName} ({deal.distanceKm} km away)
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-[#FF9800]">
                    {formatCurrency(deal.currentPricePkr)}
                  </span>
                  <span className="text-xs line-through text-slate-400 font-medium">
                    {formatCurrency(deal.originalPricePkr)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF9800]/20 text-[#FF9800]">
                    {deal.discountPercent}% OFF
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F9F6F0] dark:bg-[#1F2937] border border-[#2D6A4F]/15 dark:border-white/10">
              <span className="text-xs font-semibold text-[#1F2937] dark:text-[#F9F6F0]">Quantity (Max {deal.stockQuantity}):</span>
              <div className="flex items-center gap-3">
                <button
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="size-8 rounded-full bg-white dark:bg-[#141c27] text-slate-700 dark:text-slate-200 font-bold border border-[#2D6A4F]/20 disabled:opacity-40 hover:bg-slate-100 shadow-2xs"
                >
                  -
                </button>
                <span className="font-black text-[#1F2937] dark:text-[#F9F6F0] text-sm w-4 text-center">{quantity}</span>
                <button
                  disabled={quantity >= deal.stockQuantity}
                  onClick={() => setQuantity((q) => Math.min(deal.stockQuantity, q + 1))}
                  className="size-8 rounded-full bg-white dark:bg-[#141c27] text-slate-700 dark:text-slate-200 font-bold border border-[#2D6A4F]/20 disabled:opacity-40 hover:bg-slate-100 shadow-2xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fulfillment Type Selector */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] dark:text-[#F9F6F0] mb-1.5 flex items-center gap-1">
                <Bike className="size-3.5 text-[#FF9800]" />
                Select Fulfillment Mode:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('self-pickup')}
                  className={`p-3 rounded-2xl border text-center font-bold transition-all ${
                    fulfillmentType === 'self-pickup'
                      ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                      : 'bg-[#F9F6F0] dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 border-[#2D6A4F]/15'
                  }`}
                >
                  🚶 Self-Pickup (Free)
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType('bykea-delivery')}
                  className={`p-3 rounded-2xl border text-center font-bold transition-all ${
                    fulfillmentType === 'bykea-delivery'
                      ? 'bg-[#FF9800] text-white border-[#FF9800] shadow-sm'
                      : 'bg-[#F9F6F0] dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 border-[#2D6A4F]/15'
                  }`}
                >
                  🏍️ Bykea Express (+ ₨ 150)
                </button>
              </div>
            </div>

            {/* Rescue Wallet Balance Deduction */}
            {userWalletBalancePkr > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#F9F6F0] dark:bg-[#1F2937] border border-[#2D6A4F]/15 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-[#FF9800] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    🪙
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1F2937] dark:text-[#F9F6F0] block">Use Rescue Cashback Wallet</span>
                    <span className="text-[10px] text-[#FF9800] font-bold">Balance: {formatCurrency(userWalletBalancePkr)} available</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUseWalletBalance(!useWalletBalance)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    useWalletBalance
                      ? 'bg-[#2D6A4F] text-white shadow-xs'
                      : 'bg-white dark:bg-[#141c27] text-slate-700 dark:text-slate-200 border border-[#2D6A4F]/25'
                  }`}
                >
                  {useWalletBalance ? '✓ Applied' : 'Apply'}
                </button>
              </div>
            )}

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] dark:text-[#F9F6F0] mb-1.5 flex items-center gap-1">
                <Wallet className="size-3.5 text-[#2D6A4F] dark:text-[#4CAF50]" />
                Select Payment Method:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('JazzCash')}
                  className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                    paymentMethod === 'JazzCash'
                      ? 'bg-[#d32f2f] text-white border-[#d32f2f] shadow-sm'
                      : 'bg-[#F9F6F0] dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 border-[#2D6A4F]/15'
                  }`}
                >
                  🔴 JazzCash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('EasyPaisa')}
                  className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                    paymentMethod === 'EasyPaisa'
                      ? 'bg-[#2e7d32] text-white border-[#2e7d32] shadow-sm'
                      : 'bg-[#F9F6F0] dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 border-[#2D6A4F]/15'
                  }`}
                >
                  🟢 EasyPaisa
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash on Pickup')}
                  className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                    paymentMethod === 'Cash on Pickup'
                      ? 'bg-[#FF9800] text-white border-[#FF9800] shadow-sm'
                      : 'bg-[#F9F6F0] dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 border-[#2D6A4F]/15'
                  }`}
                >
                  💵 Cash
                </button>
              </div>
            </div>

            {/* Order Summary Breakdown */}
            <div className="p-3.5 rounded-2xl bg-[#FF9800]/10 border border-[#FF9800]/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-[#FF9800] font-black block text-sm">Savings: {formatCurrency(totalSavingsPkr)}</span>
                <span className="text-[#2D6A4F] dark:text-[#4CAF50] text-[10px] block font-bold">Includes 5% Instant PKR Rescue Cashback!</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Payable</span>
                <span className="text-2xl font-black text-[#1F2937] dark:text-[#F9F6F0]">{formatCurrency(totalPricePkr)}</span>
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
            
            <div className="size-16 rounded-full bg-[#4CAF50]/15 text-[#2D6A4F] dark:text-[#4CAF50] flex items-center justify-center border border-[#4CAF50]/30">
              <CheckCircle2 className="size-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#1F2937] dark:text-[#F9F6F0] mb-1">Surprise Bag Secured!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {confirmedReservation?.fulfillmentType === 'bykea-delivery'
                  ? 'Bykea Express Rider assigned and en route to store!'
                  : 'Present your pickup code at store counter within 15 minutes.'}
              </p>
            </div>

            {/* Bykea Rider Live Tracking Trigger Box */}
            {confirmedReservation?.fulfillmentType === 'bykea-delivery' && (
              <div
                onClick={() => {
                  if (confirmedReservation && onOpenBykeaTracker) {
                    onOpenBykeaTracker(confirmedReservation);
                  }
                }}
                className="w-full p-4 rounded-2xl bg-[#FF9800]/15 hover:bg-[#FF9800]/25 border border-[#FF9800]/40 text-left flex items-center justify-between gap-3 cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-[#FF9800] text-white flex items-center justify-center font-bold">
                    <Bike className="size-5 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF9800] block">
                      Bykea Express Rider Assigned
                    </span>
                    <p className="text-xs font-bold text-[#1F2937] dark:text-[#F9F6F0]">
                      {confirmedReservation.bykeaRiderName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      ETA: <strong>12 mins</strong> • Click to View Live GPS Route
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-[#FF9800] text-white font-black text-xs shadow-xs">
                  Track Live 📍
                </span>
              </div>
            )}

            {/* Pickup Code Voucher Boarding-Pass Card */}
            <div className="w-full p-5 rounded-3xl bg-[#F9F6F0] dark:bg-[#141c27] text-slate-900 dark:text-slate-100 border-2 border-dashed border-[#2D6A4F]/30 flex flex-col items-center gap-2.5 shadow-sm">
              <div className="p-3 bg-white dark:bg-[#1F2937] text-[#2D6A4F] dark:text-[#4CAF50] rounded-2xl shadow-xs border border-[#2D6A4F]/20">
                <QrCode className="size-24" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Store Pickup Pass Code
              </span>
              <span className="font-mono text-3xl font-black tracking-widest text-[#2D6A4F] dark:text-[#4CAF50] bg-white dark:bg-[#1F2937] px-6 py-1.5 rounded-full border border-[#2D6A4F]/30 shadow-xs">
                {confirmedReservation?.pickupCode}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Payment: {confirmedReservation?.paymentMethod} ({confirmedReservation?.paymentStatus})
              </span>
            </div>

            <div className="flex gap-2.5 w-full pt-2">
              <button
                onClick={() => {
                  onClose();
                  if (confirmedReservation) onOpenWhatsApp(confirmedReservation);
                }}
                className="flex-1 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd59] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>💬 WhatsApp Voucher</span>
              </button>

              <button
                onClick={onClose}
                className="btn-claim flex-1 py-3.5 text-xs font-bold"
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
