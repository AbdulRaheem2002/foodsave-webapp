import React from 'react';
import { ShoppingBag, Store, Leaf, LogIn, MapPin, ArrowLeft } from 'lucide-react';
import type { AuthUser, PakistanCity, AppTab } from '../types';

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
  { label: 'Karachi', value: 'Karachi' },
  { label: 'Lahore', value: 'Lahore' },
  { label: 'Islamabad', value: 'Islamabad' },
  { label: 'Rawalpindi', value: 'Rawalpindi' },
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => setActiveTab('consumer')}
            className="flex items-center gap-2.5 text-left group shrink-0"
          >
            <div className="size-9 rounded-xl bg-[#1b4332] text-white flex items-center justify-center shadow-sm group-hover:bg-[#143527] transition-colors">
              <Leaf className="size-4 text-[#85e3a8]" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-stone-900">
                  Foodsave
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#edf7ed] text-[#1b4332] border border-[#c8e6c9] rounded">
                  PK
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium hidden sm:block whitespace-nowrap">
                Surplus Food Marketplace
              </p>
            </div>
          </button>

          {/* Center City Selector (Desktop) */}
          <nav
            aria-label="City filter"
            className="hidden lg:flex items-center gap-0.5 bg-stone-100 p-1 rounded-full border border-stone-200/80"
          >
            <MapPin className="size-3.5 text-stone-400 ml-2.5 mr-1 shrink-0" />
            {CITIES.map((c) => {
              const isActive = selectedCity === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedCity(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1b4332] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Merchant / Consumer Switch */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'retailer' ? 'consumer' : 'retailer')}
              title={activeTab === 'retailer' ? 'Back to Consumer Marketplace' : 'Partner Store Portal'}
              className={`px-3 sm:px-3.5 py-2 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'retailer'
                  ? 'bg-[#fff3e0] border-[#ffcc80] text-[#e65100] hover:bg-[#ffe0b2]'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              {activeTab === 'retailer' ? (
                <>
                  <ArrowLeft className="size-3.5" />
                  <span className="hidden sm:inline">Marketplace</span>
                </>
              ) : (
                <>
                  <Store className="size-3.5 text-stone-500" />
                  <span className="hidden sm:inline">Merchant Portal</span>
                </>
              )}
            </button>

            {/* My Bag Button */}
            <button
              type="button"
              onClick={onOpenReservations}
              className="px-3.5 py-2 rounded-full bg-[#1b4332] hover:bg-[#133326] text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all whitespace-nowrap active:scale-95"
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
              className={`px-3 sm:px-3.5 py-2 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all whitespace-nowrap ${
                currentUser
                  ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#1b4332] hover:bg-[#dcf2dc]'
                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
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
