import React, { useState, useEffect, useMemo } from 'react';
import type { DealItem, Reservation, RetailerStore, AuthUser, PakistanCity, AppTab } from './types';
import { INITIAL_DEALS, INITIAL_STORES } from './data/mockData';
import { Navbar } from './components/Navbar';
import { DealMap } from './components/ConsumerApp/DealMap';
import { DealFeed } from './components/ConsumerApp/DealFeed';
import { MysteryBagsBanner } from './components/ConsumerApp/MysteryBagsBanner';
import { ReservationModal } from './components/ConsumerApp/ReservationModal';
import { ActivePassesDrawer } from './components/ConsumerApp/ActivePassesDrawer';
import { WhatsAppModal } from './components/ConsumerApp/WhatsAppModal';
import { RatingModal } from './components/ConsumerApp/RatingModal';
import { StoreProfileModal } from './components/ConsumerApp/StoreProfileModal';
import { BykeaTrackerModal } from './components/ConsumerApp/BykeaTrackerModal';
import { RetailerDashboard } from './components/RetailerPOS/RetailerDashboard';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { fetchDealsApi, fetchMyReservationsApi } from './services/api';
import { ArrowRight, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

const STORAGE_KEYS = {
  RESERVATIONS: 'foodsave_reservations_v2',
  USER: 'foodsave_user_v2',
  LEGACY_RESERVATIONS: 'flashfruit_reservations_v2',
  LEGACY_USER: 'flashfruit_user_v2',
};

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('consumer');
  const [selectedCity, setSelectedCity] = useState<PakistanCity>('All Pakistan');

  const [deals, setDeals] = useState<DealItem[]>(INITIAL_DEALS);
  const [stores] = useState<RetailerStore[]>(INITIAL_STORES);
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);
  const [reserveModalDeal, setReserveModalDeal] = useState<DealItem | null>(null);
  const [whatsAppReservation, setWhatsAppReservation] = useState<Reservation | null>(null);
  const [ratingDeal, setRatingDeal] = useState<DealItem | null>(null);
  const [selectedStoreProfile, setSelectedStoreProfile] = useState<RetailerStore | null>(null);
  
  // Bykea Delivery Tracking State
  const [trackedBykeaReservation, setTrackedBykeaReservation] = useState<Reservation | null>(null);

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESERVATIONS) || localStorage.getItem(STORAGE_KEYS.LEGACY_RESERVATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isPassesDrawerOpen, setIsPassesDrawerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER) || localStorage.getItem(STORAGE_KEYS.LEGACY_USER);
      return saved ? JSON.parse(saved) : null;
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

  // Fetch initial deals & backend reservations from Express REST API
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [apiDeals, apiReservations] = await Promise.all([
          fetchDealsApi(),
          fetchMyReservationsApi(),
        ]);

        if (apiDeals && apiDeals.length > 0) {
          setDeals(apiDeals);
        }

        if (apiReservations && apiReservations.length > 0) {
          setReservations((prev) => {
            const combined = [...prev];
            apiReservations.forEach((ar) => {
              if (!combined.some((p) => p.id === ar.id || p.pickupCode === ar.pickupCode)) {
                combined.push(ar);
              }
            });
            return combined;
          });
        }
      } catch (err) {
        console.warn('Using seed data fallback:', err);
      }
    }
    loadInitialData();
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
    const newItem: DealItem = {
      id: `dl-${Date.now()}`,
      storeId: 'ret-1',
      storeName: 'Al-Fatah Gourmet Supermarket',
      storeType: 'grocery',
      storeRating: 4.9,
      title: partialItem.title || 'Surplus Item',
      category: partialItem.category || 'grocery',
      originalPricePkr: partialItem.originalPricePkr || 1200,
      currentPricePkr: partialItem.currentPricePkr || 480,
      discountPercent: partialItem.discountPercent || 60,
      expiryHoursLeft: partialItem.expiryHoursLeft || 2,
      stockQuantity: partialItem.stockQuantity || 5,
      pickupDeadline: `Pick up within ${partialItem.expiryHoursLeft || 2} hrs`,
      distanceKm: 0.5,
      imageUrl: partialItem.imageUrl || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
      isVerified: true,
      location: { x: 50, y: 50, address: 'Main Boulevard, Gulberg III', city: selectedCity === 'All Pakistan' ? 'Lahore' : selectedCity },
      decaySchedule: partialItem.decaySchedule || [],
      hoursRemaining: partialItem.expiryHoursLeft || 2,
    };

    setDeals((prev) => [newItem, ...prev]);
  };

  const handleRemoveItem = (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
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
      
      {/* Top Push Alert Simulator Banner matching Reference Mockup */}
      <div className="bg-[#0b1d14] text-white py-1.5 px-4 text-xs font-medium flex items-center justify-between border-b border-[#163826] shadow-2xs">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="px-2 py-0.5 rounded-full bg-[#fbc02d] text-stone-950 text-[10px] uppercase font-black tracking-wide flex-shrink-0">
            FLASH ALERT
          </span>
          <span className="truncate text-[11px] text-stone-200">
            Tehzeeb Bakery dropped Sourdough Bread to 75% OFF in Blue Area, Islamabad (Only 4 Bags left)
          </span>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 ml-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-stone-300">
            <span className="size-1.5 rounded-full bg-[#4CAF50] animate-pulse" />
            <span>2,400+ Active Bags</span>
          </div>

          <button
            onClick={() => setIsPassesDrawerOpen(true)}
            className="text-[11px] font-bold text-[#81c784] hover:underline"
          >
            View Active Passes
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
        totalSavedPkr={totalSavedPkr}
        itemsRescuedCount={itemsRescuedCount}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenMysteryBags={scrollToDeals}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-5 pb-12">
        {activeTab === 'retailer' ? (
          <div className="animate-in fade-in duration-300">
            <RetailerDashboard
              stores={stores}
              deals={deals}
              reservations={reservations}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onUpdateDealPrice={handleUpdateDealPrice}
              onCollectReservation={handleCollectReservation}
            />
          </div>
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
                  Pakistani bakeries, restaurants, and grocery stores list high-quality surplus items at steep discounts before closing. Pay seamlessly via <strong>JazzCash, EasyPaisa, or Cash on Pickup</strong> with 15-minute guaranteed hold &amp; <strong>Bykea Express Delivery</strong>.
                </p>

                {/* Trust Guarantee Badges */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-600 font-bold">
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-2xs">
                    <CheckCircle2 className="size-3.5 text-[#2e7d32]" />
                    100% Halal Verified
                  </span>
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-2xs">
                    <Clock className="size-3.5 text-[#f37021]" />
                    15-Min Guaranteed Hold
                  </span>
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-2xs">
                    <ShieldCheck className="size-3.5 text-[#2e7d32]" />
                    Bykea Express 30-min Delivery
                  </span>
                </div>
              </div>

              {/* Right Column: Daily Milestone KPI Card */}
              <div className="lg:col-span-4 p-5 sm:p-6 rounded-[1.75rem] bg-[#f7f5f0] border border-[#e8e2d8] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                      DAILY MILESTONE
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] text-[10px] font-bold">
                      Active
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-stone-900 mb-1.5">
                    1,248 kg of Surplus Rescued Today
                  </h3>

                  <p className="text-xs text-stone-500 leading-relaxed font-medium mb-4">
                    Diverted equivalent to 3.1 tonnes of greenhouse gases across Karachi, Islamabad &amp; Rawalpindi.
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Pakistani Household Average
                    </span>
                    <span className="text-xs font-black text-stone-800 font-mono">
                      Rs 11,200 / mo
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
              onReserveDeal={(deal) => setReserveModalDeal(deal)}
            />

            {/* Filterable Deal Feed Grid */}
            <DealFeed
              deals={filteredDealsByCity}
              onReserveDeal={(deal) => setReserveModalDeal(deal)}
              onSelectDeal={(deal) => {
                const store = stores.find((s) => s.name === deal.storeName) || stores[0];
                setSelectedStoreProfile(store);
              }}
            />

            {/* Surprise Mystery Bags: What's Inside? Feature Banner */}
            <MysteryBagsBanner
              mysteryDeal={deals.find((d) => d.isMysteryBag)}
              onClaimMysteryBag={(deal) => setReserveModalDeal(deal)}
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
        onOpenBykeaTracker={(res) => setTrackedBykeaReservation(res)}
      />

      {/* Active Pickup Passes Drawer */}
      <ActivePassesDrawer
        isOpen={isPassesDrawerOpen}
        onClose={() => setIsPassesDrawerOpen(false)}
        reservations={reservations}
        onOpenBykeaTracker={(res) => setTrackedBykeaReservation(res)}
      />

      {/* Live Bykea Rider Animated GPS Tracker Modal */}
      <BykeaTrackerModal
        isOpen={!!trackedBykeaReservation}
        onClose={() => setTrackedBykeaReservation(null)}
        reservation={trackedBykeaReservation}
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
        onReserveDeal={(deal) => setReserveModalDeal(deal)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
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
