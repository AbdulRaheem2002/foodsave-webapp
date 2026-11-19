import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, isMongoConnected } from './config/db.js';
import { memDb } from './store/memDb.js';
import { Retailer } from './models/Retailer.js';
import { calculateTimeDecay } from './utils/decayCalculator.js';
import {
  validateRegisterPayload,
  validateLoginPayload,
  normalizePhone,
  isConfiguredAdminEmail,
  CITY_COORDINATES,
  ALLOWED_STORE_CATEGORIES,
} from './utils/authValidation.js';
import { authenticateToken, optionalAuth, requireRetailer, requireAdmin, getJwtSecret, type AuthRequest } from './middleware/auth.js';

// Mongoose MongoDB Controllers
import { register, login, googleLogin, verifyGoogleToken } from './controllers/authController.js';
import {
  getAdminOverview,
  updateRetailerApproval,
  deleteAdminRetailer,
  updatePartnerLeadStatus,
  deleteDropSubscriber,
  deletePushSubscriber,
} from './controllers/adminController.js';
import { getDeals } from './controllers/dealController.js';
import {
  createReservation,
  getMyReservations,
  verifyPickupCode,
  updateReservationStatus,
  dismissMyReservation,
} from './controllers/reservationController.js';
import {
  getRetailerProfile,
  getRetailerOrdersAndStats,
  addItemAndDeal,
  overrideDealPrice,
  deleteDeal,
} from './controllers/retailerController.js';
import {
  buildPlatformSalesSummary,
  buildStoreSalesSummary,
  isItemExpired,
  mapReservationToOrderRecord,
  type StoreOrderRecord,
} from './utils/salesAnalytics.js';
import { createPartnerLead, validatePartnerLeadBody } from './controllers/partnerLeadController.js';
import { subscribeDropAlert, validateDropAlertBody } from './controllers/dropAlertController.js';
import {
  getPushConfig,
  sendTestPush,
  subscribePush,
  unsubscribePush,
  validatePushSubscribeBody,
} from './controllers/pushController.js';
import {
  isPushConfigured,
  notifyMatchingPushSubscribers,
  sendSinglePushNotification,
} from './services/pushService.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CLIENT_URL
  ? [...process.env.CLIENT_URL.split(',').map((s) => s.trim()), 'http://localhost:5173', 'http://localhost:4173']
  : undefined;

app.use(
  cors({
    origin: allowedOrigins || true,
    credentials: true,
  })
);
app.use(express.json());

// Ensure MongoDB Atlas connection on API requests (supports serverless cold starts)
app.use('/api', async (req: Request, res: Response, next) => {
  if (!isMongoConnected() && process.env.MONGODB_URI) {
    await connectDB();
  }
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  if (isProd && req.path !== '/health' && !isMongoConnected()) {
    res.status(503).json({ error: 'Database unavailable. Verify MONGODB_URI and Atlas network access.' });
    return;
  }
  next();
});

// 1. Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'BiteHour Pakistan MERN Stack API',
    locale: 'PKR (₨)',
    databaseEngine: isMongoConnected() ? 'MongoDB Atlas (Connected)' : 'In-Memory MERN Database (Development Fallback)',
    mongoReadyState: mongoose.connection.readyState,
    timestamp: new Date(),
  });
});

