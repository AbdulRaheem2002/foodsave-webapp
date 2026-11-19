import { Response } from 'express';
import mongoose from 'mongoose';
import { Retailer } from '../models/Retailer.js';
import { Item } from '../models/Item.js';
import { Deal } from '../models/Deal.js';
import { Reservation } from '../models/Reservation.js';
import { calculateTimeDecay } from '../utils/decayCalculator.js';
import { notifyMatchingPushSubscribers } from '../services/pushService.js';
import {
  buildStoreSalesSummary,
  expireStalePendingReservationsMongo,
  isItemExpired,
  mapReservationToOrderRecord,
} from '../utils/salesAnalytics.js';
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
      boxPricePkr,
      quantity,
      expiryHoursLeft,
      imageUrl,
    } = req.body;

    const retailer = await resolveRetailerForUser(req.user?.id);
    if (!retailer) {
      res.status(404).json({ error: 'Merchant store profile not found. Please register a merchant account.' });
      return;
    }

    if (!retailer.isVerified) {
      res.status(403).json({
        error: 'Your store is awaiting BiteHour approval before you can publish surplus deals.',
      });
      return;
    }

    const worthNum = Number(originalPricePkr);
    const hasFixedBoxPrice =
      boxPricePkr !== undefined && boxPricePkr !== null && String(boxPricePkr).trim() !== '';
    const boxPriceNum = Number(boxPricePkr);

    if (!String(name || '').trim() || worthNum <= 0 || Number(quantity) < 1) {
      res.status(400).json({ error: 'Valid box title, Worth value (> 0), and quantity (>= 1) are required.' });
      return;
    }

    if (hasFixedBoxPrice && (!Number.isFinite(boxPriceNum) || boxPriceNum <= 0 || boxPriceNum >= worthNum)) {
      res.status(400).json({ error: 'Box/deal price must be greater than ₨ 0 and lower than retail value.' });
      return;
    }

    const rawImage = String(imageUrl || '').trim();
    if (rawImage.startsWith('data:')) {
      const validDataImg = /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(rawImage);
      if (!validDataImg || rawImage.length > 1_800_000) {
        res.status(400).json({ error: 'Uploaded image must be JPEG, PNG, or WebP under 1.3 MB.' });
        return;
      }
    }

    const expiryDeadline = new Date(Date.now() + (expiryHoursLeft || 2) * 3600 * 1000);
    const safeFlavor = ALLOWED_FLAVORS.includes(flavorProfile) ? flavorProfile : 'mixed';
    const windowLabel =
      String(pickupWindowText || '').trim() ||
      `Pick up within ${Number(expiryHoursLeft || 2).toFixed(1)} hrs`;

    const safeCat = category || 'bakery';
    const defaultImgByCat: Record<string, string> = {
      bakery: '/images/box-sweet.jpg',
      restaurant: '/images/box-savory.jpg',
      grocery: '/images/hero-pastries.jpg',
    };

    const item = await Item.create({
      name: String(name).trim(),
      category: safeCat,
      flavorProfile: safeFlavor,
      isMysteryBag: isMysteryBag === undefined ? true : Boolean(isMysteryBag),
      originalPricePkr: worthNum,
      quantity: Number(quantity || 1),
      expiryDeadline,
      retailerRef: retailer._id,
      imageUrl: rawImage || defaultImgByCat[safeCat] || '/images/box-sweet.jpg',
    });

    const decay = calculateTimeDecay(worthNum, Number(expiryHoursLeft || 2), category || 'bakery');
    const effectivePrice = hasFixedBoxPrice ? Math.round(boxPriceNum) : decay.currentDiscountedPricePkr;
    const effectiveDiscount = hasFixedBoxPrice
      ? Math.max(1, Math.round(((worthNum - effectivePrice) / worthNum) * 100))
      : decay.currentDiscountPercent;

    const deal = await Deal.create({
      itemRef: item._id,
      retailerRef: retailer._id,
      currentDiscountedPricePkr: effectivePrice,
      discountPercent: effectiveDiscount,
      manualOverridePricePkr: hasFixedBoxPrice ? effectivePrice : undefined,
      decaySchedule: decay.decaySchedule,
      status: 'active',
      stockQuantity: Number(quantity || 1),
      pickupWindowText: windowLabel,
    });

    const pushResult = await notifyMatchingPushSubscribers({
      dealId: deal._id.toString(),
      itemName: item.name,
      storeName: retailer.name,
      sector: retailer.location?.sector || '',
      flavorProfile: item.flavorProfile,
      isMysteryBag: item.isMysteryBag,
      originalPricePkr: item.originalPricePkr,
      currentPricePkr: deal.currentDiscountedPricePkr,
      discountPercent: deal.discountPercent,
      pickupWindowText: deal.pickupWindowText,
    });

    res.status(201).json({
      message: 'Item and Deal listed successfully',
      notificationsSent: pushResult.sent,
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

export const getRetailerOrdersAndStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const retailer = await resolveRetailerForUser(req.user?.id);
    if (!retailer) {
      res.status(404).json({ error: 'Merchant store profile not found for this account.' });
      return;
    }

    await expireStalePendingReservationsMongo({ retailerRef: retailer._id });

    const now = Date.now();
    const [deals, reservations] = await Promise.all([
      Deal.find({ retailerRef: retailer._id }).populate('itemRef').sort({ createdAt: -1 }),
      Reservation.find({ retailerRef: retailer._id })
        .populate('userRef', 'name email contactPhone')
        .populate({ path: 'dealRef', populate: { path: 'itemRef' } })
        .populate('retailerRef')
        .sort({ createdAt: -1 }),
    ]);

    const staleDealIds: any[] = [];
    for (const d of deals as any[]) {
      if (d.status === 'active' && (!d.itemRef || isItemExpired(d.itemRef.expiryDeadline, now))) {
        staleDealIds.push(d._id);
        d.status = 'expired';
      }
    }
    if (staleDealIds.length > 0) {
      await Deal.updateMany({ _id: { $in: staleDealIds } }, { $set: { status: 'expired' } });
    }

    const orders = reservations.map((r: any) => mapReservationToOrderRecord(r));
    const dealSummaryInputs = (deals as any[]).map((d) => ({
      status: d.status,
      stockQuantity: d.stockQuantity,
      expiryDeadline: d.itemRef?.expiryDeadline,
    }));

    const summary = buildStoreSalesSummary(
      {
        id: retailer._id.toString(),
        name: retailer.name,
        category: retailer.category,
        sector: retailer.location?.sector || '',
        city: retailer.location?.city || 'Islamabad',
        isVerified: Boolean(retailer.isVerified),
        contactPhone: retailer.contactPhone || '',
      },
      orders,
      dealSummaryInputs,
      now
    );

    const expiredDeals = (deals as any[])
      .filter((d) => d.status === 'expired' || isItemExpired(d.itemRef?.expiryDeadline, now))
      .slice(0, 20)
      .map((d) => ({
        id: d._id.toString(),
        title: d.itemRef?.name || 'Surplus Listing',
        category: d.itemRef?.category || retailer.category || 'bakery',
        originalPricePkr: Number(d.itemRef?.originalPricePkr || 0),
        currentPricePkr: Number(d.manualOverridePricePkr ?? d.currentDiscountedPricePkr ?? 0),
        stockRemaining: Number(d.stockQuantity || 0),
        expiryDeadline: d.itemRef?.expiryDeadline
          ? new Date(d.itemRef.expiryDeadline).toISOString()
          : new Date().toISOString(),
        pickupWindowText: String(d.pickupWindowText || ''),
      }));

    res.json({ summary, orders, expiredDeals });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not load store sales and orders.' });
  }
};
