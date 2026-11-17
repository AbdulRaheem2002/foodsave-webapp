import React from 'react';
import { MapPin, SlidersHorizontal, QrCode, ShoppingBag, Store, ArrowRight } from 'lucide-react';

interface HowItWorksSectionProps {
  onOpenPartnerPage: () => void;
}

const STEPS = [
  {
    num: '01',
    icon: MapPin,
    title: 'Pick Your Sector & Craving',
    desc: 'Filter live closing-hour drops in F-6, F-7, Blue Area, NUST H-12, Lahore, or Karachi — and choose Sweet, Savory, Coffee, or Mixed.',
  },
  {
    num: '02',
    icon: SlidersHorizontal,
    title: 'Reserve in 15 Seconds',
    desc: 'Zero app download needed. Lock your item or surprise box online with clear Original vs. Closing-Hour price before stock runs out.',
  },
  {
    num: '03',
    icon: QrCode,
    title: 'Show Pickup Code at Counter',
    desc: 'Walk in during the store pickup window and show your PK-XXXXX counter pass. Cashiers verify it in 5 seconds.',
  },
  {
    num: '04',
    icon: ShoppingBag,
    title: 'Pay Cash or Digital Wallet',
    desc: 'Pay Cash on Pickup directly at the counter (or JazzCash / EasyPaisa) and enjoy same-day artisan pastries, cafés & meals for less.',
  },
];

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onOpenPartnerPage }) => {
  return (
    <section id="how-it-works" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#f37021]">
            Simple 4-Step Flow
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
            Find it. Lock it. Collect fresh before closing.
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenPartnerPage}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#fff8f1] hover:bg-[#ffedd5] text-[#e65100] border border-[#fed7aa] text-xs font-bold self-start sm:self-auto transition-colors"
        >
          <Store className="size-3.5" />
          <span>Own a Bakery or Café? Sell With Us</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="bg-white border border-[#e5e0d8] rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-2xs hover:border-[#1b4332]/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-2xl bg-[#edf7ed] text-[#1b4332] border border-[#c8e6c9] flex items-center justify-center">
                  <Icon className="size-5" />
                </div>
                <span className="font-mono text-xs font-black text-stone-300">{step.num}</span>
              </div>

              <div>
                <h3 className="text-sm font-black text-stone-900 mb-1">{step.title}</h3>
                <p className="text-xs text-stone-600 leading-relaxed font-medium">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