function formatMemRetailerDto(retailer: any) {
  if (!retailer) return null;
  return {
    id: retailer.id,
    name: retailer.name,
    category: retailer.category,
    address: retailer.location?.address || '',
    city: retailer.location?.city || 'Islamabad',
    sector: retailer.location?.sector || '',
    isVerified: Boolean(retailer.isVerified),
    rating: retailer.rating ?? 5.0,
    totalRecoveredPkr: retailer.totalRecoveredPkr ?? 0,
    totalWastedValueAvoidedPkr: retailer.totalWastedValueAvoidedPkr ?? 0,
  };
}

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

  const validation = validateRegisterPayload(req.body);
  if (!validation.valid || !validation.normalizedEmail) {
    res.status(400).json({ error: validation.error || 'Invalid registration details.' });
    return;
  }

  const { name, password, role, storeName, storeCategory, storeAddress, city, sector, phone } = req.body;
  const normalizedEmail = validation.normalizedEmail;
  const normalizedPhone = normalizePhone(phone);

  if (memDb.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    return;
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const assignedRole = isConfiguredAdminEmail(normalizedEmail)
    ? ('admin' as const)
    : role === 'retailer'
    ? ('retailer' as const)
    : ('consumer' as const);

  const newUser = {
    id: `usr-${Date.now()}`,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: assignedRole,
    contactPhone: normalizedPhone,
    totalSavedPkr: 0,
    itemsRescuedCount: 0,
  };
  memDb.users.push(newUser);

  let newRetailer = null;
  if (newUser.role === 'retailer') {
    const storeCity = String(city).trim();
    const baseCoords = CITY_COORDINATES[storeCity] || CITY_COORDINATES.Islamabad;
    const safeCategory = ALLOWED_STORE_CATEGORIES.includes(storeCategory)
      ? (storeCategory as 'grocery' | 'bakery' | 'restaurant')
      : 'grocery';

    newRetailer = {
      id: `ret-${Date.now()}`,
      userId: newUser.id,
      name: String(storeName).trim(),
      category: safeCategory,
      location: {
        lat: baseCoords.lat,
        lng: baseCoords.lng,
        address: String(storeAddress).trim(),
        city: storeCity,
        sector: String(sector || '').trim(),
      },
      isVerified: false,
      rating: 5.0,
      contactPhone: normalizedPhone,
      totalRecoveredPkr: 0,
      totalWastedValueAvoidedPkr: 0,
    };
    memDb.retailers.push(newRetailer);
  }

  const retailerDto = formatMemRetailerDto(newRetailer);

  if (newUser.role === 'retailer') {
    res.status(201).json({
      pendingApproval: true,
      message:
        'Application received! Your bakery registration is pending verification. Once approved, you will receive an email or WhatsApp message unlocking Store POS access.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        contactPhone: newUser.contactPhone,
        totalSavedPkr: newUser.totalSavedPkr,
        itemsRescuedCount: newUser.itemsRescuedCount,
        retailer: retailerDto,
      },
      retailer: retailerDto,
    });
    return;
  }

  const token = jwt.sign({ id: newUser.id, role: newUser.role }, getJwtSecret(), { expiresIn: '7d' });

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      contactPhone: newUser.contactPhone,
      totalSavedPkr: newUser.totalSavedPkr,
      itemsRescuedCount: newUser.itemsRescuedCount,
      retailer: null,
    },
    retailer: null,
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

  const validation = validateLoginPayload(req.body);
  if (!validation.valid || !validation.normalizedEmail) {
    res.status(400).json({ error: validation.error || 'Email and password are required.' });
    return;
  }

  const { password, expectedRole } = req.body;
  const normalizedEmail = validation.normalizedEmail;

  const user = memDb.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (!user.passwordHash) {
    res.status(400).json({ error: 'This account uses Google Sign-In. Please click Continue with Google.' });
    return;
  }

  const isMatch = await bcrypt.compare(String(password), user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (isConfiguredAdminEmail(normalizedEmail) && user.role !== 'admin') {
    user.role = 'admin';
  }

  if (expectedRole && expectedRole !== user.role) {
    res.status(403).json({
      error:
        expectedRole === 'admin'
          ? 'Founder Admin privileges are required to access this portal.'
          : expectedRole === 'retailer'
          ? 'This email belongs to a non-store account. Please sign in with a Merchant Partner account.'
          : 'This email belongs to a different account type.',
    });
    return;
  }

  const retailer = user.role === 'retailer' ? memDb.getRetailerByUserId(user.id) || null : null;
  if (user.role === 'retailer' && (!retailer || !retailer.isVerified)) {
    res.status(403).json({
      pendingApproval: true,
      error:
        'Your bakery is still under review. Please wait — you will receive an email or WhatsApp confirmation once your store is approved for Store POS access.',
    });
    return;
  }
  const retailerDto = formatMemRetailerDto(retailer);
  const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      contactPhone: user.contactPhone,
      totalSavedPkr: user.totalSavedPkr,
      itemsRescuedCount: user.itemsRescuedCount,
      retailer: retailerDto,
    },
    retailer: retailerDto,
  });
});

