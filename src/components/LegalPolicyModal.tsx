import React from 'react';
import { X, ShieldCheck, FileText, Lock, Store } from 'lucide-react';
import type { LegalPolicyKey } from '../types';

interface LegalPolicyModalProps {
  activePolicy: LegalPolicyKey | null;
  onSelectPolicy: (policy: LegalPolicyKey) => void;
  onClose: () => void;
}

interface PolicySection {
  heading: string;
  body: string;
}

interface PolicyDocument {
  key: LegalPolicyKey;
  label: string;
  title: string;
  updatedAt: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: PolicySection[];
}

const POLICY_DOCUMENTS: PolicyDocument[] = [
  {
    key: 'terms',
    label: 'Terms of Service',
    title: 'BiteHour Pakistan — Terms of Service',
    updatedAt: 'Effective November 2026 • Islamabad, Pakistan',
    icon: FileText,
    sections: [
      {
        heading: '1. Platform Role & Acceptance',
        body: 'BiteHour Pakistan operates an online closing-hour surplus food marketplace connecting consumers with verified commercial bakeries, restaurants, hotels, cafés, and groceries ("Partner Kitchens"). By reserving or claiming an item, you agree to these Terms. BiteHour is a technology marketplace and does not prepare, cook, store, or inspect individual meals; each Partner Kitchen remains solely responsible for food preparation, hygiene, quality, and statutory compliance.',
      },
      {
        heading: '2. Reservations, 15-Minute Holds & Pickup Windows',
        body: 'Claiming a Surprise Box or Single Closing Deal reserves stock during the active closing pickup window and generates a counter pass (PK-XXXXX). Because closing-hour inventory is perishable, customers must present their pass code within the active hold window or closing slot before expiry.',
      },
      {
        heading: '3. Cancellations, No-Shows & Uncollected Food',
        body: 'If you cannot collect your order, please cancel in advance inside Active Passes / My Bag so the store can release the stock to another diner. Repeated no-shows may restrict future self-pickup holds. Uncollected items remaining past the store closing deadline may be reassigned, resold, or donated to local welfare partners without obligation.',
      },
      {
        heading: '4. Payments & 48-Hour Issue Window',
        body: 'Orders may be settled directly at the store counter via Cash on Pickup, JazzCash, or EasyPaisa as supported by the Partner Kitchen. Please inspect your order at counter handover. If an item is visibly spoiled, unsafe, or mismatched against its listing description, raise a quality dispute within 48 hours of pickup with your pass code and store details.',
      },
      {
        heading: '5. Surprise Box Assortment & Allergens',
        body: 'Surprise Boxes pack same-day unsold food matching the stated value tier and craving profile (Sweet, Spicy & Savory, Coffee & Bake, or Assorted). Exact contents vary daily and cannot be hand-picked. Guests with severe food allergies must review Single Meal Deals or verify ingredients directly with counter staff prior to payment.',
      },
      {
        heading: '6. Prohibited Conduct & Governing Law',
        body: 'Creating fake reservations, harassing store staff, scraping listings, or reselling platform stock is prohibited. To the fullest extent permitted by law, BiteHour is not liable for indirect losses beyond the value of a disputed order. These Terms are governed by the laws of the Islamic Republic of Pakistan, with exclusive jurisdiction in the courts of Islamabad.',
      },
    ],
  },
  {
    key: 'privacy',
    label: 'Privacy Policy',
    title: 'BiteHour Pakistan — Privacy Policy',
    updatedAt: 'Effective November 2026 • Islamabad, Pakistan',
    icon: Lock,
    sections: [
      {
        heading: '1. Data We Collect',
        body: 'We collect only the information needed to operate counter pickup passes and store accounts: your name, email address, Pakistani mobile number (+92 / 03XX), reservation history, saved Islamabad sector/flavor preferences, and optional Web Push device tokens if you opt into drop alerts.',
      },
      {
        heading: '2. How Your Information Is Used',
        body: 'Your account details are used strictly to authenticate logins (email/password or Google Sign-In), generate pickup passes (PK-XXXXX), keep closing deals accurate, prevent fake holds, and deliver closing-hour alerts in the Islamabad sectors you explicitly choose.',
      },
      {
        heading: '3. Exact Sharing With Partner Kitchens',
        body: 'When you reserve a deal at a bakery, hotel, restaurant, or grocery partner, that store receives your name, contact phone, pickup pass code, item quantity, and selected counter payment method solely to verify and hand over your order. BiteHour never sells or rents customer lists to third-party advertisers.',
      },
      {
        heading: '4. Browser Storage, Tokens & Web Push',
        body: 'BiteHour stores your signed authentication JWT and active pass state locally in your browser storage to keep your session fast without extra logins. You can sign out or disable Web Push notifications anytime directly from your browser settings or the Drop Alerts drawer.',
      },
      {
        heading: '5. Retention, Deletion & Under-18 Policy',
        body: 'BiteHour accounts are intended for users aged 18+ (or minors with guardian supervision). You may dismiss completed/expired pass history from your drawer, delete alert subscriptions immediately, or request full account removal through BiteHour support.',
      },
    ],
  },
  {
    key: 'vendor',
    label: 'Partner Agreement',
    title: 'Partner & Vendor Kitchen Agreement',
    updatedAt: '0% Launch Fee Program • BiteHour Islamabad',
    icon: Store,
    sections: [
      {
        heading: '1. Eligibility & Kitchen Verification',
        body: 'Partner Kitchens (bakeries, cafés, spicy kitchens, fast-food restaurants, hotels, and marts) affirm they hold valid commercial operating licenses and comply with Islamabad Food Authority (IFA) / Punjab Food Authority hygiene, storage, and Halal standards.',
      },
      {
        heading: '2. 0% Commission Launch Terms & Direct Settlement',
        body: 'During the BiteHour Islamabad Founding Wave, Partner Kitchens pay 0% platform commission on closing-hour deals. Customers settle Cash on Pickup, JazzCash, or EasyPaisa directly at your store counter — your business keeps 100% of recovered counter revenue with zero payout holding delays.',
      },
      {
        heading: '3. Same-Day Freshness & Honest Value Representation',
        body: 'All food listed (whether packed in Surprise Boxes or posted as Single Closing Deals) must be fresh same-day inventory fit for human consumption — never expired, stale, or unsafe items. Surprise Boxes must contain genuine retail value matching or exceeding the stated "Worth" price.',
      },
      {
        heading: '4. Full Merchant Control & Auto-Expiry Enforcement',
        body: 'Merchants set their own pickup slots, quantities, photos, fixed box prices, or auto time-decay discounts via Store POS. To protect storefront credibility, BiteHour automatically hides expired listings once pickup deadlines pass and cancels stale uncollected holds.',
      },
      {
        heading: '5. Allergen Care, Handover & Removal Rights',
        body: 'Counter staff must verify PK-XXXXX codes on pickup and inform buyers cleanly of major allergens (nuts, dairy, eggs, gluten) upon request. BiteHour reserves the right to pause or revoke any Partner Kitchen receiving verified freshness complaints or repeated unfair cancellations.',
      },
    ],
  },
  {
    key: 'halal',
    label: 'Halal & Allergens',
    title: 'Halal, Freshness & Allergen Standards',
    updatedAt: 'Quality Assurance Charter • BiteHour Pakistan',
    icon: ShieldCheck,
    sections: [
      {
        heading: '1. 100% Halal Partner Kitchens',
        body: 'Every merchant onboarded onto BiteHour Pakistan is vetted as a commercial kitchen or food retailer operating in Pakistan serving Halal-compliant ingredients and menu items.',
      },
      {
        heading: '2. Fresh Same-Day Surplus Only',
        body: 'BiteHour partners list end-of-day display items, high-tea/buffet excess, freshly baked loaves/pastries, or untouched evening kitchen portions prepared the very same day and held safely until your closing pickup slot.',
      },
      {
        heading: '3. Important Allergen Disclaimer (Surprise Boxes)',
        body: 'Assorted closing Surprise Boxes combine multiple bakery, café, or kitchen items left at closing and commonly come into contact with wheat/gluten, dairy, eggs, sesame, peanuts, and tree nuts. If you have life-threatening food allergies, choose labeled Single Meal Deals and confirm ingredients directly with counter staff before paying.',
      },
    ],
  },
];

