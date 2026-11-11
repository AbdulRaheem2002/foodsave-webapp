import React, { useState } from 'react';
import type { DealItem, DonationRecord } from '../../types';
import { X, Heart, Truck, Building2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { sounds } from '../../lib/soundEffects';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealItem | null;
  onConfirmDonation: (record: DonationRecord) => void;
}

const CHARITIES = [
  {
    name: 'Saylani Welfare International' as const,
    branch: 'Dastarkhwan Unit (Gulberg, Lahore)',
    mealsEstFactor: 2.5,
    tagline: 'Feeds 150,000+ daily across Pakistan',
  },
  {
    name: 'Edhi Foundation Pakistan' as const,
    branch: 'Emergency Food Relief (Blue Area & Karachi)',
    mealsEstFactor: 2.2,
    tagline: 'Pakistan’s largest humanitarian network',
  },
  {
    name: 'JDC Welfare Organization' as const,
    branch: 'Free Community Kitchen (Bahadurabad / Clifton)',
    mealsEstFactor: 2.8,
    tagline: 'Active round-the-clock food distribution',
  },
];

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  deal,
  onConfirmDonation,
}) => {
  const [selectedCharity, setSelectedCharity] = useState<typeof CHARITIES[0]>(CHARITIES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !deal) return null;

  const totalValuePkr = deal.originalPricePkr * deal.stockQuantity;
  const estimatedMeals = Math.round(deal.stockQuantity * selectedCharity.mealsEstFactor);
  const co2SavedKg = Math.round(deal.stockQuantity * 1.8 * 10) / 10;

  const handleDonate = () => {
    setIsSubmitting(true);
    sounds.playSuccessFanfare();

    const donationRecord: DonationRecord = {
      id: `don-${Date.now()}`,
      dealId: deal.id,
      itemTitle: deal.title,
      storeName: deal.storeName,
      charityName: selectedCharity.name,
      quantity: deal.stockQuantity,
      estimatedValuePkr: totalValuePkr,
      co2SavedKg,
      mealsServed: estimatedMeals,
      certificateNumber: `CSR-PK-${Math.floor(100000 + Math.random() * 900000)}`,
      dispatchedAt: new Date().toISOString(),
      status: 'dispatched',
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onConfirmDonation(donationRecord);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="size-11 rounded-2xl bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30 flex items-center justify-center shadow-xs">
            <Heart className="size-6 fill-[#2e7d32] text-[#2e7d32]" />
          </div>
          <div>
            <h3 className="text-base font-black text-stone-900 dark:text-white">NGO Food Rescue Donation</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Redirect unsold edible surplus to verified Pakistan food banks</p>
          </div>
        </div>

        {/* Item Summary */}
        <div className="p-3.5 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={deal.imageUrl} alt={deal.title} className="size-12 rounded-xl object-cover border border-stone-200 dark:border-stone-700 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-stone-900 dark:text-white truncate">{deal.title}</h4>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">{deal.stockQuantity} units • Value: {formatCurrency(totalValuePkr)}</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] text-[10px] font-bold whitespace-nowrap">
            Zero-Waste
          </span>
        </div>

        {/* Charity Selector */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
            <Building2 className="size-3.5 text-[#f37021]" />
            Select Partner Charity Network:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {CHARITIES.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedCharity(c)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedCharity.name === c.name
                    ? 'bg-[#edf7ed] dark:bg-[#1b4332]/40 border-[#2e7d32] ring-2 ring-[#2e7d32]/20'
                    : 'bg-[#f7f5f0] dark:bg-stone-900/60 border-[#e8e2d8] dark:border-stone-800 hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-xs text-stone-900 dark:text-white">{c.name}</span>
                  <span className="text-[10px] text-[#2e7d32] dark:text-[#81c784] font-semibold">{c.branch.split('(')[1]?.replace(')', '') || 'Pakistan'}</span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">{c.tagline}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Impact Estimate Metric Cards */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="p-2.5 rounded-xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 text-center">
            <span className="text-[9px] uppercase font-bold text-stone-400 block">Meals Served</span>
            <span className="text-sm font-black text-[#f37021]">{estimatedMeals} Meals</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 text-center">
            <span className="text-[9px] uppercase font-bold text-stone-400 block">CO₂ Diverted</span>
            <span className="text-sm font-black text-[#2e7d32] dark:text-[#81c784]">{co2SavedKg} kg</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 text-center">
            <span className="text-[9px] uppercase font-bold text-stone-400 block">CSR Tax Credit</span>
            <span className="text-sm font-black text-stone-900 dark:text-white">100% Deductible</span>
          </div>
        </div>

        <button
          disabled={isSubmitting}
          onClick={handleDonate}
          className="w-full py-3.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-transform transform active:scale-95"
        >
          <Truck className="size-4 text-white" />
          <span>{isSubmitting ? 'Dispatching Food Rescue...' : `Dispatch Donation to ${selectedCharity.name.split(' ')[0]}`}</span>
        </button>

      </div>
    </div>
  );
};
