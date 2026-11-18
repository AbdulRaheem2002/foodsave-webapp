import React from 'react';
import { ShoppingBag, Store, LogIn, MapPin, ArrowLeft } from 'lucide-react';
import type { AuthUser, PakistanCity, AppTab } from '../types';
import { BiteHourLogo } from './BrandLogo';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedCity: PakistanCity;
  setSelectedCity: (city: PakistanCity) => void;
  reservationCount: number;
  onOpenReservations: () => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
}

const CITIES: { label: string; value: PakistanCity }[] = [
  { label: 'All Cities', value: 'All Pakistan' },
  { label: 'Islamabad', value: 'Islamabad' },
  { label: 'Rawalpindi', value: 'Rawalpindi' },
  { label: 'Lahore', value: 'Lahore' },
  { label: 'Karachi', value: 'Karachi' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedCity,
  setSelectedCity,
  reservationCount,
  onOpenReservations,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F3]/92 backdrop-blur-lg border-b border-[#E7E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[72px] flex items-center justify-between gap-4">
          
          {/* Brand Logo (Option B: Bitten-Clock Badge + Bold BiteHour) */}
          <button
            type="button"
            onClick={() => setActiveTab('consumer')}
            className="flex items-center text-left group shrink-0 cursor-pointer"
          >
            <BiteHourLogo showTagline />
          </button>

          {/* Center City Selector (Desktop) */}
          <nav
            aria-label="City filter"
            className="hidden lg:flex items-center gap-1 bg-[#F1ECE1] p-1 rounded-full border border-[#E5DFD3]"
          >
            <MapPin className="size-3.5 text-stone-400 ml-3 mr-1 shrink-0" />
            {CITIES.map((c) => {
              const isActive = selectedCity === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedCity(c.value)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#1b4332] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/70'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Single Smart Business Action: For Bakeries (/partner), Store POS (logged-in retailer), or ← Live Deals */}
            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'consumer') {
                  setActiveTab('consumer');
                } else {
                  setActiveTab(currentUser?.role === 'retailer' ? 'retailer' : 'partner');
                }
              }}
              title={
                activeTab !== 'consumer'
                  ? 'Back to Live Deals'
                  : currentUser?.role === 'retailer'
                  ? 'Open Your Store POS Dashboard'
                  : 'For Bakeries, Cafés & Restaurants'
              }
              className={`px-3.5 sm:px-4 py-2 rounded-full text-[13px] font-bold border flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab !== 'consumer'
                  ? 'bg-[#171916] border-[#171916] text-white hover:bg-stone-800 shadow-xs'
                  : currentUser?.role === 'retailer'
                  ? 'bg-[#edf7ed] border-[#1b4332]/25 text-[#1b4332] hover:bg-[#dcf2dc]'
                  : 'bg-white border-[#E5DFD3] text-[#171916] hover:border-[#f37021]/60 hover:bg-[#fff8f1]'
              }`}
            >
              {activeTab !== 'consumer' ? (
                <>
                  <ArrowLeft className="size-3.5" />
                  <span className="hidden sm:inline">Live Deals</span>
                  <span className="sm:hidden">Deals</span>
                </>
              ) : currentUser?.role === 'retailer' ? (
                <>
                  <Store className="size-3.5 text-[#1b4332]" />
                  <span>Store POS</span>
                </>
              ) : (
                <>
                  <Store className="size-3.5 text-[#f37021]" />
                  <span className="hidden sm:inline">For Bakeries</span>
                  <span className="sm:hidden">Bakeries</span>
                </>
              )}
            </button>

            {/* My Bag Button */}
            <button
              type="button"
              onClick={onOpenReservations}
              className="px-4 py-2 rounded-full bg-[#1b4332] hover:bg-[#133326] text-white font-bold text-[13px] shadow-xs flex items-center gap-2 transition-all whitespace-nowrap active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="size-3.5" />
              <span>My Bag</span>
              {reservationCount > 0 && (
                <span className="px-1.5 py-0.5 min-w-[18px] text-center rounded-full bg-[#f37021] text-white text-[10px] font-black leading-none">
                  {reservationCount}
                </span>
              )}
            </button>

            {/* User Account / Sign In */}
            <button
              type="button"
              onClick={onOpenAuth}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-[13px] font-bold border flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                currentUser
                  ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#1b4332] hover:bg-[#dcf2dc]'
                  : 'bg-white border-[#E5DFD3] text-stone-700 hover:bg-stone-50'
              }`}
              title={currentUser ? `Signed in as ${currentUser.name}` : 'Sign In or Create Account'}
            >
              {currentUser ? (
                <>
                  <div className="size-5 rounded-full bg-[#1b4332] text-white flex items-center justify-center text-[10px] font-black">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="truncate max-w-[90px] hidden sm:inline">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="size-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Mobile / Tablet City Selector Row */}
        <div className="flex lg:hidden items-center gap-1.5 pb-2.5 pt-1 overflow-x-auto scrollbar-none">
          <MapPin className="size-3.5 text-stone-400 shrink-0" />
          {CITIES.map((c) => {
            const isActive = selectedCity === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedCity(c.value)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#1b4332] text-white'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
