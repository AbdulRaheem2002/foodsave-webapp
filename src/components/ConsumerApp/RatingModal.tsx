import React, { useState } from 'react';
import { X, Star, CheckCircle2 } from 'lucide-react';
import type { DealItem } from '../../types';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealItem | null;
  onAddReview: (dealId: string, rating: number, comment: string) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  deal,
  onAddReview,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen || !deal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddReview(deal.id, rating, comment);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-3xl p-6 shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-2xl bg-[#fff8e1] dark:bg-stone-800 text-[#fbc02d] border border-[#ffecb3] dark:border-stone-700 flex items-center justify-center">
                <Star className="size-5 fill-[#fbc02d]" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white tracking-tight">Rate &amp; Review Store</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{deal.storeName}</p>
              </div>
            </div>

            {/* Star Rating Bar */}
            <div className="flex items-center justify-center gap-2 py-3 bg-[#f7f5f0] dark:bg-stone-900 rounded-2xl border border-[#e8e2d8] dark:border-stone-800">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`size-7 ${
                      star <= rating
                        ? 'text-[#fbc02d] fill-[#fbc02d]'
                        : 'text-stone-300 dark:text-stone-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Your Review Comment:
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Fresh bakery items and quick pickup at the counter..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#f7f5f0] dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#1b4332]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-md transition-all active:scale-95"
            >
              Submit Rating &amp; Review
            </button>
          </form>
        ) : (
          <div className="text-center py-6 flex flex-col items-center gap-2">
            <CheckCircle2 className="size-12 text-[#2e7d32] animate-bounce" />
            <h3 className="text-lg font-black text-stone-900 dark:text-white">Thank You for Your Feedback!</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Your rating helps build trust for Pakistani surplus food rescue.</p>
          </div>
        )}

      </div>
    </div>
  );
};
