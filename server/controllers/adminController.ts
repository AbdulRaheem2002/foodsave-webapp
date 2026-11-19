import { Response } from 'express';
import mongoose from 'mongoose';
import { Retailer } from '../models/Retailer.js';
import { PartnerLead } from '../models/PartnerLead.js';
import { DropAlertSubscriber } from '../models/DropAlertSubscriber.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { Item } from '../models/Item.js';
import { Deal } from '../models/Deal.js';
import { Reservation } from '../models/Reservation.js';
import {
  buildPlatformSalesSummary,
  buildStoreSalesSummary,
  expireStalePendingReservationsMongo,
  isItemExpired,
  mapReservationToOrderRecord,
  type StoreOrderRecord,
} from '../utils/salesAnalytics.js';
import type { AuthRequest } from '../middleware/auth.js';

const ALLOWED_LEAD_STATUSES = ['new', 'contacted', 'approved', 'rejected'] as const;

export function formatAdminRetailerDto(retailer: any) {
  const userObj = retailer.userRef;
  return {
    id: retailer._id?.toString() || retailer.id,
    name: retailer.name,
    category: retailer.category,
    address: retailer.location?.address || '',
    city: retailer.location?.city || 'Islamabad',
    sector: retailer.location?.sector || '',
    isVerified: Boolean(retailer.isVerified),
    rating: retailer.rating ?? 5.0,
    contactPhone: retailer.contactPhone || userObj?.contactPhone || '',
    ownerName: userObj?.name || '',
    ownerEmail: userObj?.email || '',
    totalRecoveredPkr: retailer.totalRecoveredPkr ?? 0,
    totalWastedValueAvoidedPkr: retailer.totalWastedValueAvoidedPkr ?? 0,
    createdAt: retailer.createdAt || new Date().toISOString(),
  };
}

export const getAdminOverview = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await expireStalePendingReservationsMongo({});

    const now = Date.now();
    const [retailers, partnerLeads, dropSubscribers, pushSubscribers, allDeals, allReservations] =
      await Promise.all([
        Retailer.find().populate('userRef', 'name email contactPhone').sort({ createdAt: -1 }),
        PartnerLead.find().sort({ createdAt: -1 }),
        DropAlertSubscriber.find().sort({ createdAt: -1 }),
        PushSubscription.find({ isActive: true }).sort({ updatedAt: -1 }),
        Deal.find().populate('itemRef'),
        Reservation.find()
          .populate('userRef', 'name email contactPhone')
          .populate({ path: 'dealRef', populate: { path: 'itemRef' } })
          .populate('retailerRef')
          .sort({ createdAt: -1 }),
      ]);

    const staleDealIds: any[] = [];
    for (const deal of allDeals as any[]) {
      if (
        deal.status === 'active' &&
        (!deal.itemRef || isItemExpired(deal.itemRef.expiryDeadline, now))
      ) {
        staleDealIds.push(deal._id);
        deal.status = 'expired';
      }
    }
    if (staleDealIds.length > 0) {
      await Deal.updateMany({ _id: { $in: staleDealIds } }, { $set: { status: 'expired' } });
    }

    const activeDealsCount = (allDeals as any[]).filter(
      (d) =>
        d.status === 'active' &&
        Number(d.stockQuantity || 0) > 0 &&
        !isItemExpired(d.itemRef?.expiryDeadline, now)
    ).length;

    const mappedRetailers = retailers.map(formatAdminRetailerDto);
    const pendingRetailers = mappedRetailers.filter((r) => !r.isVerified);
    const approvedRetailers = mappedRetailers.filter((r) => r.isVerified);

    const allOrders = allReservations.map((r: any) => mapReservationToOrderRecord(r));
    const ordersByStore = new Map<string, StoreOrderRecord[]>();
    for (const order of allOrders) {
      const sid = order.store.id;
      if (!sid) continue;
      const list = ordersByStore.get(sid) || [];
      list.push(order);
      ordersByStore.set(sid, list);
    }

    const dealsByStore = new Map<
      string,
      Array<{ status?: string; stockQuantity?: number; expiryDeadline?: Date | string | null }>
    >();
    for (const d of allDeals as any[]) {
      const sid = d.retailerRef?.toString() || d.itemRef?.retailerRef?.toString() || '';
      if (!sid) continue;
      const list = dealsByStore.get(sid) || [];
      list.push({
        status: d.status,
        stockQuantity: d.stockQuantity,
        expiryDeadline: d.itemRef?.expiryDeadline,
      });
      dealsByStore.set(sid, list);
    }

    const platformSales = buildPlatformSalesSummary(allOrders);
    const storeAnalytics = mappedRetailers
      .map((store) =>
        buildStoreSalesSummary(
          store,
          ordersByStore.get(store.id) || [],
          dealsByStore.get(store.id) || [],
          now
        )
      )
      .sort(
        (a, b) =>
          b.totalGrossRevenuePkr - a.totalGrossRevenuePkr ||
          b.collectedOrdersCount - a.collectedOrdersCount ||
          b.totalOrdersCount - a.totalOrdersCount
      );

    const mappedLeads = partnerLeads.map((lead: any) => ({
      id: lead._id.toString(),
      ownerName: lead.ownerName,
      businessName: lead.businessName,
      businessType: lead.businessType,
      city: lead.city,
      sector: lead.sector,
      phone: lead.phone,
      email: lead.email || '',
      notes: lead.notes || '',
      status: lead.status,
      createdAt: lead.createdAt,
    }));

    const mappedSubscribers = dropSubscribers.map((sub: any) => ({
      id: sub._id.toString(),
      name: sub.name || '',
      phone: sub.phone,
      email: sub.email || '',
      city: sub.city || 'Islamabad',
      sector: sub.sector || 'All Islamabad',
      sectors:
        Array.isArray(sub.sectors) && sub.sectors.length > 0
          ? sub.sectors
          : [sub.sector || 'All Islamabad'],
      preference: sub.preference || 'all',
      preferences:
        Array.isArray(sub.preferences) && sub.preferences.length > 0
          ? sub.preferences
          : [sub.preference || 'all'],
      createdAt: sub.createdAt,
    }));

    const mappedPushSubscribers = pushSubscribers.map((sub: any) => ({
      id: sub._id.toString(),
      city: sub.city || 'Islamabad',
      sectors:
        Array.isArray(sub.sectors) && sub.sectors.length > 0
          ? sub.sectors
          : ['All Islamabad'],
      preferences:
        Array.isArray(sub.preferences) && sub.preferences.length > 0
          ? sub.preferences
          : ['all'],
      deviceType: sub.deviceType || 'other',
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));

    res.json({
      stats: {
        pendingRetailersCount: pendingRetailers.length,
        approvedRetailersCount: approvedRetailers.length,
        partnerLeadsCount: mappedLeads.length,
        dropSubscribersCount: mappedSubscribers.length,
        pushSubscribersCount: mappedPushSubscribers.length,
        activeDealsCount,
      },
      pendingRetailers,
      approvedRetailers,
      partnerLeads: mappedLeads,
      dropSubscribers: mappedSubscribers,
      pushSubscribers: mappedPushSubscribers,
      platformSales,
      storeAnalytics,
      recentOrders: allOrders.slice(0, 200),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not load admin dashboard.' });
  }
};

export const updateRetailerApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    const isVerified = Boolean(req.body?.isVerified);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid store ID.' });
      return;
    }

    const retailer = await Retailer.findByIdAndUpdate(
      id,
      { $set: { isVerified } },
      { returnDocument: 'after' }
    ).populate('userRef', 'name email contactPhone');

    if (!retailer) {
      res.status(404).json({ error: 'Store not found.' });
      return;
    }

    res.json({
      message: isVerified ? 'Store approved and Store POS unlocked!' : 'Store moved back to pending review.',
      retailer: formatAdminRetailerDto(retailer),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not update store approval status.' });
  }
};

