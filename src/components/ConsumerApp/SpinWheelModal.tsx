import React, { useState } from 'react';
import { X, Sparkles, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIZES = [
  '₨ 150 Bykea Credit',
  '+15% Extra Off',
  'Free Samosa Voucher',
  '₨ 250 Foodsave Cash',
  'Free Bykea Delivery',
  '+20% Mega Surplus Off',
];

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({ isOpen, onClose }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setWonPrize(null);

    const extraRounds = 5;
    const randomPrizeIndex = Math.floor(Math.random() * PRIZES.length);
    const degreesPerSlice = 360 / PRIZES.length;
    const targetDegree = rotation + extraRounds * 360 + randomPrizeIndex * degreesPerSlice;

    setRotation(targetDegree);

    setTimeout(() => {
      setSpinning(false);
      const prize = PRIZES[randomPrizeIndex];
      setWonPrize(prize);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#2D6A4F', '#4CAF50', '#FF9800', '#F9F6F0'],
      });
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#182230] border border-[#2D6A4F]/20 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col items-center text-center">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F9F6F0] dark:bg-[#1F2937] hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="size-5 text-[#FF9800]" />
          <h3 className="text-xl font-black text-[#1F2937] dark:text-[#F9F6F0] tracking-tight">Daily Spin-to-Save Wheel</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-medium">
          Spin the lucky wheel once a day for bonus Pakistan surplus savings!
        </p>

        {/* Wheel Container */}
        <div className="relative size-64 mb-6 flex items-center justify-center">
          
          {/* Pointer Needle */}
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[#FF9800] filter drop-shadow-md" />

          {/* Wheel Circle */}
          <div
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
            }}
            className="size-full rounded-full border-4 border-[#2D6A4F] shadow-xl relative overflow-hidden bg-[#F9F6F0] dark:bg-[#1F2937] flex items-center justify-center"
          >
            {PRIZES.map((prize, idx) => {
              const angle = (360 / PRIZES.length) * idx;
              return (
                <div
                  key={prize}
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center center',
                  }}
                  className="absolute inset-0 flex items-start justify-center pt-3 text-[10px] font-black tracking-tight"
                >
                  <span className="bg-white dark:bg-[#141c27] text-[#1F2937] dark:text-[#F9F6F0] px-2 py-0.5 rounded-full border border-[#2D6A4F]/25 truncate max-w-[90px] shadow-2xs">
                    {prize}
                  </span>
                </div>
              );
            })}

            {/* Center Hub */}
            <div className="absolute size-14 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-white z-10">
              🎰
            </div>
          </div>
        </div>

        {/* Won Prize Banner */}
        {wonPrize && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-[#4CAF50]/15 border border-[#4CAF50]/30 text-xs font-bold text-[#2D6A4F] dark:text-[#4CAF50] animate-in zoom-in-95 duration-200">
            🎉 Congratulations! You won: <strong className="text-[#FF9800]">{wonPrize}</strong>!
          </div>
        )}

        {/* Spin Action Button */}
        <button
          onClick={handleSpin}
          disabled={spinning}
          className={`w-full py-3 rounded-full font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
            spinning
              ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-[#FF9800] hover:bg-[#f57c00] text-white shadow-[#FF9800]/30 active:scale-95'
          }`}
        >
          <Gift className="size-4" />
          <span>{spinning ? 'Spinning the Wheel...' : 'Spin the Wheel Now'}</span>
        </button>

      </div>
    </div>
  );
};
