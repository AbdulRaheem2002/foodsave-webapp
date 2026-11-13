import { Response } from 'express';
import mongoose from 'mongoose';
import { Reservation } from '../models/Reservation';
import { Deal } from '../models/Deal';
import { User } from '../models/User';
import { Retailer } from '../models/Retailer';
import type { AuthRequest } from '../middleware/auth';

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

    res.json(reservations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyPickupCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pickupCode } = req.body;
    if (!pickupCode) {
      res.status(400).json({ error: 'Pickup code is required' });
      return;
    }

    const cleanCode = String(pickupCode).trim().toUpperCase();
    let reservation: any = await Reservation.findOne({ pickupCode: cleanCode })
      .populate({ path: 'dealRef', populate: { path: 'itemRef' } })
      .populate('retailerRef');

    if (!reservation && mongoose.Types.ObjectId.isValid(pickupCode)) {
      reservation = await Reservation.findById(pickupCode)
        .populate({ path: 'dealRef', populate: { path: 'itemRef' } })
        .populate('retailerRef');
    }

    if (!reservation) {
      res.status(404).json({ error: `No active reservation found with code: ${cleanCode}` });
      return;
    }

    res.json({
      message: 'Pass verified successfully',
      reservation: {
        id: reservation._id,
        pickupCode: reservation.pickupCode,
        status: reservation.status,
        quantity: reservation.quantity,
        totalAmountPkr: reservation.totalAmountPkr,
        paymentMethod: reservation.paymentMethod,
        paymentStatus: reservation.paymentStatus,
        pickupWindowEnd: reservation.pickupWindowEnd,
        deal: {
          id: reservation.dealRef?._id,
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

export const updateReservationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
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
