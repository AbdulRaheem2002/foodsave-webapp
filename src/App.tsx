import React, { useState, useEffect, useMemo } from 'react';
import type { DealItem, Reservation, RetailerStore, AuthUser, PakistanCity, AppTab } from './types';
import { Navbar } from './components/Navbar';
import { DealMap } from './components/ConsumerApp/DealMap';
import { DealFeed } from './components/ConsumerApp/DealFeed';
import { MysteryBagsBanner } from './components/ConsumerApp/MysteryBagsBanner';
import { HowItWorksSection } from './components/ConsumerApp/HowItWorksSection';
import { FaqSection } from './components/ConsumerApp/FaqSection';
import { PartnerPage } from './components/PartnerPage';
import { InstallPwaBanner } from './components/InstallPwaBanner';
import { ReservationModal } from './components/ConsumerApp/ReservationModal';
import { ActivePassesDrawer } from './components/ConsumerApp/ActivePassesDrawer';
import { WhatsAppModal } from './components/ConsumerApp/WhatsAppModal';
import { RatingModal } from './components/ConsumerApp/RatingModal';
import { StoreProfileModal } from './components/ConsumerApp/StoreProfileModal';
import { RetailerDashboard } from './components/RetailerPOS/RetailerDashboard';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import {
  fetchDealsApi,
  fetchStoresApi,
  fetchMyReservationsApi,
  deleteRetailerItemApi,
  updateReservationStatusApi,
  TOKEN_STORAGE_KEY,
} from './services/api';
import { ArrowRight, CheckCircle2, ShieldCheck, Clock, Store, Lock } from 'lucide-react';

