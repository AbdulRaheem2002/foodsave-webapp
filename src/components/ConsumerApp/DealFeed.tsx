import React, { useState, useMemo } from 'react';
import type { DealItem, CategoryType, FlavorType, PakistanCity } from '../../types';
import { DropAlertSignupCard } from './DropAlertSignupCard';
import { DealCard } from './DealCard';
import { SampleBoxesSection } from './SampleBoxesSection';
import { Search } from 'lucide-react';
import { isDealExpired } from '../../lib/utils';

interface DealFeedProps {
  deals: DealItem[];
  selectedCity?: PakistanCity;
  selectedSector?: string;
  onSelectSector?: (sector: string) => void;
  onReserveDeal: (deal: DealItem) => void;
  onSelectDeal: (deal: DealItem) => void;
  onOpenPartnerPage?: () => void;
  onDealExpired?: (dealId: string) => void;
}

const CATEGORIES: { key: CategoryType; label: string; icon: string }[] = [
  { key: 'All', label: 'All Boxes', icon: '' },
  { key: 'bakery', label: 'Bakery Boxes', icon: '🥐' },
  { key: 'restaurant', label: 'Café & Meals', icon: '🍗' },
  { key: 'grocery', label: 'Grocery Boxes', icon: '🥑' },
];

const FLAVORS: { key: FlavorType; label: string }[] = [
  { key: 'All', label: 'All Flavors' },
  { key: 'sweet', label: '🥐 Sweet' },
  { key: 'savory', label: '🍗 Savory' },
  { key: 'drinks', label: '☕ Drinks' },
  { key: 'mixed', label: '🍱 Mixed' },
];

const ISLAMABAD_SECTORS = ['All Areas', 'F-6', 'F-7', 'E-11', 'F-10', 'Blue Area', 'NUST / H-12', 'I-8 / DHA'];

export const DealFeed: React.FC<DealFeedProps> = ({
  deals,
  selectedCity = 'All Pakistan',
  selectedSector: controlledSector,
  onSelectSector,
  onReserveDeal,
  onSelectDeal,
  onOpenPartnerPage,
  onDealExpired,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorType>('All');
  const [internalSector, setInternalSector] = useState<string>('All Areas');
  const [maxBoxPrice, setMaxBoxPrice] = useState<number>(0);

  const selectedSector = controlledSector ?? internalSector;
  const setSelectedSector = (sector: string) => {
    if (onSelectSector) onSelectSector(sector);
    setInternalSector(sector);
  };

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (isDealExpired(deal)) return false;
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

      const matchesBudget = maxBoxPrice === 0 || deal.currentPricePkr <= maxBoxPrice;

      return matchesSearch && matchesCategory && matchesFlavor && matchesSector && matchesBudget;
    });
  }, [deals, searchTerm, selectedCategory, selectedFlavor, selectedSector, maxBoxPrice]);

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

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f7f5f0] border border-[#e8e3d8] text-xs">
              <span className="text-stone-600 font-semibold whitespace-nowrap text-[11px]">Box Budget</span>
              <select
                value={maxBoxPrice}
                onChange={(e) => setMaxBoxPrice(Number(e.target.value))}
                className="bg-transparent font-extrabold text-[#1b4332] text-xs focus:outline-none cursor-pointer"
              >
                <option value={0}>Any Price</option>
                <option value={500}>Under ₨ 500</option>
                <option value={750}>Under ₨ 750</option>
                <option value={1000}>Under ₨ 1,000</option>
              </select>
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#2e7d32] block mb-1">
            {deals.length === 0 ? 'Preview Tonight’s Format' : 'Live Closing Surprise Boxes'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#171916] tracking-tight">
            {deals.length === 0 ? (
              <>
                What Goes Into a{' '}
                <span className="font-serif-display italic font-semibold text-[#1B4332]">
                  BiteHour Surprise Box
                </span>
              </>
            ) : (
              "Today's Closing Surprise Boxes"
            )}
          </h2>
          <p className="text-sm text-stone-600 mt-1 font-medium">
            {deals.length === 0
              ? 'Guaranteed box value (e.g. Worth ₨ 1,200 for ₨ 450) with Sweet vs. Savory clarity — staff pack fresh leftovers at closing.'
              : 'No cherry-picking individual dishes — reserve your Surprise Box by flavor & value and collect fresh before closing.'}
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] self-start sm:self-auto shadow-2xs">
          {deals.length === 0
            ? 'Example Surprise Boxes'
            : `${filteredDeals.length} Live Surprise Box${filteredDeals.length === 1 ? '' : 'es'}`}
        </span>
      </div>

      {/* Grid of Deals or Appetizing Pre-Launch Sample Boxes */}
      {deals.length === 0 ? (
        <SampleBoxesSection onOpenPartnerPage={onOpenPartnerPage} />
      ) : filteredDeals.length === 0 ? (
        <div className="p-10 sm:p-12 rounded-[2rem] text-center bg-white border border-[#E7E2D8] space-y-3">
          <div className="size-14 rounded-full bg-[#F6F2EA] flex items-center justify-center mx-auto text-2xl">
            🥐
          </div>
          <h3 className="text-lg font-extrabold text-[#171916]">No Deals Matching Selected Filter</h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            Try clearing your flavor or sector filter or adjusting the minimum discount slider.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedFlavor('All');
              setSelectedSector('All Areas');
              setMaxBoxPrice(0);
            }}
            className="px-6 py-2.5 rounded-full bg-[#1b4332] text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onReserve={onReserveDeal}
              onSelect={onSelectDeal}
              onExpired={onDealExpired}
            />
          ))}
        </div>
      )}

      {/* Evening Drop Alert Waitlist Signup */}
      <DropAlertSignupCard defaultSector={selectedSector} />
    </div>
  );
};
