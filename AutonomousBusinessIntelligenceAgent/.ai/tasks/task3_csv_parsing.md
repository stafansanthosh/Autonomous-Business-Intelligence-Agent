---
id: 3
title: Client CSV Parsing & Sample Data
status: completed
priority: critical
feature: ingestion-lite
dependencies: [1]
created_at: "2025-09-23T00:00:00Z"
started_at: "2025-09-23T02:00:00Z"
completed_at: "2025-09-23T02:30:00Z"
---

## Description
Add client-side CSV parsing using Papaparse; load and store orders/products data; provide downloadable sample CSVs.

## Details
- Papaparse integration with streaming parse for large files.
- Enforce size/row caps (5MB / 25k rows); beyond that skip remainder with warning.
- Provide sample datasets in `public/samples/`.
- Basic file drop zone with status messages.

## Progress Updates
- Implemented streaming CSV parse with row/size limits (25k rows / 5MB) via `parseCsvFile`.
- Added schema inference (column types) + numeric min/max + sample rows + SKU distinct count.
- Added aggregate summary (totalFiles, totalRows, topColumns, union size).
- Introduced new sample datasets: products.csv, inventory.csv.
- Enhanced SidePanel with expandable file cards, schema, stats, warnings, samples.
- Updated main page to use aggregate summary for prompt preview & API payload.

## Test Strategy
- Upload sample; verify counts of SKUs & rows display.

## Completion Summary
Client-side CSV ingestion upgraded with streaming parse, enforced soft limits, schema & stats extraction, additional sample datasets, and richer UI presentation. Build passes with no TypeScript errors. Ready for metrics helper library integration (Task 4).
