# Autonomous Business Intelligence Agent

This repository contains the prototype for an autonomous BI agent.  
The agent independently:
- Identifies what matters most in business data
- Surfaces unexpected trends and anomalies
- Predicts implications (stockouts, wasted ad spend, high return risk)
- Initiates or recommends preliminary responses

## Scenarios Implemented
1. Sales trends discovery (what’s working vs not)
2. Inventory foresight (stockouts vs overstock)
3. Ad spend efficiency (scale or cut)
4. Returns analysis (size/fit margin killers)

## Tech Stack
- Next.js (TypeScript)
- Tailwind + shadcn/ui
- Recharts (visuals)
- Zustand (state management)
- Papaparse (CSV ingestion)

## Usage
1. Clone repo & install dependencies.
2. Copy `web/.env.example` to `web/.env.local` and fill in any available API keys (optional for mock mode).
3. From the `web` directory run:
	```bash
	npm install
	npm run dev
	```
4. Open http://localhost:3000 and upload sample CSVs from `web/public/samples`.
5. Ask a question in the chat panel; if no keys are set you will see a mock streamed response. Which we dont want.

## Deployment (Vercel)

The `web` app is a Next.js App Router project and deploys cleanly to Vercel.

### Quick Deploy Steps
1. Push this repository to GitHub (or fork).
2. In Vercel: "New Project" → import the repo.
3. Framework auto-detected: Next.js.
4. Set Environment Variables (Project Settings → Environment Variables):
	- `AZURE_OPENAI_KEY`
	- `AZURE_OPENAI_ENDPOINT` (e.g. `https://your-resource.openai.azure.com/`)
	- `AZURE_OPENAI_DEPLOYMENT`
	- (Optional) `AZURE_OPENAI_API_VERSION`
	- (Fallback) `OPENAI_API_KEY`
	- (Optional) `OPENAI_MODEL`
5. Trigger the first deployment — build output should expose the site at `https://<project>.vercel.app`.

### Sample Dataset Links
All sample CSVs are served from `public/samples`. At build time Vercel copies the `public/` directory verbatim, so links such as `/samples/orders.csv` resolve correctly from any route.

### Streaming
The chat route (`app/api/chat/route.ts`) runs in the Node.js runtime (default) and streams via (Server-Sent Events style → transformed to text). Vercel supports streaming responses; no config change required.

### Environment & Secrets
Do NOT commit real keys. Use `.env.example` as a reference. Locally create `web/.env.local`. On Vercel, configure the variables (Production + Preview). Re‑deploy when secrets change.

### Expected Differences When Hosted
| Concern | Local Behavior | Vercel Behavior | Action |
|---------|----------------|-----------------|--------|
| Sample CSV Links | Served from dev server | Served from CDN edge | Works automatically |
| Streaming | Incremental chunks appear | Same (slight buffering possible) | None |
| Env Vars | `.env.local` in `web/` | Vercel dashboard | Set all before deploy |
| Large CSV Upload | Limited by browser memory | Limited by Vercel serverless memory & 4MB body practical | Consider client-side chunking later |
| Cold Start | N/A (dev) | First request may add 1–2s | Acceptable for prototype |
| Logs | Terminal stdout | Vercel project logs | Use for debugging provider failures |

### Hardening Ideas (Future)
- Add file size guard & friendly error if CSV too large.
- Add a provider status endpoint (`/api/health`) to verify keys.
- Add an optional `EDGE` runtime mode for lower latency (would need to remove Node-only libs if introduced later).

## Required Environment Variables Summary
| Variable | Purpose | Required? | Notes |
|----------|---------|-----------|-------|
| `AZURE_OPENAI_KEY` | Azure auth | No* | Preferred path if using Azure |
| `AZURE_OPENAI_ENDPOINT` | Azure endpoint base | No* | Ends with `/` or code adds it |
| `AZURE_OPENAI_DEPLOYMENT` | Deployed Azure model name | No* | Must exist in Azure resource |
| `AZURE_OPENAI_API_VERSION` | Version override | Optional | Defaults to `2024-12-01-preview` |
| `OPENAI_API_KEY` | OpenAI fallback | No* | Used only if Azure not present |
| `OPENAI_MODEL` | OpenAI model id | Optional | Defaults to `gpt-4o-mini` |

*If neither Azure nor OpenAI credentials are set, a mock deterministic provider is used.

## Deployment Verification Checklist
1. Load homepage: heading shows "Autonomous Business Intelligence Agent".
2. Click each sample dataset link—each downloads CSV (status 200, non-empty).
3. Submit a question with no keys (mock provider text appears) OR with keys (provider tag visible at end sentinel in network stream).
4. Upload multiple CSVs; ensure tables + insights render.
5. Hard refresh to confirm no client cache dependency.

## Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Blank response / immediate end | Missing env vars; both providers null | Add at least one provider key |
| Provider error text streamed | Invalid key or model name | Verify env var correctness |
| Tables not appearing | Model didn’t output markdown table header | Re-ask with explicit "include a markdown table" |
| Large CSV hangs | Memory / parse time | Reduce file size (prototype not yet paginated) |


### Environment Variables (Optional for Mock)
The following variables are referenced by the LLM provider selector:

Azure OpenAI (preferred if complete):
`AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`

OpenAI fallback:
`OPENAI_API_KEY`, `OPENAI_MODEL`

If neither provider is configured a deterministic mock response is streamed.

## License
[MIT](./LICENSE)
