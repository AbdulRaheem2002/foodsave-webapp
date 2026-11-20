import React, { useEffect, useState } from 'react';
import { Leaf, ShieldCheck, Store, ArrowRight, TrendingUp, Users, Sparkles } from 'lucide-react';
import type { PlatformImpactSummary } from '../types';
import { fetchPlatformImpactApi } from '../services/api';
import { formatCurrency } from '../lib/utils';
import { ImpactCalculator } from './ConsumerApp/ImpactCalculator';

interface ImpactPageProps {
  onExploreDeals: () => void;
  onOpenPartnerPage: () => void;
}

export const ImpactPage: React.FC<ImpactPageProps> = ({
  onExploreDeals,
  onOpenPartnerPage,
}) => {
  const [impact, setImpact] = useState<PlatformImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadImpact = async () => {
      try {
        const res = await fetchPlatformImpactApi();
        if (active) setImpact(res);
      } catch {
        // Leave fallback metrics cleanly
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadImpact();
    return () => {
      active = false;
    };
  }, []);

  const mealsRescued = impact?.mealsRescued ?? 0;
  const dinerSavings = impact?.customerSavedPkr ?? 0;
  const kitchenRevenue = impact?.merchantRevenueRecoveredPkr ?? 0;
  const verifiedKitchens = impact?.verifiedKitchensCount ?? 0;
  const co2Avoided = impact?.co2AvoidedKg ?? 0;

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <section className="rounded-[2rem] bg-[#142E22] text-white p-6 sm:p-10 shadow-xl space-y-6">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#a7f3d0] text-xs font-bold border border-white/15">
            <Leaf className="size-3.5" />
            Live Islamabad Food Rescue Impact
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.08]">
            Turning Closing Surplus Into{' '}
            <span className="font-serif-display italic font-semibold text-[#fed7aa]">
              Real Savings &amp; Zero Waste
            </span>
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/85 leading-relaxed font-medium">
            Every evening across Islamabad, fresh pastries, biryani plates, café sandwiches, and hotel buffet dishes go unsold at closing. BiteHour turns that sunk cost into affordable evening pickups and direct cash for local kitchens.
          </p>
        </div>

        {/* Live MongoDB Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block mb-1">
              Boxes &amp; Meals Rescued
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {loading ? '...' : mealsRescued.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-100/75 block mt-0.5">
              Verified counter handovers
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#fed7aa] block mb-1">
              Saved by Diners
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {loading ? '...' : formatCurrency(dinerSavings)}
            </p>
            <span className="text-[11px] text-emerald-100/75 block mt-0.5">
              vs. regular menu price
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block mb-1">
              Kitchen Cash Recovered
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {loading ? '...' : formatCurrency(kitchenRevenue)}
            </p>
            <span className="text-[11px] text-emerald-100/75 block mt-0.5">
              {verifiedKitchens} verified partner kitchen{verifiedKitchens === 1 ? '' : 's'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a7f3d0] block mb-1">
              CO₂e Avoided
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {loading ? '...' : `${co2Avoided} kg`}
            </p>
            <span className="text-[11px] text-emerald-100/75 block mt-0.5">
              Transparent live database tally
            </span>
          </div>
        </div>
      </section>

      {/* Dual Value Columns: Diners vs Kitchens */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E7E2D8] rounded-[1.75rem] p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="size-11 rounded-2xl bg-[#edf7ed] text-[#1B4332] border border-[#c8e6c9] flex items-center justify-center">
            <Users className="size-5" />
          </div>
          <h2 className="text-xl font-extrabold text-[#171916]">
            Why Islamabad Students &amp; Families Rescue With BiteHour
          </h2>
          <ul className="space-y-2.5 text-xs sm:text-sm text-stone-600 font-medium">
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 text-[#2e7d32] shrink-0 mt-0.5" />
              <span>Save 50%–75% on same-day pastries, spicy dinners, hotel buffets &amp; groceries.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 text-[#2e7d32] shrink-0 mt-0.5" />
              <span>Zero app download required — reserve from any mobile browser in 15 seconds.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 text-[#2e7d32] shrink-0 mt-0.5" />
              <span>Pay Cash on Pickup at the counter (or JazzCash / EasyPaisa) with 15-min hold protection.</span>
            </li>
          </ul>
          <button
            type="button"
            onClick={onExploreDeals}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1B4332] hover:bg-[#133326] text-white text-xs font-extrabold cursor-pointer transition-colors"
          >
            <span>Browse Live Closing Drops</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        <div className="bg-white border border-[#E7E2D8] rounded-[1.75rem] p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="size-11 rounded-2xl bg-[#FFF3E6] text-[#f37021] border border-[#fed7aa] flex items-center justify-center">
            <TrendingUp className="size-5" />
          </div>
          <h2 className="text-xl font-extrabold text-[#171916]">
            Why Partner Bakeries, Restaurants &amp; Hotels Join
          </h2>
          <ul className="space-y-2.5 text-xs sm:text-sm text-stone-600 font-medium">
            <li className="flex items-start gap-2">
              <Sparkles className="size-4 text-[#f37021] shrink-0 mt-0.5" />
              <span><strong>0% Launch Commission:</strong> Keep 100% of your counter recovery cash during the Founding Wave.</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="size-4 text-[#f37021] shrink-0 mt-0.5" />
              <span><strong>Dual Format:</strong> Protect brand pricing with assorted Surprise Boxes OR clear exact biryani/grill plates fast.</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="size-4 text-[#f37021] shrink-0 mt-0.5" />
              <span><strong>ESG &amp; Charity Options:</strong> Donate leftover stock to Edhi / Saylani / JDC with downloadable CSR records.</span>
            </li>
          </ul>
          <button
            type="button"
            onClick={onOpenPartnerPage}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f37021] hover:bg-[#d95e15] text-white text-xs font-extrabold cursor-pointer transition-colors"
          >
            <Store className="size-3.5" />
            <span>List Your Kitchen Free (0% Fee)</span>
          </button>
        </div>
      </section>

      {/* Household Savings & Waste Calculator */}
      <ImpactCalculator />
    </div>
  );
};
