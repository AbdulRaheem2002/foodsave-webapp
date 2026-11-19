import { Request, Response } from 'express';
import { DropAlertSubscriber } from '../models/DropAlertSubscriber.js';
import { normalizePhone, PK_PHONE_REGEX, EMAIL_REGEX } from '../utils/authValidation.js';
import { normalizePreferenceList, normalizeSectorList } from '../services/pushService.js';

export function validateDropAlertBody(body: any) {
  const name = String(body?.name || '').trim().slice(0, 80);
  const phone = normalizePhone(body?.phone);
  const email = String(body?.email || '').trim().toLowerCase();
  const city = String(body?.city || 'Islamabad').trim() || 'Islamabad';
  const sectors = normalizeSectorList(body?.sectors, body?.sector);
  const sector = sectors.join(', ');
  const preferences = normalizePreferenceList(body?.preferences, body?.preference);
  const preference = preferences.length === 1 ? preferences[0] : 'all';

  if (!PK_PHONE_REGEX.test(phone)) {
    return {
      valid: false,
      error: 'Enter a valid Pakistani WhatsApp number (e.g. 03001234567).',
    };
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Please enter a valid email address or leave email blank.' };
  }

  return {
    valid: true,
    data: {
      name,
      phone,
      email: email || undefined,
      city,
      sector,
      sectors,
      preference,
      preferences,
      isActive: true,
    },
  };
}

export const subscribeDropAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const check = validateDropAlertBody(req.body);
    if (!check.valid || !check.data) {
      res.status(400).json({ error: check.error });
      return;
    }

    const subscriber = await DropAlertSubscriber.findOneAndUpdate(
      { phone: check.data.phone },
      { $set: check.data },
      { upsert: true, returnDocument: 'after' }
    );

    const sectors =
      Array.isArray(subscriber.sectors) && subscriber.sectors.length > 0
        ? subscriber.sectors
        : [subscriber.sector || 'All Islamabad'];
    const preferences =
      Array.isArray(subscriber.preferences) && subscriber.preferences.length > 0
        ? subscriber.preferences
        : [subscriber.preference || 'all'];

    res.status(201).json({
      message: `You're on tonight's Islamabad drop list (${sectors.join(', ')})!`,
      subscriber: {
        id: subscriber._id.toString(),
        phone: subscriber.phone,
        sector: subscriber.sector,
        sectors,
        preference: subscriber.preference,
        preferences,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not save drop alert subscription.' });
  }
};
