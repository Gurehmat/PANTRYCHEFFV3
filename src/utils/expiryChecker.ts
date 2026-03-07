/**
 * Expiry status and alerts for pantry items.
 */

import type { PantryItem } from '../types/database';

export type ExpiryStatus = 'expired' | 'today' | 'soon' | 'ok';

export interface ExpiryAlert {
  item: PantryItem;
  status: ExpiryStatus;
  daysUntilExpiry: number;
}

const SOON_DAYS = 3;

/**
 * Parses a date string (YYYY-MM-DD or ISO) and returns start of day in local time (ms).
 * Uses local date parts so "YYYY-MM-DD" is interpreted as local, not UTC.
 */
function parseDate(dateStr: string): number {
  const match = String(dateStr)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(y, m, day);
    if (Number.isNaN(d.getTime())) return 0;
    return d.getTime();
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 0;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Start of today in local time (ms).
 */
function todayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Determines expiry status based on date comparison (today = expired day, not "today" as in expiring today).
 * - expired: expiry date is before today
 * - today: expiry date is today
 * - soon: expiry within 1–3 days
 * - ok: more than 3 days (caller typically excludes these from alerts)
 */
export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const exp = parseDate(expiryDate);
  const today = todayStart();
  const dayMs = 24 * 60 * 60 * 1000;
  const daysUntil = Math.floor((exp - today) / dayMs);
  if (daysUntil < 0) return 'expired';
  if (daysUntil === 0) return 'today';
  if (daysUntil <= SOON_DAYS) return 'soon';
  return 'ok';
}

/**
 * Returns items that are expired, expiring today, or within 3 days.
 * Sorted: expired first, then today, then soon.
 * Items with no expiry_date are excluded.
 */
export function getExpiryAlerts(items: PantryItem[]): ExpiryAlert[] {
  const today = todayStart();
  const dayMs = 24 * 60 * 60 * 1000;
  const alerts: ExpiryAlert[] = [];

  for (const item of items) {
    const expiry = item.expiry_date;
    if (expiry == null || String(expiry).trim() === '') continue;
    const exp = parseDate(expiry);
    if (exp === 0) continue;
    const daysUntil = Math.floor((exp - today) / dayMs);
    const status = getExpiryStatus(expiry);
    if (status === 'ok') continue;
    alerts.push({ item, status, daysUntilExpiry: daysUntil });
  }

  const order: ExpiryStatus[] = ['expired', 'today', 'soon'];
  alerts.sort((a, b) => {
    const ai = order.indexOf(a.status);
    const bi = order.indexOf(b.status);
    if (ai !== bi) return ai - bi;
    return a.daysUntilExpiry - b.daysUntilExpiry;
  });
  return alerts;
}
