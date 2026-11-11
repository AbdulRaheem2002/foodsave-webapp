import React, { useState } from 'react';
import type { DealItem, PakistanCity } from '../../types';
import { ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface DealMapProps {
  deals: DealItem[];
  selectedDeal: DealItem | null;
  selectedCity?: PakistanCity;
  onSelectDeal: (deal: DealItem) => void;
  onReserveDeal: (deal: DealItem) => void;
}

export const DealMap: React.FC<DealMapProps> = ({
  deals,
  selectedDeal,
  selectedCity = 'All Pakistan',
  onSelectDeal,
  onReserveDeal,
}) => {
  const [mapMode, setMapMode] = useState<'radar' | 'pins'>('radar');
  const [selectedRadius, setSelectedRadius] = useState<'5 km' | '10 km'>('5 km');

  const cityLabel = selectedCity === 'All Pakistan' ? 'Islamabad/Lahore' : selectedCity;

  return (
    <div className="relative w-full rounded-[1.75rem] overflow-hidden bg-[#071710] border border-[#1b3d2b] shadow-xl p-4 sm:p-6 text-white">
      
      {/* Header Bar matching Reference Mockup */}
      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#4CAF50] animate-ping" />
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              Live Geolocation Surplus Radar
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-0.5 font-medium">
            Scanning active stores across Islamabad, Lahore, &amp; Karachi in real-time
          </p>
        </div>

        {/* Right Toggle Pill Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <button
            onClick={() => setMapMode('radar')}
            className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all ${
              mapMode === 'radar'
                ? 'bg-[#1b4332] text-[#81c784] border border-[#2e7d32]'
                : 'bg-black/40 text-stone-400 border border-stone-800 hover:text-white'
            }`}
          >
            <span className="size-1.5 rounded-full bg-[#4CAF50]" />
            <span>Live Radar</span>
          </button>

          <button
            onClick={() => setMapMode('pins')}
            className={`px-3 py-1 rounded-full font-bold transition-all ${
              mapMode === 'pins'
                ? 'bg-[#1b4332] text-[#81c784] border border-[#2e7d32]'
                : 'bg-black/40 text-stone-400 border border-stone-800 hover:text-white'
            }`}
          >
            <span>Store Pins</span>
          </button>

          <button
            onClick={() => setSelectedRadius(selectedRadius === '5 km' ? '10 km' : '5 km')}
            className="px-3 py-1 rounded-full bg-black/40 text-stone-300 border border-stone-800 hover:border-stone-600 font-mono text-[11px] transition-all"
          >
            Radius: {selectedRadius}
          </button>
        </div>
      </div>

      {/* Radar Canvas with Concentric Circles & Rotating Sweep */}
      <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden bg-[#06120c] border border-[#163324] flex items-center justify-center">
        
        {/* Subtle dot matrix grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e4530_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

        {/* Concentric Radar Rings */}
        <div className="absolute size-[520px] rounded-full border border-[#1b3d2b]/60 pointer-events-none" />
        <div className="absolute size-[380px] rounded-full border border-[#1b3d2b] pointer-events-none" />
        <div className="absolute size-[250px] rounded-full border border-[#24523a] pointer-events-none" />
        <div className="absolute size-[130px] rounded-full border border-[#2d6648] pointer-events-none" />

        {/* Crosshair guidelines */}
        <div className="absolute inset-x-0 h-px bg-[#1b3d2b]/60 pointer-events-none" />
        <div className="absolute inset-y-0 w-px bg-[#1b3d2b]/60 pointer-events-none" />

        {/* Radar Sweep Animation */}
        {mapMode === 'radar' && (
          <div className="absolute size-[480px] rounded-full pointer-events-none opacity-40">
            <div className="radar-sweep" />
          </div>
        )}

        {/* Center Node: User Position */}
        <div className="relative z-10 flex flex-col items-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            <span className="absolute size-9 rounded-full bg-[#4CAF50]/30 animate-ping" />
            <div className="size-6 rounded-full bg-[#2D6A4F] border-2 border-white text-white flex items-center justify-center shadow-lg shadow-[#4CAF50]/40">
              <div className="size-2 rounded-full bg-white" />
            </div>
          </div>
          <span className="mt-1.5 text-[10px] font-bold text-white bg-black/80 px-2.5 py-0.5 rounded-full border border-[#2D6A4F] shadow-sm">
            Your Position ({cityLabel})
          </span>
        </div>

        {/* Deal Store Orbiting Nodes */}
        {deals.map((deal) => {
          const isSelected = selectedDeal?.id === deal.id;
          return (
            <div
              key={deal.id}
              style={{ left: `${deal.location.x}%`, top: `${deal.location.y}%` }}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            >
              <button
                onClick={() => onSelectDeal(deal)}
                className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all duration-300 shadow-md ${
                  isSelected
                    ? 'bg-[#FF9800] text-black border-white scale-110 ring-4 ring-[#FF9800]/40 z-30'
                    : 'bg-[#0f291e]/90 hover:bg-[#163c2c] text-white border-[#275b40] hover:scale-105'
                }`}
              >
                <span className="size-1.5 rounded-full bg-[#4CAF50]" />
                <span className="truncate max-w-[120px]">{deal.storeName.split(' ')[0]} {deal.storeName.split(' ')[1] || ''}</span>
                <span className="text-[#fbc02d] font-mono text-[10px]">
                  {formatCurrency(deal.currentPricePkr)} • {deal.distanceKm}km
                </span>
              </button>
            </div>
          );
        })}

        {/* Quick Preview Card when a Store Node is Clicked */}
        {selectedDeal && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 z-30 bg-[#0d2319]/95 backdrop-blur-md border border-[#275b40] p-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <img
              src={selectedDeal.imageUrl}
              alt={selectedDeal.title}
              className="size-14 rounded-xl object-cover border border-[#275b40] flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[#FF9800] uppercase block">
                {selectedDeal.discountPercent}% OFF • {selectedDeal.storeName}
              </span>
              <h4 className="text-xs font-bold text-white truncate">
                {selectedDeal.title}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-[#fbc02d]">
                  {formatCurrency(selectedDeal.currentPricePkr)}
                </span>
                <span className="text-[10px] line-through text-stone-400">
                  {formatCurrency(selectedDeal.originalPricePkr)}
                </span>
              </div>
            </div>

            <button
              onClick={() => onReserveDeal(selectedDeal)}
              className="px-3 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#23533e] text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
            >
              <ShoppingBag className="size-3" />
              <span>Claim</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
