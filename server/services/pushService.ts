import * as webpushPkg from 'web-push';
import { PushSubscription, type DropPreferenceType } from '../models/PushSubscription.js';
import { memDb } from '../store/memDb.js';

const webpush = ((webpushPkg as any).default || webpushPkg) as typeof webpushPkg;

const ALLOWED_PREFERENCES: DropPreferenceType[] = ['all', 'sweet', 'savory', 'drinks'];
let vapidConfiguredForKeys: string | null = null;

export function getVapidPublicKey(): string | null {
  const key = String(process.env.VAPID_PUBLIC_KEY || '').trim();
  return key || null;
}

export function isPushConfigured(): boolean {
  return Boolean(
    String(process.env.VAPID_PUBLIC_KEY || '').trim() &&
      String(process.env.VAPID_PRIVATE_KEY || '').trim()
  );
}

export function ensureWebPushConfigured(): boolean {
  const publicKey = String(process.env.VAPID_PUBLIC_KEY || '').trim();
  const privateKey = String(process.env.VAPID_PRIVATE_KEY || '').trim();
  if (!publicKey || !privateKey) {
    return false;
  }

  const subject = String(process.env.VAPID_SUBJECT || 'mailto:alerts@bitehour.pk').trim();
  const cacheKey = `${subject}|${publicKey}|${privateKey}`;
  if (vapidConfiguredForKeys !== cacheKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfiguredForKeys = cacheKey;
  }
  return true;
}

export function normalizeSectorList(rawSectors?: unknown, fallbackSector?: unknown): string[] {
  const list: string[] = [];
  if (Array.isArray(rawSectors)) {
    for (const entry of rawSectors) {
      const cleaned = String(entry || '').trim().slice(0, 60);
      if (cleaned) list.push(cleaned);
    }
  } else if (typeof rawSectors === 'string' && rawSectors.trim()) {
    list.push(rawSectors.trim().slice(0, 60));
  }

  if (list.length === 0 && typeof fallbackSector === 'string' && fallbackSector.trim()) {
    for (const part of fallbackSector.split(',')) {
      const cleaned = part.trim().slice(0, 60);
      if (cleaned) list.push(cleaned);
    }
  }

  const deduped: string[] = [];
  for (const s of list) {
    if (!deduped.some((existing) => existing.toLowerCase() === s.toLowerCase())) {
      deduped.push(s);
    }
  }

  if (deduped.length === 0) return ['All Islamabad'];

  const hasAll = deduped.some((s) => {
    const lower = s.toLowerCase();
    return lower === 'all islamabad' || lower === 'all areas' || lower === 'all';
  });
  return hasAll && deduped.length === 1 ? ['All Islamabad'] : deduped;
}

export function normalizePreferenceList(
  rawPrefs?: unknown,
  fallbackPref?: unknown
): DropPreferenceType[] {
  const candidates: string[] = [];
  if (Array.isArray(rawPrefs)) {
    for (const entry of rawPrefs) {
      candidates.push(String(entry || '').trim().toLowerCase());
    }
  } else if (typeof rawPrefs === 'string' && rawPrefs.trim()) {
    candidates.push(rawPrefs.trim().toLowerCase());
  }

  if (candidates.length === 0 && typeof fallbackPref === 'string' && fallbackPref.trim()) {
    candidates.push(fallbackPref.trim().toLowerCase());
  }

  const valid: DropPreferenceType[] = [];
  for (const c of candidates) {
    if (
      ALLOWED_PREFERENCES.includes(c as DropPreferenceType) &&
      !valid.includes(c as DropPreferenceType)
    ) {
      valid.push(c as DropPreferenceType);
    }
  }

  if (valid.length === 0) return ['all'];
  if (valid.includes('all')) return ['all'];
  return valid;
}

