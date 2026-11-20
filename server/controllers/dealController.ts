import { Request, Response } from 'express';
import { Deal } from '../models/Deal.js';
import { Reservation } from '../models/Reservation.js';
import { Retailer } from '../models/Retailer.js';
import { calculateTimeDecay } from '../utils/decayCalculator.js';
import {
  buildPlatformImpactPayload,
  isItemExpired,
  mapReservationToOrderRecord,
} from '../utils/salesAnalytics.js';


export const getDeals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, minDiscount } = req.query;
    const now = Date.now();

    const deals = await Deal.find({ status: 'active', stockQuantity: { $gt: 0 } })
      .populate({ path: 'itemRef', populate: { path: 'retailerRef' } })
      .populate('retailerRef');

    const expiredDealIds: any[] = [];
    const activeDeals: any[] = [];

    for (const deal of deals as any[]) {
      const item = deal.itemRef;
      const retailer = deal.retailerRef || item?.retailerRef;

      if (!item || isItemExpired(item.expiryDeadline, now)) {
        expiredDealIds.push(deal._id);
        continue;
      }

      const expiry = new Date(item.expiryDeadline).getTime();
      const rawHoursRemaining = (expiry - now) / (1000 * 60 * 60);
      const decay = calculateTimeDecay(
        item.originalPricePkr,
        Math.max(0.05, rawHoursRemaining),
        item.category
      );

      // Check if manual override price exists
      const effectivePrice = deal.manualOverridePricePkr ?? decay.currentDiscountedPricePkr;
      const effectiveDiscount = Math.round(
        ((item.originalPricePkr - effectivePrice) / item.originalPricePkr) * 100
      );

      activeDeals.push({
        id: deal._id.toString(),
        item: {
          id: item._id.toString(),
          name: item.name,
          category: item.category,
          flavorProfile: item.flavorProfile || 'mixed',
          isMysteryBag: Boolean(item.isMysteryBag),
          originalPricePkr: item.originalPricePkr,
          imageUrl: item.imageUrl,
          expiryDeadline: item.expiryDeadline,
        },
        retailer: {
          id: retailer?._id?.toString(),
          name: retailer?.name || 'Registered Store',
          category: retailer?.category || item.category,
          location: retailer?.location || { lat: 33.6844, lng: 73.0479, address: '', city: 'Islamabad' },
          isVerified: retailer?.isVerified ?? true,
          rating: retailer?.rating || 5.0,
        },
        currentDiscountedPricePkr: effectivePrice,
        discountPercent: effectiveDiscount,
        decaySchedule: decay.decaySchedule,
        status: deal.status,
        stockQuantity: deal.stockQuantity,
        pickupWindowText: deal.pickupWindowText,
        hoursRemaining: Number(rawHoursRemaining.toFixed(3)),
        manualOverridePricePkr: deal.manualOverridePricePkr,
      });
    }

    if (expiredDealIds.length > 0) {
      await Deal.updateMany({ _id: { $in: expiredDealIds } }, { $set: { status: 'expired' } });
    }

    // Filter by category if requested
    let filtered = activeDeals;
    if (category && category !== 'all') {
      filtered = filtered.filter((d: any) => d.item?.category === category);
    }

    if (minDiscount) {
      const minDiscNum = Number(minDiscount);
      filtered = filtered.filter((d: any) => d.discountPercent >= minDiscNum);
    }

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch deals' });
  }
};

export const getPlatformImpact = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = Date.now();
    const [verifiedKitchensCount, activeDealsRaw, reservations] = await Promise.all([
      Retailer.countDocuments({ isVerified: true }),
      Deal.find({ status: 'active', stockQuantity: { $gt: 0 } }).populate('itemRef'),
      Reservation.find({})
        .populate({ path: 'dealRef', populate: { path: 'itemRef' } })
        .select('status quantity totalAmountPkr paymentMethod paymentStatus pickupWindowEnd createdAt dealRef'),
    ]);

    const activeDealsCount = (activeDealsRaw as any[]).filter(
      (deal) => deal.itemRef && !isItemExpired(deal.itemRef.expiryDeadline, now)
    ).length;

    const orderRecords = (reservations as any[]).map((r) => mapReservationToOrderRecord(r));

    res.json(buildPlatformImpactPayload(orderRecords, verifiedKitchensCount, activeDealsCount));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to calculate platform impact.' });
  }
};
