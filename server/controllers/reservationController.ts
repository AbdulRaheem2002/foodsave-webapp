import { Response } from 'express';
import mongoose from 'mongoose';
import { Reservation } from '../models/Reservation.js';
import { Deal } from '../models/Deal.js';
import { User } from '../models/User.js';
import { Retailer } from '../models/Retailer.js';
import type { AuthRequest } from '../middleware/auth.js';

export const createReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      res.status(401).json({ error: 'Please sign in to reserve a surplus deal.' });
      return;
    }

    const { dealId, quantity, paymentMethod } = req.body;

    if (!dealId || !mongoose.Types.ObjectId.isValid(String(dealId))) {
      res.status(400).json({ error: 'Valid dealId is required.' });
      return;
    }

    const deal: any = await Deal.findById(dealId).populate('itemRef').populate('retailerRef');
    if (!deal || deal.status !== 'active') {
      res.status(400).json({ error: 'Deal is no longer available' });
      return;
    }

    const qty = Number(quantity || 1);
    if (!Number.isInteger(qty) || qty < 1 || deal.stockQuantity < qty) {
      res.status(400).json({ error: 'Insufficient stock remaining' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(401).json({ error: 'Authenticated user account not found.' });
      return;
    }

    // Generate unique pickup code (e.g. PK-84920)
    const pickupCode = `PK-${Math.floor(10000 + Math.random() * 90000)}`;
    const totalAmountPkr = deal.currentDiscountedPricePkr * qty;
    const originalTotalPkr = deal.itemRef.originalPricePkr * qty;
    const savedPkr = originalTotalPkr - totalAmountPkr;

    // 15-minute pickup window
    const pickupWindowEnd = new Date(Date.now() + 15 * 60 * 1000);

    const reservation = await Reservation.create({
      userRef: user._id,
      dealRef: deal._id,
      retailerRef: deal.retailerRef._id,
      pickupCode,
      status: 'pending',
      pickupWindowEnd,
      quantity: qty,
      totalAmountPkr,
      paymentMethod: paymentMethod || 'JazzCash',
      paymentStatus: paymentMethod === 'Cash on Pickup' ? 'pending' : 'paid',
    });

    // Deduct deal stock
    deal.stockQuantity -= qty;
    if (deal.stockQuantity <= 0) {
      deal.status = 'sold';
    }
    await deal.save();

    // Update user impact stats & retailer recovery stats
    user.totalSavedPkr += savedPkr;
    user.itemsRescuedCount += qty;
    await user.save();

    const retailer = await Retailer.findById(deal.retailerRef._id);
    if (retailer) {
      retailer.totalRecoveredPkr += totalAmountPkr;
      retailer.totalWastedValueAvoidedPkr += originalTotalPkr;
      await retailer.save();
    }

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation,
      pickupCode,
      pickupWindowEnd,
      savedPkr,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyReservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      res.status(401).json({ error: 'Authentication required to view reservations.' });
      return;
    }

    const reservations = await Reservation.find({ userRef: req.user.id })
      .populate({ path: 'dealRef', populate: { path: 'itemRef' } })
      .populate('retailerRef')
      .sort({ createdAt: -1 });

    // Auto-expire no-shows if pickup window passed and still pending
    const now = new Date();
    for (const resItem of reservations) {
      if (resItem.status === 'pending' && new Date(resItem.pickupWindowEnd) < now) {
        resItem.status = 'no-show';
        await resItem.save();

        // Return stock to deal
        const deal = await Deal.findById(resItem.dealRef);
        if (deal) {
          deal.stockQuantity += resItem.quantity;
          deal.status = 'active';
          await deal.save();
        }
      }
    }

    const formatted = reservations.map((resItem: any) => {
      const deal = resItem.dealRef;
      const item = deal?.itemRef;
      const retailer = resItem.retailerRef;
      return {
        id: resItem._id.toString(),
        userId: resItem.userRef?.toString(),
        dealId: deal?._id?.toString(),
        retailerId: retailer?._id?.toString(),
        pickupCode: resItem.pickupCode,
        status: resItem.status,
        pickupWindowEnd: resItem.pickupWindowEnd,
        quantity: resItem.quantity,
        totalAmountPkr: resItem.totalAmountPkr,
        paymentMethod: resItem.paymentMethod,
        paymentStatus: resItem.paymentStatus,
        createdAt: resItem.createdAt,
        deal: deal
          ? {
              id: deal._id.toString(),
              currentDiscountedPricePkr: deal.currentDiscountedPricePkr,
              discountPercent: deal.discountPercent,
              pickupWindowText: deal.pickupWindowText,
              item: item
                ? {
                    id: item._id.toString(),
                    name: item.name,
                    category: item.category,
                    originalPricePkr: item.originalPricePkr,
                    imageUrl: item.imageUrl,
                  }
                : null,
            }
          : null,
        retailer: retailer
          ? {
              id: retailer._id.toString(),
              name: retailer.name,
              category: retailer.category,
              rating: retailer.rating,
              location: retailer.location,
            }
          : null,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyPickupCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pickupCode } = req.body;
    if (!pickupCode) {
      res.status(400).json({ valid: false, error: 'Pickup code is required' });
      return;
    }

    const retailer = req.user?.id ? await Retailer.findOne({ userRef: req.user.id }) : null;
    const cleanCode = String(pickupCode).trim().toUpperCase();
    let reservation: any = await Reservation.findOne({ pickupCode: cleanCode })
      .populate({ path: 'dealRef', populate: { path: 'itemRef' } })
      .populate('retailerRef')
      .populate('userRef', 'name contactPhone');

    if (!reservation && mongoose.Types.ObjectId.isValid(String(pickupCode))) {
      reservation = await Reservation.findById(pickupCode)
        .populate({ path: 'dealRef', populate: { path: 'itemRef' } })
        .populate('retailerRef')
        .populate('userRef', 'name contactPhone');
    }

    if (!reservation) {
      res.status(404).json({ valid: false, error: `No active reservation found with code: ${cleanCode}` });
      return;
    }

    if (retailer && reservation.retailerRef?._id && reservation.retailerRef._id.toString() !== retailer._id.toString()) {
      res.status(403).json({ valid: false, error: 'This pickup code belongs to a different store.' });
      return;
    }

    const dealTitle = reservation.dealRef?.itemRef?.name || 'Surplus Bag';

    res.json({
      valid: true,
      message: 'Pass verified successfully',
      reservation: {
        id: reservation._id.toString(),
        pickupCode: reservation.pickupCode,
        customerName: reservation.userRef?.name || 'Customer',
        dealTitle,
        status: reservation.status,
        quantity: reservation.quantity,
        totalPricePkr: reservation.totalAmountPkr,
        totalAmountPkr: reservation.totalAmountPkr,
        paymentMethod: reservation.paymentMethod,
        paymentStatus: reservation.paymentStatus,
        pickupWindowEnd: reservation.pickupWindowEnd,
        pickupDeadline: reservation.pickupWindowEnd,
        deal: {
          id: reservation.dealRef?._id?.toString(),
          currentDiscountedPricePkr: reservation.dealRef?.currentDiscountedPricePkr,
          discountPercent: reservation.dealRef?.discountPercent,
          item: reservation.dealRef?.itemRef,
        },
        retailer: reservation.retailerRef,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateReservationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    const { status } = req.body;

    let reservation: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      reservation = await Reservation.findById(id);
    }
    if (!reservation) {
      reservation = await Reservation.findOne({ pickupCode: id.toUpperCase() });
    }
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    reservation.status = status;
    if (status === 'collected') {
      reservation.paymentStatus = 'paid';
    } else if (status === 'no-show' || status === 'cancelled' || status === 'expired') {
      const deal = await Deal.findById(reservation.dealRef);
      if (deal) {
        deal.stockQuantity += reservation.quantity;
        deal.status = 'active';
        await deal.save();
      }
    }
    await reservation.save();

    res.json({ message: `Reservation status updated to ${status}`, reservation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
