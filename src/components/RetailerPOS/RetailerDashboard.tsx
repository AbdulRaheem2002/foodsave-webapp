import React, { useState, useEffect, useMemo } from 'react';
import type { DealItem, RetailerStore, Reservation, DonationRecord, RetailerOrdersResponse } from '../../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShieldCheck, DollarSign, Leaf, Plus, TrendingUp, Edit3, Download, CheckCircle2, QrCode, X, Image as ImageIcon, Upload, Heart, MapPin, Users, ShoppingBag, Clock } from 'lucide-react';

import { compressImageFileToDataUrl, downloadCsvFile, formatCurrency } from '../../lib/utils';
import { addRetailerItemApi, overridePriceApi, verifyPickupCodeApi, updateReservationStatusApi, fetchRetailerOrdersApi } from '../../services/api';
import { DonationModal } from './DonationModal';
import { CsrCertificateModal } from './CsrCertificateModal';
import { OrdersHistoryPanel } from '../OrdersHistoryPanel';
import { sounds } from '../../lib/soundEffects';

interface RetailerDashboardProps {
  stores: RetailerStore[];
  currentStore?: RetailerStore | null;
  deals: DealItem[];
  reservations?: Reservation[];
  onAddItem: (item: Partial<DealItem>) => void;
  onRemoveItem: (id: string) => void;
  onUpdateDealPrice?: (dealId: string, newPricePkr: number) => void;
  onCollectReservation?: (reservationId: string) => void;
}

const PRESET_IMAGES = {
  grocery: '/images/box-savory.jpg',
  bakery: '/images/box-sweet.jpg',
  restaurant: '/images/box-coffee.jpg',
  mixed: '/images/hero-pastries.jpg',
};

interface ListingPreset {
  id: string;
  label: string;
  title: string;
  category: 'bakery' | 'restaurant' | 'grocery';
  flavor: 'sweet' | 'savory' | 'drinks' | 'mixed';
  worthPkr: number;
  boxPricePkr: number;
  pickupSlot: string;
  imageUrl: string;
}

const SURPRISE_BOX_PRESETS: ListingPreset[] = [
  {
    id: 'sweet',
    label: '🥐 Sweet Bakery Box',
    title: 'Sweet Bakery Surprise Box',
    category: 'bakery',
    flavor: 'sweet',
    worthPkr: 1200,
    boxPricePkr: 450,
    pickupSlot: '9:30 PM – 11:00 PM',
    imageUrl: '/images/box-sweet.jpg',
  },
  {
    id: 'savory',
    label: '🌶️ Spicy Kitchen / BBQ Box',
    title: 'Spicy Kitchen Surprise Box',
    category: 'restaurant',
    flavor: 'savory',
    worthPkr: 1600,
    boxPricePkr: 600,
    pickupSlot: '9:30 PM – 11:15 PM',
    imageUrl: '/images/box-savory.jpg',
  },
  {
    id: 'drinks',
    label: '☕ Hotel Buffet / Café Box',
    title: 'Hotel & Café Surprise Box',
    category: 'restaurant',
    flavor: 'drinks',
    worthPkr: 2200,
    boxPricePkr: 800,
    pickupSlot: '8:30 PM – 10:30 PM',
    imageUrl: '/images/box-coffee.jpg',
  },
  {
    id: 'mixed',
    label: '🥑 Grocery & Bakery Crate',
    title: 'Assorted Mart Surprise Box',
    category: 'grocery',
    flavor: 'mixed',
    worthPkr: 1500,
    boxPricePkr: 550,
    pickupSlot: '9:30 PM – 11:00 PM',
    imageUrl: '/images/hero-pastries.jpg',
  },
];

