// Neutral-context aware prompt builder.
export function buildPrompt(question: string, metricsSummary: unknown): string {
  const header = 'You are an autonomous retail analytics agent. Decide independently what is notable; do not dump all raw data. If insufficient data, clearly state limitations. If you are missing data to support a claim, explicitly say so.';
  const formatted = formatMetrics(metricsSummary);
  const tableGuidance = `\nRESPONSE FORMAT:\n- Up to 2 GitHub Markdown tables (if warranted).\n- Table 1 suggestion: SKU | Velocity14 | DaysCover | ReturnRate (only include columns with data).\n- Table 2 suggestion (optional): Campaign | Spend | ROAS | AttribRev.\n- After tables: <=6 bullet insights (patterns, anomalies, risks, opportunities).\n- No commentary inside tables. No fabrication.`;
  const disclaimer = '\nDISCLAIMER: Model-generated analytical draft; verify before operational decisions.';
  return `${header}\n\nDATA CONTEXT BEGIN\n${formatted}\nDATA CONTEXT END\n\nQUESTION: ${question}${tableGuidance}\nIf confidence is low due to sparse observations (<5 daysObserved or zero spend) prepend 'LOW CONFIDENCE:' to the narrative.${disclaimer}`;
}

function formatMetrics(raw: unknown): string {
  if (!raw) return 'NO METRICS';
  // Neutral context version 1
  if (typeof raw === 'object' && raw !== null && (raw as any).version === 1 && 'skuSignals' in (raw as any)) {
    const ctx: any = raw;
    const lines: string[] = [];
    if (!Array.isArray(ctx.skuSignals) || !Array.isArray(ctx.campaigns)) {
      return 'MALFORMED_CONTEXT_V1';
    }
    lines.push(`CONTEXT_VERSION: ${ctx.version}`);
    if (Array.isArray(ctx.skuSignals)) {
      ctx.skuSignals.forEach((s: any) => {
        lines.push(
          `SKU_SIGNAL sku=${s.sku} vel14=${round2(s.velocity14?.avgUnits)} daysObs=${s.velocity14?.daysObserved ?? 0} daysCover=${valOrNA(s.daysCover)} returnRate=${round2(s.returnRate)}`
        );
      });
    }
    if (Array.isArray(ctx.campaigns)) {
      ctx.campaigns.forEach((c: any) => {
        lines.push(
          `CAMPAIGN_SIGNAL name="${c.campaign}" spend=${round2(c.spend)} roas=${round2(c.roas)} attribRev=${round2(c.attributedRevenue)}`
        );
      });
    }
    if (Array.isArray(ctx.notes)) ctx.notes.forEach((n: string) => lines.push(`NOTE ${n}`));
    return lines.join('\n');
  }
  if (Array.isArray(raw)) return raw.map((m,i)=>`ITEM_${i+1}: ${safeStringify(m)}`).join('\n');
  if (typeof raw === 'object') return safeStringify(raw);
  return String(raw);
}

function round2(n: any): number { const num = typeof n === 'number' ? n : Number(n); if (isNaN(num)) return 0; return Math.round(num * 100) / 100; }
function valOrNA(v: any): string { if (v === null || v === undefined) return 'NA'; return String(v); }
function safeStringify(v: any): string { try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); } }

export function buildPromptPreview(question: string, metricsSummary: unknown): string {
  return buildPrompt(question, metricsSummary).slice(0, 140) + '...';
}
