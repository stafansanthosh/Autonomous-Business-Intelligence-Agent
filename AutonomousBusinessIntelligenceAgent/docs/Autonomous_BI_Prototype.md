# Prototype Specification (Markdown Version)

## 1. Hypothesis & Strategic Fit (Shortened)
We are building an **autonomous business intelligence agent** for apparel startups like Wynch. The agent addresses founder challenges such as identifying winning products, reducing wasted ad spend, managing stockouts/overstock, and cutting losses from returns. Its strategic fit is enabling **profitable growth without scaling operations**, by surfacing real-time insights and proactive recommendations.

---

## 2. Users, JTBD & Outcomes

**Persona:** Apparel founder/operator, lean team, overwhelmed by data.

**Jobs To Be Done (JTBD):**
1. Highlight emerging winners/losers by SKU to guide design and promotions.
2. Forecast inventory to avoid stockouts and over-ordering.
3. Derive ROAS from ads + sales data to reallocate spend effectively.
4. Surface return patterns tied to SKUs to improve sizing and reduce margin loss.

**Top Outcomes (v1):**
- 20% fewer stockouts/overstocks.
- +15% improvement in ROAS.
- Weekly detection of 3 winners and 3 losers.
- Identify top 2 high-return SKUs with insights.

---

## 3. Scope (In / Out)

**In-scope v1:**
- Automated detection of winners/losers by SKU.
- Inventory risk forecasting with reorder suggestions.
- Ads performance analysis tied to inventory.
- Returns analysis surfacing top issues.

**Non-goals (Phase II+):**
- Full seasonal demand forecasting.
- Creative generation for ads/design.
- End-to-end supply chain automation.
- Real-time dynamic pricing.

**Assumptions:**
- Minimum 50+ transactions/month.
- Sales, inventory, and marketing data digitized (CSV/API).

**Trade-offs:**
- Prioritize speed of insights over perfect accuracy.
- Human-in-loop for irreversible or ambiguous actions.

---

## 4. Data & Grounding

**Sources:**
- Orders/transactions.
- Product catalog (SKU-level attributes).
- Inventory snapshots and lead times.
- Marketing & ad spend (ROAS derived from spend + sales).
- Returns data (reason codes linked to SKUs).
- Optional enrichments: holidays, weather, social buzz.

**Grounding Rules:**
- Ignore SKUs with <10 sales.
- Inventory risk = stock level vs trailing 14-day sales velocity.
- Ads flagged only if spend high AND sales lift absent (≥20 sales).
- Returns flagged if >15% return rate.
- Cross-validate across multiple sources before recommending.
- Provide audit log citing exact data used.

**Freshness:** Daily refresh (orders, inventory, ads, returns). Optional near-real-time ads via API.

---

## 4a. Input Format

**Required Datasets (CSV examples):**
- `orders.csv`: order_id, customer_id, sku, quantity, price, order_date.
- `products.csv`: sku, product_name, category, size, color, cost_price, selling_price.
- `inventory_daily.csv`: sku, date, stock_level, reorder_lead_time.
- `marketing_daily.csv`: campaign_id, channel, spend, impressions, clicks, conversions, date.
- `returns.csv`: return_id, order_id, sku, return_reason, return_date.

**Optional Enrichment Files:**
- `calendar.csv`: date, holiday/event.
- `weather_by_city.csv`: date, city, weather_metric.

**Notes:**
- All datasets keyed at SKU level where applicable.
- No customer PII beyond anonymized customer_id required.
- Files ingested daily for analysis and grounding.
