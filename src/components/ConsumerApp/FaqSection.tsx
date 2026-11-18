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
    a: 'Apply in 30 seconds on our For Bakeries page. Once our team approves your store via email or WhatsApp (with zero launch commission), you receive Store POS access to list closing boxes and verify PK-XXXXX codes from any phone.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      id="faq-section"
      className="bg-white border border-[#E7E2D8] rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_30px_-14px_rgba(23,25,22,0.06)] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
    >
      <div className="lg:col-span-4 space-y-3">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#2e7d32]">
          Clear Answers
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#171916] tracking-tight leading-tight">
          Questions, answered{' '}
          <span className="font-serif-display italic font-semibold text-[#1B4332]">honestly</span>.
        </h2>
        <p className="text-[13px] sm:text-sm text-stone-500 leading-relaxed font-medium">
          Everything you should know about counter holds, freshness guarantees, and paying directly in Pakistan.
        </p>
      </div>

      <div className="lg:col-span-8 divide-y divide-stone-200/80">
        {FAQS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={item.q} className="py-4 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
              >
                <span className="text-sm sm:text-base font-bold text-[#171916]">{item.q}</span>
                <ChevronDown
                  className={`size-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#1b4332]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <p className="mt-2.5 text-[13px] sm:text-sm text-stone-600 leading-relaxed font-medium pr-6">
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
