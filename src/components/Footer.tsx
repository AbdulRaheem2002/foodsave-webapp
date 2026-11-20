import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { LegalPolicyKey } from '../types';
import { BiteHourLogo } from './BrandLogo';

interface FooterProps {
  totalSavedPkr?: number;
  itemsRescuedCount?: number;
  onOpenPartnerPage?: () => void;
  onOpenMerchantPortal?: () => void;
  onOpenImpactPage?: () => void;
  onOpenPolicy?: (policy: LegalPolicyKey) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPartnerPage,
  onOpenMerchantPortal,
  onOpenImpactPage,
  onOpenPolicy,
}) => {
  return (
    <footer className="w-full bg-[#F5F1E8] text-stone-700 pt-14 pb-10 px-4 lg:px-8 border-t border-[#E5DFD3]">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Payment Options Banner */}
        <div className="rounded-[1.75rem] bg-[#142E22] text-white p-6 sm:p-8 border border-[#1F4433] shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <h4 className="text-lg font-extrabold text-white tracking-tight">
              Simple Counter &amp; Wallet Payments
            </h4>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
              Reserve online in 15 seconds and pay via Cash on Pickup, JazzCash, or EasyPaisa at the counter.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-4 py-2 rounded-full bg-[#0F241B] border border-white/15 text-xs font-bold text-white flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#e53935]" />
              <span>JazzCash</span>
            </span>

            <span className="px-4 py-2 rounded-full bg-[#0F241B] border border-white/15 text-xs font-bold text-white flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#43a047]" />
              <span>EasyPaisa</span>
            </span>

            <span className="px-4 py-2 rounded-full bg-[#0F241B] border border-white/15 text-xs font-bold text-white flex items-center gap-1.5">
              <span>💵 Cash on Pickup</span>
            </span>
          </div>
        </div>

        {/* 4-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3 items-start">
            <BiteHourLogo compact />
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              Helping Pakistani bakeries, restaurants, hotels, cafés, and marts turn evening surplus into affordable deals and new walk-in customers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
              Islamabad Live Zones
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 font-medium">
              <li>F-6 &amp; F-7 Markaz</li>
              <li>E-11 &amp; F-10 Sectors</li>
              <li>Blue Area &amp; I-8</li>
              <li>NUST H-12 (More cities coming soon)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
              For Kitchens &amp; Community
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 font-medium">
              <li>
                <button
                  type="button"
                  onClick={onOpenPartnerPage}
                  className="font-bold text-[#1b4332] hover:text-[#f37021] hover:underline text-left transition-colors cursor-pointer"
                >
                  Partner With Us (0% Launch Fee)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenMerchantPortal}
                  className="hover:text-[#1b4332] hover:underline text-left transition-colors cursor-pointer"
                >
                  Store POS Portal
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenImpactPage}
                  className="hover:text-[#1b4332] hover:underline text-left transition-colors cursor-pointer"
                >
                  Live Rescue Impact &amp; Calculator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy?.('vendor')}
                  className="hover:text-[#1b4332] hover:underline text-left transition-colors cursor-pointer"
                >
                  Partner &amp; Vendor Agreement
                </button>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#f7f5f0] border border-[#e5e0d8] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2e7d32] flex items-center gap-1 mb-1">
                <ShieldCheck className="size-3 text-[#2e7d32]" />
                Verified Partner Kitchens
              </span>
              <h5 className="text-xs font-black text-stone-900 mb-1">
                Fresh Same-Day Closing Deals
              </h5>
              <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
                Every verified partner lists same-day closing food with clear pickup deadlines — expired deals are hidden automatically.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#2e7d32] mt-3 pt-2 border-t border-stone-200">
              <CheckCircle2 className="size-3" />
              <span>15-Minute Pickup Hold • 48h Dispute Care</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Policy Links */}
        <div className="pt-6 border-t border-[#e5e0d8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div>
            © 2026 BiteHour Pakistan. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 text-[11px]">
            <button
              type="button"
              onClick={() => onOpenPolicy?.('halal')}
              className="hover:text-stone-700 cursor-pointer transition-colors"
            >
              Halal &amp; Allergens
            </button>
            <button
              type="button"
              onClick={() => onOpenPolicy?.('vendor')}
              className="hover:text-stone-700 cursor-pointer transition-colors"
            >
              Partner Agreement
            </button>
            <button
              type="button"
              onClick={() => onOpenPolicy?.('terms')}
              className="hover:text-stone-700 cursor-pointer transition-colors"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => onOpenPolicy?.('privacy')}
              className="hover:text-stone-700 cursor-pointer transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
