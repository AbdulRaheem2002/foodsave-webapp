import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles, X, MapPin } from 'lucide-react';
import { sounds } from '../../lib/soundEffects';

interface ActivityEvent {
  id: string;
  userName: string;
  action: string;
  itemName: string;
  storeName: string;
  city: string;
  savedPkr: number;
  timeAgo: string;
}

const SAMPLE_EVENTS: Omit<ActivityEvent, 'id'>[] = [
  {
    userName: 'Ali Raza',
    action: 'rescued 5kg Chaunsa Mangoes',
    itemName: 'Chaunsa Mangoes Crate',
    storeName: 'Al-Fatah Gourmet',
    city: 'Gulberg, Lahore',
    savedPkr: 1350,
    timeAgo: 'Just now',
  },
  {
    userName: 'Fatima Noor',
    action: 'locked a 70% Bakery Pass',
    itemName: 'Artisan Sourdough & Croissant',
    storeName: 'Tehzeeb Bakery',
    city: 'Blue Area, Islamabad',
    savedPkr: 665,
    timeAgo: '1 min ago',
  },
  {
    userName: 'Zaid Siddiqui',
    action: 'unboxed a Gold Mystery Bag',
    itemName: 'Surplus Mystery Box',
    storeName: 'Al-Fatah Gourmet',
    city: 'Gulberg III, Lahore',
    savedPkr: 1801,
    timeAgo: '2 mins ago',
  },
  {
    userName: 'Sara Ahmed',
    action: 'dispatched Bykea Rider for',
    itemName: 'Dairy & Cheese Crate',
    storeName: 'Naheed Supermarket',
    city: 'Bahadurabad, Karachi',
    savedPkr: 943,
    timeAgo: '3 mins ago',
  },
  {
    userName: 'Bilal Tariq',
    action: 'slashed price with WhatsApp friends for',
    itemName: 'Chicken Biryani Family Pack',
    storeName: 'Espresso Bistro',
    city: 'Clifton, Karachi',
    savedPkr: 1540,
    timeAgo: '4 mins ago',
  },
];

export const SocialProofTicker: React.FC = () => {
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (isDismissed) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentEventIndex((prev) => (prev + 1) % SAMPLE_EVENTS.length);
        setIsVisible(true);
        // Play subtle alert chime softly for incoming live activity
        sounds.playAlertPing();
      }, 500);
    }, 7000);

    return () => clearInterval(interval);
  }, [isDismissed]);

  if (isDismissed) return null;

  const event = SAMPLE_EVENTS[currentEventIndex];

  return (
    <div
      className={`fixed bottom-5 left-5 z-40 max-w-xs sm:max-w-sm transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div className="p-3.5 rounded-2xl border border-[#2D6A4F]/20 dark:border-white/10 bg-white/95 dark:bg-[#182230]/95 shadow-xl backdrop-blur-md flex items-center gap-3">
        <div className="size-9 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
          <ShoppingBag className="size-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-[#1F2937] dark:text-[#F9F6F0] truncate">
              {event.userName}
            </span>
            <span className="text-[9px] text-[#FF9800] font-mono font-bold flex items-center gap-0.5">
              <Sparkles className="size-2.5" /> ₨ {event.savedPkr} saved
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
            {event.action} at <strong className="text-[#2D6A4F] dark:text-[#4CAF50]">{event.storeName}</strong>
          </p>

          <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="size-2.5 text-[#2D6A4F] dark:text-[#4CAF50]" />
            <span>{event.city} • {event.timeAgo}</span>
          </p>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          title="Dismiss live stream"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>

  );
};
