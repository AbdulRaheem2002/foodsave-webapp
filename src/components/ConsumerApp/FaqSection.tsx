import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Do I have to download an app to reserve on BiteHour?',
    a: 'No! Unlike app-only platforms, you can browse live Islamabad, Rawalpindi, Lahore, and Karachi deals and lock a pickup pass directly in your phone browser in 15 seconds. You can also save BiteHour to your home screen in 2 taps.',
  },
  {
    q: 'Can businesses sell both Surprise Boxes AND single spicy or exact meals?',
    a: 'Yes! Bakeries, cafés, and hotels can drop assorted closing Surprise Boxes (e.g. Worth ₨ 1,200+ for ₨ 450), while spicy biryani spots, fast-food kitchens, and grocery marts can also post exact single closing deals with fixed prices or auto time-decay discounts.',
  },
  {
    q: 'How do payments work — do I have to pay online first?',
    a: 'You can pay via Cash on Pickup right at the store counter when inspecting your pickup pass, or choose JazzCash / EasyPaisa where supported by the partner.',
  },
  {
    q: 'Are partner bakeries, hotels & spicy kitchens verified?',
    a: 'Yes. Every BiteHour store application is manually reviewed by our team before Store POS access is unlocked. Verified partners commit to licensed Halal operation, ICT / Punjab Food Authority hygiene compliance, and same-day food preparation.',
  },
  {
    q: 'What about allergies or dietary restrictions in Surprise Boxes?',
    a: 'Surprise Boxes combine fresh unsold items from the counter and commonly contain wheat/gluten, dairy, eggs, sesame, or nuts. If you have food allergies, choose labeled Single Meal Deals or verify ingredients with counter staff before paying.',
  },
  {
    q: 'What if plans change, I miss pickup, or there is a food quality issue?',
    a: 'Each reservation locks your hold for 15 minutes or the closing pickup slot. Cancel ahead in My Bag if you cannot make it so the kitchen can release the food. For any quality mismatch at handover, inspect at the counter and contact support within 48 hours with your PK-XXXXX code.',
  },
  {
    q: 'I run a restaurant, hotel, bakery, or mart — how fast can I start?',
    a: 'Apply in 30 seconds on our Partner Page. Once approved under our 0% Launch Partner Agreement, you get instant Store POS access to upload your own dish photos, post Surprise Boxes or single deals, and verify PK-XXXXX codes from any phone.',
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
