---
id: 7
title: LLM Provider Integration & Env Config
status: pending
priority: high
feature: llm
dependencies: [6]
created_at: "2025-09-23T00:00:00Z"
started_at: null
completed_at: null
---

## Description
Integrate chosen LLM (e.g., OpenAI) with key via env var and minimal prompt template.

## Details
- Prompt template includes metric lines block.
- Add safety disclaimers appended to assistant answer.
- Token limit & basic cost guard (max tokens param).

## Progress Updates

## Test Strategy
- Live call with sample metrics; verify streaming tokens.

## Completion Summary
