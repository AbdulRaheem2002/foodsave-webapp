import React from 'react';
import { ShoppingBag, Store, LogIn, MapPin, ArrowLeft, ShieldCheck, Leaf } from 'lucide-react';
import type { AuthUser, AppTab } from '../types';
import { BiteHourLogo } from './BrandLogo';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  reservationCount: number;
  onOpenReservations: () => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
}

const ISLAMABAD_NAV_SECTORS: { label: string; value: string }[] = [
  { label: 'All Islamabad', value: 'All Areas' },
  { label: 'F-6', value: 'F-6' },
  { label: 'F-7', value: 'F-7' },
  { label: 'E-11', value: 'E-11' },
  { label: 'F-10', value: 'F-10' },
  { label: 'Blue Area', value: 'Blue Area' },
  { label: 'H-12', value: 'NUST / H-12' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedSector,
  setSelectedSector,
  reservationCount,
  onOpenReservations,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F3]/92 backdrop-blur-lg border-b border-[#E7E2D8]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-[72px] flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => setActiveTab('consumer')}
            className="flex items-center text-left group shrink-0 cursor-pointer"
          >
            <BiteHourLogo showTagline />
          </button>

          {/* Center Islamabad-Only Launch Sector Filter (Desktop) */}
          <nav
            aria-label="Islamabad sectors"
            className="hidden lg:flex items-center gap-1 bg-[#F1ECE1] p-1 rounded-full border border-[#E5DFD3]"
          >
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 text-[11px] font-extrabold text-[#1B4332] whitespace-nowrap">
              <MapPin className="size-3.5 text-[#f37021] shrink-0" />
              <span>Islamabad:</span>
            </span>
            {ISLAMABAD_NAV_SECTORS.map((sec) => {
              const isActive = selectedSector === sec.value;
              return (
                <button
                  key={sec.value}
                  type="button"
                  onClick={() => {
                    setSelectedSector(sec.value);
                    if (activeTab !== 'consumer') setActiveTab('consumer');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#1b4332] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/70'
                  }`}
                >
                  {sec.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'admin' ? 'consumer' : 'admin')}
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold border flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#f37021] border-[#f37021] text-white'
                    : 'bg-[#171916] border-[#171916] text-white hover:bg-stone-800'
                }`}
              >
                <ShieldCheck className="size-3.5" />
                <span className="hidden xs:inline sm:inline">Admin</span>
              </button>
            )}

            {/* Dedicated Impact Page Pill */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'impact' ? 'consumer' : 'impact')}
              title="BiteHour Food Rescue Impact & Savings Calculator"
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold border flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'impact'
                  ? 'bg-[#1B4332] border-[#1B4332] text-white shadow-xs'
                  : 'bg-white border-[#E5DFD3] text-[#1B4332] hover:border-[#1B4332]/40 hover:bg-[#edf7ed]'
              }`}
            >
              <Leaf className="size-3.5" />
              <span className="hidden sm:inline">Impact</span>
            </button>

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
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold border flex items-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
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
                  <span>POS</span>
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
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1b4332] hover:bg-[#133326] text-white font-bold text-xs sm:text-[13px] shadow-xs flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="size-3.5" />
              <span className="hidden xs:inline sm:inline">My Bag</span>
              <span className="xs:hidden sm:hidden">Bag</span>
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
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold border flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
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
                  <span className="truncate max-w-[75px] hidden sm:inline">
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

        {/* Mobile / Tablet Islamabad Sector Row */}
        <div className="flex lg:hidden items-center gap-1.5 pb-2.5 pt-1 overflow-x-auto scrollbar-none">
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1B4332] shrink-0 pr-1">
            <MapPin className="size-3 text-[#f37021]" />
            <span>Islamabad:</span>
          </span>
          {ISLAMABAD_NAV_SECTORS.map((sec) => {
            const isActive = selectedSector === sec.value;
            return (
              <button
                key={sec.value}
                type="button"
                onClick={() => {
                  setSelectedSector(sec.value);
                  if (activeTab !== 'consumer') setActiveTab('consumer');
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#1b4332] text-white'
                    : 'bg-[#EDE7DA] text-stone-700 hover:text-stone-900'
                }`}
              >
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
