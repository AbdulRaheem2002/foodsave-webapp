import React, { useState } from 'react';
import { X, Lock, Unlock, Thermometer, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { sounds } from '../../lib/soundEffects';

interface SmartLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartLockerModal: React.FC<SmartLockerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const assignedLockerNumber = 4;
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [chamberTemp] = useState<number>(3.8);

  if (!isOpen) return null;

  const handleUnlockLocker = () => {
    setIsUnlocking(true);
    sounds.playLaserBeep();

    setTimeout(() => {
      setIsUnlocking(false);
      setIsUnlocked(true);
      sounds.playSuccessFanfare();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center shadow-md font-black text-2xl flex-shrink-0">
            🧊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">Smart 24/7 Cold-Locker Hub</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#edf7ed] dark:bg-[#1b4332]/40 text-[#2e7d32] dark:text-[#81c784] border border-[#c8e6c9] dark:border-[#2e7d32]/30">
                Contactless Pickup
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Outdoor temperature-controlled locker bay at Al-Fatah Gulberg III (Lahore)
            </p>
          </div>
        </div>

        {/* Live Telemetry Sensors Banner */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs">
          <div className="p-3 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800">
            <span className="text-[10px] text-stone-500 uppercase font-semibold flex items-center justify-center gap-1">
              <Thermometer className="size-3 text-[#2e7d32]" />
              Chamber Temp
            </span>
            <span className="font-mono text-base font-black text-stone-900 dark:text-white">{chamberTemp}°C Chill</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800">
            <span className="text-[10px] text-stone-500 uppercase font-semibold flex items-center justify-center gap-1">
              <Sparkles className="size-3 text-[#2e7d32]" />
              UV-C Sanitation
            </span>
            <span className="font-mono text-base font-black text-[#2e7d32] dark:text-[#81c784]">Active (Sterile)</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800">
            <span className="text-[10px] text-stone-500 uppercase font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="size-3 text-[#f37021]" />
              Assigned Door
            </span>
            <span className="font-mono text-base font-black text-[#f37021]">Locker #{assignedLockerNumber}</span>
          </div>
        </div>

        {/* 12-Bay Locker Visualizer Grid */}
        <div className="p-5 rounded-3xl bg-[#f7f5f0] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 mb-6">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-stone-900 dark:text-white uppercase tracking-wider">Locker Grid Bay Status:</span>
            <span className="text-stone-400 text-[11px] font-medium">Outdoor Station #01</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((lockerNum) => {
              const isAssigned = lockerNum === assignedLockerNumber;
              return (
                <div
                  key={lockerNum}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    isAssigned
                      ? isUnlocked
                        ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#2e7d32] scale-105 shadow-md animate-pulse'
                        : 'bg-[#fff8e1] border-[#ffecb3] text-[#b78103] scale-105 shadow-md font-bold'
                      : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-400 opacity-60'
                  }`}
                >
                  {isAssigned ? (
                    isUnlocked ? <Unlock className="size-4 text-[#2e7d32]" /> : <Lock className="size-4 text-[#b78103]" />
                  ) : (
                    <Lock className="size-3.5" />
                  )}
                  <span className="font-mono font-bold text-xs">#{lockerNum.toString().padStart(2, '0')}</span>
                  <span className="text-[9px] font-semibold">
                    {isAssigned ? (isUnlocked ? 'OPEN' : 'YOURS') : 'OCCUPIED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unlock Action Button / Confirmation */}
        <div className="p-5 rounded-2xl bg-[#fcfbf9] dark:bg-stone-900 border border-[#e8e2d8] dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs">
            <h4 className="font-bold text-stone-900 dark:text-white mb-0.5">Surplus Package Waiting in Bay #{assignedLockerNumber}</h4>
            <p className="text-stone-500 dark:text-stone-400">
              Hold code: <strong className="font-mono text-[#f37021]">PK-84920</strong> • 15 Mins Hold
            </p>
          </div>

          <div>
            {isUnlocked ? (
              <div className="px-5 py-3 rounded-xl bg-[#2e7d32] text-white font-black text-xs flex items-center gap-2 shadow-md animate-bounce">
                <CheckCircle2 className="size-4" />
                <span>Door Latch Unlocked! Take Item</span>
              </div>
            ) : (
              <button
                onClick={handleUnlockLocker}
                disabled={isUnlocking}
                className="px-6 py-3 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-md flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Unlock className="size-4 text-[#85e3a8]" />
                <span>{isUnlocking ? 'Connecting Sensor...' : 'Unlock Locker Door #04 🔓'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