app.post('/api/auth/google', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await googleLogin(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB googleLogin fallback to memDb:', mongoErr);
    }
  }

  const idToken = String(req.body?.idToken || '').trim();
  const expectedRole = req.body?.expectedRole as 'consumer' | 'retailer' | 'admin' | undefined;

  if (!idToken) {
    res.status(400).json({ error: 'Google ID token is required.' });
    return;
  }

  let profile;
  try {
    profile = await verifyGoogleToken(idToken);
  } catch (verifyErr: any) {
    res.status(verifyErr?.statusCode || 401).json({
      error: verifyErr?.message || 'Invalid or expired Google Sign-In session.',
    });
    return;
  }

  const isAdmin = isConfiguredAdminEmail(profile.email);
  let user = memDb.users.find((u) => u.email.toLowerCase() === profile.email);
  if (!user) {
    user = {
      id: `usr-${Date.now()}`,
      name: profile.name,
      email: profile.email,
      authProvider: 'google',
      googleId: profile.googleId,
      role: isAdmin ? 'admin' : 'consumer',
      totalSavedPkr: 0,
      itemsRescuedCount: 0,
    };
    memDb.users.push(user);
  } else if (isAdmin && user.role !== 'admin') {
    user.role = 'admin';
  }

  if (expectedRole && expectedRole !== user.role) {
    res.status(403).json({
      error:
        expectedRole === 'admin'
          ? 'Founder Admin privileges are required to access this portal.'
          : 'This Google account is not linked to a verified Merchant Store yet.',
    });
    return;
  }

  const retailer = user.role === 'retailer' ? memDb.getRetailerByUserId(user.id) || null : null;
  if (user.role === 'retailer' && (!retailer || !retailer.isVerified)) {
    res.status(403).json({
      pendingApproval: true,
      error:
        'Your bakery is still under review. Please wait — you will receive an email or WhatsApp confirmation once your store is approved for Store POS access.',
    });
    return;
  }

  const retailerDto = formatMemRetailerDto(retailer);
  const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      contactPhone: user.contactPhone,
      totalSavedPkr: user.totalSavedPkr,
      itemsRescuedCount: user.itemsRescuedCount,
      retailer: retailerDto,
    },
    retailer: retailerDto,
  });
});

// 2b. Registered Partner Stores Endpoint
app.get('/api/stores', async (_req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      const stores = await Retailer.find({ isVerified: true }).sort({ createdAt: -1 });
      res.json(stores.map(formatMemRetailerDto));
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB getStores fallback to memDb:', mongoErr);
    }
  }

  res.json(memDb.retailers.filter((r) => r.isVerified).map(formatMemRetailerDto));
});

// 2c. Partner Lead Application Endpoint (For Bakeries, Cafes & Restaurants)
app.post('/api/partner-leads', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await createPartnerLead(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB partnerLead fallback to memDb:', mongoErr);
    }
  }

  const check = validatePartnerLeadBody(req.body);
  if (!check.valid || !check.data) {
    res.status(400).json({ error: check.error });
    return;
  }

  const lead = {
    id: `lead-${Date.now()}`,
    ...check.data,
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  memDb.partnerLeads.unshift(lead);
  res.status(201).json({
    message: 'Application received! Our BiteHour team will reach out shortly.',
    lead: { id: lead.id, businessName: lead.businessName, city: lead.city, sector: lead.sector, status: lead.status },
  });
});

// 2d. Evening Drop Alert Customer Subscription Endpoint
app.post('/api/drop-alerts', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await subscribeDropAlert(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB subscribeDropAlert fallback to memDb:', mongoErr);
    }
  }

  const check = validateDropAlertBody(req.body);
  if (!check.valid || !check.data) {
    res.status(400).json({ error: check.error });
    return;
  }

  const existing = memDb.dropSubscribers.find((s) => s.phone === check.data?.phone);
  if (existing) {
    Object.assign(existing, check.data);
    res.status(201).json({
      message: `You're on tonight's Islamabad drop list (${existing.sector})!`,
      subscriber: existing,
    });
    return;
  }

  const subscriber = {
    id: `sub-${Date.now()}`,
    ...check.data,
    createdAt: new Date().toISOString(),
  };
  memDb.dropSubscribers.unshift(subscriber);
  res.status(201).json({
    message: `You're on tonight's Islamabad drop list (${subscriber.sector})!`,
    subscriber,
  });
});

// 2e. Web Push Drop Notification Endpoints (Android, Desktop, iOS Installed PWA)
app.get('/api/push/vapid-public-key', (req: Request, res: Response) => {
  getPushConfig(req, res);
});

app.post('/api/push/subscribe', optionalAuth, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await subscribePush(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB subscribePush fallback to memDb:', mongoErr);
    }
  }

  const check = validatePushSubscribeBody(req.body);
  if (!check.valid || !check.data) {
    res.status(400).json({ error: check.error });
    return;
  }

  const existing = memDb.pushSubscriptions.find((s) => s.endpoint === check.data?.endpoint);
  if (existing) {
    Object.assign(existing, {
      ...check.data,
      userRef: req.user?.id || existing.userRef,
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({
      message: `Instant drop alerts active for ${existing.sectors.join(', ')}!`,
      subscription: {
        id: existing.id,
        sectors: existing.sectors,
        preferences: existing.preferences,
        deviceType: existing.deviceType,
      },
    });
    return;
  }

  const created = {
    id: `push-${Date.now()}`,
    ...check.data,
    userRef: req.user?.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memDb.pushSubscriptions.unshift(created);
  res.status(201).json({
    message: `Instant drop alerts active for ${created.sectors.join(', ')}!`,
    subscription: {
      id: created.id,
      sectors: created.sectors,
      preferences: created.preferences,
      deviceType: created.deviceType,
    },
  });
});

app.post('/api/push/unsubscribe', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await unsubscribePush(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB unsubscribePush fallback to memDb:', mongoErr);
    }
  }

  const endpoint = String(req.body?.endpoint || '').trim();
  if (!endpoint) {
    res.status(400).json({ error: 'Push subscription endpoint is required.' });
    return;
  }

  memDb.pushSubscriptions = memDb.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
  res.json({ message: 'Instant push notifications turned off for this device.' });
});

