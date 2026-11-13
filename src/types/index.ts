export type CategoryType = 'All' | 'grocery' | 'bakery' | 'restaurant' | 'mystery-bag';
export type PakistanCity = 'All Pakistan' | 'Lahore' | 'Karachi' | 'Islamabad' | 'Rawalpindi';

export interface LocationCoordinates {
  x: number;
  y: number;
  address: string;
  city: string;
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
  isVerified: boolean;
  rating: number;
  totalRecoveredPkr: number;
  totalWastedValueAvoidedPkr: number;
}

export type AppTab = 'consumer' | 'retailer';

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
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'consumer' | 'retailer';
  contactPhone?: string;
  totalSavedPkr: number;
  itemsRescuedCount: number;
  rescueWalletBalancePkr?: number;
  retailer?: RetailerStore | null;
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


