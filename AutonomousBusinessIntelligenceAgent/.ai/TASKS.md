# Autonomous BI Prototype – Task Dashboard

Master checklist generated from `Autonomous_BI_Detailed_Design.md` (prototype-focused architecture). Each task is documented under `./tasks/` with full details. Only update checkboxes here; all progress notes go into individual task files.

| ID | Status | Title | Priority | Depends On |
|----|--------|-------|----------|------------|
| 1 | [x] | Bootstrap Next.js Scaffold | critical | - |
| 2 | [x] | Chat UI Shell & Layout | high | 1 |
| 3 | [x] | Client CSV Parsing & Sample Data | critical | 1 |
| 4 | [x] | Metrics Helper Library | critical | 3 |
| 5 | [ ] | Insight Generation Functions | high | 4 |
| 6 | [ ] | Chat API Route & Streaming Adapter | critical | 4 |
| 7 | [ ] | LLM Provider Integration & Env Config | high | 6 |
| 8 | [ ] | UI Integration of Metrics & Insights | high | 5,6,7 |
| 9 | [ ] | Disclaimers, Banner & UX Polish | medium | 8 |
| 10 | [ ] | Deployment Configuration (Vercel) | critical | 7,8 |
| 11 | [ ] | Documentation & README Authoring | high | 10 |
| 12 | [ ] | Error Handling & Fallback Strategies | medium | 6 |
| 13 | [ ] | Optional Persistence Spike (IndexedDB) | low | 3 |
| 14 | [ ] | Cost & Token Guardrails | medium | 7 |

Legend: [ ] pending, [-] in progress, [x] completed, [!] failed.

---

## High-Level Execution Order
1 → 3 → 4 → 6 → 7 → 5 → 8 → 9 → 10 → 11 (with 12/14 parallel after 6; 13 optional).

## Notes
- Keep tasks small and self-contained.
- Production-grade validation intentionally out-of-scope.
- Any scope changes: append a note to the relevant task file under Progress Updates.

---