app.post('/api/push/test', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      await sendTestPush(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB sendTestPush fallback to memDb:', mongoErr);
    }
  }

  const endpoint = String(req.body?.endpoint || '').trim();
  if (!endpoint) {
    res.status(400).json({ error: 'Push subscription endpoint is required.' });
    return;
  }

  if (!isPushConfigured()) {
    res.status(503).json({ error: 'Web Push VAPID keys are not configured on the server yet.' });
    return;
  }

  const sub = memDb.pushSubscriptions.find((s) => s.endpoint === endpoint && s.isActive !== false);
  if (!sub) {
    res.status(404).json({ error: 'No active push subscription found for this device.' });
    return;
  }

  try {
    await sendSinglePushNotification(sub, {
      title: '🔔 BiteHour Drop Alerts Active!',
      body: `You will be notified immediately when ${sub.sectors.join(', ')} bakeries post closing-hour boxes.`,
      url: '/',
      tag: 'bitehour-test',
    });
    res.json({ message: 'Test notification sent! Check your device tray.' });
  } catch (pushErr: any) {
    const code = pushErr?.statusCode;
    if (code === 404 || code === 410) {
      memDb.pushSubscriptions = memDb.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
      res.status(410).json({ error: 'Push subscription expired in browser. Please re-enable alerts.' });
      return;
    }
    res.status(500).json({ error: pushErr?.message || 'Failed to send test push notification.' });
  }
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

// 4. Retailer Dashboard Endpoints (Protected by JWT + Retailer Role)
app.get('/api/retailer/me', authenticateToken, requireRetailer, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await getRetailerProfile(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB getRetailerProfile fallback to memDb:', mongoErr);
    }
  }

  const retailer = memDb.getRetailerByUserId(req.user?.id);
  if (!retailer) {
    res.status(404).json({ error: 'Merchant store profile not found for this account.' });
    return;
  }

  const activeDealsCount = memDb.deals.filter((d) => d.retailerId === retailer.id && d.status === 'active').length;
  const reservationsCount = memDb.reservations.filter((r) => r.retailerId === retailer.id).length;

  res.json({
    retailer: formatMemRetailerDto(retailer),
    stats: {
      activeDealsCount,
      totalReservationsCount: reservationsCount,
      totalRecoveredPkr: retailer.totalRecoveredPkr || 0,
      totalWastedValueAvoidedPkr: retailer.totalWastedValueAvoidedPkr || 0,
    },
  });
});

app.get('/api/retailer/orders', authenticateToken, requireRetailer, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await getRetailerOrdersAndStats(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB getRetailerOrdersAndStats fallback to memDb:', mongoErr);
    }
  }

  const retailer = memDb.getRetailerByUserId(req.user?.id);
  if (!retailer) {
    res.status(404).json({ error: 'Merchant store profile not found for this account.' });
    return;
  }

  const now = Date.now();
  const storeDeals = memDb.deals.filter((d) => d.retailerId === retailer.id);
  const dealSummaryInputs = storeDeals.map((d) => {
    const item = memDb.items.find((i) => i.id === d.itemId);
    if (d.status === 'active' && (!item || isItemExpired(item.expiryDeadline, now))) {
      d.status = 'expired';
    }
    return {
      status: d.status,
      stockQuantity: d.stockQuantity,
      expiryDeadline: item?.expiryDeadline,
    };
  });

  const orders = memDb.reservations
    .filter((r) => r.retailerId === retailer.id)
    .map((r) => {
      const user = memDb.users.find((u) => u.id === r.userId);
      const deal = memDb.deals.find((d) => d.id === r.dealId);
      const item = memDb.items.find((i) => i.id === deal?.itemId);
      return mapReservationToOrderRecord(r, { user, deal, item, retailer });
    });

  const summary = buildStoreSalesSummary(
    {
      id: retailer.id,
      name: retailer.name,
      category: retailer.category,
      sector: retailer.location?.sector || '',
      city: retailer.location?.city || 'Islamabad',
      isVerified: retailer.isVerified,
      contactPhone: retailer.contactPhone || '',
    },
    orders,
    dealSummaryInputs,
    now
  );

  const expiredDeals = storeDeals
    .filter((d) => {
      const item = memDb.items.find((i) => i.id === d.itemId);
      return d.status === 'expired' || isItemExpired(item?.expiryDeadline, now);
    })
    .slice(0, 20)
    .map((d) => {
      const item = memDb.items.find((i) => i.id === d.itemId);
      return {
        id: d.id,
        title: item?.name || 'Surplus Listing',
        category: item?.category || retailer.category,
        originalPricePkr: Number(item?.originalPricePkr || 0),
        currentPricePkr: Number(d.manualOverridePricePkr ?? d.currentDiscountedPricePkr ?? 0),
        stockRemaining: Number(d.stockQuantity || 0),
        expiryDeadline: item?.expiryDeadline || new Date().toISOString(),
        pickupWindowText: d.pickupWindowText,
      };
    });

  res.json({ summary, orders, expiredDeals });
});

