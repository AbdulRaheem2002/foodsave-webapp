import type { DealItem, Reservation } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export async function fetchDealsApi(category?: string, minDiscount?: number): Promise<DealItem[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category.toLowerCase());
    if (minDiscount) params.append('minDiscount', String(minDiscount));

    const res = await fetch(`${API_BASE_URL}/deals?${params.toString()}`);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();

    return data.map((d: any) => ({
      id: d.id,
      storeId: d.retailer?.id || 'ret-1',
      storeName: d.retailer?.name || 'Al-Fatah Gourmet Supermarket',
      storeType: d.retailer?.category || 'grocery',
      storeRating: d.retailer?.rating || 4.8,
      title: d.item?.name || 'Surplus Item',
      category: d.item?.category || 'grocery',
      originalPricePkr: d.item?.originalPricePkr || 1000,
      currentPricePkr: d.currentDiscountedPricePkr || 400,
      discountPercent: d.discountPercent || 60,
      expiryHoursLeft: d.hoursRemaining || 2.0,
      stockQuantity: d.stockQuantity || 5,
      pickupDeadline: d.pickupWindowText || 'Pick up within 2 hrs',
      distanceKm: Math.round((0.3 + Math.random() * 1.5) * 10) / 10,
      imageUrl: d.item?.imageUrl || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
      isVerified: d.retailer?.isVerified ?? true,
      location: {
        x: 30 + Math.floor(Math.random() * 40),
        y: 30 + Math.floor(Math.random() * 40),
        address: d.retailer?.location?.address || 'Gulberg III, Lahore',
        city: d.retailer?.location?.city || 'Lahore',
      },
      decaySchedule: d.decaySchedule || [],
      hoursRemaining: d.hoursRemaining || 2.0,
      manualOverridePricePkr: d.manualOverridePricePkr,
    }));
  } catch (error) {
    console.warn('API fetch failed, returning fallback dataset:', error);
    return [];
  }
}

export async function fetchMyReservationsApi(): Promise<Reservation[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/reservations/me`);
    if (!res.ok) throw new Error('Failed to fetch reservations');
    const data = await res.json();
    return data.map((r: any) => ({
      id: r.id,
      item: {
        id: r.deal?.id || r.dealId,
        storeId: r.retailer?.id || r.retailerId,
        storeName: r.retailer?.name || 'Partner Store',
        storeType: r.retailer?.category || 'grocery',
        storeRating: r.retailer?.rating || 4.8,
        title: r.deal?.item?.name || 'Surplus Item',
        category: r.deal?.item?.category || 'grocery',
        originalPricePkr: r.deal?.item?.originalPricePkr || 1000,
        currentPricePkr: r.deal?.currentDiscountedPricePkr || 400,
        discountPercent: r.deal?.discountPercent || 60,
        expiryHoursLeft: 2,
        stockQuantity: r.quantity,
        pickupDeadline: r.deal?.pickupWindowText || '15 mins hold',
        distanceKm: 0.8,
        imageUrl: r.deal?.item?.imageUrl || 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
        isVerified: true,
        location: { x: 50, y: 50, address: r.retailer?.location?.address || 'Gulberg III', city: r.retailer?.location?.city || 'Lahore' },
        decaySchedule: [],
        hoursRemaining: 2,
      },
      quantity: r.quantity,
      totalPricePkr: r.totalAmountPkr,
      savedPkr: Math.max(0, ((r.deal?.item?.originalPricePkr || 1000) * r.quantity) - r.totalAmountPkr),
      pickupWindowEnd: r.pickupWindowEnd,
      status: r.status,
      pickupCode: r.pickupCode,
      fulfillmentType: 'self-pickup',
      paymentMethod: r.paymentMethod,
      paymentStatus: r.paymentStatus,
      createdAt: r.createdAt,
    }));
  } catch (error) {
    console.warn('Could not fetch server reservations:', error);
    return [];
  }
}

export async function createReservationApi(dealId: string, quantity: number, paymentMethod: string) {
  const res = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dealId, quantity, paymentMethod }),
  });
  if (!res.ok) throw new Error('Failed to create reservation');
  return res.json();
}

export async function verifyPickupCodeApi(pickupCode: string) {
  const res = await fetch(`${API_BASE_URL}/reservations/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pickupCode }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to verify pickup code');
  }
  return res.json();
}

export async function updateReservationStatusApi(id: string, status: string) {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update reservation status');
  return res.json();
}

export async function addRetailerItemApi(itemData: any) {
  const res = await fetch(`${API_BASE_URL}/retailer/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  if (!res.ok) throw new Error('Failed to add item');
  return res.json();
}

export async function deleteRetailerItemApi(dealId: string) {
  const res = await fetch(`${API_BASE_URL}/deals/${dealId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete deal');
  return res.json();
}

export async function overridePriceApi(dealId: string, manualOverridePricePkr: number) {
  const res = await fetch(`${API_BASE_URL}/retailer/deals/${dealId}/override`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ manualOverridePricePkr }),
  });
  if (!res.ok) throw new Error('Failed to override price');
  return res.json();
}

export async function registerAuthApi(userData: any) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return res.json();
}

export async function loginAuthApi(email: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  return res.json();
}

