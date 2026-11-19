import mongoose from 'mongoose';
import { Reservation } from '../models/Reservation.js';
import { Deal } from '../models/Deal.js';

export interface StoreOrderRecord {
  id: string;
  pickupCode: string;
  status: string;
  quantity: number;
  totalAmountPkr: number;
  originalValuePkr: number;
  savedPkr: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference: string;
  createdAt: string;
  pickupWindowEnd: string;
  item: {
    id: string;
    name: string;
    category: string;
    flavorProfile: string;
    originalPricePkr: number;
    discountedPricePkr: number;
  };
  store: {
    id: string;
    name: string;
    sector: string;
    city: string;
  };
  buyer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface StoreSalesSummary {
  storeId: string;
  storeName: string;
  category: string;
  sector: string;
  city: string;
  isVerified: boolean;
  ownerName: string;
  ownerEmail: string;
  contactPhone: string;
  activeDealsCount: number;
  expiredDealsCount: number;
  totalOrdersCount: number;
  collectedOrdersCount: number;
  pendingOrdersCount: number;
  cancelledOrNoShowCount: number;
  unitsSold: number;
  unitsPending: number;
  collectedRevenuePkr: number;
  pendingRevenuePkr: number;
  totalGrossRevenuePkr: number;
  wastedValueAvoidedPkr: number;
  uniqueBuyersCount: number;
  topItems: Array<{ itemName: string; unitsSold: number; revenuePkr: number }>;
}

export interface PlatformSalesSummary {
  totalCollectedRevenuePkr: number;
  totalPendingRevenuePkr: number;
  totalGrossRevenuePkr: number;
  totalOrdersCount: number;
  collectedOrdersCount: number;
  pendingOrdersCount: number;
  cancelledOrNoShowCount: number;
  totalUnitsSold: number;
  totalUnitsPending: number;
  totalUniqueBuyers: number;
  totalWastedValueAvoidedPkr: number;
}

export function isItemExpired(
  expiryDeadline?: Date | string | null,
  nowMs = Date.now()
): boolean {
  if (!expiryDeadline) return true;
  const ts = new Date(expiryDeadline).getTime();
  if (!Number.isFinite(ts)) return true;
  return ts <= nowMs;
}

export function mapReservationToOrderRecord(
  resDoc: any,
  fallbackRefs?: {
    user?: any;
    deal?: any;
    item?: any;
    retailer?: any;
  }
): StoreOrderRecord {
  const deal = fallbackRefs?.deal || (resDoc.dealRef && typeof resDoc.dealRef === 'object' ? resDoc.dealRef : null);
  const item =
    fallbackRefs?.item ||
    (deal?.itemRef && typeof deal.itemRef === 'object' ? deal.itemRef : null);
  const retailer =
    fallbackRefs?.retailer ||
    (resDoc.retailerRef && typeof resDoc.retailerRef === 'object' ? resDoc.retailerRef : null);
  const user =
    fallbackRefs?.user ||
    (resDoc.userRef && typeof resDoc.userRef === 'object' ? resDoc.userRef : null);

  const qty = Math.max(1, Number(resDoc.quantity || 1));
  const totalAmountPkr = Number(resDoc.totalAmountPkr || 0);
  const unitOrig = Number(item?.originalPricePkr || Math.round(totalAmountPkr / qty));
  const originalValuePkr = unitOrig * qty;
  const savedPkr = Math.max(0, originalValuePkr - totalAmountPkr);
  const discountedPricePkr = Number(
    deal?.currentDiscountedPricePkr ?? Math.round(totalAmountPkr / qty)
  );

  return {
    id: resDoc._id?.toString() || String(resDoc.id || ''),
    pickupCode: String(resDoc.pickupCode || ''),
    status: String(resDoc.status || 'pending'),
    quantity: qty,
    totalAmountPkr,
    originalValuePkr,
    savedPkr,
    paymentMethod: String(resDoc.paymentMethod || 'Cash on Pickup'),
    paymentStatus: String(resDoc.paymentStatus || 'pending'),
    paymentReference: String(resDoc.paymentReference || ''),
    createdAt: resDoc.createdAt ? new Date(resDoc.createdAt).toISOString() : new Date().toISOString(),
    pickupWindowEnd: resDoc.pickupWindowEnd
      ? new Date(resDoc.pickupWindowEnd).toISOString()
      : new Date().toISOString(),
    item: {
      id: item?._id?.toString() || String(item?.id || deal?.itemId || ''),
      name: String(item?.name || 'Surplus Box'),
      category: String(item?.category || retailer?.category || 'bakery'),
      flavorProfile: String(item?.flavorProfile || 'mixed'),
      originalPricePkr: unitOrig,
      discountedPricePkr,
    },
    store: {
      id: retailer?._id?.toString() || String(retailer?.id || resDoc.retailerId || ''),
      name: String(retailer?.name || 'Partner Store'),
      sector: String(retailer?.location?.sector || ''),
      city: String(retailer?.location?.city || 'Islamabad'),
    },
    buyer: {
      id: user?._id?.toString() || String(user?.id || resDoc.userId || ''),
      name: String(user?.name || 'Customer'),
      email: String(user?.email || ''),
      phone: String(user?.contactPhone || ''),
    },
  };
}

export function buildStoreSalesSummary(
  storeInfo: {
    id: string;
    name: string;
    category?: string;
    sector?: string;
    city?: string;
    isVerified?: boolean;
    ownerName?: string;
    ownerEmail?: string;
    contactPhone?: string;
  },
  storeOrders: StoreOrderRecord[],
  dealsForStore: Array<{
    status?: string;
    stockQuantity?: number;
    expiryDeadline?: Date | string | null;
  }>,
  nowMs = Date.now()
): StoreSalesSummary {
  let activeDealsCount = 0;
  let expiredDealsCount = 0;

  for (const d of dealsForStore) {
    const expired = d.status === 'expired' || isItemExpired(d.expiryDeadline, nowMs);
    if (expired) {
      expiredDealsCount += 1;
    } else if (d.status === 'active' && Number(d.stockQuantity || 0) > 0) {
      activeDealsCount += 1;
    }
  }

  let collectedOrdersCount = 0;
  let pendingOrdersCount = 0;
  let cancelledOrNoShowCount = 0;
  let unitsSold = 0;
  let unitsPending = 0;
  let collectedRevenuePkr = 0;
  let pendingRevenuePkr = 0;
  let wastedValueAvoidedPkr = 0;

  const uniqueBuyerKeys = new Set<string>();
  const topItemsMap = new Map<string, { itemName: string; unitsSold: number; revenuePkr: number }>();

  for (const order of storeOrders) {
    const buyerKey = order.buyer.id || order.buyer.email || order.buyer.phone || order.id;

    if (order.status === 'collected') {
      collectedOrdersCount += 1;
      unitsSold += order.quantity;
      collectedRevenuePkr += order.totalAmountPkr;
      wastedValueAvoidedPkr += order.originalValuePkr;
      uniqueBuyerKeys.add(buyerKey);

      const prev = topItemsMap.get(order.item.name) || {
        itemName: order.item.name,
        unitsSold: 0,
        revenuePkr: 0,
      };
      prev.unitsSold += order.quantity;
      prev.revenuePkr += order.totalAmountPkr;
      topItemsMap.set(order.item.name, prev);
    } else if (order.status === 'pending') {
      pendingOrdersCount += 1;
      unitsPending += order.quantity;
      pendingRevenuePkr += order.totalAmountPkr;
      uniqueBuyerKeys.add(buyerKey);
    } else {
      cancelledOrNoShowCount += 1;
    }
  }

  const topItems = Array.from(topItemsMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenuePkr - a.revenuePkr)
    .slice(0, 3);

  return {
    storeId: storeInfo.id,
    storeName: storeInfo.name,
    category: storeInfo.category || 'bakery',
    sector: storeInfo.sector || '',
    city: storeInfo.city || 'Islamabad',
    isVerified: Boolean(storeInfo.isVerified),
    ownerName: storeInfo.ownerName || '',
    ownerEmail: storeInfo.ownerEmail || '',
    contactPhone: storeInfo.contactPhone || '',
    activeDealsCount,
    expiredDealsCount,
    totalOrdersCount: storeOrders.length,
    collectedOrdersCount,
    pendingOrdersCount,
    cancelledOrNoShowCount,
    unitsSold,
    unitsPending,
    collectedRevenuePkr,
    pendingRevenuePkr,
    totalGrossRevenuePkr: collectedRevenuePkr + pendingRevenuePkr,
    wastedValueAvoidedPkr,
    uniqueBuyersCount: uniqueBuyerKeys.size,
    topItems,
  };
}

export function buildPlatformSalesSummary(allOrders: StoreOrderRecord[]): PlatformSalesSummary {
  let totalCollectedRevenuePkr = 0;
  let totalPendingRevenuePkr = 0;
  let collectedOrdersCount = 0;
  let pendingOrdersCount = 0;
  let cancelledOrNoShowCount = 0;
  let totalUnitsSold = 0;
  let totalUnitsPending = 0;
  let totalWastedValueAvoidedPkr = 0;
  const uniqueBuyers = new Set<string>();

  for (const order of allOrders) {
    const buyerKey = order.buyer.id || order.buyer.email || order.buyer.phone || order.id;

    if (order.status === 'collected') {
      collectedOrdersCount += 1;
      totalUnitsSold += order.quantity;
      totalCollectedRevenuePkr += order.totalAmountPkr;
      totalWastedValueAvoidedPkr += order.originalValuePkr;
      uniqueBuyers.add(buyerKey);
    } else if (order.status === 'pending') {
      pendingOrdersCount += 1;
      totalUnitsPending += order.quantity;
      totalPendingRevenuePkr += order.totalAmountPkr;
      uniqueBuyers.add(buyerKey);
    } else {
      cancelledOrNoShowCount += 1;
    }
  }

  return {
    totalCollectedRevenuePkr,
    totalPendingRevenuePkr,
    totalGrossRevenuePkr: totalCollectedRevenuePkr + totalPendingRevenuePkr,
    totalOrdersCount: allOrders.length,
    collectedOrdersCount,
    pendingOrdersCount,
    cancelledOrNoShowCount,
    totalUnitsSold,
    totalUnitsPending,
    totalUniqueBuyers: uniqueBuyers.size,
    totalWastedValueAvoidedPkr,
  };
}

export async function expireStalePendingReservationsMongo(
  filter: Record<string, unknown> = {}
): Promise<void> {
  const now = new Date();
  const stale = await Reservation.find({
    ...filter,
    status: 'pending',
    pickupWindowEnd: { $lt: now },
  } as any);

  for (const resItem of stale) {
    resItem.status = 'no-show';
    await resItem.save();

    if (resItem.dealRef && mongoose.Types.ObjectId.isValid(resItem.dealRef.toString())) {
      const deal: any = await Deal.findById(resItem.dealRef).populate('itemRef');
      if (deal) {
        deal.stockQuantity += resItem.quantity;
        deal.status = isItemExpired(deal.itemRef?.expiryDeadline, now.getTime())
          ? 'expired'
          : 'active';
        await deal.save();
      }
    }
  }
}