app.post('/api/retailer/items', authenticateToken, requireRetailer, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await addItemAndDeal(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB addItemAndDeal fallback to memDb:', mongoErr);
    }
  }

  const {
    name,
    category,
    flavorProfile,
    isMysteryBag,
    pickupWindowText,
    originalPricePkr,
    boxPricePkr,
    quantity,
    expiryHoursLeft,
    imageUrl,
  } = req.body;

  const retailer = memDb.getRetailerByUserId(req.user?.id);
  if (!retailer) {
    res.status(404).json({ error: 'Merchant store profile not found. Please register a merchant account.' });
    return;
  }

  if (!retailer.isVerified) {
    res.status(403).json({
      error: 'Your store is awaiting BiteHour approval before you can publish surplus deals.',
    });
    return;
  }

  const price = Number(originalPricePkr);
  const hasFixedBoxPrice =
    boxPricePkr !== undefined && boxPricePkr !== null && String(boxPricePkr).trim() !== '';
  const boxPriceNum = Number(boxPricePkr);

  if (!String(name || '').trim() || price <= 0 || Number(quantity) < 1) {
    res.status(400).json({ error: 'Valid box title, Worth value (> 0), and quantity (>= 1) are required.' });
    return;
  }

  if (hasFixedBoxPrice && (!Number.isFinite(boxPriceNum) || boxPriceNum <= 0 || boxPriceNum >= price)) {
    res.status(400).json({ error: 'Box price must be greater than ₨ 0 and lower than Worth value.' });
    return;
  }

  const itemId = `itm-${Date.now()}`;
  const dealId = `dl-${Date.now()}`;
  const hrs = Math.max(0.5, Number(expiryHoursLeft || 2.0));
  const cat = (category as 'grocery' | 'bakery' | 'restaurant') || 'bakery';
  const qty = Number(quantity);
  const allowedFlavors = ['savory', 'sweet', 'drinks', 'mixed'];
  const safeFlavor = allowedFlavors.includes(flavorProfile) ? flavorProfile : 'mixed';
  const windowLabel = String(pickupWindowText || '').trim() || `Pick up within ${hrs.toFixed(1)} hrs`;

  const newItem = {
    id: itemId,
    name: String(name).trim(),
    category: cat,
    flavorProfile: safeFlavor as 'savory' | 'sweet' | 'drinks' | 'mixed',
    isMysteryBag: isMysteryBag === undefined ? true : Boolean(isMysteryBag),
    originalPricePkr: price,
    quantity: qty,
    expiryDeadline: new Date(Date.now() + hrs * 3600 * 1000).toISOString(),
    retailerId: retailer.id,
    imageUrl: imageUrl || '/images/box-sweet.jpg',
  };
  memDb.items.push(newItem);

  const decay = calculateTimeDecay(price, hrs, cat);
  const effectivePrice = hasFixedBoxPrice ? Math.round(boxPriceNum) : decay.currentDiscountedPricePkr;
  const effectiveDiscount = hasFixedBoxPrice
    ? Math.max(1, Math.round(((price - effectivePrice) / price) * 100))
    : decay.currentDiscountPercent;

  const newDeal = {
    id: dealId,
    itemId,
    retailerId: retailer.id,
    currentDiscountedPricePkr: effectivePrice,
    discountPercent: effectiveDiscount,
    manualOverridePricePkr: hasFixedBoxPrice ? effectivePrice : undefined,
    decaySchedule: decay.decaySchedule,
    status: 'active' as const,
    stockQuantity: qty,
    pickupWindowText: windowLabel,
    hoursRemaining: hrs,
  };
  memDb.deals.unshift(newDeal);

  const pushResult = await notifyMatchingPushSubscribers({
    dealId,
    itemName: newItem.name,
    storeName: retailer.name,
    sector: retailer.location?.sector || '',
    flavorProfile: newItem.flavorProfile,
    originalPricePkr: price,
    currentPricePkr: newDeal.currentDiscountedPricePkr,
    discountPercent: newDeal.discountPercent,
    pickupWindowText: windowLabel,
    useMemoryStore: true,
  });

  res.status(201).json({
    message: 'Surplus item listed with time-decay schedule',
    notificationsSent: pushResult.sent,
    item: newItem,
    deal: newDeal,
  });
});

