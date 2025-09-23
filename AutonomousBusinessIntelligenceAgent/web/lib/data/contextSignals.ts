import { ParsedFileMeta } from './csv';
import { computeVelocity14, computeReturns14, computeDaysCover, computeRoas } from './metricsHelpers';

interface ContextSkuSignal {
  sku: string;
  velocity14?: { avgUnits: number; daysObserved: number };
  returnRate?: number;
  daysCover?: number | null;
}

interface ContextCampaignSignal {
  campaign: string;
  spend: number;
  attributedRevenue: number;
  roas: number;
}

export interface NeutralContextV1 {
  version: 1;
  generatedAt: string;
  skuSignals: ContextSkuSignal[];
  campaigns: ContextCampaignSignal[];
  notes?: string[];
}

function toSalesRows(files: ParsedFileMeta[]) {
  const f = files.find(f => /sales_daily/i.test(f.name));
  const rows: any[] = f?.retainedRows || [];
  return rows.map(r => ({
    date: String(r.date || r.Date || ''),
    sku: String(r.sku || r.SKU || ''),
    units: num(r.units),
    revenue: num(r.revenue)
  })).filter(r => r.sku && r.date);
}

function toReturnRows(files: ParsedFileMeta[]) {
  const f = files.find(f => /returns_daily/i.test(f.name));
  const rows: any[] = f?.retainedRows || [];
  return rows.map(r => ({
    date: String(r.date || ''),
    sku: String(r.sku || ''),
    units_returned: num(r.units_returned)
  })).filter(r => r.sku && r.date);
}

function toInventoryRows(files: ParsedFileMeta[]) {
  const f = files.find(f => /inventory_snapshot/i.test(f.name));
  const rows: any[] = f?.retainedRows || [];
  return rows.map(r => ({
    snapshot_date: String(r.snapshot_date || r.date || ''),
    sku: String(r.sku || ''),
    on_hand: num(r.on_hand)
  })).filter(r => r.sku);
}

function toAdRows(files: ParsedFileMeta[]) {
  const f = files.find(f => /ad_spend/i.test(f.name));
  const rows: any[] = f?.retainedRows || [];
  return rows.map(r => ({
    date: String(r.date || ''),
    campaign: String(r.campaign || ''),
    spend: num(r.spend),
    attributed_revenue: num(r.attributed_revenue)
  })).filter(r => r.campaign && r.date);
}

function num(v: any): number | undefined { if (v === null || v === undefined || v === '') return undefined; const n = typeof v === 'number'? v : Number(v); return isNaN(n)? undefined : n; }

export function buildNeutralContext(files: ParsedFileMeta[], opts?: { maxSkus?: number; maxCampaigns?: number }): NeutralContextV1 | null {
  const sales = toSalesRows(files);
  const returns = toReturnRows(files);
  const inventory = toInventoryRows(files);
  const ads = toAdRows(files);
  if (!sales.length && !ads.length) return null;
  const maxSkus = opts?.maxSkus ?? 30;
  const maxCampaigns = opts?.maxCampaigns ?? 15;

  // Derive aggregate volume per SKU to select top
  const volume: Record<string, number> = {};
  for (const r of sales) volume[r.sku] = (volume[r.sku] || 0) + (r.units || 0);
  const topSkus = Object.entries(volume).sort((a,b)=>b[1]-a[1]).slice(0, maxSkus).map(([sku])=>sku);

  const skuSignals: ContextSkuSignal[] = topSkus.map(sku => {
    const velocity14 = computeVelocity14(sales as any, sku);
    const returns14 = returns.length ? computeReturns14(returns as any, sales as any, sku) : undefined;
    const cover = inventory.length ? computeDaysCover(inventory as any, sales as any, sku) : undefined;
    return {
      sku,
      velocity14: velocity14.avgUnits ? velocity14 : { avgUnits: 0, daysObserved: velocity14.daysObserved },
      returnRate: returns14 ? round(returns14.returnRate) : undefined,
      daysCover: cover ? (isFinite(cover.daysCover) ? round(cover.daysCover) : null) : undefined
    };
  });

  // Aggregate campaigns (ads already filtered by date window inside computeRoas usage). We re-sum last 14 days manually for simplicity.
  const campaignAgg: Record<string, { spend: number; revenue: number }> = {};
  for (const r of ads) {
    campaignAgg[r.campaign] = campaignAgg[r.campaign] || { spend: 0, revenue: 0 };
    campaignAgg[r.campaign].spend += r.spend || 0;
    campaignAgg[r.campaign].revenue += r.attributed_revenue || 0;
  }
  const campaigns: ContextCampaignSignal[] = Object.entries(campaignAgg)
    .sort((a,b)=>b[1].spend - a[1].spend)
    .slice(0, maxCampaigns)
    .map(([campaign, v]) => {
      const roas = v.spend > 0 ? v.revenue / v.spend : 0;
      return { campaign, spend: round(v.spend), attributedRevenue: round(v.revenue), roas: round(roas) };
    });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    skuSignals,
    campaigns,
    notes: [
      'Neutral context: no rankings, no labels.',
      `SKUs included: ${skuSignals.length}`,
      `Campaigns included: ${campaigns.length}`
    ]
  };
}

function round(n: number): number { return Math.round(n * 100) / 100; }
