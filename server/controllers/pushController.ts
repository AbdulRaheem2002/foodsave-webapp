import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PushSubscription, type PushDeviceType } from '../models/PushSubscription.js';
import type { AuthRequest } from '../middleware/auth.js';
import {
  getVapidPublicKey,
  isPushConfigured,
  normalizePreferenceList,
  normalizeSectorList,
  sendSinglePushNotification,
} from '../services/pushService.js';

const ALLOWED_DEVICE_TYPES: PushDeviceType[] = ['desktop', 'android', 'ios', 'other'];

export function validatePushSubscribeBody(body: any) {
  const subscription = body?.subscription;
  const endpoint = String(subscription?.endpoint || '').trim();
  const p256dh = String(subscription?.keys?.p256dh || '').trim();
  const auth = String(subscription?.keys?.auth || '').trim();

  if (
    !endpoint ||
    (!endpoint.startsWith('https://') && !endpoint.startsWith('http://localhost'))
  ) {
    return { valid: false, error: 'A valid Push subscription endpoint is required.' };
  }

  if (!p256dh || !auth) {
    return { valid: false, error: 'Push encryption keys (p256dh and auth) are required.' };
  }

  const city = String(body?.city || 'Islamabad').trim() || 'Islamabad';
  const sectors = normalizeSectorList(body?.sectors, body?.sector);
  const preferences = normalizePreferenceList(body?.preferences, body?.preference);
  const rawDevice = String(body?.deviceType || 'other').trim().toLowerCase() as PushDeviceType;
  const deviceType: PushDeviceType = ALLOWED_DEVICE_TYPES.includes(rawDevice)
    ? rawDevice
    : 'other';

  return {
    valid: true,
    data: {
      endpoint,
      keys: { p256dh, auth },
      city,
      sectors,
      preferences,
      deviceType,
      isActive: true,
    },
  };
}

export const getPushConfig = (_req: Request, res: Response): void => {
  res.json({
    configured: isPushConfigured(),
    publicKey: getVapidPublicKey(),
  });
};

export const subscribePush = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const check = validatePushSubscribeBody(req.body);
    if (!check.valid || !check.data) {
      res.status(400).json({ error: check.error });
      return;
    }

    const updateDoc: any = { ...check.data };
    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      updateDoc.userRef = new mongoose.Types.ObjectId(req.user.id);
    }

    const saved = await PushSubscription.findOneAndUpdate(
      { endpoint: check.data.endpoint },
      { $set: updateDoc },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(201).json({
      message: `Instant drop alerts active for ${saved.sectors.join(', ')}!`,
      subscription: {
        id: saved._id.toString(),
        sectors: saved.sectors,
        preferences: saved.preferences,
        deviceType: saved.deviceType,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not save push notification subscription.' });
  }
};

export const unsubscribePush = async (req: Request, res: Response): Promise<void> => {
  try {
    const endpoint = String(req.body?.endpoint || '').trim();
    if (!endpoint) {
      res.status(400).json({ error: 'Push subscription endpoint is required.' });
      return;
    }

    await PushSubscription.deleteOne({ endpoint });
    res.json({ message: 'Instant push notifications turned off for this device.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not remove push subscription.' });
  }
};

export const sendTestPush = async (req: Request, res: Response): Promise<void> => {
  try {
    const endpoint = String(req.body?.endpoint || '').trim();
    if (!endpoint) {
      res.status(400).json({ error: 'Push subscription endpoint is required.' });
      return;
    }

    if (!isPushConfigured()) {
      res.status(503).json({ error: 'Web Push VAPID keys are not configured on the server yet.' });
      return;
    }

    const sub = await PushSubscription.findOne({ endpoint, isActive: true });
    if (!sub) {
      res.status(404).json({ error: 'No active push subscription found for this device.' });
      return;
    }

    try {
      await sendSinglePushNotification(sub, {
        title: '🔔 BiteHour Drop Alerts Active!',
        body: `You will be notified immediately when ${sub.sectors.join(', ')} bakeries post closing-hour boxes.`,
        url: '/',
        tag: 'bitehour-test',
      });
      res.json({ message: 'Test notification sent! Check your device tray.' });
    } catch (pushErr: any) {
      const code = pushErr?.statusCode;
      if (code === 404 || code === 410) {
        await PushSubscription.deleteOne({ endpoint });
        res.status(410).json({ error: 'Push subscription expired in browser. Please re-enable alerts.' });
        return;
      }
      throw pushErr;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send test push notification.' });
  }
};
