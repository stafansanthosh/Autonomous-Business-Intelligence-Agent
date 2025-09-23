---
id: 5
title: Insight Generation Functions
status: pending
priority: high
feature: insights
dependencies: [4]
created_at: "2025-09-23T00:00:00Z"
started_at: null
completed_at: null
---

## Description
Produce ranked lists: top winners, inventory risks, high return rate SKUs.

## Details
- Winner criteria: velocity growth vs prior period (simplified heuristic) + unit volume.
- Risk: low days cover (< threshold) + rising velocity.
- Return risk: return rate > 0.15.

## Progress Updates

## Test Strategy
- Snapshot tests for deterministic input arrays.

## Completion Summary
