import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, MapPin, Phone, Sparkles } from 'lucide-react';
import { subscribeDropAlertApi } from '../../services/api';
import type { DropAlertPreference } from '../../types';

const ISLAMABAD_DROP_SECTORS = [
  'All Islamabad',
  'F-6',
  'F-7',
  'Blue Area',
  'F-10',
  'E-11',
  'NUST / H-12',
  'I-8 / DHA',
] as const;

const PREFERENCE_OPTIONS: Array<{ id: DropAlertPreference; label: string }> = [
  { id: 'all', label: 'All Evening Boxes' },
  { id: 'sweet', label: 'Sweet Pastries' },
  { id: 'savory', label: 'Savory & Meals' },
  { id: 'drinks', label: 'Coffee & Combos' },
];

interface DropAlertSignupCardProps {
  defaultSector?: string;
}

function resolveInitialSector(sector?: string): string {
  if (!sector || sector === 'All Areas') return 'All Islamabad';
  if ((ISLAMABAD_DROP_SECTORS as readonly string[]).includes(sector)) return sector;
  return 'All Islamabad';
}

export const DropAlertSignupCard: React.FC<DropAlertSignupCardProps> = ({ defaultSector }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState(() => resolveInitialSector(defaultSector));
  const [hasEditedSector, setHasEditedSector] = useState(false);
  const [preference, setPreference] = useState<DropAlertPreference>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedMsg, setConfirmedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!hasEditedSector) {
      setSector(resolveInitialSector(defaultSector));
    }
  }, [defaultSector, hasEditedSector]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await subscribeDropAlertApi({
        name: name.trim() || undefined,
        phone,
        city: 'Islamabad',
        sector,
        preference,
      });
      setConfirmedMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to save alert right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-[2rem] bg-white border border-[#E7E2D8] p-6 sm:p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Editorial Pitch */}
        <div className="lg:col-span-5 space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFF3E6] text-[#C85610] border border-[#f37021]/20">
            <BellRing className="size-3.5" />
            7:30 PM – 10:30 PM Drop Alerts
          </span>

          <h3 className="text-2xl sm:text-[28px] font-extrabold text-[#171916] tracking-tight leading-tight">
            Get notified when{' '}
            <span className="font-serif-display italic font-semibold text-[#1B4332]">
              your sector drops
            </span>
          </h3>

          <p className="text-sm text-[#666960] leading-relaxed">
            Closing-hour bakery boxes sell out fast in Islamabad. Drop your WhatsApp number once and
            we will ping you only when fresh surplus boxes go live in your sector.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-[#40433C]">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="size-3.5 text-[#f37021]" />
              Zero spam — evening drops only
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-[#1B4332]" />
              Islamabad sectors
            </span>
          </div>
        </div>

        {/* Right Form */}
        <div className="lg:col-span-7">
          {confirmedMsg ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#ECFDF3] border border-[#BBF7D0] space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-[#15803D] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-extrabold text-[#14532D]">{confirmedMsg}</h4>
                  <p className="text-xs text-[#166534] mt-1">
                    We saved <strong>{phone}</strong> for <strong>{sector}</strong> (
                    {PREFERENCE_OPTIONS.find((p) => p.id === preference)?.label}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmedMsg(null)}
                className="px-4 py-2 rounded-full bg-white text-[#14532D] border border-[#BBF7D0] text-xs font-bold hover:bg-[#F0FDF4] transition-colors cursor-pointer"
              >
                Update number, sector or box preference
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E7E2D8] space-y-4"
            >
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#666960]">
                    WhatsApp Number *
                  </span>
                  <div className="relative">
                    <Phone className="size-3.5 text-[#7A7D75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300 1234567"
                      className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-white border border-[#E2DDD2] text-sm font-medium text-[#171916] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25"
                    />
                  </div>
                </label>

                <label className="block space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#666960]">
                    Islamabad Sector
                  </span>
                  <select
                    value={sector}
                    onChange={(e) => {
                      setHasEditedSector(true);
                      setSector(e.target.value);
                    }}
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#E2DDD2] text-sm font-semibold text-[#171916] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25"
                  >
                    {ISLAMABAD_DROP_SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#666960] block">
                  Craving Preference
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PREFERENCE_OPTIONS.map((opt) => {
                    const active = preference === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPreference(opt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#1B4332] text-white'
                            : 'bg-white text-[#40433C] border border-[#E2DDD2] hover:bg-[#F3EFE6]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First name (optional)"
                  className="sm:w-44 h-11 px-3.5 rounded-full bg-white border border-[#E2DDD2] text-xs font-medium text-[#171916] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 px-6 rounded-full bg-[#f37021] hover:bg-[#d95d12] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving your alert...' : 'Notify Me on Drop Nights'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
