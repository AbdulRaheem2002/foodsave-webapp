import bcrypt from 'bcryptjs';
import { calculateTimeDecay } from '../utils/decayCalculator';

export interface MemUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'consumer' | 'retailer';
  contactPhone?: string;
  totalSavedPkr: number;
  itemsRescuedCount: number;
}

export interface MemRetailer {
  id: string;
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

  constructor() {
    this.seed();
  }

  seed() {
    if (this.retailers.length > 0) return;

    const defaultPasswordHash = bcrypt.hashSync('foodsave123', 10);

    // Seed Consumer & Retailer Users
    this.users.push(
      {
        id: 'usr-1',
        name: 'Hamza Khan',
        email: 'hamza@example.com',
        passwordHash: defaultPasswordHash,
        role: 'consumer',
        contactPhone: '+92 300 9876543',
        totalSavedPkr: 4250,
        itemsRescuedCount: 7,
      },
      {
        id: 'usr-2',
        name: 'Al-Fatah Store Manager',
        email: 'alfatah@example.com',
        passwordHash: defaultPasswordHash,
        role: 'retailer',
        contactPhone: '+92 321 4445556',
        totalSavedPkr: 0,
        itemsRescuedCount: 0,
      }
    );

    // Seed 6 Retailers in Pakistan
    this.retailers.push(
      {
        id: 'ret-1',
        name: 'Al-Fatah Gourmet Supermarket',
        category: 'grocery',
        location: { lat: 31.5204, lng: 74.3587, address: 'Main Boulevard, Gulberg III', city: 'Lahore' },
        isVerified: true,
        rating: 4.9,
        contactPhone: '+92 42 35754401',
        totalRecoveredPkr: 145000,
        totalWastedValueAvoidedPkr: 420000,
      },
      {
        id: 'ret-2',
        name: 'Naheed Supermarket',
        category: 'grocery',
        location: { lat: 24.8833, lng: 67.0667, address: 'Bahadurabad Main Chowk', city: 'Karachi' },
        isVerified: true,
        rating: 4.8,
        contactPhone: '+92 21 111 624 333',
        totalRecoveredPkr: 198000,
        totalWastedValueAvoidedPkr: 580000,
      },
      {
        id: 'ret-3',
        name: 'Tehzeeb Bakery',
        category: 'bakery',
        location: { lat: 33.7167, lng: 73.0667, address: 'Jinnah Avenue, Blue Area', city: 'Islamabad' },
        isVerified: true,
        rating: 4.9,
        contactPhone: '+92 51 2826888',
        totalRecoveredPkr: 112000,
        totalWastedValueAvoidedPkr: 340000,
      },
      {
        id: 'ret-4',
        name: 'Kitchen Cuisine',
        category: 'bakery',
        location: { lat: 31.4700, lng: 74.3800, address: 'Phase 5 Commercial Area, DHA', city: 'Lahore' },
        isVerified: true,
        rating: 4.7,
        contactPhone: '+92 42 35728899',
        totalRecoveredPkr: 89000,
        totalWastedValueAvoidedPkr: 260000,
      },
      {
        id: 'ret-5',
        name: 'Jalal Sons',
        category: 'grocery',
        location: { lat: 31.5400, lng: 74.3300, address: 'M.M. Alam Road, Gulberg', city: 'Lahore' },
        isVerified: true,
        rating: 4.8,
        contactPhone: '+92 42 111 525 252',
        totalRecoveredPkr: 165000,
        totalWastedValueAvoidedPkr: 490000,
      },
      {
        id: 'ret-6',
        name: 'Espresso Bistro & Grill',
        category: 'restaurant',
        location: { lat: 24.8200, lng: 67.0300, address: 'Block 4, Clifton', city: 'Karachi' },
        isVerified: true,
        rating: 4.6,
        contactPhone: '+92 21 35877889',
        totalRecoveredPkr: 76000,
        totalWastedValueAvoidedPkr: 220000,
      }
    );

    // Seed Sample Items & Deals
    const seedItems = [
      {
        retId: 'ret-1',
        name: 'Fresh Chaunsa Mangoes Crate (5kg)',
        category: 'grocery' as const,
        price: 1800,
        qty: 6,
        hrs: 1.5,
        img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
      },
      {
        retId: 'ret-3',
        name: 'Artisan Sourdough & Croissant Surplus Bag',
        category: 'bakery' as const,
        price: 950,
        qty: 4,
        hrs: 0.8,
        img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      },
      {
        retId: 'ret-6',
        name: 'Special Chicken Biryani Family Pack',
        category: 'restaurant' as const,
        price: 2200,
        qty: 3,
        hrs: 1.2,
        img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      },
      {
        retId: 'ret-2',
        name: 'Farm-Fresh Dairy & Cheese Crate',
        category: 'grocery' as const,
        price: 1450,
        qty: 5,
        hrs: 2.5,
        img: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80',
      },
      {
        retId: 'ret-4',
        name: 'Freshly Baked Chicken Patties & Samosas (12 pcs)',
        category: 'bakery' as const,
        price: 850,
        qty: 8,
        hrs: 1.0,
        img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
      },
      {
        retId: 'ret-5',
        name: 'Imported Belgian Dark Chocolate Mousse Cake',
        category: 'grocery' as const,
        price: 3200,
        qty: 2,
        hrs: 3.0,
        img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      },
    ];

    seedItems.forEach((s, idx) => {
      const itemId = `itm-${idx + 1}`;
      const dealId = `dl-${idx + 1}`;
      const expiry = new Date(Date.now() + s.hrs * 3600 * 1000).toISOString();

      this.items.push({
        id: itemId,
        name: s.name,
        category: s.category,
        originalPricePkr: s.price,
        quantity: s.qty,
        expiryDeadline: expiry,
        retailerId: s.retId,
        imageUrl: s.img,
      });

      const decay = calculateTimeDecay(s.price, s.hrs, s.category);

      this.deals.push({
        id: dealId,
        itemId: itemId,
        retailerId: s.retId,
        currentDiscountedPricePkr: decay.currentDiscountedPricePkr,
        discountPercent: decay.currentDiscountPercent,
        decaySchedule: decay.decaySchedule,
        status: 'active',
        stockQuantity: s.qty,
        pickupWindowText: `Pick up within ${s.hrs.toFixed(1)} hrs`,
        hoursRemaining: s.hrs,
      });
    });
  }

  getPopulatedDeals(categoryFilter?: string, minDiscountFilter?: number) {
    let activeDeals = this.deals.filter((d) => d.status === 'active' && d.stockQuantity > 0);

    let result = activeDeals.map((deal) => {
      const item = this.items.find((i) => i.id === deal.itemId);
      const retailer = this.retailers.find((r) => r.id === deal.retailerId);

      const hrs = deal.hoursRemaining || 2.0;
      const decay = calculateTimeDecay(item?.originalPricePkr || 1000, hrs, item?.category || 'grocery');

      const price = deal.manualOverridePricePkr ?? decay.currentDiscountedPricePkr;
      const disc = item ? Math.round(((item.originalPricePkr - price) / item.originalPricePkr) * 100) : decay.currentDiscountPercent;

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
