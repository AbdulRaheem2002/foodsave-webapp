import React, { useState } from 'react';
import type { DealItem, RetailerStore, Reservation, DonationRecord } from '../../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShieldCheck, DollarSign, Leaf, Zap, Plus, TrendingUp, Edit3, Download, Scan, CheckCircle2, QrCode, X, Image as ImageIcon, Heart, MapPin } from 'lucide-react';

import { formatCurrency } from '../../lib/utils';
import { addRetailerItemApi, overridePriceApi, verifyPickupCodeApi, updateReservationStatusApi } from '../../services/api';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { DonationModal } from './DonationModal';
import { CsrCertificateModal } from './CsrCertificateModal';
import { DigitalTwinCockpit } from './DigitalTwinCockpit';
import { sounds } from '../../lib/soundEffects';

interface RetailerDashboardProps {
  stores: RetailerStore[];
  deals: DealItem[];
  reservations?: Reservation[];
  onAddItem: (item: Partial<DealItem>) => void;
  onRemoveItem: (id: string) => void;
  onUpdateDealPrice?: (dealId: string, newPricePkr: number) => void;
  onCollectReservation?: (reservationId: string) => void;
}

const PRESET_IMAGES = {
  grocery: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  restaurant: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
};

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({
  stores,
  deals,
  reservations = [],
  onAddItem,
  onRemoveItem,
  onUpdateDealPrice,
  onCollectReservation,
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || 'ret-1');
  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  const [isAddItemOpen, setIsAddItemOpen] = useState<boolean>(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState<boolean>(false);
  const [isVerifyPassOpen, setIsVerifyPassOpen] = useState<boolean>(false);
  const [donateDeal, setDonateDeal] = useState<DealItem | null>(null);
  const [activeCsrCertificate, setActiveCsrCertificate] = useState<DonationRecord | null>(null);
  const [donationsList, setDonationsList] = useState<DonationRecord[]>([]);

  const [overrideDealId, setOverrideDealId] = useState<string | null>(null);
  const [overridePriceInput, setOverridePriceInput] = useState<string>('');

  // Cashier Pass Redemption State
  const [verifyCodeInput, setVerifyCodeInput] = useState<string>('');
  const [verifiedPass, setVerifiedPass] = useState<any | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSuccessCollected, setIsSuccessCollected] = useState<boolean>(false);

  // Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'grocery' | 'bakery' | 'restaurant'>('grocery');
  const [newItemPrice, setNewItemPrice] = useState<number>(1200);
  const [newItemQuantity, setNewItemQuantity] = useState<number>(5);
  const [newItemExpiryHours, setNewItemExpiryHours] = useState<number>(2.0);
  const [newItemImageUrl, setNewItemImageUrl] = useState<string>(PRESET_IMAGES.grocery);

  // CSV Report Generator
  const handleExportCsvReport = () => {
    const headers = ['Listing ID', 'Item Name', 'Category', 'Original Price (PKR)', 'Discount Price (PKR)', 'Discount %', 'Quantity', 'Store City'];
    const rows = deals.map((d) => [
      d.id,
      `"${d.title}"`,
      d.category,
      d.originalPricePkr,
      d.currentPricePkr,
      `${d.discountPercent}%`,
      d.stockQuantity,
      d.location.city || 'Lahore',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Foodsave_Daily_Recovery_Report_${selectedStore.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSurplusItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    sounds.playAlertPing();
    const imgUrl = newItemImageUrl || PRESET_IMAGES[newItemCategory];

    try {
      await addRetailerItemApi({
        name: newItemName,
        category: newItemCategory,
        originalPricePkr: newItemPrice,
        quantity: newItemQuantity,
        expiryHoursLeft: newItemExpiryHours,
        imageUrl: imgUrl,
      });

      onAddItem({
        title: newItemName,
        category: newItemCategory,
        originalPricePkr: newItemPrice,
        currentPricePkr: Math.round(newItemPrice * 0.4),
        discountPercent: 60,
        expiryHoursLeft: newItemExpiryHours,
        stockQuantity: newItemQuantity,
        pickupDeadline: `Pick up within ${newItemExpiryHours} hrs`,
        distanceKm: 0.5,
        imageUrl: imgUrl,
        isVerified: true,
        location: { x: 50, y: 50, address: selectedStore.address, city: selectedStore.city },
        decaySchedule: [
          { hoursRemaining: 4, discountPercent: 30, pricePkr: Math.round(newItemPrice * 0.7) },
          { hoursRemaining: 2, discountPercent: 50, pricePkr: Math.round(newItemPrice * 0.5) },
          { hoursRemaining: 1, discountPercent: 75, pricePkr: Math.round(newItemPrice * 0.25) },
        ],
        hoursRemaining: newItemExpiryHours,
      });

      setIsAddItemOpen(false);
      setNewItemName('');
    } catch {
      onAddItem({
        title: newItemName,
        category: newItemCategory,
        originalPricePkr: newItemPrice,
        currentPricePkr: Math.round(newItemPrice * 0.4),
        discountPercent: 60,
        expiryHoursLeft: newItemExpiryHours,
        stockQuantity: newItemQuantity,
        pickupDeadline: `Pick up within ${newItemExpiryHours} hrs`,
        distanceKm: 0.5,
        imageUrl: imgUrl,
        isVerified: true,
        location: { x: 50, y: 50, address: selectedStore.address, city: selectedStore.city },
        decaySchedule: [],
        hoursRemaining: newItemExpiryHours,
      });
      setIsAddItemOpen(false);
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
    } catch {
      if (onUpdateDealPrice) onUpdateDealPrice(dealId, num);
      setOverrideDealId(null);
      setOverridePriceInput('');
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
      sounds.playSuccessFanfare();
      await updateReservationStatusApi(verifiedPass.id, 'collected');
      setIsSuccessCollected(true);
      if (onCollectReservation) {
        onCollectReservation(verifiedPass.id);
      }
    } catch {
      setIsSuccessCollected(true);
      if (onCollectReservation) {
        onCollectReservation(verifiedPass.id);
      }
    }
  };

  const handleRecordDonation = (record: DonationRecord) => {
    setDonationsList((prev) => [record, ...prev]);
    setActiveCsrCertificate(record);
    onRemoveItem(record.dealId);
  };

  const chartData = [
    { time: '4h left', timeDecay: 1200, flatPrice: 1200 },
    { time: '3h left', timeDecay: 900, flatPrice: 1200 },
    { time: '2h left', timeDecay: 600, flatPrice: 1200 },
    { time: '1h left', timeDecay: 350, flatPrice: 1200 },
    { time: '30m left', timeDecay: 180, flatPrice: 1200 },
    { time: 'Close', timeDecay: 100, flatPrice: 1200 },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-300">
      
      {/* Store Header & Multi-Branch Switcher */}
      <div className="bg-white dark:bg-[#182230] p-6 rounded-[2rem] border border-[#2D6A4F]/15 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-[#2D6A4F]/15 text-[#2D6A4F] dark:text-[#4CAF50] border border-[#2D6A4F]/30 flex items-center justify-center text-3xl font-bold shadow-xs">
            🏪
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1F2937] dark:text-[#F9F6F0] tracking-tight">{selectedStore.name}</h2>
              {selectedStore.isVerified && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#4CAF50]/15 text-[#2D6A4F] dark:text-[#4CAF50] border border-[#4CAF50]/30 flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-[#4CAF50]" />
                  Verified Store
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
              <MapPin className="size-3 text-[#2D6A4F] dark:text-[#4CAF50]" />
              {selectedStore.address}, {selectedStore.city} (Pakistan)
            </p>
          </div>
        </div>

        {/* Multi-Branch Selector & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Switcher Dropdown */}
          <div className="flex items-center gap-1 bg-[#F9F6F0] dark:bg-[#1F2937] p-1.5 rounded-full border border-[#2D6A4F]/15 text-xs shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2">Branch:</span>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-transparent text-[#2D6A4F] dark:text-[#4CAF50] text-xs font-bold focus:outline-none pr-2 cursor-pointer"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white">
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsVerifyPassOpen(true)}
            className="btn-claim px-4 py-2.5 text-xs font-black shadow-xs"
          >
            <QrCode className="size-4" />
            <span>Verify Customer Pass</span>
          </button>

          <button
            onClick={() => setIsBarcodeOpen(true)}
            className="px-4 py-2.5 rounded-full bg-[#F9F6F0] dark:bg-[#1F2937] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-[#2D6A4F]/15 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Scan className="size-4 text-[#FF9800]" />
            <span>Scan Barcode / OCR</span>
          </button>

          <button
            onClick={() => setIsAddItemOpen(true)}
            className="px-4 py-2.5 rounded-full bg-[#FF9800] hover:bg-[#f57c00] text-white font-black text-xs shadow-md shadow-[#FF9800]/25 flex items-center gap-1.5 transition-all transform active:scale-95"
          >
            <Plus className="size-4" />
            <span>List Surplus Item</span>
          </button>
        </div>
      </div>

      {/* Daily Recovery Total Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Metric 1: ₨ Recovered */}
        <div className="bg-white dark:bg-[#182230] p-5 rounded-2xl border border-[#2D6A4F]/15 dark:border-white/10 flex items-start justify-between shadow-2xs">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">Daily Recovery Total</span>
            <div className="text-2xl font-black text-[#FF9800] tracking-tight mb-1">
              {formatCurrency(selectedStore.totalRecoveredPkr)}
            </div>
            <span className="text-[11px] text-[#4CAF50] flex items-center gap-1 font-semibold">
              <TrendingUp className="size-3.5" /> Recovered Revenue
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FF9800]/15 text-[#FF9800]">
            <DollarSign className="size-6" />
          </div>
        </div>

        {/* Metric 2: Wasted Value Avoided */}
        <div className="bg-white dark:bg-[#182230] p-5 rounded-2xl border border-[#2D6A4F]/15 dark:border-white/10 flex items-start justify-between shadow-2xs">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">Wasted Value Diverted</span>
            <div className="text-2xl font-black text-[#2D6A4F] dark:text-[#4CAF50] tracking-tight mb-1">
              {formatCurrency(selectedStore.totalWastedValueAvoidedPkr)}
            </div>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <Leaf className="size-3.5 text-[#4CAF50]" /> Edible Food Rescued
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#2D6A4F]/15 text-[#2D6A4F] dark:text-[#4CAF50]">
            <Leaf className="size-6" />
          </div>
        </div>

        {/* Metric 3: NGO Charity Donations */}
        <div className="bg-white dark:bg-[#182230] p-5 rounded-2xl border border-[#2D6A4F]/15 dark:border-white/10 flex items-start justify-between shadow-2xs">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">NGO Rescue Donations</span>
            <div className="text-2xl font-black text-rose-500 tracking-tight mb-1">
              {donationsList.length} Dispatched
            </div>
            <span className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
              <Heart className="size-3.5 fill-rose-500" /> Saylani / Edhi / JDC
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-500">
            <Heart className="size-6" />
          </div>
        </div>

        {/* Metric 4: Rule Decay Proof */}
        <div className="bg-white dark:bg-[#182230] p-5 rounded-2xl border border-[#2D6A4F]/15 dark:border-white/10 flex items-start justify-between shadow-2xs">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">Auto Price Decay</span>
            <div className="text-xl font-black text-[#1F2937] dark:text-[#F9F6F0] tracking-tight mb-1">
              Rule Active
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              30% → 50% → 75% steps before expiry.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#4CAF50]/15 text-[#4CAF50]">
            <Zap className="size-6" />
          </div>
        </div>

      </div>

      {/* Auto-Generated Time-Decay Curve Graph */}
      <div className="bg-white dark:bg-[#182230] p-6 rounded-[2rem] border border-[#2D6A4F]/15 dark:border-white/10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-black text-[#1F2937] dark:text-[#F9F6F0] flex items-center gap-2">
              <span>Time-Decay Schedule Curve (Formula Decay)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lowers price dynamically in PKR (₨) as deadline approaches to match willing nearby buyers.
            </p>
          </div>
        </div>

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
      </div>

      {/* Predictive AI Digital Twin Spoilage Cockpit */}
      <DigitalTwinCockpit />

      {/* Active Surplus Listings Table */}
      <div className="bg-white dark:bg-[#182230] p-6 rounded-[2rem] border border-[#2D6A4F]/15 dark:border-white/10 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-[#1F2937] dark:text-[#F9F6F0] flex items-center gap-2">
            <span>Active Store Surplus Listings ({selectedStore.name.split(' ')[0]})</span>
            <span className="px-3 py-0.5 rounded-full text-xs bg-[#2D6A4F]/15 text-[#2D6A4F] dark:text-[#4CAF50] border border-[#2D6A4F]/30 font-bold">
              {deals.length} Active
            </span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsvReport}
              className="px-3.5 py-1.5 rounded-full bg-[#F9F6F0] dark:bg-[#1F2937] hover:bg-slate-200 border border-[#2D6A4F]/20 text-[#1F2937] dark:text-[#F9F6F0] text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Download className="size-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={() => setIsAddItemOpen(true)}
              className="px-4 py-1.5 rounded-full bg-[#FF9800] text-white text-xs font-bold hover:bg-[#f57c00] transition-colors flex items-center gap-1 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F6F0] dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 uppercase font-bold text-[10px] tracking-wider border-b border-[#2D6A4F]/15">
              <tr>
                <th className="p-3">Item Details</th>
                <th className="p-3">Category</th>
                <th className="p-3">Original Price</th>
                <th className="p-3">Current Price</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Quantity</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D6A4F]/10 dark:divide-white/10">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-[#F9F6F0]/60 dark:hover:bg-[#1F2937]/50 transition-colors">
                  <td className="p-3 font-semibold text-[#1F2937] dark:text-[#F9F6F0] flex items-center gap-3">
                    <img src={deal.imageUrl} alt={deal.title} className="size-10 rounded-xl object-cover border border-[#2D6A4F]/15" />
                    <div>
                      <p className="font-bold text-xs truncate max-w-xs">{deal.title}</p>
                      <span className="text-[10px] text-slate-500">{deal.pickupDeadline}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F9F6F0] dark:bg-[#1F2937] border border-[#2D6A4F]/20 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">
                      {deal.category}
                    </span>
                  </td>
                  <td className="p-3 line-through text-slate-400">
                    {formatCurrency(deal.originalPricePkr)}
                  </td>
                  <td className="p-3 font-black text-[#FF9800] text-sm">
                    {formatCurrency(deal.currentPricePkr)}
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FF9800]/15 text-[#FF9800] border border-[#FF9800]/30">
                      {deal.discountPercent}% OFF
                    </span>
                  </td>
                  <td className="p-3 font-bold text-[#1F2937] dark:text-[#F9F6F0]">
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
                          className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300"
                          title="Override Price"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onRemoveItem(deal.id)}
                        className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300"
                        title="Remove Listing"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashier Verification Modal */}
      {isVerifyPassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md glass-panel border border-emerald-500/60 rounded-3xl p-6 shadow-2xl overflow-hidden bg-[#09150e]">
            
            <button
              onClick={() => {
                setIsVerifyPassOpen(false);
                setVerifiedPass(null);
                setVerifyError(null);
                setIsSuccessCollected(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <QrCode className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cashier Counter Pass Verification</h3>
                <p className="text-xs text-emerald-300/70">Verify customer pickup code PK-XXXXX</p>
              </div>
            </div>

            <form onSubmit={handleVerifyPickupCode} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                placeholder="Enter Code (e.g. PK-84920)"
                value={verifyCodeInput}
                onChange={(e) => setVerifyCodeInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-700 text-amber-300 font-mono text-sm font-bold placeholder-emerald-400/40 uppercase"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg transition-all"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            {verifyError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold mb-4">
                ❌ {verifyError}
              </div>
            )}

            {verifiedPass && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-600/80 flex flex-col gap-3 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-emerald-900 pb-2">
                  <span className="font-mono text-xs font-bold text-amber-300">
                    Code: #{verifiedPass.pickupCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ✓ Valid Pass
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-white font-bold">{verifiedPass.dealTitle}</p>
                  <p className="text-emerald-300/80">Quantity: <strong>{verifiedPass.quantity} pcs</strong></p>
                  <p className="text-emerald-300/80">Amount: <strong className="text-amber-300">{formatCurrency(verifiedPass.totalPricePkr)}</strong></p>
                  <p className="text-emerald-300/80">Payment: <strong>{verifiedPass.paymentMethod}</strong> ({verifiedPass.paymentStatus})</p>
                </div>

                {isSuccessCollected ? (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
                    <CheckCircle2 className="size-4" />
                    <span>Item Handover Confirmed!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleConfirmCollection}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg transition-all"
                  >
                    Confirm Customer Handover (Collect)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4">List New Surplus Item</h3>
            <form onSubmit={handleCreateSurplusItem} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-emerald-300/80 mb-1 font-medium">Item Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Chaunsa Mangoes Box"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-white text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-emerald-300/80 mb-1 font-medium">Category:</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setNewItemCategory(cat);
                      setNewItemImageUrl(PRESET_IMAGES[cat as keyof typeof PRESET_IMAGES]);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-white text-xs font-bold"
                  >
                    <option value="grocery">Grocery</option>
                    <option value="bakery">Bakery</option>
                    <option value="restaurant">Restaurant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-emerald-300/80 mb-1 font-medium">Original Price (PKR):</label>
                  <input
                    type="number"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-emerald-300/80 mb-1 font-medium">Quantity:</label>
                  <input
                    type="number"
                    required
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-emerald-300/80 mb-1 font-medium">Hours to Deadline:</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newItemExpiryHours}
                    onChange={(e) => setNewItemExpiryHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* Photo Upload / Preset Selector */}
              <div>
                <label className="block text-xs text-emerald-300/80 mb-1 font-medium flex items-center gap-1">
                  <ImageIcon className="size-3.5 text-amber-400" />
                  <span>Item Photo (URL or Presets):</span>
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-white text-xs font-bold mb-2"
                />
                <div className="flex gap-2">
                  {(['grocery', 'bakery', 'restaurant'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewItemImageUrl(PRESET_IMAGES[cat])}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-[10px] text-emerald-300 hover:text-white capitalize"
                    >
                      {cat} photo
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg"
                >
                  Publish &amp; Apply Time-Decay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onAddItem={onAddItem}
      />

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


