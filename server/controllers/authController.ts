import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Retailer } from '../models/Retailer';
import { getJwtSecret } from '../middleware/auth';
import {
  validateRegisterPayload,
  validateLoginPayload,
  normalizePhone,
  CITY_COORDINATES,
  ALLOWED_STORE_CATEGORIES,
} from '../utils/authValidation';

function formatRetailerDto(retailer: any) {
  if (!retailer) return null;
  return {
    id: retailer._id?.toString() || retailer.id,
    name: retailer.name,
    category: retailer.category,
    address: retailer.location?.address || '',
    city: retailer.location?.city || 'Lahore',
    isVerified: Boolean(retailer.isVerified),
    rating: retailer.rating ?? 5.0,
    totalRecoveredPkr: retailer.totalRecoveredPkr ?? 0,
    totalWastedValueAvoidedPkr: retailer.totalWastedValueAvoidedPkr ?? 0,
  };
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateRegisterPayload(req.body);
    if (!validation.valid || !validation.normalizedEmail) {
      res.status(400).json({ error: validation.error || 'Invalid registration details.' });
      return;
    }

    const { name, password, role, storeName, storeCategory, storeAddress, city, phone } = req.body;
    const normalizedEmail = validation.normalizedEmail;
    const normalizedPhone = normalizePhone(phone);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
      return;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === 'retailer' ? 'retailer' : 'consumer',
      contactPhone: normalizedPhone,
    });

    let retailerProfile = null;
    if (user.role === 'retailer') {
      const storeCity = String(city).trim();
      const baseCoords = CITY_COORDINATES[storeCity] || CITY_COORDINATES.Lahore;
      const safeCategory = ALLOWED_STORE_CATEGORIES.includes(storeCategory) ? storeCategory : 'grocery';

      retailerProfile = await Retailer.create({
        name: String(storeName).trim(),
        category: safeCategory,
        location: {
          lat: baseCoords.lat,
          lng: baseCoords.lng,
          address: String(storeAddress).trim(),
          city: storeCity,
        },
        contactPhone: normalizedPhone,
        rating: 5.0,
        isVerified: true,
        userRef: user._id,
      });
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, getJwtSecret(), { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        contactPhone: user.contactPhone,
        totalSavedPkr: user.totalSavedPkr,
        itemsRescuedCount: user.itemsRescuedCount,
        retailer: formatRetailerDto(retailerProfile),
      },
      retailer: formatRetailerDto(retailerProfile),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateLoginPayload(req.body);
    if (!validation.valid || !validation.normalizedEmail) {
      res.status(400).json({ error: validation.error || 'Email and password are required.' });
      return;
    }

    const { password, expectedRole } = req.body;
    const normalizedEmail = validation.normalizedEmail;

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (expectedRole && expectedRole !== user.role) {
      res.status(403).json({
        error:
          expectedRole === 'retailer'
            ? 'This email belongs to a Consumer account. Please sign in with a Merchant Partner account or register a new store.'
            : 'This email belongs to a Merchant Partner account.',
      });
      return;
    }

    let retailerProfile = null;
    if (user.role === 'retailer') {
      retailerProfile = await Retailer.findOne({ userRef: user._id });
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, getJwtSecret(), { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        contactPhone: user.contactPhone,
        totalSavedPkr: user.totalSavedPkr,
        itemsRescuedCount: user.itemsRescuedCount,
        retailer: formatRetailerDto(retailerProfile),
      },
      retailer: formatRetailerDto(retailerProfile),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};
