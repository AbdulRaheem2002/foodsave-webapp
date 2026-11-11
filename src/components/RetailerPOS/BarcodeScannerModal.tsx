import React, { useState } from 'react';
import type { DealItem } from '../../types';
import { X, QrCode, Scan, ArrowRight, Camera, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { sounds } from '../../lib/soundEffects';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Partial<DealItem>) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
}) => {
  const [scanMode, setScanMode] = useState<'barcode' | 'ocr-expiry'>('barcode');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<{
    title: string;
    category: any;
    originalPricePkr: number;
    stockQuantity: number;
    expiryHoursLeft: number;
    ocrText?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      sounds.playLaserBeep();

      if (scanMode === 'barcode') {
        setScannedResult({
          title: 'Fresh Baked Naan & Samosa Combo Box',
          category: 'bakery',
          originalPricePkr: 950,
          stockQuantity: 8,
          expiryHoursLeft: 2.0,
        });
      } else {
        setScannedResult({
          title: 'Gourmet Marinated BBQ Chicken Tikka',
          category: 'restaurant',
          originalPricePkr: 1650,
          stockQuantity: 5,
          expiryHoursLeft: 1.5,
          ocrText: 'EXP: 19/08/2026 21:00 • BATCH: LHR-9281',
        });
      }
    }, 1200);
  };

  const handlePublishListing = () => {
    if (!scannedResult) return;

    sounds.playSuccessFanfare();

    onAddItem({
      title: scannedResult.title,
      category: scannedResult.category,
      originalPricePkr: scannedResult.originalPricePkr,
      currentPricePkr: Math.round(scannedResult.originalPricePkr * 0.4),
      discountPercent: 60,
      expiryHoursLeft: scannedResult.expiryHoursLeft,
      stockQuantity: scannedResult.stockQuantity,
      pickupDeadline: `Pick up within ${scannedResult.expiryHoursLeft} hrs`,
      distanceKm: 0.5,
      imageUrl: scannedResult.category === 'bakery'
        ? 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      isVerified: true,
      location: { x: 50, y: 50, address: 'Gulberg III', city: 'Lahore' },
      decaySchedule: [
        { hoursRemaining: 3, discountPercent: 40, pricePkr: Math.round(scannedResult.originalPricePkr * 0.6) },
        { hoursRemaining: 2, discountPercent: 60, pricePkr: Math.round(scannedResult.originalPricePkr * 0.4) },
        { hoursRemaining: 1, discountPercent: 80, pricePkr: Math.round(scannedResult.originalPricePkr * 0.2) },
      ],
      hoursRemaining: scannedResult.expiryHoursLeft,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-1 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800">
          <button
            onClick={() => {
              setScanMode('barcode');
              setScannedResult(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              scanMode === 'barcode' ? 'bg-[#1b4332] text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Scan className="size-3.5" />
            <span>POS Barcode</span>
          </button>

          <button
            onClick={() => {
              setScanMode('ocr-expiry');
              setScannedResult(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              scanMode === 'ocr-expiry' ? 'bg-[#f37021] text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Camera className="size-3.5" />
            <span>Expiry Label OCR</span>
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="relative w-full h-44 rounded-2xl bg-[#fcfbf9] border border-stone-200 flex flex-col items-center justify-center overflow-hidden mb-4">
          {isScanning ? (
            <div className="flex flex-col items-center gap-2 text-[#1b4332]">
              <Scan className="size-12 animate-pulse text-[#f37021]" />
              <span className="text-xs font-mono font-bold animate-bounce">
                {scanMode === 'barcode' ? 'Scanning EAN Barcode...' : 'Camera OCR Parsing Label...'}
              </span>
            </div>
          ) : scannedResult ? (
            <div className="p-4 text-center">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] mb-2 inline-block">
                ✓ {scanMode === 'barcode' ? 'Barcode Matched' : 'OCR Parsed Successfully'}
              </span>
              <p className="text-sm font-bold text-stone-900">{scannedResult.title}</p>
              {scannedResult.ocrText && (
                <p className="text-[10px] font-mono text-purple-600 mt-0.5">{scannedResult.ocrText}</p>
              )}
              <p className="text-xs text-[#f37021] font-mono mt-1 font-bold">
                Original Price: {formatCurrency(scannedResult.originalPricePkr)} • {scannedResult.stockQuantity} pcs
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-stone-400">
              {scanMode === 'barcode' ? <QrCode className="size-12 opacity-60 text-stone-500" /> : <Camera className="size-12 opacity-60 text-[#f37021]" />}
              <p className="text-xs text-center max-w-xs px-4 text-stone-500">
                {scanMode === 'barcode'
                  ? 'Point barcode scanner or camera at packaging'
                  : 'Point camera at perishable expiry timestamp label'}
              </p>
              <button
                onClick={handleSimulateScan}
                className="mt-2 px-4 py-1.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
              >
                <Sparkles className="size-3.5 text-[#85e3a8]" />
                <span>Simulate {scanMode === 'barcode' ? 'Scan Barcode' : 'Expiry OCR'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={!scannedResult}
            onClick={handlePublishListing}
            className="flex-1 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all"
          >
            <span>Publish &amp; Apply Decay</span>
            <ArrowRight className="size-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
