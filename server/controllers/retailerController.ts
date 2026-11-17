import { Response } from 'express';
import mongoose from 'mongoose';
import { Retailer } from '../models/Retailer.js';
import { Item } from '../models/Item.js';
import { Deal } from '../models/Deal.js';
import { Reservation } from '../models/Reservation.js';
import { calculateTimeDecay } from '../utils/decayCalculator.js';
import type { AuthRequest } from '../middleware/auth.js';

async function resolveRetailerForUser(userId?: string) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }
  return Retailer.findOne({ userRef: userId });
}

export const getRetailerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const retailer = await resolveRetailerForUser(req.user?.id);
    if (!retailer) {
      res.status(404).json({ error: 'Retailer profile not found for this account.' });
      return;
    }

    const activeDealsCount = await Deal.countDocuments({ retailerRef: retailer._id, status: 'active' });
    const reservationsCount = await Reservation.countDocuments({ retailerRef: retailer._id });

    res.json({
      retailer,
      stats: {
        activeDealsCount,
        totalReservationsCount: reservationsCount,
        totalRecoveredPkr: retailer.totalRecoveredPkr,
        totalWastedValueAvoidedPkr: retailer.totalWastedValueAvoidedPkr,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const ALLOWED_FLAVORS = ['savory', 'sweet', 'drinks', 'mixed'] as const;

export const addItemAndDeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      category,
      flavorProfile,
      isMysteryBag,
      pickupWindowText,
      originalPricePkr,
      quantity,
      expiryHoursLeft,
      imageUrl,
    } = req.body;

    const retailer = await resolveRetailerForUser(req.user?.id);
    if (!retailer) {
      res.status(404).json({ error: 'Merchant store profile not found. Please register a merchant account.' });
      return;
    }

    if (!String(name || '').trim() || Number(originalPricePkr) <= 0 || Number(quantity) < 1) {
      res.status(400).json({ error: 'Valid item title, original price (> 0), and quantity (>= 1) are required.' });
      return;
    }

    const expiryDeadline = new Date(Date.now() + (expiryHoursLeft || 2) * 3600 * 1000);
    const safeFlavor = ALLOWED_FLAVORS.includes(flavorProfile) ? flavorProfile : 'mixed';
    const windowLabel =
      String(pickupWindowText || '').trim() ||
      `Pick up within ${Number(expiryHoursLeft || 2).toFixed(1)} hrs`;

    const item = await Item.create({
      name: String(name).trim(),
      category: category || 'grocery',
      flavorProfile: safeFlavor,
      isMysteryBag: Boolean(isMysteryBag),
      originalPricePkr: Number(originalPricePkr),
      quantity: Number(quantity || 1),
      expiryDeadline,
      retailerRef: retailer._id,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    });

    const decay = calculateTimeDecay(Number(originalPricePkr), Number(expiryHoursLeft || 2), category || 'grocery');

    const deal = await Deal.create({
      itemRef: item._id,
      retailerRef: retailer._id,
      currentDiscountedPricePkr: decay.currentDiscountedPricePkr,
      discountPercent: decay.currentDiscountPercent,
      decaySchedule: decay.decaySchedule,
      status: 'active',
      stockQuantity: Number(quantity || 1),
      pickupWindowText: windowLabel,
    });

    res.status(201).json({
      message: 'Item and Deal listed successfully',
      item: {
        id: item._id.toString(),
        name: item.name,
        category: item.category,
        flavorProfile: item.flavorProfile,
        isMysteryBag: item.isMysteryBag,
        originalPricePkr: item.originalPricePkr,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      },
      deal: {
        id: deal._id.toString(),
        currentDiscountedPricePkr: deal.currentDiscountedPricePkr,
        discountPercent: deal.discountPercent,
        decaySchedule: deal.decaySchedule,
        status: deal.status,
        stockQuantity: deal.stockQuantity,
        pickupWindowText: deal.pickupWindowText,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const overrideDealPrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { manualOverridePricePkr } = req.body;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    const retailer = await resolveRetailerForUser(req.user?.id);
    if (!retailer) {
      res.status(404).json({ error: 'Merchant store profile not found.' });
      return;
    }

    const deal = await Deal.findOne({ _id: id, retailerRef: retailer._id }).populate('itemRef');
    if (!deal) {
      res.status(404).json({ error: 'Deal not found for your store.' });
      return;
    }

    const item: any = deal.itemRef;
    deal.manualOverridePricePkr = Number(manualOverridePricePkr);
    deal.currentDiscountedPricePkr = Number(manualOverridePricePkr);
    if (item && item.originalPricePkr) {
      deal.discountPercent = Math.round(((item.originalPricePkr - Number(manualOverridePricePkr)) / item.originalPricePkr) * 100);
    }
    await deal.save();

    res.json({ message: 'Price manually overridden', deal });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    const retailer = await resolveRetailerForUser(req.user?.id);
    if (!retailer) {
      res.status(404).json({ error: 'Merchant store profile not found.' });
      return;
    }

    const deal = await Deal.findOneAndDelete({ _id: id, retailerRef: retailer._id });
    if (!deal) {
      res.status(404).json({ error: 'Deal not found for your store.' });
      return;
    }

    if (deal.itemRef) {
      await Item.findByIdAndDelete(deal.itemRef);
    }

    res.json({ message: 'Deal and item deleted successfully', id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
