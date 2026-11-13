import React from 'react';
import { Leaf, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  totalSavedPkr?: number;
  itemsRescuedCount?: number;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="w-full bg-[#fcfbf9] dark:bg-[#111827] text-stone-700 dark:text-stone-300 pt-12 pb-8 px-4 lg:px-8 border-t border-[#e5e0d8] dark:border-white/10 transition-colors">
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
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-[#1b4332] text-white flex items-center justify-center shadow-xs">
                <Leaf className="size-4 text-[#85e3a8]" />
              </div>
              <h3 className="text-base font-black text-stone-900">
                Foodsave Pakistan
              </h3>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              Helping Pakistani bakeries, restaurants, and grocery stores sell daily surplus food at steep closing discounts.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
              Supported Cities
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 font-medium">
              <li>Lahore</li>
              <li>Karachi</li>
              <li>Islamabad</li>
              <li>Rawalpindi</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
              For Merchants
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 font-medium">
              <li>Register Bakery or Restaurant</li>
              <li>Time-Decay Surplus Pricing</li>
              <li>Cashier Pass Verification</li>
              <li>Merchant Dashboard Portal</li>
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
        <div className="pt-6 border-t border-[#e5e0d8] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div>
            © 2026 Foodsave Pakistan (Pvt.) Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-5 text-[11px]">
            <span className="hover:text-stone-700 dark:hover:text-white cursor-pointer transition-colors">Halal Verification Policy</span>
            <span className="hover:text-stone-700 dark:hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-stone-700 dark:hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
