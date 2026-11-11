import React from 'react';
import type { DonationRecord } from '../../types';
import { X, Award, Download, CheckCircle2, QrCode } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface CsrCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: DonationRecord | null;
}

export const CsrCertificateModal: React.FC<CsrCertificateModalProps> = ({
  isOpen,
  onClose,
  donation,
}) => {
  if (!isOpen || !donation) return null;

  const handlePrintOrDownload = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#FAFAF8] dark:bg-[#182230] border border-[#e5e0d8] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Certificate Printable Canvas */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white text-stone-900 border-4 border-[#1b4332]/20 shadow-md relative flex flex-col items-center text-center">
          
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] font-bold text-[#1b4332] uppercase tracking-widest">
            <span>🇵🇰</span> Foodsave Zero-Waste Alliance
          </div>

          <div className="absolute top-4 right-4 text-[10px] font-mono font-bold text-stone-400">
            {donation.certificateNumber}
          </div>

          <div className="size-16 rounded-full bg-[#edf7ed] text-[#1b4332] border-2 border-[#1b4332]/30 flex items-center justify-center my-4 shadow-xs">
            <Award className="size-9" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#1b4332] mb-1">
            Certificate of Food Rescue &amp; CSR Impact
          </h2>
          <p className="text-xs text-stone-500 mb-6 uppercase tracking-wider font-semibold">
            Official Green Tax Relief &amp; Waste Diversion Voucher
          </p>

          <div className="w-full border-t border-b border-stone-200 py-4 mb-6 text-xs text-stone-700 leading-relaxed text-left flex flex-col gap-2">
            <p>
              This certifies that <strong>{donation.storeName}</strong> has diverted <strong>{donation.quantity} surplus food items</strong> ({donation.itemTitle}) valued at <strong>{formatCurrency(donation.estimatedValuePkr)}</strong> to registered charity partner <strong>{donation.charityName}</strong>.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2 rounded-lg bg-[#f7f5f0] border border-[#e8e2d8] text-center">
                <span className="text-[10px] text-stone-500 block font-bold">Meals Served</span>
                <span className="font-black text-sm text-[#f37021]">{donation.mealsServed} Meals</span>
              </div>
              <div className="p-2 rounded-lg bg-[#f7f5f0] border border-[#e8e2d8] text-center">
                <span className="text-[10px] text-stone-500 block font-bold">CO₂ Avoided</span>
                <span className="font-black text-sm text-[#2e7d32]">{donation.co2SavedKg} kg</span>
              </div>
              <div className="p-2 rounded-lg bg-[#f7f5f0] border border-[#e8e2d8] text-center">
                <span className="text-[10px] text-stone-500 block font-bold">Tax Code</span>
                <span className="font-black text-sm text-[#1b4332]">FBR Sec 61</span>
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-left">
              <QrCode className="size-12 text-stone-800" />
              <div>
                <span className="text-[10px] font-mono block text-stone-400">Scan to Verify</span>
                <span className="text-[10px] font-bold text-[#2e7d32] flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> FBR Compliant
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="border-b border-stone-400 w-32 mb-1" />
              <span className="text-[10px] font-bold text-stone-600 block">Authorized Signature</span>
              <span className="text-[9px] text-stone-400">{new Date(donation.dispatchedAt).toLocaleDateString()}</span>
            </div>
          </div>

        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handlePrintOrDownload}
            className="flex-1 py-3 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
          >
            <Download className="size-4" />
            <span>Download &amp; Print CSR Certificate (PDF)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
