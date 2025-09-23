---
id: 4
title: Metrics Helper Library (Neutral Signal Extraction)
status: completed
priority: critical
feature: metrics
dependencies: [3]
created_at: "2025-09-23T00:00:00Z"
started_at: "2025-09-23T00:00:00Z"
completed_at: "2025-09-23T00:30:00Z"
---

## Description
Implement neutral, domain-agnostic helper functions that surface generic quantitative signals (e.g. velocity, returns ratio, ROAS, days of cover) from parsed tabular data. These helpers MUST avoid embedding scenario-specific conclusions; reasoning is deferred to the LLM.

## Details
Core goals:
1. Provide lightweight numeric signals (no narrative, no ranking language) so the LLM can synthesize insights itself.
2. Remain resilient to partial data (some datasets may be absent).
3. Be token-efficient: avoid large raw dumps if summarized aggregates suffice.
4. Avoid prematurely answering business questions (no labels like "winner", "loser", or "underperforming").

Planned exported helpers:
- `computeVelocity14(salesRows, sku, opts?)` → average daily units over last 14 days (falls back to available days, returns `{ avgUnits, daysObserved }`).
- `computeReturns14(returnsRows, sku)` → `{ unitsReturned, unitsSold, returnRate }` (graceful if either side missing).
- `computeRoas(adRows, campaign)` → `{ spend, attributedRevenue, roas }` (roas = 0 if spend=0; do not infer quality).
- `computeDaysCover(inventoryRows, salesRows, sku)` → `{ onHand, velocity, daysCover }` (daysCover = onHand / max(velocity, epsilon)).

Caching Strategy:
- In-memory ephemeral cache keyed by a hash of array lengths + last date seen + parameter key.
- Cache invalidates automatically if input shape or sentinel fields change.

Synthetic Data Plan:
- Add / extend synthetic CSVs (if not present): `returns_daily.csv`, larger `sales_daily.csv` (multiple SKUs), `inventory_snapshot.csv` with realistic on_hand variance.
- Datasets intentionally include sparse zones and zero-spend campaigns for edge-case coverage.

Non-Goals / Explicit Omissions:
- No test harness / unit test files (per directive to remove tests).
- No opinionated classification (e.g., "high churn").
- No multi-metric composite scores.

Deliverable Shape (example object for a SKU):
```
{
	sku: "SKU-1001",
	velocity14: { avgUnits: 32.4, daysObserved: 14 },
	returns14: { unitsReturned: 2, unitsSold: 450, returnRate: 0.0044 },
	inventory: { onHand: 120, daysCover: 3.7 },
	campaigns: [ { campaign: "Retargeting - Hoodie", roas: 3.42, spend: 310, attributedRevenue: 1060 } ]
}
```

Inclusion in Prompt:
- The UI or metrics summary layer will decide which subset to serialize (e.g., top N SKUs by volume); this task only provides primitive calculators.

Edge Handling:
- Missing numeric -> skip or treat as 0 depending on metric (documented inline).
- Division by zero guarded with epsilon 1e-9.

Performance:
- Datasets are small in-browser; micro-optimizations unnecessary—clarity favored over complexity.

## Progress Updates

- Created synthetic datasets: `returns_daily.csv`, `inventory_snapshot.csv`.
- Added neutral helper module `metricsHelpers.ts` with velocity, returns, roas, daysCover.
- Implemented lightweight cache (signature: lengths + latest date + key).
- Removed test strategy per directive; spec rewritten to stress LLM reasoning (no scenario labels).
- No prompt changes applied yet (recommendation documented separately).

## Test Strategy
Per directive: omitted. Manual spot-check via console during integration only.

## Completion Summary
Implemented a neutral signal extraction layer producing raw quantitative metrics (velocity, return rate, ROAS, days cover) without embedded business logic. Added synthetic support datasets ensuring sparse / edge cases present (zero spend, sparse returns). This enables subsequent tasks (Insight Generation & UI Integration) to feed richer, but still unbiased, inputs to the LLM. Next optional steps: integrate these signals into the prompt in a neutral serialized form and consider adding inventory risk (low days cover) flags only if still kept descriptive (not judgmental).

## Completion Summary
