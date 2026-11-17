import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Do I have to download an app to reserve on BiteHour?',
    a: 'No! Unlike app-only platforms, you can browse live Islamabad, Rawalpindi, Lahore, and Karachi deals and lock a pickup pass directly in your phone browser in 15 seconds. You can also save BiteHour to your home screen in 2 taps.',
  },
  {
    q: 'Can I filter Sweet vs. Savory items before claiming?',
    a: 'Yes. Stores tag listings as Sweet, Savory, Coffee & Drinks, or Mixed — and can list exact closing-hour boxes as well as Surprise Bags — so you know what flavor profile to expect.',
  },
  {
    q: 'How do payments work — do I have to pay online first?',
    a: 'You can pay via Cash on Pickup right at the store counter when inspecting your pickup pass, or choose JazzCash / EasyPaisa where supported by the partner.',
  },
  {
    q: 'Is the food fresh and same-day?',
    a: 'Yes. Every BiteHour drop comes from licensed partner cafés, bakeries, restaurants, and groceries selling fresh same-day inventory before closing time.',
  },
  {
    q: 'How long is my pickup code held, and what if I miss the window?',
    a: 'Each reservation locks your bag immediately for your 15-minute hold / store closing window. If you cannot make it, cancel ahead of time in My Bag so the store can release the stock to another customer.',
  },
  {
    q: 'I run a bakery, café, or restaurant — how fast can I start?',
    a: 'Partner registration takes under 2 minutes with zero commission during our launch phase. Your staff can publish closing items and verify customer PK-XXXXX codes right from any phone browser.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq-section" className="bg-white border border-[#e5e0d8] rounded-3xl p-5 sm:p-8 space-y-5 shadow-2xs">
      <div>
        <span className="text-[11px] font-black uppercase tracking-wider text-[#2e7d32]">
          Clear Answers
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="divide-y divide-stone-200/80">
        {FAQS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={item.q} className="py-3.5 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-4 text-left"
              >
                <span className="text-sm font-bold text-stone-900">{item.q}</span>
                <ChevronDown
                  className={`size-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#1b4332]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <p className="mt-2 text-xs sm:text-[13px] text-stone-600 leading-relaxed font-medium pr-6">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
