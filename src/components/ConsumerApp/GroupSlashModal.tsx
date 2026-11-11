import React, { useState } from 'react';
import type { DealItem } from '../../types';
import { X, Users, Sparkles, Send, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { sounds } from '../../lib/soundEffects';

interface GroupSlashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealItem | null;
  onApplySlashDiscount: (dealId: string, slashPercent: number) => void;
}

export const GroupSlashModal: React.FC<GroupSlashModalProps> = ({
  isOpen,
  onClose,
  deal,
  onApplySlashDiscount,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSlashClaimed, setIsSlashClaimed] = useState(false);

  if (!isOpen || !deal) return null;

  const slashedPrice = Math.round(deal.currentPricePkr * 0.85); // extra 15% off
  const savingsExtra = deal.currentPricePkr - slashedPrice;

  const shareText = `🇵🇰 *FOODSAVE PAKISTAN GROUP RESCUE SLASH* ⚡\n\nHey! Help me slash the price on *${deal.title}* at *${deal.storeName}* (${deal.location.city})!\n\n💰 *Standard Price:* ${formatCurrency(deal.currentPricePkr)}\n🔥 *Slashed Price for Both of Us:* ${formatCurrency(slashedPrice)} (Extra 15% OFF!)\n\nClick link to join my rescue team within 15 mins: https://foodsave.pk/slash/${deal.id}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateClaim = () => {
    sounds.playSuccessFanfare();
    setIsSlashClaimed(true);
    onApplySlashDiscount(deal.id, 15);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden text-center">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="size-14 rounded-2xl bg-[#f37021] text-white flex items-center justify-center mx-auto mb-3 shadow-md font-bold">
          <Users className="size-7" />
        </div>

        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Sparkles className="size-4 text-[#f37021]" />
          <h3 className="text-lg font-black text-stone-900 dark:text-white tracking-tight">Group-Rescue Price Slash</h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto mb-4 font-medium">
          Invite 1 friend on WhatsApp. When they join, both of you unlock an <strong>extra 15% OFF</strong> this surplus deal!
        </p>

        {/* Price Comparison Card */}
        <div className="p-4 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 flex items-center justify-between mb-4 shadow-2xs">
          <div className="text-left">
            <span className="text-[10px] text-stone-400 block uppercase font-bold">Standard Deal</span>
            <span className="text-sm font-semibold text-stone-400 line-through">
              {formatCurrency(deal.currentPricePkr)}
            </span>
          </div>

          <div className="text-center font-bold text-[#b78103] text-xs px-2.5 py-1 bg-[#fff8e1] dark:bg-[#FF9800]/20 rounded-xl border border-[#ffecb3] dark:border-[#FF9800]/40">
            -15% Group Bonus
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#2e7d32] block uppercase font-bold">Group Slashed</span>
            <span className="text-xl font-black text-[#1b4332] dark:text-[#81c784]">
              {formatCurrency(slashedPrice)}
            </span>
          </div>
        </div>

        {isSlashClaimed ? (
          <div className="p-3.5 rounded-2xl bg-[#edf7ed] dark:bg-[#1b4332]/40 border border-[#c8e6c9] dark:border-[#2e7d32]/50 text-[#2e7d32] dark:text-[#81c784] text-xs font-bold animate-bounce shadow-2xs">
            🎉 Group Slash Applied! You save an extra {formatCurrency(savingsExtra)}!
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sounds.playLaserBeep()}
              className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Send className="size-4" />
              <span>Share Deal on WhatsApp (-15%)</span>
            </a>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="size-3.5 text-[#2e7d32]" /> : <Copy className="size-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateClaim}
                className="flex-1 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white text-xs font-black shadow-xs flex items-center justify-center gap-1 transition-all"
              >
                <span>Instant Slash Claim ⚡</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
