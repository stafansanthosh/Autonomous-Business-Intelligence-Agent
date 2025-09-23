// Build an LLM prompt. Accepts any shape for metricsSummary and normalizes to an array of lines.
export function buildPrompt(question: string, metricsSummary: unknown): string {
  const header = 'You are a concise merchandising & inventory analyst. Use ONLY provided context; if missing say you need more data. Provide direct answers with supporting numeric evidence.';
  const formatted = formatMetrics(metricsSummary);
  return `${header}\n\nDATA CONTEXT BEGIN\n${formatted}\nDATA CONTEXT END\n\nQUESTION: ${question}\nINSTRUCTIONS: If confidence is low (thin sample <20 units or sparse campaigns) state that clearly.`;
}

function formatMetrics(raw: unknown): string {
  if (!raw) return 'NO METRICS';
  // Recognize structured metrics object shape
  if (typeof raw === 'object' && raw !== null && 'sales' in (raw as any)) {
    const m: any = raw;
    const lines: string[] = [];
    lines.push(`TIME_WINDOW_DAYS: ${m.timeWindowDays || 14}`);
    if (m.sales?.skus) {
      const topIncreases = [...m.sales.skus].sort((a,b)=>b.pctChangeRevenue - a.pctChangeRevenue).slice(0,5);
      const topDeclines = [...m.sales.skus].sort((a,b)=>a.pctChangeRevenue - b.pctChangeRevenue).slice(0,5);
      lines.push('SALES_TOP_REVENUE_GROWTH:');
      topIncreases.forEach(s => lines.push(compactSkuLine(s)));
      lines.push('SALES_TOP_REVENUE_DECLINE:');
      topDeclines.forEach(s => lines.push(compactSkuLine(s)));
    }
    if (Array.isArray(m.campaigns)) {
      const sorted = [...m.campaigns].sort((a,b)=> (b.roas - a.roas));
      lines.push('CAMPAIGNS_BY_ROAS_DESC:');
      sorted.slice(0,5).forEach(c => lines.push(compactCampaignLine(c)));
      const lowImpact = sorted.filter(c => c.last7Spend > 0 && c.roas < 1).slice(0,5);
      if (lowImpact.length) {
        lines.push('CAMPAIGNS_LOW_ROAS:');
        lowImpact.forEach(c => lines.push(compactCampaignLine(c)));
      }
    }
    return lines.join('\n');
  }
  if (Array.isArray(raw)) return raw.map((m,i)=>`ITEM_${i+1}: ${safeStringify(m)}`).join('\n');
  if (typeof raw === 'object') return safeStringify(raw);
  return String(raw);
}

function compactSkuLine(s: any): string {
  return `SKU ${s.sku} revΔ%=${round2(s.pctChangeRevenue)} unitsΔ%=${round2(s.pctChangeUnits)} last=${s.last7Revenue}/${s.last7Units} prev=${s.prev7Revenue}/${s.prev7Units}`;
}
function compactCampaignLine(c: any): string {
  return `CAMP "${c.campaign}" spend=${c.last7Spend} attrib_rev=${c.last7AttributedRevenue} roas=${c.roas} units=${c.units}`;
}
function round2(n: any): number { const num = typeof n === 'number' ? n : Number(n); return Math.round(num * 100) / 100; }

function safeStringify(v: any): string {
  try {
    return typeof v === 'string' ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function buildPromptPreview(question: string, metricsSummary: unknown): string {
  return buildPrompt(question, metricsSummary).slice(0, 140) + '...';
}
