import React, { useState, useEffect, useMemo } from 'react';
import type { DealItem, Reservation, RetailerStore, AuthUser, PakistanCity, AppTab } from './types';
import { Navbar } from './components/Navbar';
import { DealMap } from './components/ConsumerApp/DealMap';
import { DealFeed } from './components/ConsumerApp/DealFeed';
import { MysteryBagsBanner } from './components/ConsumerApp/MysteryBagsBanner';
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
  const [activeTab, setActiveTab] = useState<AppTab>('consumer');
  const [selectedCity, setSelectedCity] = useState<PakistanCity>('All Pakistan');

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
        city: selectedCity === 'All Pakistan' ? 'Lahore' : selectedCity,
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
        city: merchantStore.city || 'Lahore',
      },
      decaySchedule: partialItem.decaySchedule || [],
      hoursRemaining: partialItem.expiryHoursLeft || 2,
    };

    setDeals((prev) => [newItem, ...prev]);
  };

  const handleOpenReserveModal = (deal: DealItem) => {
    if (!currentUser) {
      setPendingReserveDeal(deal);
      setAuthInitialRole('consumer');
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
    if (pendingReserveDeal) {
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

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1F2937] flex flex-col font-sans">
      
      {/* Top Utility Bar */}
      <div className="bg-[#1b4332] text-white py-1.5 px-4 sm:px-6 lg:px-8 text-xs border-b border-[#143527]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="size-1.5 rounded-full bg-[#85e3a8] shrink-0" />
            <span className="truncate text-[11px] font-medium text-stone-100">
              {filteredDealsByCity.length} live surplus {filteredDealsByCity.length === 1 ? 'bag' : 'bags'} available{selectedCity === 'All Pakistan' ? ' across Pakistan' : ` in ${selectedCity}`} • 15-min pickup hold
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
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-5 pb-12">
        {activeTab === 'retailer' ? (
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
                    setIsAuthModalOpen(true);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#FF9800] hover:bg-[#e68900] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Store className="size-4" />
                  <span>{currentUser ? 'Switch to Merchant Account' : 'Merchant Sign In / Register'}</span>
                </button>
                <button
                  onClick={() => setActiveTab('consumer')}
                  className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 font-bold text-xs transition-colors"
                >
                  ← Back to Deals
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            
            {/* Hero Section matching exact Reference Mockup */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Headline & Value Proposition */}
              <div className="lg:col-span-8 flex flex-col justify-center">
                
                {/* Top Location & Hold Pill */}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] inline-flex items-center gap-1.5 self-start mb-3 shadow-2xs">
                  <span className="size-2 rounded-full bg-[#4CAF50] animate-pulse" />
                  PK Live Surplus Deals &amp; Surprise Bags Across Pakistan | 15-min Guaranteed Hold
                </span>

                {/* Big Editorial Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-tight mb-3">
                  Rescue Delicious Food at <span className="text-[#1b4332]">Up to 85% OFF</span>
                </h1>

                {/* Subtitle with Pakistani rails */}
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl mb-4 font-medium">
                  Pakistani bakeries, restaurants, and grocery stores list fresh daily surplus items at steep discounts before closing. Pay easily via <strong>JazzCash, EasyPaisa, or Cash on Pickup</strong> with a 15-minute counter hold.
                </p>

                {/* Trust Guarantee Badges */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-600 font-bold">
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-2xs">
                    <CheckCircle2 className="size-3.5 text-[#2e7d32]" />
                    Verified Store Surplus
                  </span>
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-2xs">
                    <Clock className="size-3.5 text-[#f37021]" />
                    15-Min Guaranteed Hold
                  </span>
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-2xs">
                    <ShieldCheck className="size-3.5 text-[#2e7d32]" />
                    Direct Counter Pickup
                  </span>
                </div>
              </div>

              {/* Right Column: Live Marketplace Status Card */}
              <div className="lg:col-span-4 p-5 sm:p-6 rounded-[1.75rem] bg-[#f7f5f0] border border-[#e8e2d8] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                      LIVE MARKETPLACE
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] text-[10px] font-bold">
                      {deals.length > 0 ? 'Live' : 'Ready'}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-stone-900 mb-1.5">
                    {deals.length > 0
                      ? `${deals.length} Active Surplus Deal${deals.length === 1 ? '' : 's'}`
                      : 'Fresh Surplus Listed Daily'}
                  </h3>

                  <p className="text-xs text-stone-500 leading-relaxed font-medium mb-4">
                    {stores.length > 0
                      ? `Connecting ${stores.length} registered partner store${stores.length === 1 ? '' : 's'} with local customers before closing.`
                      : 'Sign in as a customer to claim deals or register your bakery, restaurant, or grocery store to start listing.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Registered Stores
                    </span>
                    <span className="text-xs font-black text-stone-800 font-mono">
                      {stores.length} Verified Partner{stores.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <button
                    onClick={scrollToDeals}
                    className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all transform active:scale-95"
                  >
                    <span>Explore Deals</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Geolocation Radar Map View */}
            <DealMap
              deals={filteredDealsByCity}
              selectedCity={selectedCity}
              selectedDeal={selectedDeal}
              onSelectDeal={(deal) => setSelectedDeal(deal)}
              onReserveDeal={handleOpenReserveModal}
            />

            {/* Filterable Deal Feed Grid */}
            <DealFeed
              deals={filteredDealsByCity}
              onReserveDeal={handleOpenReserveModal}
              onSelectDeal={(deal) => {
                const store =
                  stores.find((s) => s.id === deal.storeId || s.name === deal.storeName) || {
                    id: deal.storeId || deal.id,
                    name: deal.storeName,
                    category: deal.storeType,
                    address: deal.location.address,
                    city: deal.location.city,
                    isVerified: deal.isVerified,
                    rating: deal.storeRating,
                    totalRecoveredPkr: 0,
                    totalWastedValueAvoidedPkr: 0,
                  };
                setSelectedStoreProfile(store);
              }}
            />

            {/* Surprise Mystery Bags: What's Inside? Feature Banner */}
            <MysteryBagsBanner
              mysteryDeal={deals.find((d) => d.isMysteryBag)}
              onClaimMysteryBag={handleOpenReserveModal}
            />

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
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onSwitchTab={(tab) => setActiveTab(tab)}
      />

      {/* Global Footer */}
      <Footer
        totalSavedPkr={totalSavedPkr}
        itemsRescuedCount={itemsRescuedCount}
      />

    </div>
  );
}

export default App;
