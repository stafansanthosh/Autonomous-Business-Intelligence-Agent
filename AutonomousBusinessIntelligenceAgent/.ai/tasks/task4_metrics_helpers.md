---
id: 4
title: Metrics Helper Library
status: pending
priority: critical
feature: metrics
dependencies: [3]
created_at: "2025-09-23T00:00:00Z"
started_at: null
completed_at: null
---

## Description
Implement pure functions to compute velocity, days cover, return rate, ROAS from parsed arrays.

## Details
- Expose functions: `computeVelocity14`, `computeReturns14`, `computeRoas`, `computeDaysCover`.
- Handle missing optional datasets gracefully.
- Cache results per SKU in memory until data changes.

## Progress Updates

## Test Strategy
- Unit tests (basic) with synthetic data verifying expected outputs.

## Completion Summary
