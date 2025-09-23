/*
 Neutral metrics helper functions.
 These expose raw quantitative signals only; no scenario labeling or business interpretation.
*/

export interface SalesRow { date: string; sku: string; units?: number; revenue?: number }
export interface ReturnsRow { date: string; sku: string; units_returned?: number }
export interface AdRow { date: string; campaign: string; spend?: number; attributed_revenue?: number }
export interface InventoryRow { snapshot_date?: string; date?: string; sku: string; on_hand?: number }

interface Velocity14 { avgUnits: number; daysObserved: number }
interface Returns14 { unitsReturned: number; unitsSold: number; returnRate: number }
interface RoasResult { spend: number; attributedRevenue: number; roas: number }
interface DaysCover { onHand: number; velocity: number; daysCover: number }

const EPS = 1e-9;

// Simple ephemeral cache: key -> { hash, value }
interface CacheEntry<T> { sig: string; value: T }
const velocityCache = new Map<string, CacheEntry<Velocity14>>();
const returnsCache = new Map<string, CacheEntry<Returns14>>();
const roasCache = new Map<string, CacheEntry<RoasResult>>();
const coverCache = new Map<string, CacheEntry<DaysCover>>();

function signature(objs: any[], extra: string): string {
  // Lightweight signature using lengths + last date + extra key
  const parts = objs.map(o => Array.isArray(o)
    ? `${o.length}:${latestDate(o)}`
    : 'na');
  return parts.join('|') + '|' + extra;
}

function latestDate(rows: any[]): string {
  let latest = 0;
  for (const r of rows) {
    const d = new Date(r.date || r.snapshot_date).getTime();
    if (!isNaN(d) && d > latest) latest = d;
  }
  return latest ? String(latest) : '0';
}

function window14Boundary(rows: { date?: string; snapshot_date?: string }[]): { start: number; end: number } {
  // Determine end as latest midnight UTC in data; start = end - 14d
  let latest = 0;
  for (const r of rows) {
    const raw = r.date || r.snapshot_date;
    if (!raw) continue;
    const t = Date.parse(raw);
    if (!isNaN(t) && t > latest) latest = t;
  }
  if (!latest) {
    const now = Date.now();
    latest = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  }
  const end = Date.UTC(new Date(latest).getUTCFullYear(), new Date(latest).getUTCMonth(), new Date(latest).getUTCDate()) + 24*3600*1000; // exclusive
  const start = end - 14 * 24 * 3600 * 1000;
  return { start, end };
}

function within(ts: number, start: number, end: number) { return ts >= start && ts < end; }

export function computeVelocity14(sales: SalesRow[], sku: string): Velocity14 {
  const sig = signature([sales], `velocity:${sku}`);
  const cached = velocityCache.get(sig);
  if (cached) return cached.value;
  const { start, end } = window14Boundary(sales);
  let totalUnits = 0; const days = new Set<string>();
  for (const row of sales) {
    if (row.sku !== sku) continue;
    if (row.units == null) continue;
    const t = Date.parse(row.date);
    if (isNaN(t) || !within(t, start, end)) continue;
    totalUnits += row.units;
    days.add(row.date);
  }
  const daysObserved = days.size || 0;
  const avgUnits = daysObserved ? totalUnits / daysObserved : 0;
  const value = { avgUnits, daysObserved };
  velocityCache.set(sig, { sig, value });
  return value;
}

export function computeReturns14(returnsRows: ReturnsRow[], sales: SalesRow[], sku: string): Returns14 {
  const sig = signature([returnsRows, sales], `returns:${sku}`);
  const cached = returnsCache.get(sig);
  if (cached) return cached.value;
  const { start, end } = window14Boundary([...returnsRows, ...sales]);
  let unitsReturned = 0; let unitsSold = 0;
  for (const r of returnsRows) {
    if (r.sku !== sku || r.units_returned == null) continue;
    const t = Date.parse(r.date); if (isNaN(t) || !within(t, start, end)) continue;
    unitsReturned += r.units_returned;
  }
  for (const s of sales) {
    if (s.sku !== sku || s.units == null) continue;
    const t = Date.parse(s.date); if (isNaN(t) || !within(t, start, end)) continue;
    unitsSold += s.units;
  }
  const returnRate = unitsSold === 0 ? 0 : unitsReturned / (unitsSold + EPS);
  const value = { unitsReturned, unitsSold, returnRate };
  returnsCache.set(sig, { sig, value });
  return value;
}

export function computeRoas(adRows: AdRow[], campaign: string): RoasResult {
  const sig = signature([adRows], `roas:${campaign}`);
  const cached = roasCache.get(sig);
  if (cached) return cached.value;
  const { start, end } = window14Boundary(adRows);
  let spend = 0; let attributedRevenue = 0;
  for (const r of adRows) {
    if (r.campaign !== campaign) continue;
    const t = Date.parse(r.date); if (isNaN(t) || !within(t, start, end)) continue;
    spend += r.spend || 0;
    attributedRevenue += r.attributed_revenue || 0;
  }
  const roas = spend === 0 ? 0 : attributedRevenue / (spend + EPS);
  const value = { spend, attributedRevenue, roas };
  roasCache.set(sig, { sig, value });
  return value;
}

export function computeDaysCover(inventory: InventoryRow[], sales: SalesRow[], sku: string): DaysCover {
  const sig = signature([inventory, sales], `cover:${sku}`);
  const cached = coverCache.get(sig);
  if (cached) return cached.value;
  let onHand = 0;
  // choose the latest snapshot row for sku
  let latestTs = 0;
  for (const inv of inventory) {
    if (inv.sku !== sku) continue;
    const ts = Date.parse(inv.snapshot_date || inv.date || '');
    if (isNaN(ts)) continue;
    if (ts > latestTs) { latestTs = ts; onHand = inv.on_hand || 0; }
  }
  const velocity = computeVelocity14(sales, sku).avgUnits;
  const daysCover = velocity <= 0 ? Infinity : onHand / (velocity + EPS);
  const value = { onHand, velocity, daysCover };
  coverCache.set(sig, { sig, value });
  return value;
}

// Utility to clear caches (not exported by default to avoid accidental use in prompt logic)
export const __internal = {
  clearAll() { velocityCache.clear(); returnsCache.clear(); roasCache.clear(); coverCache.clear(); }
};
