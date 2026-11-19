import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  Share,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import {
  fetchPushConfigApi,
  sendTestPushApi,
  subscribeDropAlertApi,
  subscribePushApi,
  unsubscribePushApi,
} from '../../services/api';
import type { DropAlertPreference } from '../../types';
import {
  detectDeviceType,
  getExistingPushSubscription,
  isIosDevice,
  isPushSupported,
  isStandalonePwa,
  loadSavedPushPrefs,
  savePushPrefs,
  subscribeBrowserPush,
  togglePreferenceSelection,
  toggleSectorSelection,
  unsubscribeBrowserPush,
} from '../../lib/pushNotifications';
import { InstallPwaBanner } from '../InstallPwaBanner';

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

function resolveInitialSectors(sector?: string): string[] {
  if (!sector || sector === 'All Areas') return ['All Islamabad'];
  if ((ISLAMABAD_DROP_SECTORS as readonly string[]).includes(sector)) return [sector];
  return ['All Islamabad'];
}

function formatPreferencesSummary(prefs: DropAlertPreference[]): string {
  return prefs
    .map((id) => PREFERENCE_OPTIONS.find((opt) => opt.id === id)?.label || id)
    .join(', ');
}

interface PreferencePickersProps {
  sectors: string[];
  preferences: DropAlertPreference[];
  onToggleSector: (sector: string) => void;
  onTogglePreference: (pref: DropAlertPreference) => void;
}

