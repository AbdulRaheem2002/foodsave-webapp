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
    <section id="how-it-works" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#f37021]">
            Simple 4-Step Flow
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#171916] tracking-tight mt-1.5">
            Find it. Lock it.{' '}
            <span className="font-serif-display italic font-semibold text-[#1B4332]">
              Collect fresh
            </span>{' '}
            before closing.
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenPartnerPage}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#fff8f1] text-[#171916] border border-[#E5DFD3] hover:border-[#f37021]/50 text-xs sm:text-[13px] font-bold self-start sm:self-auto transition-all shadow-2xs cursor-pointer"
        >
          <Store className="size-4 text-[#f37021]" />
          <span>Own a Bakery or Café? Sell With Us</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="bg-white border border-[#E7E2D8] rounded-[1.75rem] p-6 flex flex-col justify-between gap-6 shadow-[0_8px_24px_-12px_rgba(23,25,22,0.06)] hover:border-[#1B4332]/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-2xl bg-[#edf7ed] text-[#1b4332] border border-[#c8e6c9] flex items-center justify-center">
                  <Icon className="size-5" />
                </div>
                <span className="font-mono text-sm font-bold text-[#1B4332]/25">{step.num}</span>
              </div>

              <div>
                <h3 className="text-base sm:text-[17px] font-extrabold text-[#171916] mb-1.5 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-[13px] text-stone-600 leading-relaxed font-medium">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
