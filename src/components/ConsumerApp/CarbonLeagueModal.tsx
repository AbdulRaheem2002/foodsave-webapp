import React, { useState } from 'react';
import { X, Download, Building2, GraduationCap, Users } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { sounds } from '../../lib/soundEffects';

interface CarbonLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LeagueEntry {
  rank: number;
  name: string;
  category: 'university' | 'corporate';
  city: string;
  membersCount: number;
  rescuedKg: number;
  co2AvoidedKg: number;
  savedPkr: number;
  badge: string;
}

const UNIVERSITY_LEAGUE: LeagueEntry[] = [
  { rank: 1, name: 'LUMS (Lahore University of Management Sciences)', category: 'university', city: 'Lahore', membersCount: 1420, rescuedKg: 3840, co2AvoidedKg: 9600, savedPkr: 2840000, badge: '🥇 Gold Eco-Leader' },
  { rank: 2, name: 'NUST (National University of Sciences & Tech)', category: 'university', city: 'Islamabad', membersCount: 1290, rescuedKg: 3210, co2AvoidedKg: 8025, savedPkr: 2410000, badge: '🥈 Silver Warrior' },
  { rank: 3, name: 'IBA (Institute of Business Administration)', category: 'university', city: 'Karachi', membersCount: 980, rescuedKg: 2450, co2AvoidedKg: 6125, savedPkr: 1890000, badge: '🥉 Bronze Guardian' },
  { rank: 4, name: 'FAST-NUCES (Lahore / Islamabad / Karachi)', category: 'university', city: 'National', membersCount: 890, rescuedKg: 2100, co2AvoidedKg: 5250, savedPkr: 1650000, badge: '⭐ Green Tech Vanguard' },
  { rank: 5, name: 'GIKI (Ghulam Ishaq Khan Institute)', category: 'university', city: 'Topi', membersCount: 620, rescuedKg: 1580, co2AvoidedKg: 3950, savedPkr: 1180000, badge: '🌿 Eco Innovator' },
];

const CORPORATE_LEAGUE: LeagueEntry[] = [
  { rank: 1, name: 'Jazz (VEON Pakistan Telecom)', category: 'corporate', city: 'Islamabad', membersCount: 2850, rescuedKg: 8400, co2AvoidedKg: 21000, savedPkr: 6800000, badge: '🏆 Corporate ESG Champion' },
  { rank: 2, name: 'Systems Limited', category: 'corporate', city: 'Lahore', membersCount: 2100, rescuedKg: 6100, co2AvoidedKg: 15250, savedPkr: 4950000, badge: '⭐ Tech Zero-Waste Titan' },
  { rank: 3, name: 'HBL (Habib Bank Limited)', category: 'corporate', city: 'Karachi', membersCount: 1750, rescuedKg: 4900, co2AvoidedKg: 12250, savedPkr: 3980000, badge: '🌱 Sustainable Finance Award' },
  { rank: 4, name: 'Netsol Technologies', category: 'corporate', city: 'Lahore', membersCount: 1200, rescuedKg: 3400, co2AvoidedKg: 8500, savedPkr: 2750000, badge: '✨ Carbon Offset Hero' },
];

export const CarbonLeagueModal: React.FC<CarbonLeagueModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'university' | 'corporate'>('university');

  if (!isOpen) return null;

  const currentList = activeTab === 'university' ? UNIVERSITY_LEAGUE : CORPORATE_LEAGUE;

  const handleDownloadEsgReport = () => {
    sounds.playAlertPing();
    const content = `=====================================================
FOODSAVE PAKISTAN — NATIONAL ZERO-WASTE CARBON AUDIT
=====================================================
Category: ${activeTab.toUpperCase()} LEAGUE
Generated: ${new Date().toLocaleDateString('en-PK')}
Verified Standard: GHG Protocol & FBR Section 61 Tax Exemption

TOP PARTICIPATING ENTITIES:
${currentList
  .map(
    (e) =>
      `Rank #${e.rank}: ${e.name} (${e.city})
 - Rescued Food: ${e.rescuedKg} kg
 - Carbon Offset: ${e.co2AvoidedKg} kg CO2e
 - Community Value Saved: PKR ${e.savedPkr.toLocaleString()}
 - Active Eco-Members: ${e.membersCount}
 - Badge: ${e.badge}\n`
  )
  .join('\n')}
=====================================================
Issued by Foodsave Pakistan Sustainable Technology Division
Contact: esg@foodsave.pk | www.foodsave.pk
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Foodsave_${activeTab}_ESG_Carbon_Audit_Report.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center shadow-md font-bold text-2xl flex-shrink-0">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">National Zero-Waste Carbon League</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30">
                  Pakistan Cup
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Live sustainability tournament between Pakistan’s top universities and tech enterprises
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadEsgReport}
            className="hidden sm:flex px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-bold items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="size-3.5 text-[#f37021]" />
            <span>ESG Audit Report</span>
          </button>
        </div>

        {/* League Selector Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setActiveTab('university');
              sounds.playLaserBeep();
            }}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'university'
                ? 'bg-[#1b4332] text-white shadow-xs font-black'
                : 'bg-[#f7f5f0] dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-[#e8e2d8] dark:border-stone-800'
            }`}
          >
            <GraduationCap className="size-4" />
            <span>🎓 University League (LUMS, NUST, IBA, FAST)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('corporate');
              sounds.playLaserBeep();
            }}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'corporate'
                ? 'bg-[#1b4332] text-white shadow-xs font-black'
                : 'bg-[#f7f5f0] dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-[#e8e2d8] dark:border-stone-800'
            }`}
          >
            <Building2 className="size-4" />
            <span>🏢 Corporate ESG League (Jazz, Systems, HBL)</span>
          </button>
        </div>

        {/* Scoreboard Table */}
        <div className="space-y-3">
          {currentList.map((entry) => (
            <div
              key={entry.name}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                entry.rank === 1
                  ? 'bg-[#edf7ed] dark:bg-[#1b4332]/25 border-[#c8e6c9] dark:border-[#2e7d32]/40 shadow-xs'
                  : 'bg-[#f7f5f0] dark:bg-stone-900/70 border-[#e8e2d8] dark:border-stone-800'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`size-9 rounded-xl flex items-center justify-center font-mono font-black text-sm ${
                  entry.rank === 1
                    ? 'bg-[#f37021] text-white'
                    : entry.rank === 2
                    ? 'bg-stone-300 text-stone-900'
                    : entry.rank === 3
                    ? 'bg-stone-700 text-white'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}>
                  #{entry.rank}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">{entry.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30">
                      {entry.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                    {entry.city} • <Users className="size-3 inline mr-1 text-[#f37021]" />{entry.membersCount} Eco-Members
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center justify-between sm:justify-end gap-6 text-xs border-t sm:border-t-0 border-stone-200 dark:border-stone-800 pt-2 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-stone-400 block uppercase font-semibold">Rescued Food</span>
                  <span className="font-bold text-stone-900 dark:text-white font-mono">{entry.rescuedKg.toLocaleString()} kg</span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-stone-400 block uppercase font-semibold">CO₂ Offset</span>
                  <span className="font-black text-[#2e7d32] dark:text-[#81c784] font-mono">{entry.co2AvoidedKg.toLocaleString()} kg CO₂</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#f37021] block uppercase font-semibold">Value Saved</span>
                  <span className="font-black text-[#1b4332] dark:text-[#81c784] font-mono">{formatCurrency(entry.savedPkr)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
