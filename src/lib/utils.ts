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
  if (seconds >= 3600) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getDealSecondsRemaining(
  deal: { expiryDeadline?: string; expiryHoursLeft?: number },
  nowMs = Date.now()
): number {
  if (deal.expiryDeadline) {
    const expiryMs = new Date(deal.expiryDeadline).getTime();
    if (Number.isFinite(expiryMs)) {
      return Math.max(0, Math.floor((expiryMs - nowMs) / 1000));
    }
  }
  return Math.max(0, Math.floor((deal.expiryHoursLeft || 0) * 3600));
}

export function isDealExpired(
  deal: { expiryDeadline?: string; expiryHoursLeft?: number },
  nowMs = Date.now()
): boolean {
  return getDealSecondsRemaining(deal, nowMs) <= 0;
}

export function formatWhatsAppHref(rawPhone: string, message = ''): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  const intl = digits.startsWith('0')
    ? `92${digits.slice(1)}`
    : digits.startsWith('92')
    ? digits
    : `92${digits}`;
  return message ? `https://wa.me/${intl}?text=${encodeURIComponent(message)}` : `https://wa.me/${intl}`;
}

export function downloadCsvFile(filename: string, headers: string[], rows: Array<Array<string | number>>): void {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