const SINGLE_DEAL_PRESETS: ListingPreset[] = [
  {
    id: 'biryani',
    label: '🍛 Spicy Biryani / Karahi',
    title: 'Closing Chicken Biryani & Raita',
    category: 'restaurant',
    flavor: 'savory',
    worthPkr: 750,
    boxPricePkr: 380,
    pickupSlot: '10:00 PM – 11:30 PM',
    imageUrl: '/images/box-savory.jpg',
  },
  {
    id: 'burger',
    label: '🍔 Burger / Pizza Deal',
    title: 'Loaded Grill Burger & Fries',
    category: 'restaurant',
    flavor: 'savory',
    worthPkr: 950,
    boxPricePkr: 480,
    pickupSlot: '10:30 PM – 11:45 PM',
    imageUrl: '/images/box-savory.jpg',
  },
  {
    id: 'pastry',
    label: '🥐 Cake / Pastries Plate',
    title: 'Assorted Fresh Pastry Plate',
    category: 'bakery',
    flavor: 'sweet',
    worthPkr: 1100,
    boxPricePkr: 520,
    pickupSlot: '9:30 PM – 11:00 PM',
    imageUrl: '/images/box-sweet.jpg',
  },
  {
    id: 'produce',
    label: '🥑 Fresh Fruit / Mart Pack',
    title: 'Closing Fresh Fruit & Mart Pack',
    category: 'grocery',
    flavor: 'mixed',
    worthPkr: 1400,
    boxPricePkr: 650,
    pickupSlot: '9:00 PM – 11:00 PM',
    imageUrl: '/images/hero-pastries.jpg',
  },
];

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({
  stores,
  currentStore,
  deals,
  reservations = [],
  onAddItem,
  onRemoveItem,
  onUpdateDealPrice,
  onCollectReservation,
}) => {
  const availableStores = useMemo(
    () => (currentStore ? [currentStore, ...stores.filter((s) => s.id !== currentStore.id)] : stores),
    [currentStore, stores]
  );

  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    currentStore?.id || availableStores[0]?.id || ''
  );

  useEffect(() => {
    if (currentStore?.id) {
      setSelectedStoreId(currentStore.id);
    } else if (!selectedStoreId && availableStores[0]?.id) {
      setSelectedStoreId(availableStores[0].id);
    }
  }, [currentStore?.id, availableStores, selectedStoreId]);

  const selectedStore =
    availableStores.find((s) => s.id === selectedStoreId) || currentStore || availableStores[0] || null;

  const storeDeals = selectedStore
    ? deals.filter((d) => d.storeId === selectedStore.id || d.storeName === selectedStore.name)
    : deals;

  const [isAddItemOpen, setIsAddItemOpen] = useState<boolean>(false);
  const [isVerifyPassOpen, setIsVerifyPassOpen] = useState<boolean>(false);
  const [donateDeal, setDonateDeal] = useState<DealItem | null>(null);
  const [activeCsrCertificate, setActiveCsrCertificate] = useState<DonationRecord | null>(null);
  const [donationsList, setDonationsList] = useState<DonationRecord[]>([]);

  const [overrideDealId, setOverrideDealId] = useState<string | null>(null);
  const [overridePriceInput, setOverridePriceInput] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addItemError, setAddItemError] = useState<string | null>(null);

  // Store Sales & Buyer History State
  const [ordersData, setOrdersData] = useState<RetailerOrdersResponse | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const loadStoreOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const data = await fetchRetailerOrdersApi();
      setOrdersData(data);
    } catch (err) {
      console.warn('Could not load retailer orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    void loadStoreOrders();
  }, [selectedStoreId]);

  // Cashier Pass Redemption State
  const [verifyCodeInput, setVerifyCodeInput] = useState<string>('');
  const [verifiedPass, setVerifiedPass] = useState<any | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSuccessCollected, setIsSuccessCollected] = useState<boolean>(false);

  // Dual-Mode Closing Setup: 'surprise' (Assorted Box) or 'single' (Direct Meal / Item Deal)
  const [listingMode, setListingMode] = useState<'surprise' | 'single'>('surprise');
  const [singlePricingMode, setSinglePricingMode] = useState<'fixed' | 'decay'>('fixed');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('Bakery Surprise Box');
  const [newItemCategory, setNewItemCategory] = useState<'grocery' | 'bakery' | 'restaurant'>('bakery');
  const [newItemFlavor, setNewItemFlavor] = useState<'sweet' | 'savory' | 'drinks' | 'mixed'>('mixed');
  const [newItemPickupSlot, setNewItemPickupSlot] = useState<string>('9:30 PM – 11:00 PM');
  const [newItemPrice, setNewItemPrice] = useState<number>(1200);
  const [newBoxPrice, setNewBoxPrice] = useState<number>(450);
  const [newItemQuantity, setNewItemQuantity] = useState<number>(5);
  const [newItemExpiryHours, setNewItemExpiryHours] = useState<number>(2.5);
  const [newItemImageUrl, setNewItemImageUrl] = useState<string>('/images/box-sweet.jpg');

  const applyListingPreset = (preset: ListingPreset) => {
    setNewItemName(preset.title);
    setNewItemCategory(preset.category);
    setNewItemFlavor(preset.flavor);
    setNewItemPrice(preset.worthPkr);
    setNewBoxPrice(preset.boxPricePkr);
    setNewItemPickupSlot(preset.pickupSlot);
    setNewItemImageUrl(preset.imageUrl);
  };

  const switchListingMode = (mode: 'surprise' | 'single') => {
    setListingMode(mode);
    setAddItemError(null);
    const defaultPreset = mode === 'surprise' ? SURPRISE_BOX_PRESETS[0] : SINGLE_DEAL_PRESETS[0];
    applyListingPreset(defaultPreset);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPhotoUploadError(null);
    setIsUploadingPhoto(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 900, 0.78);
      setNewItemImageUrl(dataUrl);
    } catch (err: any) {
      setPhotoUploadError(err?.message || 'Could not process the selected photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // CSV Report Generator
  const handleExportCsvReport = () => {
    const storeLabel = (selectedStore?.name || 'BiteHour_Store').replace(/\s+/g, '_');
    const headers = ['Listing ID', 'Item Name', 'Category', 'Original Price (PKR)', 'Discount Price (PKR)', 'Discount %', 'Quantity', 'Store City'];
    const rows = storeDeals.map((d) => [
      d.id,
      d.title,
      d.category,
      d.originalPricePkr,
      d.currentPricePkr,
      `${d.discountPercent}%`,
      d.stockQuantity,
      d.location.city || selectedStore?.city || 'Islamabad',
    ]);
    downloadCsvFile(`BiteHour_Daily_Recovery_Report_${storeLabel}.csv`, headers, rows);
  };

  const handleCreateSurplusItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const isMystery = listingMode === 'surprise';
    const hasExplicitPrice = isMystery || singlePricingMode === 'fixed';
    if (hasExplicitPrice && newBoxPrice >= newItemPrice) {
      setAddItemError('Closing price must be lower than original worth/menu price.');
      return;
    }

    setAddItemError(null);
    sounds.playAlertPing();
    const imgUrl = newItemImageUrl.trim() || PRESET_IMAGES[newItemCategory];
    const estimatedAutoPrice = Math.round(newItemPrice * 0.65);

    try {
      const apiRes = await addRetailerItemApi({
        name: newItemName.trim(),
        category: newItemCategory,
        flavorProfile: newItemFlavor,
        isMysteryBag: isMystery,
        pickupWindowText: newItemPickupSlot.trim() || undefined,
        originalPricePkr: newItemPrice,
        boxPricePkr: hasExplicitPrice ? newBoxPrice : undefined,
        quantity: newItemQuantity,
        expiryHoursLeft: newItemExpiryHours,
        imageUrl: imgUrl,
      });

      const createdDeal = apiRes?.deal;
      const fallbackPrice = hasExplicitPrice ? newBoxPrice : estimatedAutoPrice;

      onAddItem({
        id: createdDeal?.id || createdDeal?._id,
        title: newItemName.trim(),
        category: newItemCategory,
        flavorProfile: newItemFlavor,
        isMysteryBag: isMystery,
        originalPricePkr: newItemPrice,
        currentPricePkr: createdDeal?.currentDiscountedPricePkr ?? fallbackPrice,
        discountPercent:
          createdDeal?.discountPercent ??
          Math.max(1, Math.round(((newItemPrice - fallbackPrice) / Math.max(1, newItemPrice)) * 100)),
        expiryHoursLeft: newItemExpiryHours,
        stockQuantity: newItemQuantity,
        pickupDeadline:
          createdDeal?.pickupWindowText ||
          newItemPickupSlot.trim() ||
          `Pick up within ${newItemExpiryHours} hrs`,
        distanceKm: 0.5,
        imageUrl: imgUrl,
        isVerified: true,
        location: {
          x: 50,
          y: 50,
          address: selectedStore?.address || '',
          city: selectedStore?.city || 'Islamabad',
          sector: selectedStore?.sector || '',
        },
        decaySchedule: createdDeal?.decaySchedule || [],
        hoursRemaining: newItemExpiryHours,
      });

      setIsAddItemOpen(false);
      setPhotoUploadError(null);
      switchListingMode(listingMode);
      void loadStoreOrders();
    } catch (err: any) {
      setAddItemError(err?.message || 'Could not save listing. Please make sure you are signed in as a Retailer.');
    }
  };

  const handleApplyOverride = async (dealId: string) => {
    const num = Number(overridePriceInput);
    if (!num || num <= 0) return;

    try {
      await overridePriceApi(dealId, num);
      if (onUpdateDealPrice) onUpdateDealPrice(dealId, num);
      setOverrideDealId(null);
      setOverridePriceInput('');
    } catch (err: any) {
      setVerifyError(err?.message || 'Could not apply price override.');
    }
  };

  // Cashier Verification Action
  const handleVerifyPickupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCodeInput.trim()) return;

    setIsVerifying(true);
    setVerifyError(null);
    setVerifiedPass(null);
    setIsSuccessCollected(false);

    try {
      const formattedCode = verifyCodeInput.trim().toUpperCase();
      const localMatch = reservations.find(
        (r) => r.pickupCode.toUpperCase() === formattedCode || r.id === formattedCode
      );

      if (localMatch) {
        setVerifiedPass({
          id: localMatch.id,
          pickupCode: localMatch.pickupCode,
          customerName: 'Customer (App Reserve)',
          dealTitle: localMatch.item.title,
          quantity: localMatch.quantity,
          totalPricePkr: localMatch.totalPricePkr,
          paymentMethod: localMatch.paymentMethod,
          paymentStatus: localMatch.paymentStatus,
          paymentReference: localMatch.paymentReference || '',
          status: localMatch.status,
          pickupDeadline: localMatch.pickupWindowEnd,
        });
        sounds.playLaserBeep();
        return;
      }

      const res = await verifyPickupCodeApi(formattedCode);
      if (res.valid) {
        setVerifiedPass(res.reservation);
        sounds.playLaserBeep();
      } else {
        setVerifyError(res.message || 'Invalid or expired pickup pass code');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Could not verify code. Please check pass number.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmCollection = async () => {
    if (!verifiedPass) return;
    try {
      await updateReservationStatusApi(verifiedPass.id, 'collected');
      sounds.playSuccessFanfare();
      setIsSuccessCollected(true);
      if (onCollectReservation) {
        onCollectReservation(verifiedPass.id);
      }
      void loadStoreOrders();
    } catch (err: any) {
      setVerifyError(err?.message || 'Failed to mark reservation as collected.');
    }
  };

  const handleMarkOrderCollected = async (orderId: string) => {
    setBusyOrderId(orderId);
    try {
      await updateReservationStatusApi(orderId, 'collected');
      sounds.playSuccessFanfare();
      if (onCollectReservation) {
        onCollectReservation(orderId);
      }
      await loadStoreOrders();
    } catch (err: any) {
      setVerifyError(err?.message || 'Failed to mark order as collected.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleRecordDonation = (record: DonationRecord) => {
    setDonationsList((prev) => [record, ...prev]);
    setActiveCsrCertificate(record);
    onRemoveItem(record.dealId);
  };

  const primaryDeal = storeDeals[0];
  const chartData = primaryDeal?.decaySchedule?.length
    ? [
        { time: 'Full Retail', timeDecay: primaryDeal.originalPricePkr },
        ...primaryDeal.decaySchedule.map((step) => ({
          time: `${step.hoursRemaining}h left`,
          timeDecay: step.pricePkr,
        })),
      ]
    : [];

  if (!selectedStore) {
    return (
      <div className="bg-white p-10 rounded-3xl border border-stone-200 text-center max-w-lg mx-auto my-8">
        <div className="text-4xl mb-3">🏪</div>
        <h3 className="text-lg font-black text-stone-900">Store Profile Not Loaded</h3>
        <p className="text-xs text-stone-500 mt-1">
          Please register or sign in with a verified Merchant Partner account to manage store listings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-300">
      
      {/* Store Header & Branch Selector */}
      <div className="bg-white p-6 rounded-[2rem] border border-[#2D6A4F]/15 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-[#2D6A4F]/15 text-[#2D6A4F] border border-[#2D6A4F]/30 flex items-center justify-center text-3xl font-bold shadow-xs">
            🏪
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1F2937] tracking-tight">{selectedStore.name}</h2>
              {selectedStore.isVerified && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#4CAF50]/15 text-[#2D6A4F] border border-[#4CAF50]/30 flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-[#4CAF50]" />
                  Verified Store
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
              <MapPin className="size-3 text-[#2D6A4F]" />
              {selectedStore.address}, {selectedStore.city}
            </p>
          </div>
        </div>

        {/* Branch Selector & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {availableStores.length > 1 && (
            <div className="flex items-center gap-1 bg-[#F9F6F0] p-1.5 rounded-full border border-[#2D6A4F]/15 text-xs shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-2">Branch:</span>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-transparent text-[#2D6A4F] text-xs font-bold focus:outline-none pr-2 cursor-pointer"
              >
                {availableStores.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white text-slate-900">
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsVerifyPassOpen(true)}
            className="btn-claim px-4 py-2.5 text-xs font-black shadow-xs flex-1 sm:flex-none justify-center"
          >
            <QrCode className="size-4" />
            <span>Verify Pass</span>
          </button>

          <button
            onClick={() => setIsAddItemOpen(true)}
            className="px-4 py-2.5 rounded-full bg-[#FF9800] hover:bg-[#f57c00] text-white font-black text-xs shadow-md shadow-[#FF9800]/25 flex items-center justify-center gap-1.5 transition-all transform active:scale-95 flex-1 sm:flex-none cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Drop Box / Deal</span>
          </button>
        </div>
      </div>

      {/* Store Sales & Buyer Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Collected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#2D6A4F]/15 flex items-start justify-between shadow-2xs">
          <div>
            <span className="text-xs text-slate-500 font-medium block mb-1">Collected Revenue</span>
            <div className="text-2xl font-black text-[#FF9800] tracking-tight mb-1">
              {formatCurrency(ordersData?.summary?.collectedRevenuePkr ?? selectedStore.totalRecoveredPkr)}
            </div>
            <span className="text-[11px] text-[#4CAF50] flex items-center gap-1 font-semibold">
              <TrendingUp className="size-3.5" /> +{' '}
              {formatCurrency(ordersData?.summary?.pendingRevenuePkr ?? 0)} pending pickup
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FF9800]/15 text-[#FF9800]">
            <DollarSign className="size-6" />
          </div>
        </div>

        {/* Metric 2: Boxes Sold */}
        <div className="bg-white p-5 rounded-2xl border border-[#2D6A4F]/15 flex items-start justify-between shadow-2xs">
          <div>
            <span className="text-xs text-slate-500 font-medium block mb-1">Boxes Sold</span>
            <div className="text-2xl font-black text-[#1B4332] tracking-tight mb-1">
              {ordersData?.summary?.unitsSold ?? 0} Sold
            </div>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <ShoppingBag className="size-3.5 text-[#f37021]" />{' '}
              {ordersData?.summary?.unitsPending ?? 0} awaiting counter pickup
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#2D6A4F]/15 text-[#2D6A4F]">
            <ShoppingBag className="size-6" />
          </div>
        </div>

        {/* Metric 3: Unique Buyers */}
        <div className="bg-white p-5 rounded-2xl border border-[#2D6A4F]/15 flex items-start justify-between shadow-2xs">
          <div>
            <span className="text-xs text-slate-500 font-medium block mb-1">Unique Buyers</span>
            <div className="text-2xl font-black text-[#171916] tracking-tight mb-1">
              {ordersData?.summary?.uniqueBuyersCount ?? 0} Buyers
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {ordersData?.summary?.totalOrdersCount ?? 0} total orders
              {donationsList.length > 0 ? ` • ${donationsList.length} donated` : ''}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-stone-100 text-[#1B4332]">
            <Users className="size-6" />
          </div>
        </div>

        {/* Metric 4: Food Waste Value Rescued */}
        <div className="bg-white p-5 rounded-2xl border border-[#2D6A4F]/15 flex items-start justify-between shadow-2xs">
          <div>
            <span className="text-xs text-slate-500 font-medium block mb-1">Food Value Rescued</span>
            <div className="text-2xl font-black text-[#2D6A4F] tracking-tight mb-1">
              {formatCurrency(
                ordersData?.summary?.wastedValueAvoidedPkr ?? selectedStore.totalWastedValueAvoidedPkr
              )}
            </div>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <Leaf className="size-3.5 text-[#4CAF50]" /> Retail food saved from waste
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#4CAF50]/15 text-[#4CAF50]">
            <Leaf className="size-6" />
          </div>
        </div>
      </div>

      {/* Auto-Generated Time-Decay Curve Graph */}
      <div className="bg-white p-6 rounded-[2rem] border border-[#2D6A4F]/15 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-black text-[#1F2937] flex items-center gap-2">
              <span>Time-Decay Schedule Curve{primaryDeal ? ` — ${primaryDeal.title}` : ''}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Lowers price automatically in PKR (₨) as expiry approaches to match nearby buyers.
            </p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="timeDecayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9800" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#FF9800" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit=" ₨" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#2D6A4F', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`₨ ${val}`, 'Price']}
                />
                <Area type="monotone" dataKey="timeDecay" stroke="#FF9800" strokeWidth={3} fillOpacity={1} fill="url(#timeDecayGradient)" name="Time-Decay Price (₨)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-44 rounded-2xl bg-[#F9F6F0] border border-stone-200 flex flex-col items-center justify-center text-center p-6">
            <p className="text-xs font-bold text-stone-700">No active listings yet for {selectedStore.name}</p>
            <p className="text-[11px] text-stone-500 mt-1">
              List your first surplus item to generate a live time-decay pricing schedule.
            </p>
          </div>
        )}
      </div>

      {/* Active Surplus Listings Table */}
      <div className="bg-white p-6 rounded-[2rem] border border-[#2D6A4F]/15 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-black text-[#1F2937] flex items-center gap-2 flex-wrap">
            <span>Live Store Boxes &amp; Deals ({selectedStore.name.split(' ')[0]})</span>
            <span className="px-3 py-0.5 rounded-full text-xs bg-[#2D6A4F]/15 text-[#2D6A4F] border border-[#2D6A4F]/30 font-bold">
              {storeDeals.length} Live
            </span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsvReport}
              disabled={storeDeals.length === 0}
              className="px-3.5 py-1.5 rounded-full bg-[#F9F6F0] hover:bg-slate-200 disabled:opacity-40 border border-[#2D6A4F]/20 text-[#1F2937] text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Download className="size-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={() => setIsAddItemOpen(true)}
              className="px-4 py-1.5 rounded-full bg-[#FF9800] text-white text-xs font-bold hover:bg-[#f57c00] transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Drop Box / Deal</span>
            </button>
          </div>
        </div>

        {storeDeals.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#F9F6F0] border border-stone-200 text-center">
            <p className="text-sm font-bold text-stone-800">No Closing Boxes or Deals Posted Yet</p>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Drop a closing Surprise Box (Worth ₨ 1,200 for ₨ 450) OR list individual Spicy Biryani, Burger, Hotel Buffet, or Grocery closing deals with your own photo.
            </p>
            <button
              onClick={() => setIsAddItemOpen(true)}
              className="px-4 py-2 rounded-full bg-[#FF9800] hover:bg-[#f57c00] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              + Drop First Box or Deal
            </button>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F6F0] text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-[#2D6A4F]/15">
              <tr>
                <th className="p-3">Listing</th>
                <th className="p-3">Craving</th>
                <th className="p-3">Worth / Original</th>
                <th className="p-3">Closing Price</th>
                <th className="p-3">Format</th>
                <th className="p-3">Stock Left</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D6A4F]/10">
              {storeDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-[#F9F6F0]/60 transition-colors">
                  <td className="p-3 font-semibold text-[#1F2937] flex items-center gap-3">
                    <img src={deal.imageUrl} alt={deal.title} className="size-10 rounded-xl object-cover border border-[#2D6A4F]/15" />
                    <div>
                      <p className="font-bold text-xs truncate max-w-xs">{deal.title}</p>
                      <span className="text-[10px] text-slate-500">{deal.pickupDeadline}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F9F6F0] border border-[#2D6A4F]/20 text-[10px] uppercase font-bold text-slate-600">
                      {deal.flavorProfile || deal.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 font-semibold">
                    {deal.isMysteryBag !== false ? 'Worth ' : ''}{formatCurrency(deal.originalPricePkr)}
                  </td>
                  <td className="p-3 font-black text-[#1B4332] text-sm">
                    {formatCurrency(deal.currentPricePkr)}
                  </td>
                  <td className="p-3">
                    {deal.isMysteryBag !== false ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#edf7ed] text-[#1B4332] border border-[#c8e6c9]">
                        🎁 Surprise Box
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]">
                        🔥 -{deal.discountPercent}% Deal
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-[#1F2937]">
                    {deal.stockQuantity} pcs
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* NGO Donation Button */}
                      <button
                        onClick={() => setDonateDeal(deal)}
                        className="px-2.5 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                        title="Donate to Saylani / Edhi / JDC"
                      >
                        <Heart className="size-3 fill-rose-500" />
                        <span>Donate</span>
                      </button>

                      {overrideDealId === deal.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="₨ New"
                            value={overridePriceInput}
                            onChange={(e) => setOverridePriceInput(e.target.value)}
                            className="w-16 px-2 py-1 rounded bg-white dark:bg-[#1F2937] border border-[#FF9800] text-[#FF9800] text-xs font-bold"
                          />
                          <button
                            onClick={() => handleApplyOverride(deal.id)}
                            className="px-2.5 py-1 rounded bg-[#FF9800] text-white font-bold text-[10px]"
                          >
                            Set
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setOverrideDealId(deal.id);
                            setOverridePriceInput(deal.currentPricePkr.toString());
                          }}
                          className="p-1.5 rounded-lg bg-[#edf7ed] hover:bg-[#c8e6c9] border border-[#c8e6c9] text-[#2e7d32] transition-colors"
                          title="Override Price"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                      )}

                      {deleteConfirmId === deal.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in duration-150">
                          <button
                            onClick={() => {
                              onRemoveItem(deal.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold shadow-xs transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(deal.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors"
                          title="Remove Listing"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Store Orders & Buyer History (What Sold & Who Bought) */}
      <OrdersHistoryPanel
        title="Orders & Buyer History (What Sold & Who Bought)"
        subtitle={`Customer reservations, buyer contacts, and payment details scoped to ${selectedStore.name}`}
        orders={ordersData?.orders || []}
        showStoreColumn={false}
        exportFilename={`BiteHour_Orders_${(selectedStore.name || 'Store').replace(/\s+/g, '_')}.csv`}
        onRefresh={() => void loadStoreOrders()}
        isRefreshing={isLoadingOrders}
        onMarkCollected={handleMarkOrderCollected}
        busyOrderId={busyOrderId}
      />

      {/* Recently Expired Listings Archive (hidden from customers automatically) */}
      {Boolean(ordersData?.expiredDeals?.length) && (
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-[#E7E2D8] shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
                <Clock className="size-4 text-stone-500" />
                <span>Recently Expired Listings ({ordersData?.expiredDeals.length})</span>
              </h3>
              <p className="text-xs text-stone-500">
                Automatically hidden from customers once their closing expiry passed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(ordersData?.expiredDeals || []).map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E5DFD3] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-stone-900 truncate">{exp.title}</p>
                  <p className="text-[11px] text-stone-500">
                    Expired {new Date(exp.expiryDeadline).toLocaleString()}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold shrink-0">
                  {exp.stockRemaining} unsold
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cashier Verification Modal */}
      {isVerifyPassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-[#2D6A4F]/20 rounded-3xl p-6 shadow-2xl overflow-hidden">
            
            <button
              onClick={() => {
                setIsVerifyPassOpen(false);
                setVerifiedPass(null);
                setVerifyError(null);
                setIsSuccessCollected(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-10 rounded-2xl bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] flex items-center justify-center">
                <QrCode className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Cashier Counter Pass Verification</h3>
                <p className="text-xs text-stone-500">Verify customer pickup code PK-XXXXX</p>
              </div>
            </div>

            <form onSubmit={handleVerifyPickupCode} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                placeholder="Enter Code (e.g. PK-84920)"
                value={verifyCodeInput}
                onChange={(e) => setVerifyCodeInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F9F6F0] border border-stone-300 text-stone-900 font-mono text-sm font-bold placeholder-stone-400 uppercase focus:outline-none focus:border-[#2D6A4F]"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] disabled:opacity-50 text-white font-black text-xs shadow-md transition-all"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            {verifyError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold mb-4">
                ❌ {verifyError}
              </div>
            )}

            {verifiedPass && (
              <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-[#2D6A4F]/30 flex flex-col gap-3 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="font-mono text-xs font-bold text-[#1b4332]">
                    Code: #{verifiedPass.pickupCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9]">
                    ✓ Valid Pass
                  </span>
                </div>

                <div className="text-xs space-y-1.5">
                  <p className="text-stone-900 font-bold">{verifiedPass.dealTitle}</p>
                  <p className="text-stone-600">Quantity: <strong>{verifiedPass.quantity} pcs</strong></p>
                  <p className="text-stone-600">Amount Due: <strong className="text-[#f37021]">{formatCurrency(verifiedPass.totalPricePkr)}</strong></p>
                  <div
                    className={`mt-1.5 p-2.5 rounded-xl border text-[11px] font-bold ${
                      verifiedPass.paymentStatus === 'paid'
                        ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#2e7d32]'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}
                  >
                    {verifiedPass.paymentStatus === 'paid' ? (
                      <span>✓ Payment Already Confirmed ({verifiedPass.paymentMethod})</span>
                    ) : verifiedPass.paymentMethod === 'Cash on Pickup' ? (
                      <span>💵 COLLECT {formatCurrency(verifiedPass.totalPricePkr)} CASH AT COUNTER</span>
                    ) : (
                      <span>
                        📱 CHECK {verifiedPass.paymentMethod.toUpperCase()} RECEIPT FOR{' '}
                        {formatCurrency(verifiedPass.totalPricePkr)}
                        {verifiedPass.paymentReference ? ` (Ref: ${verifiedPass.paymentReference})` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {isSuccessCollected ? (
                  <div className="p-3 rounded-xl bg-[#edf7ed] border border-[#c8e6c9] text-[#2e7d32] text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
                    <CheckCircle2 className="size-4" />
                    <span>Payment Verified &amp; Item Handed Over!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleConfirmCollection}
                    className="w-full py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-md transition-all"
                  >
                    Confirm Payment &amp; Handover
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dual-Mode Drop Box or Deal Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setIsAddItemOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="mb-3 pr-8">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#f37021]">
                30-Second Closing Setup
              </span>
              <h3 className="text-base font-black text-stone-900">
                {listingMode === 'surprise' ? 'Drop Closing Surprise Boxes' : 'List Exact Dish / Closing Deal'}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {listingMode === 'surprise'
                  ? 'Pack assorted leftovers at closing — hide exact item markdowns in a Surprise Box.'
                  : 'List a specific plate, biryani, burger, hotel buffet meal, or grocery crate with fixed or auto-decay pricing.'}
              </p>
            </div>

            {/* Dual-Mode Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#F9F6F0] border border-stone-200 mb-3.5">
              <button
                type="button"
                onClick={() => switchListingMode('surprise')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  listingMode === 'surprise'
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🎁 Surprise Box
              </button>
              <button
                type="button"
                onClick={() => switchListingMode('single')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  listingMode === 'single'
                    ? 'bg-[#f37021] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🔥 Single Meal / Exact Deal
              </button>
            </div>

            {/* 1-Tap Staff Presets */}
            <div className="mb-3.5 space-y-1.5">
              <span className="block text-[11px] font-bold text-stone-600">
                {listingMode === 'surprise'
                  ? '1-Tap Box Presets (Worth ₨ Value → Fixed Box Price):'
                  : '1-Tap Restaurant / Hotel / Mart Presets:'}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(listingMode === 'surprise' ? SURPRISE_BOX_PRESETS : SINGLE_DEAL_PRESETS).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyListingPreset(preset)}
                    className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-[#edf7ed] border border-[#E5DFD3] hover:border-[#1B4332]/40 text-left transition-colors cursor-pointer"
                  >
                    <span className="block text-[11px] font-extrabold text-stone-900 truncate">
                      {preset.label}
                    </span>
                    <span className="block text-[10px] text-[#1B4332] font-bold">
                      {listingMode === 'surprise'
                        ? `Worth ${formatCurrency(preset.worthPkr)} for ${formatCurrency(preset.boxPricePkr)}`
                        : `${formatCurrency(preset.worthPkr)} → ${formatCurrency(preset.boxPricePkr)}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {addItemError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {addItemError}
              </div>
            )}

            <form onSubmit={handleCreateSurplusItem} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-stone-600 mb-1 font-medium">
                  {listingMode === 'surprise' ? 'Surprise Box Name:' : 'Exact Dish / Deal Title:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={listingMode === 'surprise' ? 'e.g. Spicy Kitchen Surprise Box' : 'e.g. Closing Chicken Biryani & Raita'}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F6F0] border border-stone-300 text-stone-900 text-xs font-bold focus:outline-none focus:border-[#2D6A4F]"
                />
              </div>

              {listingMode === 'single' && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF8F3] border border-[#E5DFD3]">
                  <span className="text-[11px] font-bold text-stone-600 shrink-0">Pricing:</span>
                  <button
                    type="button"
                    onClick={() => setSinglePricingMode('fixed')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      singlePricingMode === 'fixed'
                        ? 'bg-[#1B4332] text-white'
                        : 'bg-white border border-stone-200 text-stone-700'
                    }`}
                  >
                    Fixed Closing Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setSinglePricingMode('decay')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      singlePricingMode === 'decay'
                        ? 'bg-[#f37021] text-white'
                        : 'bg-white border border-stone-200 text-stone-700'
                    }`}
                  >
                    Auto Drop (-35% → -75%)
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-600 mb-1 font-medium">
                    {listingMode === 'surprise' ? 'Worth Inside (PKR):' : 'Regular Menu Price (PKR):'}
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F6F0] border border-stone-300 text-stone-900 text-xs font-bold focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>
                {listingMode === 'surprise' || singlePricingMode === 'fixed' ? (
                  <div>
                    <label className="block text-xs text-stone-600 mb-1 font-medium">Customer Pays (PKR):</label>
                    <input
                      type="number"
                      required
                      min={50}
                      value={newBoxPrice}
                      onChange={(e) => setNewBoxPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#F9F6F0] border border-[#1B4332]/40 text-[#1B4332] text-xs font-black focus:outline-none focus:border-[#2D6A4F]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-end">
                    <div className="px-3 py-2 rounded-xl bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] text-[11px] font-bold">
                      Starts ~{formatCurrency(Math.round(newItemPrice * 0.65))} → Drops -75%
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-600 mb-1 font-medium">Craving Profile:</label>
                  <select
                    value={newItemFlavor}
                    onChange={(e) => setNewItemFlavor(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F6F0] border border-stone-300 text-stone-900 text-xs font-bold focus:outline-none focus:border-[#2D6A4F]"
                  >
                    <option value="mixed">🍱 Assorted / Buffet</option>
                    <option value="savory">🌶️ Spicy &amp; Savory</option>
                    <option value="sweet">🥐 Sweet Pastries &amp; Desserts</option>
                    <option value="drinks">☕ Coffee, Tea &amp; Bake</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1 font-medium">Business Type:</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setNewItemCategory(cat);
                      if (!newItemImageUrl.startsWith('data:image/')) {
                        setNewItemImageUrl(PRESET_IMAGES[cat as keyof typeof PRESET_IMAGES] || '/images/box-sweet.jpg');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F6F0] border border-stone-300 text-stone-900 text-xs font-bold focus:outline-none focus:border-[#2D6A4F]"
                  >
                    <option value="bakery">Bakery / Patisserie</option>
                    <option value="restaurant">Restaurant / Hotel / Café</option>
                    <option value="grocery">Grocery / Supermarket</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs text-stone-600 mb-1 font-medium">
                    {listingMode === 'surprise' ? 'Boxes (Qty):' : 'Plates / Packs:'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F6F0] border border-stone-300 text-stone-900 text-xs font-bold focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1 font-medium">Hours Open:</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newItemExpiryHours}
                    onChange={(e) => setNewItemExpiryHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F6F0] border border-stone-300 text-stone-900 text-xs font-bold focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1 font-medium">Pickup Slot:</label>
                  <input
                    type="text"
                    placeholder="9:30 - 11 PM"
                    value={newItemPickupSlot}
                    onChange={(e) => setNewItemPickupSlot(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#F9F6F0] border border-stone-300 text-stone-900 text-xs font-bold focus:outline-none focus:border-[#2D6A4F]"
                  />
                </div>
              </div>

              {/* Photo Selector + Normal File Upload */}
              <div>
                <label className="block text-xs text-stone-600 mb-1.5 font-medium flex items-center gap-1">
                  <ImageIcon className="size-3.5 text-[#f37021]" />
                  <span>Food Photo (Upload Your Own or Pick Preset):</span>
                </label>

                <div className="flex items-center gap-3 mb-2 p-2.5 rounded-2xl bg-[#FAF8F3] border border-[#E5DFD3]">
                  <img
                    src={newItemImageUrl || '/images/box-sweet.jpg'}
                    alt="Listing preview"
                    className="size-12 rounded-xl object-cover border border-stone-200 shrink-0 bg-white"
                  />
                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B4332] hover:bg-[#133326] text-white text-[11px] font-bold cursor-pointer transition-colors">
                      <Upload className="size-3.5" />
                      <span>{isUploadingPhoto ? 'Compressing...' : 'Upload Photo from Phone / PC'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingPhoto}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-stone-500 mt-1 truncate">
                      {newItemImageUrl.startsWith('data:image/')
                        ? 'Custom photo uploaded & compressed automatically'
                        : 'JPG, PNG or WebP — auto-compressed for fast loading'}
                    </p>
                  </div>
                </div>

                {photoUploadError && (
                  <p className="text-[11px] font-semibold text-red-600 mb-1.5">{photoUploadError}</p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { label: 'Sweet Box', url: '/images/box-sweet.jpg' },
                    { label: 'Savory / Spicy', url: '/images/box-savory.jpg' },
                    { label: 'Coffee / Hotel', url: '/images/box-coffee.jpg' },
                    { label: 'Pastries / Mart', url: '/images/hero-pastries.jpg' },
                  ].map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => {
                        setPhotoUploadError(null);
                        setNewItemImageUrl(p.url);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                        newItemImageUrl === p.url
                          ? 'bg-[#1B4332] text-white border-[#1B4332]'
                          : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {!newItemImageUrl.startsWith('data:image/') ? (
                  <input
                    type="text"
                    placeholder="/images/box-sweet.jpg or https://..."
                    value={newItemImageUrl}
                    onChange={(e) => setNewItemImageUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F9F6F0] border border-stone-300 text-stone-900 text-[11px] font-medium focus:outline-none focus:border-[#2D6A4F]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setNewItemImageUrl(PRESET_IMAGES[newItemCategory])}
                    className="text-[11px] font-bold text-[#f37021] hover:underline cursor-pointer"
                  >
                    Reset to default stock photo
                  </button>
                )}
              </div>

              {/* Live Value Preview */}
              <div className="p-3 rounded-xl bg-[#edf7ed] border border-[#c8e6c9] text-xs font-bold text-[#1B4332] flex items-center justify-between gap-2">
                <span className="truncate">{newItemName || 'New Closing Listing'}</span>
                <span className="shrink-0">
                  {listingMode === 'surprise'
                    ? `Worth ${formatCurrency(newItemPrice)} for ${formatCurrency(newBoxPrice)}`
                    : singlePricingMode === 'fixed'
                    ? `${formatCurrency(newItemPrice)} → ${formatCurrency(newBoxPrice)}`
                    : `Auto-Decay (-35% → -75%)`}
                </span>
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPhoto}
                  className="flex-1 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {listingMode === 'surprise' ? 'Publish Surprise Boxes' : 'Publish Closing Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NGO Food Rescue Donation Modal */}
      <DonationModal
        isOpen={!!donateDeal}
        onClose={() => setDonateDeal(null)}
        deal={donateDeal}
        onConfirmDonation={handleRecordDonation}
      />

      {/* ESG CSR Tax Relief Certificate Modal */}
      <CsrCertificateModal
        isOpen={!!activeCsrCertificate}
        onClose={() => setActiveCsrCertificate(null)}
        donation={activeCsrCertificate}
      />

    </div>
  );
};


