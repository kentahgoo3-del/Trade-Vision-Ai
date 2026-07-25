---
name: TradeVision AI Pro Stack
description: Architecture, routing, and key decisions for TradeVision AI Pro mobile app
---

## Stack
- **Mobile**: Expo / React Native (`artifacts/tradevision-mobile`) — preview at `/mobile/`
- **Backend**: Express API server (`artifacts/api-server`) — all routes under `/api/`
- **DB**: Replit PostgreSQL via Drizzle ORM (`lib/db`)
- **AI**: Replit AI Integrations (OpenAI proxy) via `@workspace/integrations-openai-ai-server`
- **API client**: Orval-generated React Query hooks in `@workspace/api-client-react`

## Key Decisions
- OpenAPI spec at `lib/api-spec/openapi.yaml` → run `pnpm --filter @workspace/api-spec run codegen` after any spec change
- DB schema tables: `analyses`, `conversations`, `messages`, `journal_entries`, `watchlist_items`
- `setBaseUrl()` called in `app/_layout.tsx` with `EXPO_PUBLIC_DOMAIN`
- AI chart analysis uses `gpt-4o` vision with structured JSON response format
- Streaming chat uses SSE via `expo/fetch` with `getReader()`
- expo-image-picker added for chart uploads (base64 mode)
- Dark theme default: background `#0D0E12`, primary `#00C896` (teal), accent `#F59E0B` (gold)

**Why:** Mobile-only pivot; user confirmed Expo is target platform. Web artifact (`/`) exists but is dormant.

## Routes implemented
- GET/POST `/api/analyses`, `/api/analyses/stats`, `/api/analyses/recent`, `/api/analyses/:id`
- GET/POST/DELETE `/api/watchlist`, `/api/watchlist/:id`
- GET/POST/PATCH/DELETE `/api/journal`, `/api/journal/stats`, `/api/journal/:id`
- GET `/api/portfolio/summary`, `/api/portfolio/equity-curve`, `/api/portfolio/monthly-performance`
- GET/POST `/api/openai/conversations`, GET/DELETE `/api/openai/conversations/:id`
- GET/POST `/api/openai/conversations/:id/messages` (SSE streaming)
