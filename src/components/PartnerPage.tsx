import React, { useState } from 'react';
import {
  Store,
  Zap,
  Banknote,
  QrCode,
  ArrowRight,
  AlertCircle,
  Phone,
  Clock,
} from 'lucide-react';
import { submitPartnerLeadApi } from '../services/api';

interface PartnerPageProps {
  onOpenMerchantRegister: () => void;
  onOpenStoreLogin?: () => void;
  onBackToDeals: () => void;
}

const BENEFITS = [
  {
    icon: Banknote,
    title: 'Keep Cash Tonight (0% Launch Fee)',
    desc: 'Collect Cash on Pickup directly at your counter the same evening — zero weekly payout delays during our launch phase.',
  },
  {
    icon: Zap,
    title: 'Fast Approval & Setup',
    desc: 'Apply in 30 seconds — once approved via WhatsApp or email, start listing closing boxes in under 2 minutes.',
  },
  {
    icon: QrCode,
    title: 'Zero Extra POS Hardware Needed',
    desc: 'Your cashier verifies customer PK-XXXXX codes on any phone or counter browser in 5 seconds.',
  },
  {
    icon: Clock,
    title: 'Sell Exact Items or Surprise Boxes',
    desc: 'Avoid customer complaints: tag items as Sweet, Savory, or Coffee & Drinks, and set your exact closing pickup window.',
  },
];

export const PartnerPage: React.FC<PartnerPageProps> = ({
  onOpenMerchantRegister,
  onOpenStoreLogin,
  onBackToDeals,
}) => {
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<'bakery' | 'cafe' | 'restaurant' | 'grocery' | 'dessert'>('bakery');
  const [city, setCity] = useState('Islamabad');
  const [sector, setSector] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedLead, setSubmittedLead] = useState<{ businessName: string; city: string; sector: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await submitPartnerLeadApi({
        ownerName: ownerName.trim(),
        businessName: businessName.trim(),
        businessType,
        city,
        sector: sector.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSubmittedLead(res.lead || { businessName: businessName.trim(), city, sector: sector.trim() });
    } catch (err: any) {
      setError(err?.message || 'Could not submit application. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: B2B Pitch Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex flex-col items-start gap-3">
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={onBackToDeals}
                className="text-xs font-bold text-[#1b4332] hover:underline inline-flex items-center gap-1"
              >
                ← Back to Live Deals
              </button>
              {onOpenStoreLogin && (
                <button
                  type="button"
                  onClick={onOpenStoreLogin}
                  className="text-xs font-bold text-[#e65100] hover:underline inline-flex items-center gap-1"
                >
                  <span>Already a partner? Store POS Login →</span>
                </button>
              )}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fff3e0] text-[#e65100] border border-[#ffe0b2] text-xs font-black">
              <Store className="size-3.5" />
              <span>For Bakeries, Cafés &amp; Restaurants</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#171916] tracking-tight leading-[1.06]">
              Turn Closing-Hour Surplus Into{' '}
              <span className="font-serif-display italic font-semibold text-[#1b4332]">
                Revenue &amp; New Walk-Ins
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
              Built for busy spots in <strong>Islamabad (F-6, F-7, Blue Area, H-12), Rawalpindi, Lahore &amp; Karachi</strong>.
              Attract university students &amp; young professionals before closing without discounting full-day menu prices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white border border-[#E7E2D8] rounded-3xl p-5 space-y-2.5 shadow-[0_6px_20px_-10px_rgba(23,25,22,0.06)]">
                  <div className="size-10 rounded-2xl bg-[#edf7ed] text-[#1b4332] flex items-center justify-center">
                    <Icon className="size-4.5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-[#171916]">{b.title}</h3>
                  <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-medium">{b.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="p-5 rounded-3xl bg-[#1b4332] text-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black">Already approved by our team?</h3>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  Received your approval email or WhatsApp confirmation? Sign in to open your Store POS counter.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenStoreLogin || onOpenMerchantRegister}
                className="px-4 py-2.5 rounded-xl bg-[#f37021] hover:bg-[#e26115] text-white text-xs font-black shrink-0 inline-flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Store POS Login</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
            <div className="pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-100">
              <span>New bakery or café? Apply on the right →</span>
              <span className="font-bold text-[#a7f3d0]">0% Launch Commission</span>
            </div>
          </div>
        </div>

        {/* Right: 30-Second Partner Application Card */}
        <div className="lg:col-span-6 bg-white border border-[#e5e0d8] rounded-3xl p-6 sm:p-8 shadow-sm">
          {submittedLead ? (
            <div className="text-center py-8 space-y-4">
              <div className="size-16 rounded-full bg-[#fff8e1] text-[#e65100] border border-[#ffe0b2] flex items-center justify-center mx-auto">
                <Clock className="size-8" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff3e0] text-[#c2410c] border border-[#fed7aa] text-[11px] font-black uppercase tracking-wider">
                Pending Verification
              </span>
              <h2 className="text-2xl font-black text-stone-900">Application Under Review!</h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Thanks for applying for <strong>{submittedLead.businessName}</strong> ({submittedLead.sector},{' '}
                {submittedLead.city}). Please wait while our BiteHour team verifies your bakery details.
              </p>
              <div className="p-4 rounded-2xl bg-[#f7f5f0] border border-[#e8e2d8] text-xs text-stone-700 font-medium max-w-md mx-auto">
                Once approved, you will receive an <strong>email or WhatsApp confirmation</strong> unlocking access to your Store POS portal.
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 justify-center">
                <button
                  type="button"
                  onClick={onBackToDeals}
                  className="px-5 py-3 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white text-xs font-black cursor-pointer"
                >
                  ← Back to Live Deals
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedLead(null);
                    setBusinessName('');
                    setOwnerName('');
                    setPhone('');
                    setNotes('');
                  }}
                  className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  Submit Another Branch
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-stone-900">Sell With BiteHour</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Leave your store details — we help set up your menu, pricing decay, and counter pass verification.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Usman Tariq"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f5f0] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#1b4332]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone / WhatsApp *</label>
                  <div className="relative">
                    <Phone className="size-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="03001234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#f7f5f0] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#1b4332]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Bakery / Café / Store Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Crust & Bean Café"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f5f0] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#1b4332]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Business Type *</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f5f0] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#1b4332]"
                  >
                    <option value="bakery">Bakery</option>
                    <option value="cafe">Café / Coffee Shop</option>
                    <option value="dessert">Desserts / Patisserie</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="grocery">Grocery / Mart</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">City *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f5f0] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#1b4332]"
                  >
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Sector / Area *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. F-7 Markaz, Blue Area, H-12"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f5f0] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#1b4332]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="manager@yourbakery.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f5f0] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#1b4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Closing Time &amp; Surplus Items (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. We close at 11 PM with fresh pastries, croissants & sandwiches left over"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#f7f5f0] border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#1b4332]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#1b4332] hover:bg-[#133326] disabled:opacity-50 text-white font-black text-xs shadow-md transition-all"
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Partner Request →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
