import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { seedDatabase } from './seeds/seed';
import { memDb } from './store/memDb';
import { calculateTimeDecay } from './utils/decayCalculator';

// Mongoose MongoDB Controllers
import { register, login } from './controllers/authController';
import { getDeals } from './controllers/dealController';
import {
  createReservation,
  getMyReservations,
  verifyPickupCode,
  updateReservationStatus,
} from './controllers/reservationController';
import {
  getRetailerProfile,
  addItemAndDeal,
  overrideDealPrice,
} from './controllers/retailerController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'foodsave_pakistan_secret_key_2026';

app.use(cors());
app.use(express.json());

// Helper to determine if MongoDB Atlas is live
const isMongoConnected = (): boolean => mongoose.connection.readyState === 1;

// 1. Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Foodsave Pakistan MERN Stack API',
    locale: 'PKR (₨)',
    databaseEngine: isMongoConnected() ? 'MongoDB Atlas (Connected)' : 'In-Memory MERN Database (Development Fallback)',
    mongoReadyState: mongoose.connection.readyState,
    timestamp: new Date(),
  });
});

// 2. Auth Endpoints (Register & Login for Consumer & Retailer)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await register(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB register fallback to memDb:', mongoErr);
    }
  }

  const { name, email, role, storeName, storeCategory, storeAddress, city } = req.body;

  const newUser = {
    id: `usr-${Date.now()}`,
    name: name || 'Foodsave User',
    email: email || 'user@foodsave.pk',
    role: (role as 'consumer' | 'retailer') || 'consumer',
    totalSavedPkr: 0,
    itemsRescuedCount: 0,
  };
  memDb.users.push(newUser);

  let newRetailer = null;
  if (newUser.role === 'retailer') {
    newRetailer = {
      id: `ret-${Date.now()}`,
      name: storeName || 'New Pakistan Store',
      category: (storeCategory as 'grocery' | 'bakery' | 'restaurant') || 'grocery',
      location: {
        lat: 31.5204 + (Math.random() * 0.04 - 0.02),
        lng: 74.3587 + (Math.random() * 0.04 - 0.02),
        address: storeAddress || 'Gulberg III Main Blvd',
        city: city || 'Lahore',
      },
      isVerified: true,
      rating: 4.8,
      contactPhone: '+92 300 1234567',
      totalRecoveredPkr: 0,
      totalWastedValueAvoidedPkr: 0,
    };
    memDb.retailers.push(newRetailer);
  }

  const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: newUser,
    retailer: newRetailer,
  });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await login(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB login fallback to memDb:', mongoErr);
    }
  }

  const { email } = req.body;
  const user = memDb.users.find((u) => u.email === email) || memDb.users[0];
  const retailer = user.role === 'retailer' ? memDb.retailers[0] : null;

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user,
    retailer,
  });
});

// 3. Deals Endpoint (Calculate Rule-Based Time Decay & Filter)
app.get('/api/deals', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await getDeals(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB getDeals fallback to memDb:', mongoErr);
    }
  }

  const { category, minDiscount } = req.query;
  const deals = memDb.getPopulatedDeals(
    category ? String(category) : undefined,
    minDiscount ? Number(minDiscount) : undefined
  );
  res.json(deals);
});

// 4. Retailer Dashboard Endpoints
app.get('/api/retailer/me', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await getRetailerProfile(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB getRetailerProfile fallback to memDb:', mongoErr);
    }
  }

  const retailer = memDb.retailers[0];
  const activeDealsCount = memDb.deals.filter((d) => d.status === 'active').length;
  const reservationsCount = memDb.reservations.length;

  res.json({
    retailer,
    stats: {
      activeDealsCount,
      totalReservationsCount: reservationsCount,
      totalRecoveredPkr: retailer?.totalRecoveredPkr || 0,
      totalWastedValueAvoidedPkr: retailer?.totalWastedValueAvoidedPkr || 0,
    },
  });
});

