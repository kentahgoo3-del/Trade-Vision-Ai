---
name: AI Decision Engine Schema
description: New DB columns and API contract added for the full AI trading decision engine — what fields exist and where they live.
---

## What changed
The `analyses` table and `/api/analyses` route were extended with 14 new columns/fields to power the full AI Decision Engine spec.

## New JSONB columns on `analyses` table
- `trade_decision` (text) — BUY | SELL | WAIT | NO TRADE
- `overall_score` (integer) — 0-100
- `confidence_breakdown` (jsonb) — 11 sub-scores object
- `trade_plan` (jsonb) — full trade plan with entry/SL/TP/breakeven/trailing/R:R
- `scenarios` (jsonb) — array of 3 alternative scenario objects
- `market_psychology` (jsonb) — string[] of psychology observations
- `trade_checklist` (jsonb) — 10-key boolean object
- `multi_timeframe` (jsonb) — array of { timeframe, bias, agreement }
- `risk_breakdown` (jsonb) — 7 risk factors + overall
- `trade_quality_stars` (integer) — 1-5
- `coach_advice` (jsonb) — string[] of coaching tips
- `pattern_explanations` (jsonb) — array of { name, what, why, successRate, failures, confirmation }
- `beginner_explanation` (text)
- `news_sentiment` (jsonb) — { classification, score, impact, summary }

**Why:** All existing text columns kept for backwards compat and quick-list display; new JSONB cols hold the rich engine output.

## AI Prompt rule
- `tradeDecision` must be WAIT or NO TRADE if `overallScore < 75`
- `max_tokens` set to 4000 (up from 1000)
- `response_format: json_object` still used

## OpenAPI spec
All 14 new fields added to `Analysis` schema in `lib/api-spec/openapi.yaml` as nullable types. Run `pnpm --filter @workspace/api-spec run codegen` after any schema changes to regenerate api-client-react and api-zod.

## Analysis detail screen
`artifacts/tradevision-mobile/app/analysis/[id].tsx` fully rebuilt. Sections (in order):
1. Decision banner (BUY/SELL/WAIT/NO TRADE) + overall score
2. Trade quality stars
3. AI summary
4. Confidence breakdown (11 animated bars)
5. Trade plan (full table)
6. Position size calculator (interactive, client-side)
7. Trade checklist (10 pass/fail items)
8. Multi-timeframe alignment grid
9. Alternative scenarios (3 cards)
10. Market psychology bullets
11. Risk assessment breakdown
12. Pattern explanations (expandable cards)
13. AI coaching tips
14. News sentiment
15. Beginner explanation
16. AI reasoning (strengths/weaknesses/risks)
17. Market structure (legacy fields)
