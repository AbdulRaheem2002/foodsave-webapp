export type CategoryType = 'All' | 'grocery' | 'bakery' | 'restaurant' | 'mystery-bag';
export type FlavorType = 'All' | 'savory' | 'sweet' | 'drinks' | 'mixed';
export type PakistanCity = 'All Pakistan' | 'Islamabad' | 'Rawalpindi' | 'Lahore' | 'Karachi';

export interface LocationCoordinates {
  x: number;
  y: number;
  address: string;
  city: string;
  sector?: string;
}

export interface DecayPoint {
  hoursRemaining: number;
  discountPercent: number;
  pricePkr: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DealItem {
  id: string;
  storeId: string;
  storeName: string;
  storeType: 'grocery' | 'bakery' | 'restaurant';
  storeRating: number;
  reviewsCount?: number;
  title: string;
  category: 'grocery' | 'bakery' | 'restaurant';
  flavorProfile?: 'savory' | 'sweet' | 'drinks' | 'mixed';
  originalPricePkr: number;
  currentPricePkr: number;
  discountPercent: number;
  expiryHoursLeft: number;
  stockQuantity: number;
  pickupDeadline: string;
  distanceKm: number;
  imageUrl: string;
  isVerified: boolean;
  location: LocationCoordinates;
  decaySchedule: DecayPoint[];
  hoursRemaining: number;
  manualOverridePricePkr?: number;
  isMysteryBag?: boolean;
  mysteryBagTier?: 'gold' | 'silver' | 'bronze';
  mysteryBagContents?: string[];
}

export interface RetailerStore {
  id: string;
  name: string;
  category: 'grocery' | 'bakery' | 'restaurant';
  address: string;
  city: string;
  sector?: string;
  isVerified: boolean;
  rating: number;
  totalRecoveredPkr: number;
  totalWastedValueAvoidedPkr: number;
}

export type AppTab = 'consumer' | 'retailer' | 'partner' | 'admin';

export interface Reservation {
  id: string;
  item: DealItem;
  quantity: number;
  totalPricePkr: number;
  savedPkr: number;
  pickupWindowEnd: string;
  status: 'pending' | 'collected' | 'no-show' | 'cancelled' | 'expired';
  pickupCode: string;
  fulfillmentType: 'self-pickup' | 'bykea-delivery';
  bykeaRiderName?: string;
  bykeaRiderPhone?: string;
  bykeaEtaMinutes?: number;
  paymentMethod: 'JazzCash' | 'EasyPaisa' | 'Cash on Pickup';
  paymentStatus: 'paid' | 'pending';
  paymentReference?: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'consumer' | 'retailer' | 'admin';
  contactPhone?: string;
  totalSavedPkr: number;
  itemsRescuedCount: number;
  rescueWalletBalancePkr?: number;
  retailer?: RetailerStore | null;
}

export interface AdminRetailerRecord extends RetailerStore {
  contactPhone: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
}

export interface AdminPartnerLead {
  id: string;
  ownerName: string;
  businessName: string;
  businessType: string;
  city: string;
  sector: string;
  phone: string;
  email?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'approved' | 'rejected';
  createdAt: string;
}

export type DropAlertPreference = 'all' | 'sweet' | 'savory' | 'drinks';

export interface AdminDropSubscriber {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  city: string;
  sector: string;
  preference: DropAlertPreference;
  createdAt: string;
}

export interface AdminOverview {
  stats: {
    pendingRetailersCount: number;
    approvedRetailersCount: number;
    partnerLeadsCount: number;
    dropSubscribersCount: number;
    activeDealsCount: number;
  };
  pendingRetailers: AdminRetailerRecord[];
  approvedRetailers: AdminRetailerRecord[];
  partnerLeads: AdminPartnerLead[];
  dropSubscribers: AdminDropSubscriber[];
}

export interface DonationRecord {
  id: string;
  dealId: string;
  itemTitle: string;
  storeName: string;
  charityName: 'Saylani Welfare International' | 'Edhi Foundation Pakistan' | 'JDC Welfare Organization';
  quantity: number;
  estimatedValuePkr: number;
  co2SavedKg: number;
  mealsServed: number;
  certificateNumber: string;
  dispatchedAt: string;
  status: 'dispatched' | 'received';
}


