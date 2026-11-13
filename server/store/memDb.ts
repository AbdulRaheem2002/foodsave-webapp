import { calculateTimeDecay } from '../utils/decayCalculator';

export interface MemUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'consumer' | 'retailer';
  contactPhone?: string;
  totalSavedPkr: number;
  itemsRescuedCount: number;
}

export interface MemRetailer {
  id: string;
  userId?: string;
  name: string;
  category: 'grocery' | 'bakery' | 'restaurant';
  location: { lat: number; lng: number; address: string; city: string };
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
  createdAt: string;
}

class MemoryDatabase {
  users: MemUser[] = [];
  retailers: MemRetailer[] = [];
  items: MemItem[] = [];
  deals: MemDeal[] = [];
  reservations: MemReservation[] = [];

  getRetailerByUserId(userId?: string): MemRetailer | undefined {
    if (!userId) return undefined;
    return this.retailers.find((r) => r.userId === userId);
  }

  getPopulatedDeals(categoryFilter?: string, minDiscountFilter?: number) {
    const activeDeals = this.deals.filter((d) => d.status === 'active' && d.stockQuantity > 0);

    let result = activeDeals.map((deal) => {
      const item = this.items.find((i) => i.id === deal.itemId);
      const retailer = this.retailers.find((r) => r.id === deal.retailerId);

      const hrs = deal.hoursRemaining || 2.0;
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
        hoursRemaining: hrs,
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
