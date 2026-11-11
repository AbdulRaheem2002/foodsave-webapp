import React from 'react';
import { ShoppingBag, Store, Leaf, User, LogIn, MapPin, Sparkles } from 'lucide-react';
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
  onOpenMysteryBags,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#FAFAF8]/95 backdrop-blur-md border-b border-[#e5e0d8] px-4 lg:px-8 py-3 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 lg:gap-4">
        
        {/* Brand Logo & Pakistan Market Tagline */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('consumer')}
          >
            {/* Circular Green Brand Emblem matching reference design */}
            <div className="size-10 rounded-full bg-[#1b4332] text-white flex items-center justify-center shadow-md shadow-[#1b4332]/25 group-hover:scale-105 transition-transform">
              <Leaf className="size-5 text-[#85e3a8]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-[#111827]">
                  Foodsave
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-black bg-[#1b4332]/10 text-[#1b4332] border border-[#1b4332]/20 rounded-md">
                  PK
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-medium tracking-tight">
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
        <div className="flex items-center gap-0.5 bg-[#f0ebe1] p-1 rounded-full border border-[#ded8cc] text-xs shadow-2xs self-center md:self-auto overflow-x-auto scrollbar-none">
          <MapPin className="size-3.5 text-stone-400 ml-2 mr-1 hidden sm:block" />
          {CITIES.map((c) => {
            const isActive = selectedCity === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setSelectedCity(c.value)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1b4332] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#1b4332]'
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
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf7ed] border border-[#c8e6c9] text-[11px] text-[#2e7d32] font-bold shadow-2xs">
            <Leaf className="size-3.5 text-[#2e7d32]" />
            <span>{itemsRescuedCount > 0 ? `${itemsRescuedCount + 1648} Bags Saved!` : '1,648 Bags Saved!'}</span>
          </div>

          {/* Value Returned Chip */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff8e1] border border-[#ffecb3] text-[11px] text-[#b78103] font-bold shadow-2xs">
            <span>🪙 Rs {Math.round((totalSavedPkr + 248000) / 1000)}k Saved in Pakistan</span>
          </div>

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

          {/* Role Tabs Switcher (Consumer / Merchant POS) */}
          <div className="flex items-center gap-1 bg-[#ece7dd] p-1 rounded-full border border-[#ded8cc] text-xs">
            <button
              onClick={() => setActiveTab(activeTab === 'retailer' ? 'consumer' : 'retailer')}
              title={activeTab === 'retailer' ? 'Switch to Consumer View' : 'Merchant POS Portal'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-[11px] font-bold ${
                activeTab === 'retailer'
                  ? 'bg-[#FF9800] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Store className="size-3.5" />
              <span>{activeTab === 'retailer' ? 'Consumer' : 'Merchant POS'}</span>
            </button>

            {/* User Auth */}
            <button
              onClick={onOpenAuth}
              className="p-1.5 rounded-full hover:bg-stone-200 text-stone-700 transition-colors"
              title={currentUser ? currentUser.name : 'Sign In'}
            >
              {currentUser ? <User className="size-3.5 text-[#2D6A4F]" /> : <LogIn className="size-3.5" />}
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
