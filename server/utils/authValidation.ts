export interface AuthValidationResult {
  valid: boolean;
  error?: string;
  normalizedEmail?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_STRONG_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;
const PK_PHONE_REGEX = /^(\+92|0)(3\d{9}|[2-9]\d{8,10})$/;

export const ALLOWED_STORE_CATEGORIES = ['grocery', 'bakery', 'restaurant'] as const;
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
};

export function normalizePhone(rawPhone?: string): string {
  return String(rawPhone || '').replace(/[\s()-]/g, '').trim();
}

export function validateRegisterPayload(body: any): AuthValidationResult {
  const name = String(body?.name || '').trim();
  const normalizedEmail = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const confirmPassword = body?.confirmPassword !== undefined ? String(body.confirmPassword) : undefined;
  const phone = normalizePhone(body?.phone);
  const role = body?.role === 'retailer' ? 'retailer' : 'consumer';

  if (name.length < 2 || name.length > 80 || !/[a-zA-Z]/.test(name)) {
    return { valid: false, error: 'Please enter a valid full name (at least 2 characters).' };
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  if (!PK_PHONE_REGEX.test(phone)) {
    return {
      valid: false,
      error: 'Please enter a valid Pakistani phone number (e.g. 03001234567 or +923001234567).',
    };
  }

  if (!PASSWORD_STRONG_REGEX.test(password)) {
    return {
      valid: false,
      error: 'Password must be 8+ characters and include uppercase, lowercase, and a number.',
    };
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match.' };
  }

  if (role === 'retailer') {
    const storeName = String(body?.storeName || '').trim();
    const storeCategory = String(body?.storeCategory || '').trim().toLowerCase();
    const storeAddress = String(body?.storeAddress || '').trim();
    const city = String(body?.city || '').trim();

    if (storeName.length < 2 || storeName.length > 100) {
      return { valid: false, error: 'Store name is required (at least 2 characters).' };
    }
    if (!ALLOWED_STORE_CATEGORIES.includes(storeCategory as (typeof ALLOWED_STORE_CATEGORIES)[number])) {
      return { valid: false, error: 'Please select a valid store category (grocery, bakery, or restaurant).' };
    }
    if (!city) {
      return { valid: false, error: 'Please select your store city.' };
    }
    if (storeAddress.length < 5 || storeAddress.length > 200) {
      return { valid: false, error: 'Please enter a complete street address for store pickup (at least 5 characters).' };
    }
  }

  return { valid: true, normalizedEmail };
}

export function validateLoginPayload(body: any): AuthValidationResult {
  const normalizedEmail = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  if (!password) {
    return { valid: false, error: 'Password is required.' };
  }

  return { valid: true, normalizedEmail };
}