const STORAGE_KEYS = {
  RESERVATIONS: 'foodsave_reservations_v2',
  USER: 'foodsave_user_v2',
  LEGACY_RESERVATIONS: 'flashfruit_reservations_v2',
  LEGACY_USER: 'flashfruit_user_v2',
};

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/partner') return 'partner';
      if (window.location.pathname === '/merchant') return 'retailer';
    }
    return 'consumer';
  });
  const [selectedCity, setSelectedCity] = useState<PakistanCity>('All Pakistan');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextPath =
      activeTab === 'partner' ? '/partner' : activeTab === 'retailer' ? '/merchant' : '/';
    if (window.location.pathname !== nextPath) {
      window.history.replaceState(null, '', nextPath);
    }
  }, [activeTab]);

  const [deals, setDeals] = useState<DealItem[]>([]);
  const [stores, setStores] = useState<RetailerStore[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);
  const [reserveModalDeal, setReserveModalDeal] = useState<DealItem | null>(null);
  const [pendingReserveDeal, setPendingReserveDeal] = useState<DealItem | null>(null);
  const [whatsAppReservation, setWhatsAppReservation] = useState<Reservation | null>(null);
  const [ratingDeal, setRatingDeal] = useState<DealItem | null>(null);
  const [selectedStoreProfile, setSelectedStoreProfile] = useState<RetailerStore | null>(null);

  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [isPassesDrawerOpen, setIsPassesDrawerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authInitialRole, setAuthInitialRole] = useState<'consumer' | 'retailer'>('consumer');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return token && saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Ensure pure Light Theme permanently
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('foodsave_theme_v2');
      localStorage.removeItem('flashfruit_theme_v2');
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage when state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    } catch (e) {
      console.warn('LocalStorage reservations error', e);
    }
  }, [reservations]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      }
    } catch (e) {
      console.warn('LocalStorage user error', e);
    }
  }, [currentUser]);

  // Fetch live deals, stores & authenticated reservations from Express REST API
  const refreshMarketplaceData = async () => {
    try {
      const [apiDeals, apiStores, apiReservations] = await Promise.all([
        fetchDealsApi(),
        fetchStoresApi(),
        fetchMyReservationsApi(),
      ]);

      setDeals(apiDeals);
      setStores(apiStores);
      setReservations(apiReservations);
    } catch (err) {
      console.warn('Could not load marketplace data:', err);
    }
  };

  useEffect(() => {
    refreshMarketplaceData();
  }, []);

  // Filter Deals by Selected City
  const filteredDealsByCity = useMemo(() => {
    if (selectedCity === 'All Pakistan') return deals;
    return deals.filter(
      (d) => d.location.city.toLowerCase() === selectedCity.toLowerCase()
    );
  }, [deals, selectedCity]);

  // Global PKR Impact Stats
  const totalSavedPkr = (currentUser?.totalSavedPkr || 0) + reservations.reduce((sum, r) => sum + r.savedPkr, 0);
  const itemsRescuedCount = (currentUser?.itemsRescuedCount || 0) + reservations.reduce((sum, r) => sum + r.quantity, 0);

  const handleAddItem = (partialItem: Partial<DealItem>) => {
    const merchantStore =
      currentUser?.retailer ||
      stores[0] || {
        id: 'store',
        name: `${currentUser?.name || 'Partner'}'s Store`,
        category: partialItem.category || 'grocery',
        address: '',
        city: selectedCity === 'All Pakistan' ? 'Islamabad' : selectedCity,
        sector: '',
        rating: 5.0,
      };

    const newItem: DealItem = {
      id: partialItem.id || `dl-${Date.now()}`,
      storeId: merchantStore.id,
      storeName: merchantStore.name,
      storeType: merchantStore.category,
      storeRating: merchantStore.rating || 5.0,
      title: partialItem.title || 'Surplus Item',
      category: partialItem.category || merchantStore.category || 'grocery',
      flavorProfile: partialItem.flavorProfile || 'mixed',
      originalPricePkr: partialItem.originalPricePkr || 0,
      currentPricePkr: partialItem.currentPricePkr || 0,
      discountPercent: partialItem.discountPercent || 0,
      expiryHoursLeft: partialItem.expiryHoursLeft || 2,
      stockQuantity: partialItem.stockQuantity || 1,
      pickupDeadline: partialItem.pickupDeadline || `Pick up within ${partialItem.expiryHoursLeft || 2} hrs`,
      distanceKm: 0.5,
      imageUrl: partialItem.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
      isVerified: true,
      location: {
        x: 50,
        y: 50,
        address: merchantStore.address || '',
        city: merchantStore.city || 'Islamabad',
        sector: merchantStore.sector || '',
      },
      decaySchedule: partialItem.decaySchedule || [],
      hoursRemaining: partialItem.expiryHoursLeft || 2,
      isMysteryBag: Boolean(partialItem.isMysteryBag),
    };

    setDeals((prev) => [newItem, ...prev]);
  };

  const handleOpenReserveModal = (deal: DealItem) => {
    if (!currentUser) {
      setPendingReserveDeal(deal);
      setAuthInitialRole('consumer');
      setAuthInitialMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setReserveModalDeal(deal);
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await deleteRetailerItemApi(id);
    } catch (e) {
      console.warn('API delete item fallback:', e);
    }
    setDeals((prev) => prev.filter((d) => d.id !== id));
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      await updateReservationStatusApi(reservationId, 'cancelled');
    } catch (e) {
      console.warn('API cancel reservation fallback:', e);
    }
    const target = reservations.find((r) => r.id === reservationId || r.pickupCode === reservationId);
    if (target) {
      // restore stock quantity in local state deals
      setDeals((prev) =>
        prev.map((d) =>
          d.id === target.item.id
            ? { ...d, stockQuantity: d.stockQuantity + target.quantity }
            : d
        )
      );
    }
    // Remove reservation from active list
    setReservations((prev) =>
      prev.filter((r) => r.id !== reservationId && r.pickupCode !== reservationId)
    );
  };

  const handleAuthSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch (e) {
      console.warn('LocalStorage token error:', e);
    }
    refreshMarketplaceData();
    if (user.role === 'retailer') {
      setActiveTab('retailer');
    } else if (pendingReserveDeal) {
      setReserveModalDeal(pendingReserveDeal);
      setPendingReserveDeal(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setReservations([]);
    setPendingReserveDeal(null);
    if (activeTab === 'retailer') {
      setActiveTab('consumer');
    }
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_USER);
      localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_RESERVATIONS);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      console.warn('Logout localStorage clear error:', e);
    }
  };

  const handleConfirmReservation = (res: Reservation) => {
    setReservations((prev) => [res, ...prev]);
    setDeals((prev) =>
      prev.map((d) =>
        d.id === res.item.id
          ? { ...d, stockQuantity: Math.max(0, d.stockQuantity - res.quantity) }
          : d
      )
    );
  };

  const handleCollectReservation = (reservationId: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId || r.pickupCode === reservationId
          ? { ...r, status: 'collected', paymentStatus: 'paid' }
          : r
      )
    );
  };

  const handleAddReview = (dealId: string, rating: number) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, storeRating: Math.round(((d.storeRating + rating) / 2) * 10) / 10 } : d
      )
    );
  };

  const handleUpdateDealPrice = (dealId: string, newPricePkr: number) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          const discountPercent = Math.round(((d.originalPricePkr - newPricePkr) / d.originalPricePkr) * 100);
          return { ...d, currentPricePkr: newPricePkr, discountPercent: Math.max(0, discountPercent) };
        }
        return d;
      })
    );
  };

  const storeDealsForModal = useMemo(() => {
    if (!selectedStoreProfile) return [];
    return deals.filter((d) => d.storeName === selectedStoreProfile.name);
  }, [deals, selectedStoreProfile]);

  const scrollToDeals = () => {
    const el = document.getElementById('deals-feed-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const featuredDeal = deals[0] || null;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#171916] flex flex-col font-sans">
      
      {/* Top Utility Bar */}
      <div className="bg-[#142E22] text-white py-2 px-4 sm:px-6 lg:px-8 text-xs border-b border-[#1F4433]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="size-1.5 rounded-full bg-[#85e3a8] shrink-0" />
            <span className="truncate text-[11px] font-medium text-stone-100">
              {filteredDealsByCity.length > 0
                ? `${filteredDealsByCity.length} live surplus ${filteredDealsByCity.length === 1 ? 'bag' : 'bags'} available${selectedCity === 'All Pakistan' ? ' across Pakistan' : ` in ${selectedCity}`} • 15-min hold`
                : 'Islamabad Launch • Closing-hour bakery & café deals up to 85% OFF • Zero app required'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsPassesDrawerOpen(true)}
            className="text-[11px] font-bold text-[#a7f3d0] hover:text-white hover:underline shrink-0 whitespace-nowrap"
          >
            Active Passes ({reservations.length})
          </button>
        </div>
      </div>

      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        reservationCount={reservations.length}
        onOpenReservations={() => setIsPassesDrawerOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthInitialRole('consumer');
          setAuthInitialMode('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-5 pb-12">
        {activeTab === 'partner' ? (
          <PartnerPage
            onOpenMerchantRegister={() => {
              if (currentUser?.role === 'retailer') {
                setActiveTab('retailer');
              } else {
                if (currentUser) handleLogout();
                setAuthInitialRole('retailer');
                setAuthInitialMode('register');
                setIsAuthModalOpen(true);
              }
            }}
            onOpenStoreLogin={() => {
              if (currentUser?.role === 'retailer') {
                setActiveTab('retailer');
              } else {
                if (currentUser) handleLogout();
                setAuthInitialRole('retailer');
                setAuthInitialMode('login');
                setIsAuthModalOpen(true);
              }
            }}
            onBackToDeals={() => {
              setActiveTab('consumer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : activeTab === 'retailer' ? (
          currentUser?.role === 'retailer' ? (
            <div className="animate-in fade-in duration-300">
              <RetailerDashboard
                stores={stores}
                currentStore={currentUser?.retailer || null}
                deals={deals}
                reservations={reservations}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onUpdateDealPrice={handleUpdateDealPrice}
                onCollectReservation={handleCollectReservation}
              />
            </div>
          ) : (
            <div className="max-w-lg mx-auto my-12 p-8 rounded-3xl bg-white border border-[#2D6A4F]/20 shadow-lg text-center flex flex-col items-center gap-4 animate-in fade-in duration-300">
              <div className="size-16 rounded-2xl bg-[#fff3e0] text-[#e65100] border border-[#ffe0b2] flex items-center justify-center shadow-xs">
                <Lock className="size-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">
                  Merchant Partner Access Required
                </h2>
                <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                  {currentUser
                    ? `You are signed in as ${currentUser.name} (Consumer). Only verified partner stores can manage surplus listings and verify pickup passes.`
                    : 'Only verified store partners can access the Merchant POS dashboard to list surplus food and verify customer pickup codes.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-2">
                <button
                  onClick={() => {
                    if (currentUser) handleLogout();
                    setActiveTab('retailer');
                    setAuthInitialRole('retailer');
                    setAuthInitialMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Store className="size-4" />
                  <span>{currentUser ? 'Switch to Store Account' : 'Sign In to Store POS'}</span>
                </button>
                <button
                  onClick={() => {
                    if (currentUser) handleLogout();
                    setActiveTab('retailer');
                    setAuthInitialRole('retailer');
                    setAuthInitialMode('register');
                    setIsAuthModalOpen(true);
                  }}
                  className="py-3 px-4 rounded-xl bg-[#fff3e0] hover:bg-[#ffe0b2] border border-[#ffcc80] text-[#b45309] font-black text-xs transition-colors"
                >
                  Register New Store
                </button>
              </div>
              <button
                onClick={() => setActiveTab('consumer')}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 hover:underline transition-colors"
              >
                ← Back to Live Deals
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-12 sm:gap-16 animate-in fade-in duration-300">
            
            {/* Editorial Split Hero with Appetite Photography */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-1 lg:pt-4">
              
              {/* Left Column: High-Impact Typography & Clear CTAs */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                
                {/* Top Location Pill */}
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#edf7ed] text-[#1B4332] border border-[#c8e6c9] inline-flex items-center gap-2 self-start mb-5 shadow-2xs">
                  <span className="size-2 rounded-full bg-[#2e7d32] animate-pulse" />
                  Islamabad Closing Drops • Up to 85% OFF
                </span>

                {/* Big Display Headline with Editorial Italic Serif Accent */}
                <h1 className="text-4xl sm:text-5xl lg:text-[3.65rem] font-extrabold text-[#171916] tracking-[-0.03em] leading-[1.03] mb-5">
                  Rescue Fresh{' '}
                  <span className="font-serif-display italic font-semibold text-[#1B4332]">
                    Evening Pastries
                  </span>{' '}
                  Before Closing.
                </h1>

                {/* Generous Lead Subtitle */}
                <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl mb-6 font-medium">
                  Islamabad bakeries, cafés, and kitchens drop fresh same-day surplus before lockup. Reserve on web in 15 seconds — pay via{' '}
                  <strong className="text-[#171916] font-bold">Cash on Pickup, JazzCash, or EasyPaisa</strong>.
                </p>

                {/* Primary CTA Pair + App Install */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <button
                    type="button"
                    onClick={scrollToDeals}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#1B4332] hover:bg-[#133326] text-white text-sm font-bold shadow-lg shadow-[#1B4332]/20 transition-all cursor-pointer"
                  >
                    <span>{deals.length > 0 ? 'Explore Live Drops' : 'See Sample Boxes'}</span>
                    <ArrowRight className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('partner');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-[#fff8f1] text-[#171916] border border-[#D8D1C5] hover:border-[#f37021] text-sm font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <Store className="size-4 text-[#f37021]" />
                    <span>Partner Your Bakery (0% Fee)</span>
                  </button>

                  <InstallPwaBanner />
                </div>

                {/* Crisp Inline Guarantees */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-stone-600 font-semibold pt-2 border-t border-[#E7E2D8]">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-[#2e7d32]" />
                    F-6 • F-7 • Blue Area • H-12
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-[#f37021]" />
                    15-Min Counter Hold
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-[#2e7d32]" />
                    Sweet &amp; Savory Clarity
                  </span>
                </div>
              </div>

              {/* Right Column: Rich Sunlit Artisan Food Photography + Floating Bag Preview */}
              <div className="lg:col-span-6">
                <div className="relative rounded-[2rem] overflow-hidden shadow-[0_24px_60px_-20px_rgba(23,25,22,0.22)] border border-[#E7E2D8] bg-stone-100 aspect-[4/3]">
                  <img
                    src={featuredDeal?.imageUrl || '/images/hero-pastries.jpg'}
                    alt={featuredDeal ? featuredDeal.title : 'Fresh golden croissants and evening bakery assortment'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                  {/* Single Floating Editorial Drop Pill */}
                  <div className="absolute bottom-4 left-4 right-4 sm:left-5 sm:right-5 rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-xl border border-white/60 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#f37021] block">
                        {featuredDeal
                          ? `Live Drop • ${featuredDeal.storeName}`
                          : 'Sample Evening Drop • Islamabad Bakery Format'}
                      </span>
                      <p className="text-sm sm:text-base font-extrabold text-[#171916] truncate">
                        {featuredDeal
                          ? featuredDeal.title
                          : 'Artisan Croissant & Pastry Box (9:30 PM)'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-stone-400 line-through font-medium block leading-none mb-0.5">
                        {featuredDeal ? `₨ ${featuredDeal.originalPricePkr}` : '₨ 1,650'}
                      </span>
                      <span className="text-lg sm:text-xl font-extrabold text-[#1B4332] leading-none">
                        {featuredDeal ? `₨ ${featuredDeal.currentPricePkr}` : '₨ 550'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Filterable Deal Feed Grid FIRST (customers see deals/filters immediately) */}
            <DealFeed
              deals={filteredDealsByCity}
              selectedCity={selectedCity}
              onReserveDeal={handleOpenReserveModal}
              onOpenPartnerPage={() => {
                setActiveTab('partner');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectDeal={(deal) => {
                const store =
                  stores.find((s) => s.id === deal.storeId || s.name === deal.storeName) || {
                    id: deal.storeId || deal.id,
                    name: deal.storeName,
                    category: deal.storeType,
                    address: deal.location.address,
                    city: deal.location.city,
                    sector: deal.location.sector,
                    isVerified: deal.isVerified,
                    rating: deal.storeRating,
                    totalRecoveredPkr: 0,
                    totalWastedValueAvoidedPkr: 0,
                  };
                setSelectedStoreProfile(store);
              }}
            />

            {/* Warm Light Map View (auto-hides when 0 deals match) */}
            <DealMap
              deals={filteredDealsByCity}
              selectedCity={selectedCity}
              selectedDeal={selectedDeal}
              onSelectDeal={(deal) => setSelectedDeal(deal)}
              onReserveDeal={handleOpenReserveModal}
            />

            {/* Surprise Mystery Bags: What's Inside? Feature Banner */}
            <MysteryBagsBanner
              mysteryDeal={deals.find((d) => d.isMysteryBag)}
              onClaimMysteryBag={handleOpenReserveModal}
            />

            {/* 4-Step Editorial How BiteHour Works Guide */}
            <HowItWorksSection
              onOpenPartnerPage={() => {
                setActiveTab('partner');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Transparent Consumer & Merchant FAQ Accordion */}
            <FaqSection />

          </div>
        )}
      </main>

      {/* Reservation Checkout Modal */}
      <ReservationModal
        deal={reserveModalDeal}
        onClose={() => setReserveModalDeal(null)}
        onConfirmReservation={handleConfirmReservation}
        onOpenWhatsApp={(res) => setWhatsAppReservation(res)}
      />

      {/* Active Pickup Passes Drawer */}
      <ActivePassesDrawer
        isOpen={isPassesDrawerOpen}
        onClose={() => setIsPassesDrawerOpen(false)}
        reservations={reservations}
        onCancelReservation={handleCancelReservation}
        onRateDeal={(deal) => setRatingDeal(deal)}
      />

      {/* WhatsApp Pass Dispatch Modal */}
      <WhatsAppModal
        isOpen={!!whatsAppReservation}
        onClose={() => setWhatsAppReservation(null)}
        reservation={whatsAppReservation}
      />

      {/* Rating & Review Modal */}
      <RatingModal
        isOpen={!!ratingDeal}
        onClose={() => setRatingDeal(null)}
        deal={ratingDeal}
        onAddReview={handleAddReview}
      />

      {/* Store Profile Modal */}
      <StoreProfileModal
        isOpen={!!selectedStoreProfile}
        onClose={() => setSelectedStoreProfile(null)}
        store={selectedStoreProfile}
        storeDeals={storeDealsForModal}
        onReserveDeal={handleOpenReserveModal}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        initialRole={authInitialRole}
        initialMode={authInitialMode}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onSwitchTab={(tab) => setActiveTab(tab)}
      />

      {/* Global Footer */}
      <Footer
        totalSavedPkr={totalSavedPkr}
        itemsRescuedCount={itemsRescuedCount}
        onOpenPartnerPage={() => {
          setActiveTab('partner');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenMerchantPortal={() => {
          setActiveTab('retailer');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

    </div>
  );
}

export default App;
