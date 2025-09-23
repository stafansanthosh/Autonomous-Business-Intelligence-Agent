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
5. Ask a question in the chat panel; if no keys are set you will see a mock streamed response.

### Environment Variables (Optional for Mock)
The following variables are referenced by the LLM provider selector:

Azure OpenAI (preferred if complete):
`AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`

OpenAI fallback:
`OPENAI_API_KEY`, `OPENAI_MODEL`

If neither provider is configured a deterministic mock response is streamed.

## License
[MIT](./LICENSE)
