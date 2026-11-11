import React, { useState } from 'react';
import { CloudRain, AlertTriangle, Zap, CheckCircle2, Thermometer, Eye } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { sounds } from '../../lib/soundEffects';

interface ZoneRisk {
  id: string;
  name: string;
  category: string;
  itemsAtRiskCount: number;
  atRiskValuePkr: number;
  riskLevel: 'Low' | 'Medium' | 'Critical';
  riskPercent: number;
  temperatureC: number;
  recommendation: string;
}

export const DigitalTwinCockpit: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<string>('bakery');
  const [isPreemptiveDeployed, setIsPreemptiveDeployed] = useState<boolean>(false);

  const zones: ZoneRisk[] = [
    {
      id: 'bakery',
      name: 'Aisle 1: Bakery & Artisanal Breads',
      category: 'Bakery',
      itemsAtRiskCount: 42,
      atRiskValuePkr: 18900,
      riskLevel: 'Critical',
      riskPercent: 88,
      temperatureC: 24.2,
      recommendation: 'Preemptive 65% discount trigger at 3:00 PM before evening footfall drop.',
    },
    {
      id: 'produce',
      name: 'Aisle 2: Fresh Organic Produce & Mangoes',
      category: 'Produce',
      itemsAtRiskCount: 65,
      atRiskValuePkr: 24500,
      riskLevel: 'Critical',
      riskPercent: 82,
      temperatureC: 18.5,
      recommendation: 'Bundle into Surplus Mystery Bags (Gold Tier) at ₨ 599.',
    },
    {
      id: 'dairy',
      name: 'Aisle 3: Dairy, Cheeses & Yogurts',
      category: 'Dairy',
      itemsAtRiskCount: 18,
      atRiskValuePkr: 9800,
      riskLevel: 'Medium',
      riskPercent: 52,
      temperatureC: 4.1,
      recommendation: 'Step-decay to 40% OFF at 6:00 PM.',
    },
    {
      id: 'deli',
      name: 'Aisle 4: Hot Deli, BBQ & Prepared Meals',
      category: 'Restaurant',
      itemsAtRiskCount: 14,
      atRiskValuePkr: 12400,
      riskLevel: 'Medium',
      riskPercent: 44,
      temperatureC: 65.0,
      recommendation: 'Flash 50% discount for dinner commute window (7:00 PM - 9:00 PM).',
    },
  ];

  const activeZone = zones.find((z) => z.id === selectedZone) || zones[0];
  const totalAtRiskPkr = zones.reduce((sum, z) => sum + z.atRiskValuePkr, 0);

  const handleDeployPreemptive = () => {
    setIsPreemptiveDeployed(true);
    sounds.playLaserBeep();
    sounds.playSuccessFanfare();
  };

  return (
    <div className="bg-white dark:bg-[#182230] p-6 lg:p-8 rounded-3xl border border-[#e5e0d8] dark:border-white/10 flex flex-col gap-6 shadow-2xs">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-stone-900 dark:text-white">Store Aisle Spoilage Risk Forecaster</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30 flex items-center gap-1">
              <Eye className="size-3 text-[#2e7d32]" />
              24h Advance Prediction
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Simulates supermarket floor inventory dynamics using local weather forecasts and footfall patterns.
          </p>
        </div>

        {/* Weather Intelligence Feed */}
        <div className="p-3 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#fff8e1] text-[#b78103] flex items-center justify-center">
            <CloudRain className="size-5 text-[#f37021] animate-bounce" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-stone-900 dark:text-white block">Monsoon Rain Forecast Tomorrow</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">Lahore: -40% foot traffic predicted after 2:00 PM</span>
          </div>
        </div>
      </div>

      {/* Store Aisle Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            onClick={() => {
              setSelectedZone(zone.id);
              sounds.playAlertPing();
            }}
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${
              selectedZone === zone.id
                ? 'bg-[#1b4332] text-white border-[#1b4332] shadow-md scale-102'
                : 'bg-[#f7f5f0] dark:bg-stone-900/60 border-[#e8e2d8] dark:border-stone-800 hover:border-stone-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                zone.riskLevel === 'Critical'
                  ? selectedZone === zone.id ? 'bg-white/20 text-white' : 'bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]'
                  : selectedZone === zone.id ? 'bg-white/20 text-white' : 'bg-[#fff8e1] text-[#b78103] border border-[#ffecb3]'
              }`}>
                {zone.riskLevel} Risk ({zone.riskPercent}%)
              </span>
              <span className={`text-[10px] font-mono flex items-center gap-0.5 ${
                selectedZone === zone.id ? 'text-[#85e3a8]' : 'text-stone-500 dark:text-stone-400'
              }`}>
                <Thermometer className="size-3" />
                {zone.temperatureC}°C
              </span>
            </div>

            <h4 className={`text-xs font-bold mb-1 ${selectedZone === zone.id ? 'text-white' : 'text-stone-900 dark:text-white'}`}>
              {zone.name.split(':')[0]}
            </h4>
            <p className={`text-[11px] mb-2 ${selectedZone === zone.id ? 'text-white/80' : 'text-stone-500 dark:text-stone-400'}`}>
              {zone.name.split(':')[1]}
            </p>

            <div className={`flex items-center justify-between text-xs pt-2 border-t font-mono ${
              selectedZone === zone.id ? 'border-white/20' : 'border-stone-200 dark:border-stone-800'
            }`}>
              <span className={selectedZone === zone.id ? 'text-white/80' : 'text-stone-500'}>{zone.itemsAtRiskCount} items</span>
              <span className={`font-bold ${selectedZone === zone.id ? 'text-[#fbc02d]' : 'text-[#f37021]'}`}>{formatCurrency(zone.atRiskValuePkr)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Zone Deep Dive & Preemptive Action Cockpit */}
      <div className="p-6 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="size-4 text-[#f37021]" />
            <h4 className="text-sm font-black text-stone-900 dark:text-white">{activeZone.name}</h4>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-3">
            Smart Recommendation: <strong className="text-[#f37021]">{activeZone.recommendation}</strong>
          </p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-stone-600 dark:text-stone-300">Total Store Spoilage Exposure: <strong className="text-stone-900 dark:text-white">{formatCurrency(totalAtRiskPkr)}</strong></span>
            <span className="text-[#2e7d32] dark:text-[#81c784]">Protected Revenue: <strong>{formatCurrency(Math.round(totalAtRiskPkr * 0.72))}</strong></span>
          </div>
        </div>

        <div>
          {isPreemptiveDeployed ? (
            <div className="p-3.5 rounded-xl bg-[#edf7ed] dark:bg-[#1b4332]/40 border border-[#c8e6c9] text-[#2e7d32] dark:text-[#81c784] text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="size-5" />
              <span>Preemptive Schedules Active in POS!</span>
            </div>
          ) : (
            <button
              onClick={handleDeployPreemptive}
              className="px-6 py-3.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <Zap className="size-4 text-[#85e3a8]" />
              <span>Deploy Preemptive Schedules</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
