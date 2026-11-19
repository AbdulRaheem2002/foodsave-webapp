import type { DropAlertPreference, PushDeviceType } from '../types';

const PUSH_PREFS_STORAGE_KEY = 'bitehour_push_prefs_v1';

export interface SavedPushPrefs {
  sectors: string[];
  preferences: DropAlertPreference[];
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches || Boolean(nav.standalone)
  );
}

export function detectDeviceType(): PushDeviceType {
  if (typeof window === 'undefined') return 'other';
  const ua = window.navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Windows|Macintosh|Linux/i.test(ua)) return 'desktop';
  return 'other';
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (err) {
    console.warn('Service worker registration skipped:', err);
    return null;
  }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await registerServiceWorker();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export async function subscribeBrowserPush(publicKey: string): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error('This browser does not support Web Push notifications.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const reg = (await registerServiceWorker()) || (await navigator.serviceWorker.ready);
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    return existing;
  }

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

export async function unsubscribeBrowserPush(): Promise<string | null> {
  const sub = await getExistingPushSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}

export function loadSavedPushPrefs(): SavedPushPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PUSH_PREFS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.sectors) && Array.isArray(parsed?.preferences)) {
      return {
        sectors: parsed.sectors,
        preferences: parsed.preferences,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function savePushPrefs(prefs: SavedPushPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PUSH_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

export function toggleSectorSelection(list: string[], value: string): string[] {
  if (value === 'All Islamabad') {
    return ['All Islamabad'];
  }
  const withoutAll = list.filter((s) => s !== 'All Islamabad');
  const exists = withoutAll.includes(value);
  const next = exists ? withoutAll.filter((s) => s !== value) : [...withoutAll, value];
  return next.length === 0 ? ['All Islamabad'] : next;
}

export function togglePreferenceSelection(
  list: DropAlertPreference[],
  value: DropAlertPreference
): DropAlertPreference[] {
  if (value === 'all') {
    return ['all'];
  }
  const withoutAll = list.filter((p) => p !== 'all');
  const exists = withoutAll.includes(value);
  const next = exists ? withoutAll.filter((p) => p !== value) : [...withoutAll, value];
  return next.length === 0 ? ['all'] : next;
}
