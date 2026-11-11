import { Request, Response } from 'express';
import { Deal } from '../models/Deal';
import { calculateTimeDecay } from '../utils/decayCalculator';


export const getDeals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, minDiscount } = req.query;

    const deals = await Deal.find({ status: 'active', stockQuantity: { $gt: 0 } })
      .populate({ path: 'itemRef', populate: { path: 'retailerRef' } })
      .populate('retailerRef');

    const updatedDeals = deals.map((deal: any) => {
      const item = deal.itemRef;
      const retailer = deal.retailerRef || item?.retailerRef;

      if (!item) return deal;

      // Compute dynamic time-decay price based on expiry deadline
      const now = new Date().getTime();
      const expiry = new Date(item.expiryDeadline).getTime();
      const hoursRemaining = Math.max(0.2, (expiry - now) / (1000 * 60 * 60));

      const decay = calculateTimeDecay(item.originalPricePkr, hoursRemaining, item.category);

      // Check if manual override price exists
      const effectivePrice = deal.manualOverridePricePkr ?? decay.currentDiscountedPricePkr;
      const effectiveDiscount = Math.round(((item.originalPricePkr - effectivePrice) / item.originalPricePkr) * 100);

      return {
        id: deal._id,
        item: {
          id: item._id,
          name: item.name,
          category: item.category,
          originalPricePkr: item.originalPricePkr,
          imageUrl: item.imageUrl,
          expiryDeadline: item.expiryDeadline,
        },
        retailer: {
          id: retailer?._id,
          name: retailer?.name || 'Local Food Store',
          category: retailer?.category || item.category,
          location: retailer?.location || { lat: 31.5204, lng: 74.3587, address: 'Main Boulevard, Gulberg', city: 'Lahore' },
          isVerified: retailer?.isVerified ?? true,
          rating: retailer?.rating || 4.8,
        },
        currentDiscountedPricePkr: effectivePrice,
        discountPercent: effectiveDiscount,
        decaySchedule: decay.decaySchedule,
        status: deal.status,
        stockQuantity: deal.stockQuantity,
        pickupWindowText: deal.pickupWindowText,
        hoursRemaining: Number(hoursRemaining.toFixed(1)),
        manualOverridePricePkr: deal.manualOverridePricePkr,
      };
    });

    // Filter by category if requested
    let filtered = updatedDeals;
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