const PreferencePickers: React.FC<PreferencePickersProps> = ({
  sectors,
  preferences,
  onToggleSector,
  onTogglePreference,
}) => (
  <div className="space-y-3.5">
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#666960]">
          Islamabad Sectors (Select 1 or more)
        </span>
        <span className="text-[11px] font-semibold text-[#1B4332]">
          {sectors.length === 1 && sectors[0] === 'All Islamabad'
            ? 'All areas'
            : `${sectors.length} selected`}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ISLAMABAD_DROP_SECTORS.map((sectorName) => {
          const active = sectors.includes(sectorName);
          return (
            <button
              key={sectorName}
              type="button"
              onClick={() => onToggleSector(sectorName)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-white text-[#40433C] border border-[#E2DDD2] hover:bg-[#F3EFE6]'
              }`}
            >
              {sectorName}
            </button>
          );
        })}
      </div>
    </div>

    <div className="space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#666960] block">
        Food &amp; Craving Types (Select 1 or more)
      </span>
      <div className="flex flex-wrap gap-1.5">
        {PREFERENCE_OPTIONS.map((opt) => {
          const active = preferences.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onTogglePreference(opt.id)}
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
  </div>
);

export const DropAlertSignupCard: React.FC<DropAlertSignupCardProps> = ({ defaultSector }) => {
  const [activeChannel, setActiveChannel] = useState<'push' | 'whatsapp'>('push');

  // Shared initial sector preference synced with feed filter unless user customized
  const [savedPrefs] = useState(() => loadSavedPushPrefs());
  const [hasEditedPush, setHasEditedPush] = useState(Boolean(savedPrefs));
  const [pushSectors, setPushSectors] = useState<string[]>(
    () => savedPrefs?.sectors || resolveInitialSectors(defaultSector)
  );
  const [pushPreferences, setPushPreferences] = useState<DropAlertPreference[]>(
    () => savedPrefs?.preferences || ['all']
  );

  const [pushConfig, setPushConfig] = useState<{
    loaded: boolean;
    configured: boolean;
    publicKey: string | null;
  }>({
    loaded: false,
    configured: false,
    publicKey: null,
  });

  const [pushSupported] = useState(() => isPushSupported());
  const [iosNeedsInstall] = useState(() => isIosDevice() && !isStandalonePwa());
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    () => (typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported')
  );
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Secondary WhatsApp waitlist state
  const [hasEditedWa, setHasEditedWa] = useState(false);
  const [waSectors, setWaSectors] = useState<string[]>(() => resolveInitialSectors(defaultSector));
  const [waPreferences, setWaPreferences] = useState<DropAlertPreference[]>(['all']);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [waSubmitting, setWaSubmitting] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [waConfirmedMsg, setWaConfirmedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!hasEditedPush) {
      setPushSectors(resolveInitialSectors(defaultSector));
    }
    if (!hasEditedWa) {
      setWaSectors(resolveInitialSectors(defaultSector));
    }
  }, [defaultSector, hasEditedPush, hasEditedWa]);

  useEffect(() => {
    let cancelled = false;

    const initPushState = async () => {
      try {
        const cfg = await fetchPushConfigApi();
        if (!cancelled) {
          setPushConfig({ loaded: true, configured: cfg.configured, publicKey: cfg.publicKey });
        }
      } catch {
        if (!cancelled) {
          setPushConfig({ loaded: true, configured: false, publicKey: null });
        }
      }

      if (isPushSupported()) {
        const existing = await getExistingPushSubscription();
        if (!cancelled && existing && Notification.permission === 'granted') {
          setActiveEndpoint(existing.endpoint);
          setPermissionState('granted');
        }
      }
    };

    void initPushState();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnableOrUpdatePush = async () => {
    setPushError(null);
    setPushFeedback(null);

    if (!pushConfig.publicKey) {
      setPushError('Push notifications are not enabled on this server yet.');
      return;
    }

    setPushBusy(true);
    try {
      const sub = await subscribeBrowserPush(pushConfig.publicKey);
      const res = await subscribePushApi({
        subscription: sub.toJSON(),
        city: 'Islamabad',
        sectors: pushSectors,
        preferences: pushPreferences,
        deviceType: detectDeviceType(),
      });
      savePushPrefs({ sectors: pushSectors, preferences: pushPreferences });
      setActiveEndpoint(sub.endpoint);
      setPermissionState('granted');
      setPushFeedback(res.message);
    } catch (err: any) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionState(Notification.permission);
      }
      setPushError(err?.message || 'Unable to enable notifications on this device.');
    } finally {
      setPushBusy(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!activeEndpoint) return;
    setPushError(null);
    setPushFeedback(null);
    setPushBusy(true);
    try {
      const res = await sendTestPushApi(activeEndpoint);
      setPushFeedback(res.message);
    } catch (err: any) {
      setPushError(err?.message || 'Could not send test notification.');
    } finally {
      setPushBusy(false);
    }
  };

  const handleTurnOffPush = async () => {
    setPushError(null);
    setPushFeedback(null);
    setPushBusy(true);
    try {
      const endpoint = (await unsubscribeBrowserPush()) || activeEndpoint;
      if (endpoint) {
        await unsubscribePushApi(endpoint);
      }
      setActiveEndpoint(null);
      setPushFeedback('Instant push notifications paused on this device.');
    } catch (err: any) {
      setPushError(err?.message || 'Could not disable notifications.');
    } finally {
      setPushBusy(false);
    }
  };

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaError(null);
    setWaSubmitting(true);
    try {
      const res = await subscribeDropAlertApi({
        name: name.trim() || undefined,
        phone,
        city: 'Islamabad',
        sector: waSectors.join(', '),
        sectors: waSectors,
        preference: waPreferences.length === 1 ? waPreferences[0] : 'all',
        preferences: waPreferences,
      });
      setWaConfirmedMsg(res.message);
    } catch (err: any) {
      setWaError(err?.message || 'Unable to save alert right now. Please try again.');
    } finally {
      setWaSubmitting(false);
    }
  };

  const pushReadyToUse = pushSupported && !iosNeedsInstall && (!pushConfig.loaded || pushConfig.configured);

  return (
    <section className="rounded-[2rem] bg-white border border-[#E7E2D8] p-6 sm:p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Editorial Pitch + PWA App Install */}
        <div className="lg:col-span-5 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFF3E6] text-[#C85610] border border-[#f37021]/20">
            <BellRing className="size-3.5" />
            Instant Area &amp; Food Alerts
          </span>

          <h3 className="text-2xl sm:text-[28px] font-extrabold text-[#171916] tracking-tight leading-tight">
            Get notified when{' '}
            <span className="font-serif-display italic font-semibold text-[#1B4332]">
              your sector drops
            </span>
          </h3>

          <p className="text-sm text-[#666960] leading-relaxed">
            Closing-hour bakery boxes sell out fast in Islamabad. Pick your sectors and favorite
            food types once to receive automatic device alerts on desktop or your phone the second
            fresh surplus boxes go live.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs font-semibold text-[#40433C]">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="size-3.5 text-[#f37021]" />
              Automatic drop alerts
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-[#1B4332]" />
              Multi-sector filters
            </span>
          </div>

          <div className="pt-1.5 flex flex-wrap items-center gap-2.5">
            <InstallPwaBanner />
          </div>
        </div>

        {/* Right Card: Instant Push (Primary) + WhatsApp (Secondary) */}
        <div className="lg:col-span-7">
          <div className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E7E2D8] space-y-4">
            {/* Channel Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#EFE9DD]">
              <button
                type="button"
                onClick={() => setActiveChannel('push')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeChannel === 'push'
                    ? 'bg-white text-[#1B4332] shadow-2xs'
                    : 'text-[#5D6057] hover:text-[#171916]'
                }`}
              >
                <Bell className="size-3.5" />
                <span>Instant Push Alerts</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChannel('whatsapp')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeChannel === 'whatsapp'
                    ? 'bg-white text-[#1B4332] shadow-2xs'
                    : 'text-[#5D6057] hover:text-[#171916]'
                }`}
              >
                <MessageCircle className="size-3.5" />
                <span>WhatsApp Alerts</span>
              </button>
            </div>

            {activeChannel === 'push' ? (
              <div className="space-y-4">
                {iosNeedsInstall ? (
                  <div className="p-4 rounded-xl bg-white border border-[#E2DDD2] space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Smartphone className="size-5 text-[#f37021] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-[#171916]">
                          Install BiteHour on iPhone / iPad for Push Alerts
                        </p>
                        <p className="text-xs text-[#666960] leading-relaxed">
                          Apple Safari requires adding BiteHour to your Home Screen first: tap{' '}
                          <Share className="inline size-3.5 text-[#1B4332]" /> <strong>Share</strong>{' '}
                          → <strong>Add to Home Screen</strong>, then open BiteHour from the app
                          icon to enable notifications.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveChannel('whatsapp')}
                      className="px-4 py-2 rounded-full bg-[#1B4332] text-white text-xs font-bold cursor-pointer"
                    >
                      Use WhatsApp Alerts Instead
                    </button>
                  </div>
                ) : !pushReadyToUse ? (
                  <div className="p-4 rounded-xl bg-white border border-[#E2DDD2] space-y-2.5">
                    <p className="text-xs font-bold text-[#171916]">
                      Instant browser notifications aren&apos;t available in this browser view.
                    </p>
                    <p className="text-xs text-[#666960]">
                      Open BiteHour in Chrome, Edge, Android, or use WhatsApp alerts to get pinged on
                      drop nights.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveChannel('whatsapp')}
                      className="px-4 py-2 rounded-full bg-[#1B4332] text-white text-xs font-bold cursor-pointer"
                    >
                      Switch to WhatsApp Alerts
                    </button>
                  </div>
                ) : (
                  <>
                    <PreferencePickers
                      sectors={pushSectors}
                      preferences={pushPreferences}
                      onToggleSector={(sectorName) => {
                        setHasEditedPush(true);
                        setPushSectors((prev) => toggleSectorSelection(prev, sectorName));
                      }}
                      onTogglePreference={(pref) => {
                        setHasEditedPush(true);
                        setPushPreferences((prev) => togglePreferenceSelection(prev, pref));
                      }}
                    />

                    {pushError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                        {pushError}
                      </div>
                    )}

                    {pushFeedback && (
                      <div className="p-3 rounded-xl bg-[#ECFDF3] border border-[#BBF7D0] text-xs font-bold text-[#14532D] flex items-center gap-2">
                        <CheckCircle2 className="size-4 shrink-0 text-[#15803D]" />
                        <span>{pushFeedback}</span>
                      </div>
                    )}

                    {permissionState === 'denied' && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                        <p className="text-xs font-semibold text-amber-900">
                          Notifications are blocked in your browser site settings. Tap the lock/tune
                          icon beside the URL and allow Notifications, or use WhatsApp alerts.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveChannel('whatsapp')}
                          className="px-3.5 py-1.5 rounded-full bg-white border border-amber-300 text-amber-900 text-xs font-bold cursor-pointer"
                        >
                          Switch to WhatsApp Alerts
                        </button>
                      </div>
                    )}

                    {activeEndpoint && permissionState === 'granted' ? (
                      <div className="p-4 rounded-xl bg-[#ECFDF3] border border-[#BBF7D0] space-y-3">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="size-5 text-[#15803D] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-extrabold text-[#14532D]">
                              Instant Drop Alerts Enabled on This Device
                            </p>
                            <p className="text-xs text-[#166534] mt-0.5">
                              Watching <strong>{pushSectors.join(', ')}</strong> •{' '}
                              {formatPreferencesSummary(pushPreferences)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={pushBusy}
                            onClick={handleEnableOrUpdatePush}
                            className="px-4 py-2 rounded-full bg-[#1B4332] hover:bg-[#133326] disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                          >
                            {pushBusy ? 'Saving...' : 'Save Updated Preferences'}
                          </button>
                          <button
                            type="button"
                            disabled={pushBusy}
                            onClick={handleSendTestNotification}
                            className="px-4 py-2 rounded-full bg-white hover:bg-[#F0FDF4] text-[#14532D] border border-[#BBF7D0] text-xs font-bold cursor-pointer"
                          >
                            Send Test Notification
                          </button>
                          <button
                            type="button"
                            disabled={pushBusy}
                            onClick={handleTurnOffPush}
                            className="px-3.5 py-2 rounded-full bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <BellOff className="size-3.5" />
                            <span>Turn Off</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={pushBusy || permissionState === 'denied'}
                        onClick={handleEnableOrUpdatePush}
                        className="w-full h-11 px-6 rounded-full bg-[#f37021] hover:bg-[#d95d12] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <BellRing className="size-4" />
                        <span>
                          {pushBusy
                            ? 'Activating Notifications...'
                            : 'Enable Instant Drop Notifications'}
                        </span>
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : waConfirmedMsg ? (
              <div className="p-5 rounded-xl bg-[#ECFDF3] border border-[#BBF7D0] space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-[#15803D] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-base font-extrabold text-[#14532D]">{waConfirmedMsg}</h4>
                    <p className="text-xs text-[#166534] mt-1">
                      We saved <strong>{phone}</strong> for{' '}
                      <strong>{waSectors.join(', ')}</strong> (
                      {formatPreferencesSummary(waPreferences)}).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWaConfirmedMsg(null)}
                  className="px-4 py-2 rounded-full bg-white text-[#14532D] border border-[#BBF7D0] text-xs font-bold hover:bg-[#F0FDF4] transition-colors cursor-pointer"
                >
                  Update number, sectors or cravings
                </button>
              </div>
            ) : (
              <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                {waError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                    {waError}
                  </div>
                )}

                <PreferencePickers
                  sectors={waSectors}
                  preferences={waPreferences}
                  onToggleSector={(sectorName) => {
                    setHasEditedWa(true);
                    setWaSectors((prev) => toggleSectorSelection(prev, sectorName));
                  }}
                  onTogglePreference={(pref) => {
                    setHasEditedWa(true);
                    setWaPreferences((prev) => togglePreferenceSelection(prev, pref));
                  }}
                />

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
                      First Name (optional)
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ayesha"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#E2DDD2] text-sm font-medium text-[#171916] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={waSubmitting}
                  className="w-full h-11 px-6 rounded-full bg-[#f37021] hover:bg-[#d95d12] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {waSubmitting ? 'Saving your alert...' : 'Notify Me via WhatsApp'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
