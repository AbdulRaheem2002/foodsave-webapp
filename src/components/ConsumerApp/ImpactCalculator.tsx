import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export const ImpactCalculator: React.FC = () => {
  const [weeklySpendPkr, setWeeklySpendPkr] = useState<number>(8000);

  // Assumptions based on buying 40% of groceries/dining surplus at ~60% discount
  const monthlySavingsPkr = Math.round(weeklySpendPkr * 4 * 0.35);
  const annualSavingsPkr = monthlySavingsPkr * 12;
  const foodSavedKg = Math.round((weeklySpendPkr / 500) * 4 * 1.5);
  const co2AvoidedKg = Math.round(foodSavedKg * 2.5);

  return (
    <div className="bg-white dark:bg-[#182230] p-6 sm:p-8 rounded-[1.75rem] border border-[#e5e0d8] dark:border-white/10 shadow-2xs flex flex-col gap-6">
      
      {/* Header matching exact Reference Mockup */}
      <div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30 inline-flex items-center gap-1.5 mb-2.5">
          <Sparkles className="size-3 text-[#2e7d32] dark:text-[#81c784]" />
          Interactive Impact Tool
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-[#F9F6F0] tracking-tight">
          Calculate Your Household Savings &amp; CO₂ Reduction
        </h3>

        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
          Estimate how much money you save &amp; how much landfill food waste you prevent each month by swapping grocery runs with Foodsave surplus.
        </p>
      </div>

      {/* Slider Input Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#f7f5f0] dark:bg-[#1F2937] border border-[#e8e3d8] dark:border-white/10">
        <div className="flex justify-between items-center text-xs sm:text-sm mb-3">
          <span className="text-stone-700 dark:text-stone-300 font-bold">
            Your Weekly Household Grocery &amp; Dining Spend (PKR):
          </span>
          <span className="font-black text-stone-900 dark:text-[#F9F6F0] text-base sm:text-lg">
            {formatCurrency(weeklySpendPkr)} / week
          </span>
        </div>

        <input
          type="range"
          min="1000"
          max="30000"
          step="500"
          value={weeklySpendPkr}
          onChange={(e) => setWeeklySpendPkr(Number(e.target.value))}
          className="w-full accent-[#1b4332] cursor-pointer h-2 bg-stone-300 dark:bg-stone-700 rounded-lg"
        />

        <div className="flex justify-between text-[11px] text-stone-400 font-mono mt-2">
          <span>Rs 1,000/wk</span>
          <span>Rs 15,000/wk</span>
          <span>Rs 30,000/wk</span>
        </div>
      </div>

      {/* 4 Metric Cards matching exact colors from the mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Monthly Saved (Soft Green) */}
        <div className="p-4 rounded-2xl bg-[#edf7ed] border border-[#c8e6c9] dark:bg-[#1b4332]/25 dark:border-[#2e7d32]/40">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#2e7d32] dark:text-[#81c784] block mb-1">
            Monthly PKR Saved
          </span>
          <span className="text-2xl font-black text-stone-900 dark:text-white">
            {formatCurrency(monthlySavingsPkr)}
          </span>
          <span className="text-[11px] text-stone-600 dark:text-stone-300 block mt-1">
            ~35% off your regular grocery bill
          </span>
        </div>

        {/* Card 2: Annual Saved (Soft Amber) */}
        <div className="p-4 rounded-2xl bg-[#fff8e1] border border-[#ffecb3] dark:bg-[#b78103]/20 dark:border-[#fbc02d]/40">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#b78103] dark:text-[#fbc02d] block mb-1">
            Annual PKR Saved
          </span>
          <span className="text-2xl font-black text-stone-900 dark:text-white">
            {formatCurrency(annualSavingsPkr)}
          </span>
          <span className="text-[11px] text-stone-600 dark:text-stone-300 block mt-1">
            Equivalent to 1 month family vacation
          </span>
        </div>

        {/* Card 3: Edible Food Rescued (Soft Blue/Cyan) */}
        <div className="p-4 rounded-2xl bg-[#e0f7fa] border border-[#b2ebf2] dark:bg-[#006064]/25 dark:border-[#00838f]/40">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#00838f] dark:text-[#4dd0e1] block mb-1">
            Edible Food Rescued
          </span>
          <span className="text-2xl font-black text-stone-900 dark:text-white">
            {foodSavedKg} kg
          </span>
          <span className="text-[11px] text-stone-600 dark:text-stone-300 block mt-1">
            Diverted from peri-urban landfills
          </span>
        </div>

        {/* Card 4: CO2 Prevented (Soft Mint) */}
        <div className="p-4 rounded-2xl bg-[#e8f5e9] border border-[#c8e6c9] dark:bg-[#1b4332]/25 dark:border-[#2e7d32]/40">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#2e7d32] dark:text-[#81c784] block mb-1">
            CO₂ Emissions Prevented
          </span>
          <span className="text-2xl font-black text-stone-900 dark:text-white">
            {co2AvoidedKg} kg
          </span>
          <span className="text-[11px] text-stone-600 dark:text-stone-300 block mt-1">
            Cleansed 4 indoor tree equivalent
          </span>
        </div>

      </div>

    </div>
  );
};
