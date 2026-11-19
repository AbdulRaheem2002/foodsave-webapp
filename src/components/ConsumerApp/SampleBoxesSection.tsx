import React from 'react';
import { Store, ArrowRight, Clock } from 'lucide-react';

interface SampleBoxesSectionProps {
  onOpenPartnerPage?: () => void;
}

const SAMPLE_BOXES = [
  {
    title: 'Sweet Bakery Surprise Box',
    subtitle: 'Fresh assortment packed at closing — e.g. croissants, brownies & glazed rolls',
    window: '9:30 PM – 11:00 PM',
    image: '/images/box-sweet.jpg',
    tag: '🥐 Sweet',
    worth: '₨ 1,200',
    boxPrice: '₨ 450',
    valuePill: 'Worth ₨ 1,200',
  },
  {
    title: 'Savory Café Surprise Box',
    subtitle: 'Chef selection packed in 30s — e.g. paninis, savory puffs & flatbreads',
    window: '9:00 PM – 10:30 PM',
    image: '/images/box-savory.jpg',
    tag: '🍗 Savory',
    worth: '₨ 1,400',
    boxPrice: '₨ 500',
    valuePill: 'Worth ₨ 1,400',
  },
  {
    title: 'Coffee & Bake Surprise Box',
    subtitle: 'Closing brew paired with freshly left-over almond bake or muffin',
    window: '8:30 PM – 10:30 PM',
    image: '/images/box-coffee.jpg',
    tag: '☕ Drinks',
    worth: '₨ 1,000',
    boxPrice: '₨ 400',
    valuePill: 'Worth ₨ 1,000',
  },
];

/**
 * High-appetite visual preview rendered before the first partner drops live evening stock,
 * helping shoppers & Islamabad bakery owners picture exact BiteHour boxes transparently.
 */
export const SampleBoxesSection: React.FC<SampleBoxesSectionProps> = ({ onOpenPartnerPage }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SAMPLE_BOXES.map((box) => (
          <div
            key={box.title}
            className="bg-white border border-[#E7E2D8] rounded-[1.75rem] p-4 shadow-[0_10px_30px_-14px_rgba(23,25,22,0.08)] flex flex-col justify-between group hover:border-[#1B4332]/30 transition-all duration-300"
          >
            <div>
              <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-stone-100">
                <img
                  src={box.image}
                  alt={box.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-3 py-1 rounded-full bg-[#1B4332]/90 backdrop-blur-md text-white font-bold text-xs shadow-sm">
                    Example Box Guide
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/95 text-stone-800 font-bold text-xs shadow-sm">
                    {box.tag}
                  </span>
                </div>

                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-[#1B4332] text-white font-extrabold text-xs shadow-sm">
                  {box.valuePill}
                </span>
              </div>

              <div className="pt-4 px-1 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                  <Clock className="size-3.5 text-[#f37021]" />
                  <span>Typical pickup: {box.window}</span>
                </div>

                <h3 className="text-lg font-extrabold text-[#171916] tracking-tight">
                  {box.title}
                </h3>

                <p className="text-[13px] text-stone-600 leading-relaxed font-medium">
                  {box.subtitle}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3.5 px-1 border-t border-stone-100 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-bold text-stone-400">
                  Worth <span className="line-through">{box.worth}</span> for
                </span>
                <span className="text-xl font-extrabold text-[#1B4332]">
                  {box.boxPrice}
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#2e7d32] bg-[#edf7ed] px-2.5 py-1 rounded-full border border-[#c8e6c9]">
                Surprise Box
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Onboarding CTA Banner */}
      <div className="rounded-[2rem] bg-[#142E22] text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#a7f3d0]">
            Islamabad First Wave • Now Onboarding
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
            Opening Across{' '}
            <span className="font-serif-display italic font-semibold text-[#fed7aa]">
              F-6, F-7, Blue Area &amp; NUST H-12
            </span>
          </h3>
          <p className="text-sm text-emerald-100/85 leading-relaxed font-medium">
            Own a bakery or café in Islamabad? Never mark down single menu items — let staff pack closing Surprise Boxes (Worth ₨ 1,200 for ₨ 450) in 30 seconds and collect cash the very same night.
          </p>
        </div>

        {onOpenPartnerPage && (
          <button
            type="button"
            onClick={onOpenPartnerPage}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#f37021] hover:bg-[#e26115] text-white text-sm font-extrabold shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Store className="size-4" />
            <span>List Your Bakery Free</span>
            <ArrowRight className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
};
