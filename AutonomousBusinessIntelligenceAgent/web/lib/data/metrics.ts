import { ParsedFileMeta } from './csv';

interface DailySkuRow { date: string; sku: string; units?: number; revenue?: number }
interface CampaignRow { date: string; campaign: string; spend?: number; attributed_units?: number; attributed_revenue?: number }

export interface MetricsSummaryObject {
  timeWindowDays: number;
  sales: {
    skus: Array<{
      sku: string;
      last7Units: number; prev7Units: number; pctChangeUnits: number;
      last7Revenue: number; prev7Revenue: number; pctChangeRevenue: number;
    }>;
    generatedAt: string;
  };
  campaigns: Array<{
    campaign: string;
    last7Spend: number; last7AttributedRevenue: number; roas: number; units: number;
  }>;
}

// Generic aggregation to expose comparative windows without embedding business logic about "winners".
export function buildMetricsSummaryFromFiles(files: ParsedFileMeta[], todayISO?: string): MetricsSummaryObject | null {
  const salesFile = files.find(f => /sales_daily/i.test(f.name));
  const adFile = files.find(f => /ad_spend/i.test(f.name));
  if (!salesFile && !adFile) return null;
  const now = todayISO ? new Date(todayISO) : new Date();
  // Establish window boundaries (assume data dates in same TZ / ISO)
  const dayMs = 86400000;
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start14 = new Date(end.getTime() - 14 * dayMs);
  const start28 = new Date(end.getTime() - 28 * dayMs);

  const salesRows: DailySkuRow[] = [];
  if (salesFile?.retainedRows) {
    for (const r of salesFile.retainedRows) {
      const date = String(r['date'] ?? r['Date'] ?? '');
      const sku = String(r['sku'] ?? r['SKU'] ?? '');
      if (!date || !sku) continue;
      const units = numberish(r['units']);
      const revenue = numberish(r['revenue']);
      salesRows.push({ date, sku, units, revenue });
    }
  }

  const campaignsRows: CampaignRow[] = [];
  if (adFile?.retainedRows) {
    for (const r of adFile.retainedRows) {
      const date = String(r['date'] ?? '');
      const campaign = String(r['campaign'] ?? '');
      if (!date || !campaign) continue;
      campaignsRows.push({
        date,
        campaign,
        spend: numberish(r['spend']),
        attributed_units: numberish(r['attributed_units']),
        attributed_revenue: numberish(r['attributed_revenue'])
      });
    }
  }

  function bucketize<T extends { date: string }>(rows: T[]): { recent: T[]; prior: T[] } {
    const recent: T[] = []; const prior: T[] = [];
    for (const row of rows) {
      const d = safeDate(row.date); if (!d) continue;
      if (d >= start14 && d < end) recent.push(row);
      else if (d >= start28 && d < start14) prior.push(row);
    }
    return { recent, prior };
  }

  const salesBySkuRecent: Record<string, { units: number; revenue: number }> = {};
  const salesBySkuPrior: Record<string, { units: number; revenue: number }> = {};
  if (salesRows.length) {
    const { recent, prior } = bucketize(salesRows);
    for (const r of recent) aggSku(salesBySkuRecent, r);
    for (const r of prior) aggSku(salesBySkuPrior, r);
  }

  const skus: MetricsSummaryObject['sales']['skus'] = Object.keys({ ...salesBySkuRecent, ...salesBySkuPrior }).map(sku => {
    const recent = salesBySkuRecent[sku] || { units: 0, revenue: 0 };
    const prior = salesBySkuPrior[sku] || { units: 0, revenue: 0 };
    return {
      sku,
      last7Units: recent.units, // note: using 14-window aggregated; could refine to 7 vs 7 in future
      prev7Units: prior.units,
      pctChangeUnits: pctChange(prior.units, recent.units),
      last7Revenue: recent.revenue,
      prev7Revenue: prior.revenue,
      pctChangeRevenue: pctChange(prior.revenue, recent.revenue)
    };
  }).slice(0, 100); // cap

  const campaignAgg: Record<string, { spend: number; revenue: number; units: number }> = {};
  if (campaignsRows.length) {
    const { recent } = bucketize(campaignsRows);
    for (const r of recent) {
      const key = r.campaign;
      if (!campaignAgg[key]) campaignAgg[key] = { spend: 0, revenue: 0, units: 0 };
      campaignAgg[key].spend += r.spend || 0;
      campaignAgg[key].revenue += r.attributed_revenue || 0;
      campaignAgg[key].units += r.attributed_units || 0;
    }
  }

  const campaigns = Object.entries(campaignAgg).map(([campaign, v]) => ({
    campaign,
    last7Spend: round2(v.spend),
    last7AttributedRevenue: round2(v.revenue),
    roas: v.spend > 0 ? round2(v.revenue / v.spend) : 0,
    units: v.units
  })).slice(0, 50);

  return {
    timeWindowDays: 14,
    sales: { skus: skus.sort((a,b)=>b.pctChangeRevenue - a.pctChangeRevenue), generatedAt: new Date().toISOString() },
    campaigns
  };
}

function numberish(v: any): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return isNaN(n) ? undefined : n;
}
function safeDate(s: string): Date | null { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
function aggSku(store: Record<string,{units:number;revenue:number}>, r: DailySkuRow) {
  if (!store[r.sku]) store[r.sku] = { units: 0, revenue: 0 };
  store[r.sku].units += r.units || 0;
  store[r.sku].revenue += r.revenue || 0;
}
function pctChange(prev: number, curr: number): number { return prev === 0 ? (curr === 0 ? 0 : 100) : ((curr - prev) / prev) * 100; }
function round2(n: number): number { return Math.round(n * 100) / 100; }