app.delete('/api/deals/:id', authenticateToken, requireRetailer, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await deleteDeal(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB deleteDeal fallback to memDb:', mongoErr);
    }
  }

  const retailer = memDb.getRetailerByUserId(req.user?.id);
  if (!retailer) {
    res.status(404).json({ error: 'Merchant store profile not found.' });
    return;
  }

  const { id } = req.params;
  const dealIdx = memDb.deals.findIndex((d) => d.id === id && d.retailerId === retailer.id);
  if (dealIdx === -1) {
    res.status(404).json({ error: 'Deal not found for your store.' });
    return;
  }

  const deletedDeal = memDb.deals.splice(dealIdx, 1)[0];
  const itemIdx = memDb.items.findIndex((i) => i.id === deletedDeal.itemId);
  if (itemIdx !== -1) {
    memDb.items.splice(itemIdx, 1);
  }
  res.json({ message: 'Surplus deal and item removed successfully', id });
});

app.put('/api/retailer/deals/:id/override', authenticateToken, requireRetailer, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await overrideDealPrice(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB overrideDealPrice fallback to memDb:', mongoErr);
    }
  }

  const retailer = memDb.getRetailerByUserId(req.user?.id);
  if (!retailer) {
    res.status(404).json({ error: 'Merchant store profile not found.' });
    return;
  }

  const { id } = req.params;
  const { manualOverridePricePkr } = req.body;

  const deal = memDb.deals.find((d) => d.id === id && d.retailerId === retailer.id);
  if (!deal) {
    res.status(404).json({ error: 'Deal not found for your store.' });
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

// 5. Reservation Endpoints (Authenticated Consumer / Merchant Reservation & Pickup Code)
app.post('/api/reservations', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await createReservation(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB createReservation fallback to memDb:', mongoErr);
    }
  }

  const { dealId, quantity, paymentMethod, paymentReference } = req.body;

  const deal = memDb.deals.find((d) => d.id === dealId);
  if (!deal || deal.status !== 'active') {
    res.status(400).json({ error: 'Deal unavailable' });
    return;
  }

  const dealItem = memDb.items.find((i) => i.id === deal.itemId);
  if (isItemExpired(dealItem?.expiryDeadline)) {
    deal.status = 'expired';
    res.status(400).json({ error: 'This deal has expired and is no longer available.' });
    return;
  }

  const qty = Number(quantity || 1);
  if (!Number.isInteger(qty) || qty < 1 || deal.stockQuantity < qty) {
    res.status(400).json({ error: 'Insufficient stock remaining' });
    return;
  }

  const user = memDb.users.find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(401).json({ error: 'Please sign in to reserve a surplus deal.' });
    return;
  }

  const retailer = memDb.retailers.find((r) => r.id === deal.retailerId);
  if (!retailer) {
    res.status(404).json({ error: 'Associated store not found.' });
    return;
  }

  const item = memDb.items.find((i) => i.id === deal.itemId);

  const pickupCode = `PK-${Math.floor(10000 + Math.random() * 90000)}`;
  const totalAmountPkr = deal.currentDiscountedPricePkr * qty;
  const originalTotalPkr = (item?.originalPricePkr || totalAmountPkr) * qty;
  const savedPkr = Math.max(0, originalTotalPkr - totalAmountPkr);

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
    paymentMethod: (paymentMethod as any) || 'Cash on Pickup',
    paymentStatus: 'pending' as const,
    paymentReference: String(paymentReference || '').trim().slice(0, 64),
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

