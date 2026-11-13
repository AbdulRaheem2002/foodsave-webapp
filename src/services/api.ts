import type { DealItem, Reservation, RetailerStore } from '../types';

export const TOKEN_STORAGE_KEY = 'foodsave_token_v2';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const CATEGORY_FALLBACK_IMAGES: Record<'grocery' | 'bakery' | 'restaurant', string> = {
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  restaurant: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
};

function getAuthHeaders(includeJson = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // ignore storage errors
  }
  return headers;
}

function hasStoredToken(): boolean {
  try {
    return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
  } catch {
    return false;
  }
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
}

function deterministicCoord(seed: string, offset: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  return 22 + ((hash + offset) % 56);
}

export async function fetchStoresApi(): Promise<RetailerStore[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/stores`);
    if (!res.ok) throw new Error('Failed to fetch stores');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Could not load partner stores:', error);
    return [];
  }
}

export async function fetchDealsApi(category?: string, minDiscount?: number): Promise<DealItem[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category.toLowerCase());
    if (minDiscount) params.append('minDiscount', String(minDiscount));

    const res = await fetch(`${API_BASE_URL}/deals?${params.toString()}`);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();

    return data.map((d: any) => {
      const cat: 'grocery' | 'bakery' | 'restaurant' = d.item?.category || d.retailer?.category || 'grocery';
      const idSeed = String(d.retailer?.id || d.id || 'store');
      return {
        id: d.id,
        storeId: d.retailer?.id || '',
        storeName: d.retailer?.name || 'Registered Store',
        storeType: d.retailer?.category || cat,
        storeRating: d.retailer?.rating ?? 5.0,
        title: d.item?.name || 'Surplus Item',
        category: cat,
        originalPricePkr: d.item?.originalPricePkr || 0,
        currentPricePkr: d.currentDiscountedPricePkr || 0,
        discountPercent: d.discountPercent || 0,
        expiryHoursLeft: d.hoursRemaining || 2.0,
        stockQuantity: d.stockQuantity || 0,
        pickupDeadline: d.pickupWindowText || 'Pick up today',
        distanceKm: Number((0.4 + (deterministicCoord(idSeed, 7) % 25) / 10).toFixed(1)),
        imageUrl: d.item?.imageUrl || CATEGORY_FALLBACK_IMAGES[cat],
        isVerified: Boolean(d.retailer?.isVerified ?? true),
        location: {
          x: deterministicCoord(idSeed, 13),
          y: deterministicCoord(idSeed, 37),
          address: d.retailer?.location?.address || '',
          city: d.retailer?.location?.city || 'Lahore',
        },
        decaySchedule: d.decaySchedule || [],
        hoursRemaining: d.hoursRemaining || 2.0,
        manualOverridePricePkr: d.manualOverridePricePkr,
      };
    });
  } catch (error) {
    console.warn('API fetch failed:', error);
    return [];
  }
}

export async function fetchMyReservationsApi(): Promise<Reservation[]> {
  if (!hasStoredToken()) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/reservations/me`, {
      headers: getAuthHeaders(false),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((r: any) => {
      const cat: 'grocery' | 'bakery' | 'restaurant' = r.deal?.item?.category || r.retailer?.category || 'grocery';
      return {
        id: r.id,
        item: {
          id: r.deal?.id || r.dealId,
          storeId: r.retailer?.id || r.retailerId || '',
          storeName: r.retailer?.name || 'Registered Store',
          storeType: r.retailer?.category || cat,
          storeRating: r.retailer?.rating ?? 5.0,
          title: r.deal?.item?.name || 'Surplus Item',
          category: cat,
          originalPricePkr: r.deal?.item?.originalPricePkr || r.totalAmountPkr,
          currentPricePkr: r.deal?.currentDiscountedPricePkr || r.totalAmountPkr,
          discountPercent: r.deal?.discountPercent || 0,
          expiryHoursLeft: 2,
          stockQuantity: r.quantity,
          pickupDeadline: r.deal?.pickupWindowText || '15 mins hold',
          distanceKm: 0.8,
          imageUrl: r.deal?.item?.imageUrl || CATEGORY_FALLBACK_IMAGES[cat],
          isVerified: true,
          location: {
            x: 50,
            y: 50,
            address: r.retailer?.location?.address || '',
            city: r.retailer?.location?.city || 'Lahore',
          },
          decaySchedule: [],
          hoursRemaining: 2,
        },
        quantity: r.quantity,
        totalPricePkr: r.totalAmountPkr,
        savedPkr: Math.max(
          0,
          (r.deal?.item?.originalPricePkr || r.totalAmountPkr) * r.quantity - r.totalAmountPkr
        ),
        pickupWindowEnd: r.pickupWindowEnd,
        status: r.status,
        pickupCode: r.pickupCode,
        fulfillmentType: 'self-pickup',
        paymentMethod: r.paymentMethod,
        paymentStatus: r.paymentStatus,
        createdAt: r.createdAt,
      };
    });
  } catch (error) {
    console.warn('Could not fetch server reservations:', error);
    return [];
  }
}

export async function createReservationApi(dealId: string, quantity: number, paymentMethod: string) {
  const res = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ dealId, quantity, paymentMethod }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to create reservation'));
  return res.json();
}

export async function verifyPickupCodeApi(pickupCode: string) {
  const res = await fetch(`${API_BASE_URL}/reservations/verify`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ pickupCode }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Failed to verify pickup code'));
  }
  return res.json();
}

export async function updateReservationStatusApi(id: string, status: string) {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to update reservation status'));
  return res.json();
}

export async function addRetailerItemApi(itemData: any) {
  const res = await fetch(`${API_BASE_URL}/retailer/items`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(itemData),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to add item'));
  return res.json();
}

export async function deleteRetailerItemApi(dealId: string) {
  const res = await fetch(`${API_BASE_URL}/deals/${dealId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to delete deal'));
  return res.json();
}

export async function overridePriceApi(dealId: string, manualOverridePricePkr: number) {
  const res = await fetch(`${API_BASE_URL}/retailer/deals/${dealId}/override`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ manualOverridePricePkr }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to override price'));
  return res.json();
}

export async function registerAuthApi(userData: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'consumer' | 'retailer';
  storeName?: string;
  storeCategory?: 'grocery' | 'bakery' | 'restaurant';
  storeAddress?: string;
  city?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return data;
}

export async function loginAuthApi(
  email: string,
  password: string,
  expectedRole?: 'consumer' | 'retailer'
) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, expectedRole }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Invalid email or password');
  }
  return data;
}
