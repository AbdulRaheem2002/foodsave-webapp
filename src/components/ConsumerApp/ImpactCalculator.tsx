import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export const ImpactCalculator: React.FC = () => {
  const [weeklySpendPkr, setWeeklySpendPkr] = useState<number>(8000);

  // Assumptions based on swapping 35-40% of routine bakery/dining spend with closing-hour BiteHour deals
  const monthlySavingsPkr = Math.round(weeklySpendPkr * 4 * 0.35);
  const annualSavingsPkr = monthlySavingsPkr * 12;
  const foodSavedKg = Math.round((weeklySpendPkr / 500) * 4 * 0.8);
  const co2AvoidedKg = Number((foodSavedKg * 2.5).toFixed(1));

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[1.75rem] border border-[#E7E2D8] shadow-xs flex flex-col gap-6">
      <div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#edf7ed] text-[#1B4332] border border-[#c8e6c9] inline-flex items-center gap-1.5 mb-2.5">
          <Sparkles className="size-3 text-[#2e7d32]" />
          Interactive Household Calculator
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-[#171916] tracking-tight">
          Estimate Your Monthly PKR Savings &amp; Waste Prevented
        </h3>

        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl font-medium">
          See how much money stays in your wallet — and how much fresh bakery &amp; kitchen food avoids landfill — when you shift evening takeout to BiteHour closing drops.
        </p>
      </div>

      {/* Slider Input Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#F6F2EA] border border-[#E8E2D6]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs sm:text-sm mb-3">
          <span className="text-stone-700 font-bold">
            Your Weekly Bakery, Café &amp; Takeout Spend (PKR):
          </span>
          <span className="font-black text-[#1B4332] text-base sm:text-lg">
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
          className="w-full accent-[#1b4332] cursor-pointer h-2 bg-stone-300 rounded-lg"
        />

        <div className="flex justify-between text-[11px] text-stone-500 font-mono mt-2">
          <span>₨ 1,000/wk</span>
          <span>₨ 15,000/wk</span>
          <span>₨ 30,000/wk</span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#edf7ed] border border-[#c8e6c9]">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#1B4332] block mb-1">
            Monthly PKR Saved
          </span>
          <span className="text-2xl font-black text-[#171916]">
            {formatCurrency(monthlySavingsPkr)}
          </span>
          <span className="text-[11px] text-stone-600 block mt-1 font-medium">
            ~35% off routine dining &amp; bakery costs
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFF3E6] border border-[#fed7aa]">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#c2410c] block mb-1">
            Annual PKR Saved
          </span>
          <span className="text-2xl font-black text-[#171916]">
            {formatCurrency(annualSavingsPkr)}
          </span>
          <span className="text-[11px] text-stone-600 block mt-1 font-medium">
            Kept in your household budget every year
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#F6F2EA] border border-[#E5DFD3]">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#1B4332] block mb-1">
            Fresh Food Rescued
          </span>
          <span className="text-2xl font-black text-[#171916]">
            {foodSavedKg} kg / mo
          </span>
          <span className="text-[11px] text-stone-600 block mt-1 font-medium">
            Edible kitchen surplus diverted from waste
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#e8f5e9] border border-[#c8e6c9]">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#2e7d32] block mb-1">
            CO₂ Emissions Avoided
          </span>
          <span className="text-2xl font-black text-[#171916]">
            {co2AvoidedKg} kg / mo
          </span>
          <span className="text-[11px] text-stone-600 block mt-1 font-medium">
            Lower methane &amp; packaging disposal waste
          </span>
        </div>
      </div>
    </div>
  );
};