app.get('/api/reservations/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await getMyReservations(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB getMyReservations fallback to memDb:', mongoErr);
    }
  }

  const userReservations = memDb.reservations.filter(
    (r) => r.userId === req.user?.id && !r.dismissedByUser
  );
  const result = userReservations.map((resItem) => {
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
app.post('/api/reservations/verify', authenticateToken, requireRetailer, async (req: AuthRequest, res: Response) => {
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

  const storeRetailer = memDb.getRetailerByUserId(req.user?.id);
  if (storeRetailer && reservation.retailerId !== storeRetailer.id) {
    res.status(403).json({ valid: false, error: 'This pickup code belongs to a different store.' });
    return;
  }

  const deal = memDb.deals.find((d) => d.id === reservation.dealId);
  const item = memDb.items.find((i) => i.id === deal?.itemId);
  const retailer = memDb.retailers.find((r) => r.id === reservation.retailerId);
  const customer = memDb.users.find((u) => u.id === reservation.userId);

  res.json({
    valid: true,
    message: 'Pass verified successfully',
    reservation: {
      ...reservation,
      customerName: customer?.name || 'Customer',
      dealTitle: item?.name || 'Surplus Bag',
      totalPricePkr: reservation.totalAmountPkr,
      pickupDeadline: reservation.pickupWindowEnd,
      deal: { ...deal, item },
      retailer,
    },
  });
});

app.put('/api/reservations/:id/status', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (status === 'collected' && req.user?.role !== 'retailer') {
    res.status(403).json({ error: 'Only a verified Merchant Partner can mark orders as collected.' });
    return;
  }

  if (isMongoConnected()) {
    try {
      await updateReservationStatus(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB updateReservationStatus fallback to memDb:', mongoErr);
    }
  }

  const { id } = req.params;

  const reservation = memDb.reservations.find((r) => r.id === id || r.pickupCode === id);
  if (!reservation) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }

  reservation.status = status;
  if (status === 'collected') {
    reservation.paymentStatus = 'paid';
  } else if (status === 'no-show' || status === 'cancelled' || status === 'expired') {
    if (status === 'cancelled') {
      reservation.dismissedByUser = true;
    }
    // Restore stock back to deal only if deal hasn't expired
    const deal = memDb.deals.find((d) => d.id === reservation.dealId);
    if (deal) {
      const item = memDb.items.find((i) => i.id === deal.itemId);
      deal.stockQuantity += reservation.quantity;
      deal.status = isItemExpired(item?.expiryDeadline) ? 'expired' : 'active';
    }
  }

  res.json({
    message: `Reservation updated to ${status}`,
    reservation,
  });
});

app.delete('/api/reservations/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await dismissMyReservation(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB dismissMyReservation fallback to memDb:', mongoErr);
    }
  }

  const { id } = req.params;
  const reservation = memDb.reservations.find((r) => r.id === id || r.pickupCode === id);
  if (!reservation) {
    res.status(404).json({ error: 'Reservation pass not found.' });
    return;
  }

  if (reservation.userId !== req.user?.id) {
    res.status(403).json({ error: 'You can only remove passes belonging to your account.' });
    return;
  }

  const now = Date.now();
  if (reservation.status === 'pending') {
    if (new Date(reservation.pickupWindowEnd).getTime() >= now) {
      res.status(400).json({ error: 'Cancel an active hold before removing it.' });
      return;
    }
    reservation.status = 'no-show';
    const deal = memDb.deals.find((d) => d.id === reservation.dealId);
    if (deal) {
      const item = memDb.items.find((i) => i.id === deal.itemId);
      deal.stockQuantity += reservation.quantity;
      deal.status = isItemExpired(item?.expiryDeadline, now) ? 'expired' : 'active';
    }
  }

  reservation.dismissedByUser = true;
  res.json({ message: 'Pass removed from your bag.', id: reservation.id });
});