export const deleteAdminRetailer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid store ID.' });
      return;
    }

    const retailer = await Retailer.findById(id);
    if (!retailer) {
      res.status(404).json({ error: 'Store not found.' });
      return;
    }

    await Promise.all([
      Deal.deleteMany({ retailerRef: retailer._id }),
      Item.deleteMany({ retailerRef: retailer._id }),
      Retailer.deleteOne({ _id: retailer._id }),
    ]);

    res.json({ message: 'Store application removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not delete store.' });
  }
};

export const updatePartnerLeadStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    const status = String(req.body?.status || '').trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid lead ID.' });
      return;
    }

    if (!ALLOWED_LEAD_STATUSES.includes(status as any)) {
      res.status(400).json({ error: 'Status must be new, contacted, approved, or rejected.' });
      return;
    }

    const lead = await PartnerLead.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: 'after' }
    );
    if (!lead) {
      res.status(404).json({ error: 'Partner lead not found.' });
      return;
    }

    res.json({
      message: `Lead marked as ${status}`,
      lead: {
        id: lead._id.toString(),
        status: lead.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not update lead status.' });
  }
};

export const deleteDropSubscriber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid subscriber ID.' });
      return;
    }

    const removed = await DropAlertSubscriber.findByIdAndDelete(id);
    if (!removed) {
      res.status(404).json({ error: 'Subscriber not found.' });
      return;
    }

    res.json({ message: 'Drop alert subscriber removed.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not remove subscriber.' });
  }
};

export const deletePushSubscriber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid push subscription ID.' });
      return;
    }

    const removed = await PushSubscription.findByIdAndDelete(id);
    if (!removed) {
      res.status(404).json({ error: 'Push subscription not found.' });
      return;
    }

    res.json({ message: 'Device removed from instant push alerts.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not remove push subscription.' });
  }
};
