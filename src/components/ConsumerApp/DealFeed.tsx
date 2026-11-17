import React, { useState, useMemo } from 'react';
import type { DealItem, CategoryType, FlavorType, PakistanCity } from '../../types';
import { DealCard } from './DealCard';
import { Search, Store } from 'lucide-react';

interface DealFeedProps {
  deals: DealItem[];
  selectedCity?: PakistanCity;
  onReserveDeal: (deal: DealItem) => void;
  onSelectDeal: (deal: DealItem) => void;
  onOpenPartnerPage?: () => void;
}

const CATEGORIES: { key: CategoryType; label: string; icon: string }[] = [
  { key: 'All', label: 'All Deals', icon: '' },
  { key: 'mystery-bag', label: 'Surprise Bags', icon: '🎁' },
  { key: 'bakery', label: 'Bakery & Café', icon: '🥐' },
  { key: 'restaurant', label: 'Hot Meals', icon: '🍗' },
  { key: 'grocery', label: 'Grocery', icon: '🥑' },
];

const FLAVORS: { key: FlavorType; label: string }[] = [
  { key: 'All', label: 'All Flavors' },
  { key: 'sweet', label: '🥐 Sweet' },
  { key: 'savory', label: '🍗 Savory' },
  { key: 'drinks', label: '☕ Drinks' },
  { key: 'mixed', label: '🍱 Mixed' },
];

const ISLAMABAD_SECTORS = ['All Areas', 'F-6', 'F-7', 'F-10', 'Blue Area', 'NUST / H-12', 'I-8 / DHA'];

export const DealFeed: React.FC<DealFeedProps> = ({
  deals,
  selectedCity = 'All Pakistan',
  onReserveDeal,
  onSelectDeal,
  onOpenPartnerPage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorType>('All');
  const [selectedSector, setSelectedSector] = useState<string>('All Areas');
  const [minDiscount, setMinDiscount] = useState<number>(30);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        deal.title.toLowerCase().includes(q) ||
        deal.storeName.toLowerCase().includes(q) ||
        deal.location.city.toLowerCase().includes(q) ||
        (deal.location.sector || '').toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'mystery-bag'
          ? !!deal.isMysteryBag
          : deal.category === selectedCategory;

      const matchesFlavor =
        selectedFlavor === 'All' ? true : (deal.flavorProfile || 'mixed') === selectedFlavor;

      const matchesSector =
        selectedSector === 'All Areas'
          ? true
          : `${deal.location.sector || ''} ${deal.location.address}`.toLowerCase().includes(
              selectedSector.toLowerCase().replace(' / ', ' ').split(' ')[0]
            );

      const matchesDiscount = deal.discountPercent >= minDiscount;

      return matchesSearch && matchesCategory && matchesFlavor && matchesSector && matchesDiscount;
    });
  }, [deals, searchTerm, selectedCategory, selectedFlavor, selectedSector, minDiscount]);

  const showSectorChips = selectedCity === 'Islamabad' || selectedCity === 'All Pakistan';

  return (
    <div className="flex flex-col gap-5" id="deals-feed-section">
      {/* Main Search & Category Bar (shown when live deals exist) */}
      {deals.length > 0 && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#e5e0d8] shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search croissants, coffee box, F-7 bakery, savory..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f7f5f0] border border-[#e8e3d8] text-stone-900 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-[#1b4332] transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#f7f5f0] border border-[#e8e3d8] text-xs">
              <span className="text-stone-600 font-semibold whitespace-nowrap text-[11px]">Min Discount</span>
              <input
                type="range"
                min="30"
                max="80"
                step="5"
                value={minDiscount}
                onChange={(e) => setMinDiscount(Number(e.target.value))}
                className="w-20 accent-[#1b4332] cursor-pointer"
              />
              <span className="font-extrabold text-[#1b4332] font-mono text-[11px] w-9">{minDiscount}%+</span>
            </div>

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
                        : 'bg-[#f7f5f0] text-stone-600 hover:text-stone-900 border border-[#e8e3d8]'
                    }`}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flavor Preference + Islamabad Sector Bar */}
          <div className="pt-2.5 border-t border-stone-100 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 shrink-0">
                Flavor:
              </span>
              {FLAVORS.map((flav) => {
                const isActive = selectedFlavor === flav.key;
                return (
                  <button
                    key={flav.key}
                    type="button"
                    onClick={() => setSelectedFlavor(flav.key)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#f37021] text-white shadow-2xs'
                        : 'bg-[#fcfbf9] text-stone-600 border border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {flav.label}
                  </button>
                );
              })}
            </div>

            {showSectorChips && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 shrink-0">
                  Islamabad:
                </span>
                {ISLAMABAD_SECTORS.map((sec) => {
                  const isActive = selectedSector === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSector(sec)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#1b4332] text-white'
                          : 'bg-[#fcfbf9] text-stone-600 border border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {sec}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
            Today's Closing-Hour Drops
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Sweet &amp; savory preference tags included. Every bag includes a 15-minute hold.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] self-start sm:self-auto shadow-2xs">
          {deals.length === 0
            ? 'Onboarding Partners'
            : `${filteredDeals.length} Active Deal${filteredDeals.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* Grid of Deals or Crisp Empty State */}
      {filteredDeals.length === 0 ? (
        <div className="p-10 sm:p-12 rounded-3xl text-center bg-white border border-[#e5e0d8] space-y-3">
          <div className="size-14 rounded-full bg-[#f7f5f0] flex items-center justify-center mx-auto text-2xl">
            🥐
          </div>
          {deals.length === 0 ? (
            <>
              <h3 className="text-base font-black text-stone-900">
                Opening Soon in Your Neighborhood
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                We are currently onboarding cafés, bakeries, and restaurants across Islamabad (F-6, F-7, Blue Area, H-12) and Lahore. Own a food business? List your evening drops in under 2 minutes with 0% launch fee.
              </p>
              {onOpenPartnerPage && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenPartnerPage}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white text-xs font-black shadow-sm"
                  >
                    <Store className="size-4 text-[#f37021]" />
                    <span>Partner Your Bakery or Café With BiteHour →</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-stone-900">No Deals Matching Selected Filter</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try clearing your flavor or sector filter or adjusting the minimum discount slider.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedFlavor('All');
                  setSelectedSector('All Areas');
                  setMinDiscount(30);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#1b4332] text-white text-xs font-bold shadow-sm"
              >
                Reset All Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onReserve={onReserveDeal} onSelect={onSelectDeal} />
          ))}
        </div>
      )}
    </div>
  );
};