app.post('/api/retailer/items', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await addItemAndDeal(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB addItemAndDeal fallback to memDb:', mongoErr);
    }
  }

  const { name, category, originalPricePkr, quantity, expiryHoursLeft, imageUrl } = req.body;

  const retailer = memDb.retailers[0];
  const itemId = `itm-${Date.now()}`;
  const dealId = `dl-${Date.now()}`;
  const price = Number(originalPricePkr || 1000);
  const hrs = Number(expiryHoursLeft || 2.0);
  const cat = (category as 'grocery' | 'bakery' | 'restaurant') || 'grocery';
  const qty = Number(quantity || 1);

  const newItem = {
    id: itemId,
    name: name || 'Surplus Food Item',
    category: cat,
    originalPricePkr: price,
    quantity: qty,
    expiryDeadline: new Date(Date.now() + hrs * 3600 * 1000).toISOString(),
    retailerId: retailer.id,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
  };
  memDb.items.push(newItem);

  const decay = calculateTimeDecay(price, hrs, cat);

  const newDeal = {
    id: dealId,
    itemId,
    retailerId: retailer.id,
    currentDiscountedPricePkr: decay.currentDiscountedPricePkr,
    discountPercent: decay.currentDiscountPercent,
    decaySchedule: decay.decaySchedule,
    status: 'active' as const,
    stockQuantity: qty,
    pickupWindowText: `Pick up within ${hrs.toFixed(1)} hrs`,
    hoursRemaining: hrs,
  };
  memDb.deals.unshift(newDeal);

  res.status(201).json({
    message: 'Surplus item listed with AI time-decay schedule',
    item: newItem,
    deal: newDeal,
  });
});

app.delete('/api/deals/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const dealIdx = memDb.deals.findIndex((d) => d.id === id);
  if (dealIdx !== -1) {
    const deletedDeal = memDb.deals.splice(dealIdx, 1)[0];
    const itemIdx = memDb.items.findIndex((i) => i.id === deletedDeal.itemId);
    if (itemIdx !== -1) {
      memDb.items.splice(itemIdx, 1);
    }
    res.json({ message: 'Surplus deal and item removed successfully', id });
    return;
  }
  res.json({ message: 'Deal removed from memory', id });
});

app.put('/api/retailer/deals/:id/override', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await overrideDealPrice(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB overrideDealPrice fallback to memDb:', mongoErr);
    }
  }

  const { id } = req.params;
  const { manualOverridePricePkr } = req.body;

  const deal = memDb.deals.find((d) => d.id === id);
  if (!deal) {
    res.status(404).json({ error: 'Deal not found' });
    return;
  }

  const item = memDb.items.find((i) => i.id === deal.itemId);
  const overridePrice = Number(manualOverridePricePkr);

  deal.manualOverridePricePkr = overridePrice;
  deal.currentDiscountedPricePkr = overridePrice;
  if (item) {
    deal.discountPercent = Math.round(((item.originalPricePkr - overridePrice) / item.originalPricePkr) * 100);
  }

  res.json({ message: 'Manual price override applied', deal });
});

