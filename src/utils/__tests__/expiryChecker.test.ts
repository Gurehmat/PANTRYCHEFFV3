import { describe, it, expect } from 'vitest';
import { getExpiryStatus, getExpiryAlerts } from '../expiryChecker';
import type { PantryItem } from '../../types/database';

function makeItem(overrides: Partial<PantryItem>): PantryItem {
  return {
    id: '1',
    user_id: 'u',
    name: 'Test',
    quantity: 1,
    unit: 'pcs',
    expiry_date: null,
    created_at: '2024-01-01',
    ...overrides,
  };
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

describe('getExpiryStatus', () => {
  it('returns expired for past date', () => {
    const past = addDays(todayISO(), -1);
    expect(getExpiryStatus(past)).toBe('expired');
  });

  it('returns today for today date', () => {
    expect(getExpiryStatus(todayISO())).toBe('today');
  });

  it('returns soon for 1–3 days ahead', () => {
    expect(getExpiryStatus(addDays(todayISO(), 1))).toBe('soon');
    expect(getExpiryStatus(addDays(todayISO(), 3))).toBe('soon');
  });

  it('returns ok for more than 3 days', () => {
    expect(getExpiryStatus(addDays(todayISO(), 5))).toBe('ok');
    expect(getExpiryStatus(addDays(todayISO(), 10))).toBe('ok');
  });
});

describe('getExpiryAlerts', () => {
  it('returns empty for empty items', () => {
    expect(getExpiryAlerts([])).toEqual([]);
  });

  it('excludes items with no expiry_date', () => {
    const items = [
      makeItem({ name: 'A', expiry_date: null }),
      makeItem({ name: 'B', expiry_date: '' }),
    ];
    expect(getExpiryAlerts(items)).toEqual([]);
  });

  it('excludes items with ok status (more than 3 days)', () => {
    const future = addDays(todayISO(), 5);
    const items = [makeItem({ name: 'A', expiry_date: future })];
    expect(getExpiryAlerts(items)).toEqual([]);
  });

  it('includes expired, today, and soon items', () => {
    const past = addDays(todayISO(), -1);
    const today = todayISO();
    const soon = addDays(todayISO(), 2);
    const items = [
      makeItem({ id: '1', name: 'Expired', expiry_date: past }),
      makeItem({ id: '2', name: 'Today', expiry_date: today }),
      makeItem({ id: '3', name: 'Soon', expiry_date: soon }),
    ];
    const alerts = getExpiryAlerts(items);
    expect(alerts).toHaveLength(3);
    expect(alerts.map((a) => a.status)).toEqual(['expired', 'today', 'soon']);
  });

  it('sorts expired first, then today, then soon', () => {
    const items = [
      makeItem({ id: 'a', name: 'Soon', expiry_date: addDays(todayISO(), 1) }),
      makeItem({ id: 'b', name: 'Expired', expiry_date: addDays(todayISO(), -2) }),
      makeItem({ id: 'c', name: 'Today', expiry_date: todayISO() }),
    ];
    const alerts = getExpiryAlerts(items);
    expect(alerts[0].status).toBe('expired');
    expect(alerts[1].status).toBe('today');
    expect(alerts[2].status).toBe('soon');
  });

  it('each alert has item, status, and daysUntilExpiry', () => {
    const past = addDays(todayISO(), -1);
    const items = [makeItem({ id: '1', name: 'Milk', expiry_date: past })];
    const alerts = getExpiryAlerts(items);
    expect(alerts[0]).toMatchObject({
      status: 'expired',
      daysUntilExpiry: -1,
    });
    expect(alerts[0].item.name).toBe('Milk');
  });
});
