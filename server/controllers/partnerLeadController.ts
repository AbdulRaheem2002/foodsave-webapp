import { Request, Response } from 'express';
import { PartnerLead } from '../models/PartnerLead.js';
import { normalizePhone, PK_PHONE_REGEX, EMAIL_REGEX } from '../utils/authValidation.js';

const ALLOWED_TYPES = ['bakery', 'cafe', 'restaurant', 'hotel', 'grocery', 'dessert'] as const;

export function validatePartnerLeadBody(body: any) {
  const ownerName = String(body?.ownerName || '').trim();
  const businessName = String(body?.businessName || '').trim();
  const businessType = ALLOWED_TYPES.includes(body?.businessType) ? body.businessType : 'bakery';
  const city = String(body?.city || '').trim();
  const sector = String(body?.sector || '').trim();
  const phone = normalizePhone(body?.phone);
  const email = String(body?.email || '').trim().toLowerCase();
  const notes = String(body?.notes || '').trim();

  if (ownerName.length < 2 || ownerName.length > 80) {
    return { valid: false, error: 'Please enter the owner or manager name (min 2 characters).' };
  }
  if (businessName.length < 2 || businessName.length > 100) {
    return { valid: false, error: 'Please enter your bakery, café, or store name.' };
  }
  if (!city) {
    return { valid: false, error: 'Please select a city.' };
  }
  if (sector.length < 2 || sector.length > 80) {
    return { valid: false, error: 'Please enter your sector or area (e.g. F-7 Markaz, Gulberg).' };
  }
  if (!PK_PHONE_REGEX.test(phone)) {
    return {
      valid: false,
      error: 'Enter a valid Pakistani phone/WhatsApp number (e.g. 03001234567).',
    };
  }
  if (email && !EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Please enter a valid email address or leave email blank.' };
  }

  return {
    valid: true,
    data: { ownerName, businessName, businessType, city, sector, phone, email: email || undefined, notes },
  };
}

export const createPartnerLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const check = validatePartnerLeadBody(req.body);
    if (!check.valid || !check.data) {
      res.status(400).json({ error: check.error });
      return;
    }

    const lead = await PartnerLead.create(check.data);
    res.status(201).json({
      message: 'Application received! Our BiteHour team will reach out shortly.',
      lead: {
        id: lead._id.toString(),
        businessName: lead.businessName,
        city: lead.city,
        sector: lead.sector,
        status: lead.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not submit partner application' });
  }
};