// 5. Reservation Endpoints (JazzCash / EasyPaisa / Cash Pickup & Pickup Code Generation)
app.post('/api/reservations', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await createReservation(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB createReservation fallback to memDb:', mongoErr);
    }
  }

  const { dealId, quantity, paymentMethod } = req.body;

  const deal = memDb.deals.find((d) => d.id === dealId);
  if (!deal || deal.status !== 'active') {
    res.status(400).json({ error: 'Deal unavailable' });
    return;
  }

  const qty = Number(quantity || 1);
  if (deal.stockQuantity < qty) {
    res.status(400).json({ error: 'Insufficient stock remaining' });
    return;
  }

  const user = memDb.users[0];
  const retailer = memDb.retailers.find((r) => r.id === deal.retailerId) || memDb.retailers[0];
  const item = memDb.items.find((i) => i.id === deal.itemId);

  const pickupCode = `PK-${Math.floor(10000 + Math.random() * 90000)}`;
  const totalAmountPkr = deal.currentDiscountedPricePkr * qty;
  const originalTotalPkr = (item?.originalPricePkr || 1000) * qty;
  const savedPkr = originalTotalPkr - totalAmountPkr;

  const pickupWindowEnd = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const newReservation = {
    id: `res-${Date.now()}`,
    userId: user.id,
    dealId: deal.id,
    retailerId: retailer.id,
    pickupCode,
    status: 'pending' as const,
    pickupWindowEnd,
    quantity: qty,
    totalAmountPkr,
    paymentMethod: (paymentMethod as any) || 'JazzCash',
    paymentStatus: paymentMethod === 'Cash on Pickup' ? ('pending' as const) : ('paid' as const),
    createdAt: new Date().toISOString(),
  };
  memDb.reservations.unshift(newReservation);

  // Deduct stock
  deal.stockQuantity -= qty;
  if (deal.stockQuantity <= 0) {
    deal.status = 'sold';
  }

  // Update user & retailer metrics
  user.totalSavedPkr += savedPkr;
  user.itemsRescuedCount += qty;
  retailer.totalRecoveredPkr += totalAmountPkr;
  retailer.totalWastedValueAvoidedPkr += originalTotalPkr;

  res.status(201).json({
    message: 'Reservation locked successfully',
    reservation: newReservation,
    pickupCode,
    savedPkr,
    pickupWindowEnd,
  });
});

app.get('/api/reservations/me', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await getMyReservations(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB getMyReservations fallback to memDb:', mongoErr);
    }
  }

  const result = memDb.reservations.map((resItem) => {
    const deal = memDb.deals.find((d) => d.id === resItem.dealId);
    const item = memDb.items.find((i) => i.id === deal?.itemId);
    const retailer = memDb.retailers.find((r) => r.id === resItem.retailerId);

    return {
      ...resItem,
      deal: {
        ...deal,
        item,
      },
      retailer,
    };
  });

  res.json(result);
});

// 6. Cashier / Retailer Pickup Pass Verification & Collection
app.post('/api/reservations/verify', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await verifyPickupCode(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB verifyPickupCode fallback to memDb:', mongoErr);
    }
  }

  const { pickupCode } = req.body;
  if (!pickupCode) {
    res.status(400).json({ error: 'Pickup code is required' });
    return;
  }

  const cleanCode = String(pickupCode).trim().toUpperCase();
  const reservation = memDb.reservations.find(
    (r) => r.pickupCode.toUpperCase() === cleanCode || r.id === pickupCode
  );

  if (!reservation) {
    res.status(404).json({ error: `No active reservation found with code: ${cleanCode}` });
    return;
  }

  const deal = memDb.deals.find((d) => d.id === reservation.dealId);
  const item = memDb.items.find((i) => i.id === deal?.itemId);
  const retailer = memDb.retailers.find((r) => r.id === reservation.retailerId);

  res.json({
    message: 'Pass verified successfully',
    reservation: {
      ...reservation,
      deal: { ...deal, item },
      retailer,
    },
  });
});

app.put('/api/reservations/:id/status', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await updateReservationStatus(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB updateReservationStatus fallback to memDb:', mongoErr);
    }
  }

  const { id } = req.params;
  const { status } = req.body;

  const reservation = memDb.reservations.find((r) => r.id === id || r.pickupCode === id);
  if (!reservation) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }

  reservation.status = status;
  if (status === 'collected') {
    reservation.paymentStatus = 'paid';
  } else if (status === 'no-show' || status === 'cancelled' || status === 'expired') {
    // Restore stock back to deal
    const deal = memDb.deals.find((d) => d.id === reservation.dealId);
    if (deal) {
      deal.stockQuantity += reservation.quantity;
      deal.status = 'active';
    }
  }

  res.json({
    message: `Reservation updated to ${status}`,
    reservation,
  });
});

const startServer = async () => {
  const isConnected = await connectDB();
  if (isConnected) {
    try {
      await seedDatabase();
    } catch (seedErr) {
      console.warn('⚠️ Seeding note:', seedErr);
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Foodsave Pakistan MERN Express API running at http://localhost:${PORT}`);
    console.log(`📡 Database mode: ${isMongoConnected() ? 'MongoDB Atlas' : 'In-Memory DB'}`);
  });
};

startServer();
