import React, { useState, useMemo } from 'react';
import type { DealItem, CategoryType } from '../../types';
import { DealCard } from './DealCard';
import { Search } from 'lucide-react';

interface DealFeedProps {
  deals: DealItem[];
  onReserveDeal: (deal: DealItem) => void;
  onSelectDeal: (deal: DealItem) => void;
}

const CATEGORIES: { key: CategoryType; label: string; icon: string }[] = [
  { key: 'All', label: 'All Deals', icon: '' },
  { key: 'mystery-bag', label: 'Surprise Bags', icon: '🔥' },
  { key: 'grocery', label: 'Fresh Produce', icon: '🥭' },
  { key: 'bakery', label: 'Bakery', icon: '🥐' },
  { key: 'restaurant', label: 'Hot Meals', icon: '🍗' },
];

export const DealFeed: React.FC<DealFeedProps> = ({
  deals,
  onReserveDeal,
  onSelectDeal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [minDiscount, setMinDiscount] = useState<number>(50);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch =
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.location.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'mystery-bag'
          ? !!deal.isMysteryBag
          : deal.category === selectedCategory;

      const matchesDiscount = deal.discountPercent >= minDiscount;

      return matchesSearch && matchesCategory && matchesDiscount;
    });
  }, [deals, searchTerm, selectedCategory, minDiscount]);

  return (
    <div className="flex flex-col gap-6" id="deals-feed-section">
      
      {/* Search & Filter Header Bar matching Reference Mockup */}
      <div className="bg-white dark:bg-[#182230] p-3 sm:p-4 rounded-2xl border border-[#e5e0d8] dark:border-white/10 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sourdough, biryani, mango crate, naan..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f7f5f0] dark:bg-[#1F2937] border border-[#e8e3d8] dark:border-white/10 text-stone-900 dark:text-[#F9F6F0] placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-[#1b4332] transition-all"
          />
        </div>

        {/* Min Discount Slider */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#f7f5f0] dark:bg-[#1F2937] border border-[#e8e3d8] dark:border-white/10 text-xs">
          <span className="text-stone-600 dark:text-stone-300 font-semibold whitespace-nowrap text-[11px]">
            Min Discount
          </span>
          <input
            type="range"
            min="30"
            max="80"
            step="5"
            value={minDiscount}
            onChange={(e) => setMinDiscount(Number(e.target.value))}
            className="w-20 accent-[#1b4332] cursor-pointer"
          />
          <span className="font-extrabold text-[#1b4332] dark:text-[#4CAF50] font-mono text-[11px] w-9">
            {minDiscount}%+
          </span>
        </div>

        {/* Category Pills matching Mockup */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'bg-[#f7f5f0] dark:bg-[#1F2937] text-stone-600 dark:text-stone-300 hover:text-stone-900 border border-[#e8e3d8] dark:border-white/10'
                }`}
              >
                {cat.icon && <span>{cat.icon}</span>}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-[#F9F6F0] tracking-tight">
            Today's Available Surplus Deals
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Automated time-decay pricing applied. Bag reservation hold for 15 minutes upon selection.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30 self-start sm:self-auto shadow-2xs">
          {filteredDeals.length} Active Deals Near You
        </span>
      </div>

      {/* Grid of Deals */}
      {filteredDeals.length === 0 ? (
        <div className="p-12 rounded-3xl text-center bg-white border border-[#e5e0d8]">
          <div className="size-16 rounded-full bg-[#f7f5f0] flex items-center justify-center mx-auto mb-3 text-3xl">
            🧺
          </div>
          {deals.length === 0 ? (
            <>
              <h3 className="text-base font-bold text-stone-900 mb-1">
                No Surplus Deals Listed Yet
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                No verified stores have published active surplus bags in this area yet. Check back before evening closing hours or register a store to list your first surplus deal.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-stone-900 mb-1">
                No Deals Matching Selected Filter
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                Try adjusting your search query or lowering the minimum discount threshold.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setMinDiscount(30);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-bold shadow-sm"
              >
                Reset Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onReserve={onReserveDeal}
              onSelect={onSelectDeal}
            />
          ))}
        </div>
      )}

    </div>
  );
};
