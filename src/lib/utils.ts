import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amountPkr: number): string {
  return `₨ ${Math.round(amountPkr).toLocaleString()}`;
}

export function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getGoogleMapsDirectionsUrl(
  storeName: string,
  address?: string,
  sector?: string,
  city?: string
): string {
  const parts = [storeName, address, sector, city || 'Islamabad', 'Pakistan']
    .map((p) => (p || '').trim())
    .filter(Boolean);
  const deduped: string[] = [];
  for (const part of parts) {
    if (!deduped.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
      deduped.push(part);
    }
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(deduped.join(', '))}`;
}