export const LegalPolicyModal: React.FC<LegalPolicyModalProps> = ({
  activePolicy,
  onSelectPolicy,
  onClose,
}) => {
  if (!activePolicy) return null;

  const currentDoc =
    POLICY_DOCUMENTS.find((doc) => doc.key === activePolicy) || POLICY_DOCUMENTS[0];
  const HeaderIcon = currentDoc.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#FAF8F3] border border-[#E5DFD3] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header + Tabs */}
        <div className="bg-white border-b border-[#E5DFD3] px-5 sm:px-6 pt-5 pb-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal policy"
            className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-2.5 pr-10 mb-3">
            <div className="size-9 rounded-xl bg-[#edf7ed] text-[#1B4332] border border-[#c8e6c9] flex items-center justify-center shrink-0">
              <HeaderIcon className="size-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#171916] leading-tight">
                {currentDoc.title}
              </h3>
              <p className="text-[11px] font-semibold text-stone-500">{currentDoc.updatedAt}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {POLICY_DOCUMENTS.map((doc) => {
              const isSelected = doc.key === currentDoc.key;
              return (
                <button
                  key={doc.key}
                  type="button"
                  onClick={() => onSelectPolicy(doc.key)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-[#F1ECE1] text-stone-700 hover:bg-[#e7e0d0]'
                  }`}
                >
                  {doc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Clauses */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {currentDoc.sections.map((section) => (
            <div
              key={section.heading}
              className="p-4 rounded-2xl bg-white border border-[#E7E2D8] space-y-1.5"
            >
              <h4 className="text-xs sm:text-sm font-extrabold text-[#1B4332]">{section.heading}</h4>
              <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-medium">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Close */}
        <div className="bg-white border-t border-[#E5DFD3] px-5 sm:px-6 py-3.5 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#133326] text-white text-xs font-black cursor-pointer"
          >
            Close Policy
          </button>
        </div>
      </div>
    </div>
  );
};