// 7. Founder Admin Endpoints (Protected by JWT + Admin Role from ADMIN_EMAIL)
app.get('/api/admin/overview', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await getAdminOverview(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB getAdminOverview fallback to memDb:', mongoErr);
    }
  }

  const now = Date.now();
  const mappedRetailers = memDb.retailers.map((r) => {
    const owner = memDb.users.find((u) => u.id === r.userId);
    return {
      ...formatMemRetailerDto(r),
      contactPhone: r.contactPhone || owner?.contactPhone || '',
      ownerName: owner?.name || '',
      ownerEmail: owner?.email || '',
      createdAt: new Date().toISOString(),
    };
  });

  const pendingRetailers = mappedRetailers.filter((r) => !r.isVerified);
  const approvedRetailers = mappedRetailers.filter((r) => r.isVerified);

  for (const d of memDb.deals) {
    const item = memDb.items.find((i) => i.id === d.itemId);
    if (d.status === 'active' && (!item || isItemExpired(item.expiryDeadline, now))) {
      d.status = 'expired';
    }
  }

  const activeDealsCount = memDb.deals.filter((d) => {
    const item = memDb.items.find((i) => i.id === d.itemId);
    return d.status === 'active' && d.stockQuantity > 0 && !isItemExpired(item?.expiryDeadline, now);
  }).length;

  const allOrders = memDb.reservations.map((r) => {
    const user = memDb.users.find((u) => u.id === r.userId);
    const deal = memDb.deals.find((d) => d.id === r.dealId);
    const item = memDb.items.find((i) => i.id === deal?.itemId);
    const retailer = memDb.retailers.find((rt) => rt.id === r.retailerId);
    return mapReservationToOrderRecord(r, { user, deal, item, retailer });
  });

  const ordersByStore = new Map<string, StoreOrderRecord[]>();
  for (const order of allOrders) {
    if (!order.store.id) continue;
    const list = ordersByStore.get(order.store.id) || [];
    list.push(order);
    ordersByStore.set(order.store.id, list);
  }

  const platformSales = buildPlatformSalesSummary(allOrders);
  const storeAnalytics = mappedRetailers
    .map((store) => {
      const storeDeals = memDb.deals
        .filter((d) => d.retailerId === store.id)
        .map((d) => ({
          status: d.status,
          stockQuantity: d.stockQuantity,
          expiryDeadline: memDb.items.find((i) => i.id === d.itemId)?.expiryDeadline,
        }));
      return buildStoreSalesSummary(
        {
          ...store,
          id: String(store.id || ''),
          name: String(store.name || 'Partner Store'),
        },
        ordersByStore.get(store.id) || [],
        storeDeals,
        now
      );
    })
    .sort((a, b) => b.totalGrossRevenuePkr - a.totalGrossRevenuePkr);

  res.json({
    stats: {
      pendingRetailersCount: pendingRetailers.length,
      approvedRetailersCount: approvedRetailers.length,
      partnerLeadsCount: memDb.partnerLeads.length,
      activeDealsCount,
      dropSubscribersCount: memDb.dropSubscribers.length,
      pushSubscribersCount: memDb.pushSubscriptions.filter((s) => s.isActive !== false).length,
    },
    pendingRetailers,
    approvedRetailers,
    partnerLeads: memDb.partnerLeads,
    dropSubscribers: memDb.dropSubscribers,
    pushSubscribers: memDb.pushSubscriptions
      .filter((s) => s.isActive !== false)
      .map((s) => ({
        id: s.id,
        city: s.city || 'Islamabad',
        sectors: s.sectors || ['All Islamabad'],
        preferences: s.preferences || ['all'],
        deviceType: s.deviceType || 'other',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    platformSales,
    storeAnalytics,
    recentOrders: allOrders.slice(0, 200),
  });
});

app.put('/api/admin/retailers/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await updateRetailerApproval(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB updateRetailerApproval fallback to memDb:', mongoErr);
    }
  }

  const retailer = memDb.retailers.find((r) => r.id === req.params.id);
  if (!retailer) {
    res.status(404).json({ error: 'Store not found.' });
    return;
  }

  retailer.isVerified = Boolean(req.body?.isVerified);
  res.json({
    message: retailer.isVerified ? 'Store approved!' : 'Store moved back to pending review.',
    retailer: formatMemRetailerDto(retailer),
  });
});

app.delete('/api/admin/retailers/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await deleteAdminRetailer(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB deleteAdminRetailer fallback to memDb:', mongoErr);
    }
  }

  const idx = memDb.retailers.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Store not found.' });
    return;
  }
  const [removed] = memDb.retailers.splice(idx, 1);
  memDb.deals = memDb.deals.filter((d) => d.retailerId !== removed.id);
  memDb.items = memDb.items.filter((i) => i.retailerId !== removed.id);
  res.json({ message: 'Store removed.' });
});

app.put('/api/admin/leads/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await updatePartnerLeadStatus(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB updatePartnerLeadStatus fallback to memDb:', mongoErr);
    }
  }

  const lead = memDb.partnerLeads.find((l) => l.id === req.params.id);
  if (!lead) {
    res.status(404).json({ error: 'Partner lead not found.' });
    return;
  }
  lead.status = String(req.body?.status || 'new');
  res.json({ message: `Lead marked as ${lead.status}`, lead });
});

app.delete('/api/admin/drop-alerts/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await deleteDropSubscriber(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB deleteDropSubscriber fallback to memDb:', mongoErr);
    }
  }

  const idx = memDb.dropSubscribers.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Drop alert subscriber not found.' });
    return;
  }
  memDb.dropSubscribers.splice(idx, 1);
  res.json({ message: 'Subscriber removed from drop alert list.' });
});

app.delete('/api/admin/push-subscriptions/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (isMongoConnected()) {
    try {
      await deletePushSubscriber(req, res);
      return;
    } catch (mongoErr) {
      console.warn('⚠️ MongoDB deletePushSubscriber fallback to memDb:', mongoErr);
    }
  }

  const idx = memDb.pushSubscriptions.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Push subscription not found.' });
    return;
  }
  memDb.pushSubscriptions.splice(idx, 1);
  res.json({ message: 'Device removed from instant push alerts.' });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 BiteHour Pakistan MERN Express API running at http://localhost:${PORT}`);
    console.log(`📡 Database mode: ${isMongoConnected() ? 'MongoDB Atlas' : 'In-Memory DB'}`);
  });
};

if (process.env.VERCEL !== '1') {
  startServer();
}

export { app };
export default app;
