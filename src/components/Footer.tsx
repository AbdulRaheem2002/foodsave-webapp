import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { BiteHourLogo } from './BrandLogo';

interface FooterProps {
  totalSavedPkr?: number;
  itemsRescuedCount?: number;
  onOpenPartnerPage?: () => void;
  onOpenMerchantPortal?: () => void;
}

const POLICY_DETAILS: Record<'halal' | 'terms' | 'privacy', { title: string; body: string }> = {
  halal: {
    title: 'Halal & Same-Day Freshness Policy',
    body: 'All partner bakeries, cafés, restaurants, and groceries on BiteHour Pakistan list 100% Halal-certified same-day food prepared fresh in licensed commercial kitchens and sold before closing.',
  },
  terms: {
    title: 'Terms of Pickup & Reservation Hold',
    body: 'Reservations lock your bag for a 15-minute counter hold (or within the posted closing pickup window). Please present your PK-XXXXX code at the store counter or cancel ahead in My Bag if plans change.',
  },
  privacy: {
    title: 'Customer & Partner Privacy Policy',
    body: 'We collect only your name, phone number, and email strictly to issue pickup passes, send order confirmations, and verify store partners. We never sell personal data to third parties.',
  },
};

export const Footer: React.FC<FooterProps> = ({
  onOpenPartnerPage,
  onOpenMerchantPortal,
}) => {
  const [activePolicy, setActivePolicy] = useState<'halal' | 'terms' | 'privacy' | null>(null);

  return (
    <footer className="w-full bg-[#fcfbf9] text-stone-700 pt-12 pb-8 px-4 lg:px-8 border-t border-[#e5e0d8]">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Payment Options Banner */}
        <div className="rounded-2xl bg-[#0e1622] text-white p-5 sm:p-6 border border-stone-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-black text-white tracking-tight">
              Simple Counter &amp; Wallet Payments
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              Reserve online and pay via Cash on Pickup, JazzCash, or EasyPaisa at the store counter.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-2xs">
              <span className="size-2 rounded-full bg-[#e53935]" />
              <span>JazzCash</span>
            </span>

            <span className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-2xs">
              <span className="size-2 rounded-full bg-[#43a047]" />
              <span>EasyPaisa</span>
            </span>

            <span className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-2xs">
              <span>💵 Cash on Pickup</span>
            </span>
          </div>
        </div>

        {/* 4-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3 items-start">
            <BiteHourLogo compact />
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              Helping Pakistani bakeries, cafés, and restaurants turn evening surplus into affordable deals and new walk-in customers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
              Launch Hubs
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 font-medium">
              <li>Islamabad (F-6, F-7, Blue Area, F-10, NUST H-12)</li>
              <li>Rawalpindi</li>
              <li>Lahore</li>
              <li>Karachi</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
              For Merchants
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 font-medium">
              <li>
                <button
                  type="button"
                  onClick={onOpenPartnerPage}
                  className="font-bold text-[#1b4332] hover:text-[#f37021] hover:underline text-left transition-colors"
                >
                  Partner With Us (0% Launch Fee)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenMerchantPortal}
                  className="hover:text-[#1b4332] hover:underline text-left transition-colors"
                >
                  Store POS Portal
                </button>
              </li>
              <li>Time-Decay Surplus Pricing</li>
              <li>Cashier Pass Verification (0% Fee)</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#f7f5f0] border border-[#e5e0d8] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2e7d32] flex items-center gap-1 mb-1">
                <ShieldCheck className="size-3 text-[#2e7d32]" />
                Quality &amp; Pickup Policy
              </span>
              <h5 className="text-xs font-black text-stone-900 mb-1">
                Fresh Same-Day Surplus
              </h5>
              <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
                All partner stores list verified same-day surplus inventory with clear expiry and pickup deadlines.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#2e7d32] mt-3 pt-2 border-t border-stone-200">
              <CheckCircle2 className="size-3" />
              <span>15-Minute Pickup Hold</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Policy Links */}
        <div className="pt-6 border-t border-[#e5e0d8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div>
            © 2026 BiteHour Pakistan. All rights reserved.
          </div>
          <div className="flex items-center gap-5 text-[11px]">
            <button
              type="button"
              onClick={() => setActivePolicy('halal')}
              className="hover:text-stone-700 cursor-pointer transition-colors"
            >
              Halal Verification Policy
            </button>
            <button
              type="button"
              onClick={() => setActivePolicy('terms')}
              className="hover:text-stone-700 cursor-pointer transition-colors"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActivePolicy('privacy')}
              className="hover:text-stone-700 cursor-pointer transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>

      </div>

      {activePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl space-y-3">
            <button
              type="button"
              onClick={() => setActivePolicy(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600"
            >
              <X className="size-4" />
            </button>
            <h3 className="text-base font-black text-stone-900 pr-8">{POLICY_DETAILS[activePolicy].title}</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              {POLICY_DETAILS[activePolicy].body}
            </p>
            <button
              type="button"
              onClick={() => setActivePolicy(null)}
              className="w-full py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-black"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};