function extractSectorTokens(value: string): string[] {
  return value
    .split('/')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function matchesPushSubscription(
  sub: { sectors?: string[]; preferences?: string[] },
  dealSector?: string,
  dealFlavor?: string
): boolean {
  const subSectors = (sub.sectors || []).map((s) => String(s || '').trim()).filter(Boolean);
  const acceptsAllSectors =
    subSectors.length === 0 ||
    subSectors.some((s) => {
      const lower = s.toLowerCase();
      return lower === 'all islamabad' || lower === 'all areas' || lower === 'all';
    });

  let sectorMatches = acceptsAllSectors;
  if (!acceptsAllSectors) {
    const target = String(dealSector || '').trim().toLowerCase();
    if (target) {
      const dealTokens = extractSectorTokens(target);
      sectorMatches = subSectors.some((subSec) => {
        const subLower = subSec.toLowerCase();
        if (subLower === target) return true;
        const subTokens = extractSectorTokens(subLower);
        return dealTokens.some((dt) => subTokens.includes(dt));
      });
    }
  }

  if (!sectorMatches) return false;

  const subPrefs = (sub.preferences || [])
    .map((p) => String(p || '').trim().toLowerCase())
    .filter(Boolean);
  if (subPrefs.length === 0 || subPrefs.includes('all')) {
    return true;
  }

  const normalizedFlavor = String(dealFlavor || 'mixed').trim().toLowerCase();
  if (normalizedFlavor === 'mixed') {
    return subPrefs.includes('sweet') || subPrefs.includes('savory');
  }
  return subPrefs.includes(normalizedFlavor);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url: string;
  dealId?: string;
  tag?: string;
}

export async function sendSinglePushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushNotificationPayload
) {
  if (!ensureWebPushConfigured()) {
    throw new Error('Push notifications are not configured on this server.');
  }

  return webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    },
    JSON.stringify(payload),
    { TTL: 3600, timeout: 5000 }
  );
}

function flavorEmojiFor(flavor?: string): string {
  switch (String(flavor || '').toLowerCase()) {
    case 'sweet':
      return '🥐';
    case 'savory':
      return '🥪';
    case 'drinks':
      return '☕';
    default:
      return '🛍️';
  }
}

export async function notifyMatchingPushSubscribers(dealInput: {
  dealId: string;
  itemName: string;
  storeName: string;
  sector?: string;
  flavorProfile?: string;
  originalPricePkr: number;
  currentPricePkr: number;
  discountPercent: number;
  pickupWindowText: string;
  useMemoryStore?: boolean;
}): Promise<{ sent: number; matched: number; failed: number; pruned: number }> {
  try {
    if (!ensureWebPushConfigured()) {
      return { sent: 0, matched: 0, failed: 0, pruned: 0 };
    }

    const activeSubs = dealInput.useMemoryStore
      ? memDb.pushSubscriptions.filter((s) => s.isActive !== false)
      : await PushSubscription.find({ isActive: true }).lean();

    const matchingSubs = activeSubs.filter((sub: any) =>
      matchesPushSubscription(sub, dealInput.sector, dealInput.flavorProfile)
    );

    if (matchingSubs.length === 0) {
      return { sent: 0, matched: 0, failed: 0, pruned: 0 };
    }

    const sectorLabel = dealInput.sector ? `${dealInput.sector} ` : 'Islamabad ';
    const emoji = flavorEmojiFor(dealInput.flavorProfile);
    const payload: PushNotificationPayload = {
      title: `${emoji} New ${sectorLabel}Surprise Box at ${dealInput.storeName} — For ₨ ${Math.round(dealInput.currentPricePkr).toLocaleString()}`,
      body: `${dealInput.itemName} (Worth ₨ ${Math.round(dealInput.originalPricePkr).toLocaleString()}+ inside) • ${dealInput.pickupWindowText}`,
      url: `/?deal=${encodeURIComponent(dealInput.dealId)}`,
      dealId: dealInput.dealId,
      tag: `bitehour-deal-${dealInput.dealId}`,
    };

    const results = await Promise.allSettled(
      matchingSubs.map((sub: any) => sendSinglePushNotification(sub, payload))
    );

    let sent = 0;
    let failed = 0;
    let pruned = 0;
    const deadEndpoints: string[] = [];

    results.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        sent += 1;
      } else {
        failed += 1;
        const statusCode = (res.reason as any)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          const ep = matchingSubs[idx]?.endpoint;
          if (ep) deadEndpoints.push(ep);
        }
      }
    });

    if (deadEndpoints.length > 0) {
      pruned = deadEndpoints.length;
      if (dealInput.useMemoryStore) {
        memDb.pushSubscriptions = memDb.pushSubscriptions.filter(
          (s) => !deadEndpoints.includes(s.endpoint)
        );
      } else {
        await PushSubscription.deleteMany({ endpoint: { $in: deadEndpoints } });
      }
    }

    return { sent, matched: matchingSubs.length, failed, pruned };
  } catch (err) {
    console.warn('⚠️ Push dispatch warning:', err);
    return { sent: 0, matched: 0, failed: 0, pruned: 0 };
  }
}
