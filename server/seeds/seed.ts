import { User } from '../models/User';
import { Retailer } from '../models/Retailer';
import { Item } from '../models/Item';
import { Deal } from '../models/Deal';
import { calculateTimeDecay } from '../utils/decayCalculator';

export async function seedDatabase() {
  console.log('🌱 Checking seed data status...');

  const retailerCount = await Retailer.countDocuments();
  if (retailerCount > 0) {
    console.log(`ℹ️ Database already seeded with ${retailerCount} retailers.`);
    return;
  }

  console.log('🌱 Seeding Foodsave Pakistan dataset...');

  // Create Sample Retailer Users
  await User.create({

    name: 'Hamza Khan',
    email: 'hamza@example.com',
    passwordHash: 'hashed_password_123',
    role: 'consumer',
    contactPhone: '+92 300 9876543',
    totalSavedPkr: 4250,
    itemsRescuedCount: 7,
  });

  const userRetailer = await User.create({
    name: 'Al-Fatah Store Manager',
    email: 'alfatah@example.com',
    passwordHash: 'hashed_password_123',
    role: 'retailer',
    contactPhone: '+92 321 4445556',
  });

  // Create 6 Retailer Locations in Pakistan
  const retailers = await Retailer.insertMany([
    {
      name: 'Al-Fatah Gourmet Supermarket',
      category: 'grocery',
      location: { lat: 31.5204, lng: 74.3587, address: 'Main Boulevard, Gulberg III', city: 'Lahore' },
      isVerified: true,
      rating: 4.9,
      contactPhone: '+92 42 35754401',
      totalRecoveredPkr: 145000,
      totalWastedValueAvoidedPkr: 420000,
      userRef: userRetailer._id,
    },
    {
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
      name: 'Espresso Bistro & Grill',
      category: 'restaurant',
      location: { lat: 24.8200, lng: 67.0300, address: 'Block 4, Clifton', city: 'Karachi' },
      isVerified: true,
      rating: 4.6,
      contactPhone: '+92 21 35877889',
      totalRecoveredPkr: 76000,
      totalWastedValueAvoidedPkr: 220000,
    },
  ]);

  // Create Items & Active Deals
  const seedItemsData = [
    {
      retailerIdx: 0,
      name: 'Fresh Chaunsa Mangoes Crate (5kg)',
      category: 'grocery' as const,
      originalPricePkr: 1800,
      quantity: 6,
      expiryHoursLeft: 1.5,
      imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
    },
    {
      retailerIdx: 2,
      name: 'Artisan Sourdough & Croissant Surplus Bag',
      category: 'bakery' as const,
      originalPricePkr: 950,
      quantity: 4,
      expiryHoursLeft: 0.8,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    },
    {
      retailerIdx: 5,
      name: 'Special Chicken Biryani Family Pack',
      category: 'restaurant' as const,
      originalPricePkr: 2200,
      quantity: 3,
      expiryHoursLeft: 1.2,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    },
    {
      retailerIdx: 1,
      name: 'Farm-Fresh Dairy & Cheese Crate',
      category: 'grocery' as const,
      originalPricePkr: 1450,
      quantity: 5,
      expiryHoursLeft: 2.5,
      imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80',
    },
    {
      retailerIdx: 3,
      name: 'Freshly Baked Chicken Patties & Samosa Box (12 pcs)',
      category: 'bakery' as const,
      originalPricePkr: 850,
      quantity: 8,
      expiryHoursLeft: 1.0,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    },
    {
      retailerIdx: 4,
      name: 'Imported Belgian Dark Chocolate Mousse Cake',
      category: 'grocery' as const,
      originalPricePkr: 3200,
      quantity: 2,
      expiryHoursLeft: 3.0,
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    },
    {
      retailerIdx: 0,
      name: 'Chef Prepared Grilled Rotisserie Chicken & Naan',
      category: 'restaurant' as const,
      originalPricePkr: 1650,
      quantity: 4,
      expiryHoursLeft: 0.9,
      imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80',
    },
  ];

  for (const seed of seedItemsData) {
    const retailer = retailers[seed.retailerIdx];
    const expiryDeadline = new Date(Date.now() + seed.expiryHoursLeft * 3600 * 1000);

    const item = await Item.create({
      name: seed.name,
      category: seed.category,
      originalPricePkr: seed.originalPricePkr,
      quantity: seed.quantity,
      expiryDeadline,
      retailerRef: retailer._id,
      imageUrl: seed.imageUrl,
    });

    const decay = calculateTimeDecay(seed.originalPricePkr, seed.expiryHoursLeft, seed.category);

    await Deal.create({
      itemRef: item._id,
      retailerRef: retailer._id,
      currentDiscountedPricePkr: decay.currentDiscountedPricePkr,
      discountPercent: decay.currentDiscountPercent,
      decaySchedule: decay.decaySchedule,
      status: 'active',
      stockQuantity: seed.quantity,
      pickupWindowText: `Pick up within ${seed.expiryHoursLeft.toFixed(1)} hrs`,
    });
  }

  console.log('✅ Foodsave Pakistan database successfully populated!');
}
