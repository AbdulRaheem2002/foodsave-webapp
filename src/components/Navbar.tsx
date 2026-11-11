import React from 'react';
import { ShoppingBag, Store, Leaf, User, LogIn, MapPin, Cpu, Zap, Sparkles } from 'lucide-react';
import type { AuthUser, PakistanCity, AppTab } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedCity: PakistanCity;
  setSelectedCity: (city: PakistanCity) => void;
  reservationCount: number;
  onOpenReservations: () => void;
  totalSavedPkr: number;
  itemsRescuedCount: number;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  rescueWalletBalancePkr?: number;
  onOpenFlashChef?: () => void;
  onOpenDutchAuction?: () => void;
  onOpenCommuteMatcher?: () => void;
  onOpenColdLocker?: () => void;
  onOpenCarbonLeague?: () => void;
  onOpenMysteryBags?: () => void;
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
  totalSavedPkr,
  itemsRescuedCount,
  currentUser,
  onOpenAuth,
  rescueWalletBalancePkr = 650,
  onOpenFlashChef,
  onOpenDutchAuction,
  onOpenCommuteMatcher,
  onOpenColdLocker,
  onOpenCarbonLeague,
  onOpenMysteryBags,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#FAFAF8]/95 dark:bg-[#182230]/95 backdrop-blur-md border-b border-[#e5e0d8] dark:border-white/10 px-4 lg:px-8 py-3 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 lg:gap-4">
        
        {/* Brand Logo & Pakistan Market Tagline */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('consumer')}
          >
            {/* Circular Green Brand Emblem matching reference design */}
            <div className="size-10 rounded-full bg-[#1b4332] dark:bg-[#2D6A4F] text-white flex items-center justify-center shadow-md shadow-[#1b4332]/25 group-hover:scale-105 transition-transform">
              <Leaf className="size-5 text-[#85e3a8]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-[#111827] dark:text-[#F9F6F0]">
                  Foodsave
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-black bg-[#1b4332]/10 dark:bg-[#4CAF50]/15 text-[#1b4332] dark:text-[#4CAF50] border border-[#1b4332]/20 dark:border-[#4CAF50]/30 rounded-md">
                  PK
                </span>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-slate-400 font-medium tracking-tight">
                Surplus Food Marketplace Pakistan
              </p>
            </div>
          </div>

          {/* Mobile Right Quick Action Icons */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenMysteryBags}
              className="px-2.5 py-1 rounded-full bg-[#f37021] text-white font-bold text-[11px] shadow-xs"
            >
              Mystery Bags
            </button>
            <button
              onClick={onOpenReservations}
              className="relative p-2 rounded-full bg-[#1b4332] text-white shadow-xs"
            >
              <ShoppingBag className="size-4" />
              {reservationCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#FF9800] text-white font-black text-[10px] flex items-center justify-center">
                  {reservationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pakistan City Capsule Selector matching exact reference */}
        <div className="flex items-center gap-0.5 bg-[#f0ebe1] dark:bg-[#1F2937] p-1 rounded-full border border-[#ded8cc] dark:border-white/10 text-xs shadow-2xs self-center md:self-auto overflow-x-auto scrollbar-none">
          <MapPin className="size-3.5 text-stone-400 dark:text-stone-500 ml-2 mr-1 hidden sm:block" />
          {CITIES.map((c) => {
            const isActive = selectedCity === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setSelectedCity(c.value)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1b4332] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-[#1b4332] dark:hover:text-white'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Right Statistics & Action Buttons */}
        <div className="flex items-center gap-2 lg:gap-2.5 self-center md:self-auto overflow-x-auto scrollbar-none">
          
          {/* Bags Saved Eco Chip */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf7ed] dark:bg-[#1F2937] border border-[#c8e6c9] dark:border-white/10 text-[11px] text-[#2e7d32] dark:text-[#81c784] font-bold shadow-2xs">
            <Leaf className="size-3.5 text-[#2e7d32] dark:text-[#81c784]" />
            <span>{itemsRescuedCount > 0 ? `${itemsRescuedCount + 1648} Bags Saved!` : '1,648 Bags Saved!'}</span>
          </div>

          {/* Value Returned Chip */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff8e1] dark:bg-[#1F2937] border border-[#ffecb3] dark:border-white/10 text-[11px] text-[#b78103] dark:text-[#fbc02d] font-bold shadow-2xs">
            <span>🪙 Rs {Math.round((totalSavedPkr + 248000) / 1000)}k Returned • ₨ {rescueWalletBalancePkr}</span>
          </div>

          {/* Flash Market Pill */}
          {onOpenDutchAuction && (
            <button
              onClick={onOpenDutchAuction}
              className="px-2.5 py-1 rounded-full bg-[#f3f4f6] dark:bg-[#1F2937] hover:bg-[#e5e7eb] dark:hover:bg-[#283548] border border-stone-300 dark:border-white/10 text-[11px] font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1 transition-all"
            >
              <Zap className="size-3 text-[#FF9800]" />
              <span className="hidden sm:inline">Flash Market</span>
            </button>
          )}

          {/* Mystery Bags Orange Button */}
          <button
            onClick={onOpenMysteryBags || onOpenReservations}
            className="px-4 py-1.5 rounded-full bg-[#f37021] hover:bg-[#e05f13] text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all transform active:scale-95"
          >
            <Sparkles className="size-3.5" />
            <span>Mystery Bags</span>
          </button>

          {/* My Bag Dark Green Button */}
          <button
            onClick={onOpenReservations}
            className="px-4 py-1.5 rounded-full bg-[#1b4332] hover:bg-[#133326] text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all transform active:scale-95"
          >
            <ShoppingBag className="size-3.5" />
            <span>My Bag</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#FF9800] text-white text-[10px] font-black">
              {reservationCount}
            </span>
          </button>

          {/* Role Tabs Switcher (Consumer / Retailer / Pricing AI) */}
          <div className="flex items-center gap-1 bg-[#ece7dd] dark:bg-[#1F2937] p-1 rounded-full border border-[#ded8cc] dark:border-white/10 text-xs">
            <button
              onClick={() => setActiveTab(activeTab === 'retailer' ? 'consumer' : 'retailer')}
              title={activeTab === 'retailer' ? 'Switch to Consumer View' : 'Merchant POS Portal'}
              className={`p-1.5 rounded-full transition-all ${
                activeTab === 'retailer'
                  ? 'bg-[#FF9800] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Store className="size-3.5" />
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'ai-simulator' ? 'consumer' : 'ai-simulator')}
              title="Pricing Algorithm Simulator"
              className={`p-1.5 rounded-full transition-all ${
                activeTab === 'ai-simulator'
                  ? 'bg-[#1b4332] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Cpu className="size-3.5" />
            </button>

            {/* User Auth */}
            <button
              onClick={onOpenAuth}
              className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
              title={currentUser ? currentUser.name : 'Sign In'}
            >
              {currentUser ? <User className="size-3.5 text-[#2D6A4F]" /> : <LogIn className="size-3.5" />}
            </button>
          </div>

        </div>

      </div>

      {/* Innovation Quick-Launch Strip */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-[#ded8cc]/60 dark:border-white/10 flex items-center gap-2 overflow-x-auto text-xs pb-0.5 scrollbar-none">
        <span className="text-[10px] uppercase font-black text-[#1b4332] dark:text-[#4CAF50] flex items-center gap-1 pl-1 flex-shrink-0 tracking-wider">
          <span>⚡ Innovation Suite:</span>
        </span>

        {onOpenFlashChef && (
          <button
            onClick={onOpenFlashChef}
            className="px-3 py-1 rounded-full bg-white dark:bg-[#1F2937] hover:bg-[#f0ede6] border border-[#ded8cc] dark:border-white/10 text-stone-700 dark:text-[#F9F6F0] text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <span>👨‍🍳 FlashChef AI</span>
          </button>
        )}

        {onOpenDutchAuction && (
          <button
            onClick={onOpenDutchAuction}
            className="px-3 py-1 rounded-full bg-[#fff8e1] dark:bg-[#1F2937] hover:bg-[#ffecb3] border border-[#ffecb3] dark:border-white/10 text-[#b78103] dark:text-[#FF9800] text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <span>⚡ Dutch Auction Live</span>
          </button>
        )}

        {onOpenCommuteMatcher && (
          <button
            onClick={onOpenCommuteMatcher}
            className="px-3 py-1 rounded-full bg-white dark:bg-[#1F2937] hover:bg-[#f0ede6] border border-[#ded8cc] dark:border-white/10 text-stone-700 dark:text-[#F9F6F0] text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <span>🚗 0-Min Commute Matcher</span>
          </button>
        )}

        {onOpenColdLocker && (
          <button
            onClick={onOpenColdLocker}
            className="px-3 py-1 rounded-full bg-white dark:bg-[#1F2937] hover:bg-[#f0ede6] border border-[#ded8cc] dark:border-white/10 text-stone-700 dark:text-[#F9F6F0] text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <span>🧊 24/7 Smart Cold Locker</span>
          </button>
        )}

        {onOpenCarbonLeague && (
          <button
            onClick={onOpenCarbonLeague}
            className="px-3 py-1 rounded-full bg-[#edf7ed] dark:bg-[#1F2937] hover:bg-[#c8e6c9] border border-[#c8e6c9] dark:border-white/10 text-[#2e7d32] dark:text-[#4CAF50] text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <span>🏆 Campus Carbon League</span>
          </button>
        )}
      </div>
    </header>
  );
};
