import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Retailer } from '../models/Retailer';
import { getJwtSecret } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, storeName, storeCategory, storeAddress, city } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || String(password).length < 6) {
      res.status(400).json({ error: 'Valid email and password (at least 6 characters) are required.' });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered. Please sign in instead.' });
      return;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: String(name || '').trim() || 'Foodsave User',
      email: normalizedEmail,
      passwordHash,
      role: role === 'retailer' ? 'retailer' : 'consumer',
    });

    let retailerProfile = null;
    if (user.role === 'retailer') {
      retailerProfile = await Retailer.create({
        name: String(storeName || '').trim() || `${user.name}'s Store`,
        category: storeCategory || 'grocery',
        location: {
          lat: 31.5204 + (Math.random() * 0.05 - 0.025),
          lng: 74.3587 + (Math.random() * 0.05 - 0.025),
          address: storeAddress || 'Main Boulevard, Gulberg',
          city: city || 'Lahore',
        },
        isVerified: true,
        userRef: user._id,
      });
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, getJwtSecret(), { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalSavedPkr: user.totalSavedPkr,
        itemsRescuedCount: user.itemsRescuedCount,
      },
      retailer: retailerProfile,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
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
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalSavedPkr: user.totalSavedPkr,
        itemsRescuedCount: user.itemsRescuedCount,
      },
      retailer: retailerProfile,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};
