---
id: 6
title: Chat API Route & Streaming Adapter
status: pending
priority: critical
feature: backend-lite
dependencies: [4]
created_at: "2025-09-23T00:00:00Z"
started_at: null
completed_at: null
---

## Description
Create `/api/chat` route that accepts question + metrics summary and streams LLM response.

## Details
- Edge runtime if provider supports; fallback to node.
- Raw fetch to LLM with streaming body.
- Forward tokens; terminate with sentinel line + JSON payload.

## Progress Updates

## Test Strategy
- Mock provider returning chunked stream; ensure UI receives incremental updates.

## Completion Summary
