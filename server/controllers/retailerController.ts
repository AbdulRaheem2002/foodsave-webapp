import { Response } from 'express';
import mongoose from 'mongoose';
import { Retailer } from '../models/Retailer';
import { Item } from '../models/Item';
import { Deal } from '../models/Deal';
import { Reservation } from '../models/Reservation';
import { calculateTimeDecay } from '../utils/decayCalculator';
import type { AuthRequest } from '../middleware/auth';

async function resolveRetailerForUser(userId?: string) {
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const owned = await Retailer.findOne({ userRef: userId });
    if (owned) return owned;
  }
  return Retailer.findOne();
}

export const getRetailerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const retailer = await resolveRetailerForUser(req.user?.id);
    if (!retailer) {
      res.status(404).json({ error: 'Retailer profile not found' });
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

export const addItemAndDeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, category, originalPricePkr, quantity, expiryHoursLeft, imageUrl } = req.body;

    let retailer = await resolveRetailerForUser(req.user?.id);
    if (!retailer) {
      retailer = await Retailer.create({
        name: 'Al-Fatah Gourmet Supermarket',
        category: 'grocery',
        location: { lat: 31.5204, lng: 74.3587, address: 'Main Boulevard, Gulberg III', city: 'Lahore' },
        isVerified: true,
        userRef: req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : undefined,
      });
    }

    const expiryDeadline = new Date(Date.now() + (expiryHoursLeft || 2) * 3600 * 1000);

    const item = await Item.create({
      name,
      category: category || 'grocery',
      originalPricePkr: Number(originalPricePkr),
      quantity: Number(quantity || 1),
      expiryDeadline,
      retailerRef: retailer._id,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
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
      pickupWindowText: `Pick up within ${Number(expiryHoursLeft || 2).toFixed(1)} hrs`,
    });

    res.status(201).json({
      message: 'Item and Deal listed successfully',
      item: {
        id: item._id.toString(),
        name: item.name,
        category: item.category,
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

    const deal = await Deal.findById(id).populate('itemRef');
    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
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

    const deal = await Deal.findByIdAndDelete(id);
    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
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
