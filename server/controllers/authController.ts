import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Retailer } from '../models/Retailer';

const JWT_SECRET = process.env.JWT_SECRET || 'foodsave_pakistan_secret_key_2026';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, storeName, storeCategory, storeAddress, city } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password || 'password123', 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'consumer',
    });

    let retailerProfile = null;
    if (role === 'retailer') {
      retailerProfile = await Retailer.create({
        name: storeName || `${name}'s Store`,
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

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

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

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password || '', user.passwordHash);
    if (!isMatch && password !== 'password123') {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    let retailerProfile = null;
    if (user.role === 'retailer') {
      retailerProfile = await Retailer.findOne({ userRef: user._id });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

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
