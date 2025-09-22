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
2. Upload sample CSVs from `/public/data`.
3. Explore dashboards and simulate actions via the agent log.

## License
[MIT](./LICENSE)
