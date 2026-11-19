import { calculateTimeDecay } from '../utils/decayCalculator.js';
import { isItemExpired } from '../utils/salesAnalytics.js';

export interface MemUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  authProvider?: 'local' | 'google';
  googleId?: string;
  role: 'consumer' | 'retailer' | 'admin';
  contactPhone?: string;
  totalSavedPkr: number;
  itemsRescuedCount: number;
}

export interface MemRetailer {
  id: string;
  userId?: string;
  name: string;
  category: 'grocery' | 'bakery' | 'restaurant';
  location: { lat: number; lng: number; address: string; city: string; sector?: string };
  isVerified: boolean;
  rating: number;
  contactPhone: string;
  totalRecoveredPkr: number;
  totalWastedValueAvoidedPkr: number;
}

export interface MemItem {
  id: string;
  name: string;
  category: 'grocery' | 'bakery' | 'restaurant';
  flavorProfile?: 'savory' | 'sweet' | 'drinks' | 'mixed';
  isMysteryBag?: boolean;
  originalPricePkr: number;
  quantity: number;
  expiryDeadline: string;
  retailerId: string;
  imageUrl: string;
}

export interface MemDeal {
  id: string;
  itemId: string;
  retailerId: string;
  currentDiscountedPricePkr: number;
  discountPercent: number;
  decaySchedule: { hoursRemaining: number; discountPercent: number; pricePkr: number }[];
  status: 'active' | 'sold' | 'expired';
  manualOverridePricePkr?: number;
  stockQuantity: number;
  pickupWindowText: string;
  hoursRemaining: number;
}

export interface MemReservation {
  id: string;
  userId: string;
  dealId: string;
  retailerId: string;
  pickupCode: string;
  status: 'pending' | 'collected' | 'no-show' | 'cancelled';
  pickupWindowEnd: string;
  quantity: number;
  totalAmountPkr: number;
  paymentMethod: 'JazzCash' | 'EasyPaisa' | 'Cash on Pickup';
  paymentStatus: 'paid' | 'pending';
  paymentReference?: string;
  dismissedByUser?: boolean;
  createdAt: string;
}

class MemoryDatabase {
  users: MemUser[] = [];
  retailers: MemRetailer[] = [];
  items: MemItem[] = [];
  deals: MemDeal[] = [];
  reservations: MemReservation[] = [];
  partnerLeads: any[] = [];
  dropSubscribers: any[] = [];
  pushSubscriptions: any[] = [];

  getRetailerByUserId(userId?: string): MemRetailer | undefined {
    if (!userId) return undefined;
    return this.retailers.find((r) => r.userId === userId);
  }

  getPopulatedDeals(categoryFilter?: string, minDiscountFilter?: number) {
    const now = Date.now();
    const activeDeals: MemDeal[] = [];

    for (const deal of this.deals) {
      if (deal.status !== 'active' || deal.stockQuantity <= 0) continue;
      const item = this.items.find((i) => i.id === deal.itemId);
      if (!item || isItemExpired(item.expiryDeadline, now)) {
        deal.status = 'expired';
        continue;
      }
      activeDeals.push(deal);
    }

    let result = activeDeals.map((deal) => {
      const item = this.items.find((i) => i.id === deal.itemId);
      const retailer = this.retailers.find((r) => r.id === deal.retailerId);

      const expiry = item?.expiryDeadline ? new Date(item.expiryDeadline).getTime() : 0;
      const hrs =
        expiry && Number.isFinite(expiry)
          ? Math.max(0.05, (expiry - now) / (1000 * 60 * 60))
          : deal.hoursRemaining || 2.0;
      const decay = calculateTimeDecay(item?.originalPricePkr || 1000, hrs, item?.category || 'grocery');

      const price = deal.manualOverridePricePkr ?? decay.currentDiscountedPricePkr;
      const disc = item
        ? Math.round(((item.originalPricePkr - price) / item.originalPricePkr) * 100)
        : decay.currentDiscountPercent;

      return {
        id: deal.id,
        item: item ? { ...item, originalPricePkr: item.originalPricePkr } : null,
        retailer: retailer || null,
        currentDiscountedPricePkr: price,
        discountPercent: disc,
        decaySchedule: decay.decaySchedule,
        status: deal.status,
        stockQuantity: deal.stockQuantity,
        pickupWindowText: deal.pickupWindowText,
        hoursRemaining: Number(hrs.toFixed(3)),
        manualOverridePricePkr: deal.manualOverridePricePkr,
      };
    });

    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter((d) => d.item?.category === categoryFilter);
    }

    if (minDiscountFilter) {
      result = result.filter((d) => d.discountPercent >= minDiscountFilter);
    }

    return result;
  }
}

export const memDb = new MemoryDatabase();
