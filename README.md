# N.E.W Procurement Intelligence (Closed-Loop v2)

A deterministic procurement-to-sales intelligence system where break-even is the entry point and every downstream decision is traceable.

This implementation is local-first and designed for exclusive use by one organization.

## System overview
Pipeline order is enforced:

Break-even -> AI Forecast -> Procurement -> Production -> Feedback Loop

Only finalized records are written to Supabase.

## Access control
- Login starts from `/login` using Google sign-in via Supabase Auth.
- Access is restricted to email(s) listed in `ALLOWED_GOOGLE_EMAILS`.
- Unauthorized login attempts are blocked and redirected to `/unauthorized`.
- Unauthorized users are automatically signed out, shown an error, then redirected to `/login` after 5 seconds.

## Architecture diagram (text)

```
[Frontend Inputs]
      |
      v
[Async Break-Even + Session Cache]
      |
      v
[AI Forecast API]
      |
      v
[Forecast-Driven Procurement Engine]
      |
      v
[Procurement-Driven Production Engine]
      |
      v
[Packaging + Financial Projection]
      |
      v
[Finalize + Supabase Persist + Audit Log]
      |
      v
[Feedback Loop: Actual vs Predicted]
```

## Tech stack
- Frontend: Next.js App Router + TypeScript
- Backend: Next.js Route Handlers
- Database: Supabase Postgres
- Hosting: Vercel free tier

## Async frontend computation
- Break-even is computed on the client asynchronously (non-blocking UI).
- UI shows business-facing status only and avoids developer-only diagnostic copy.
- Break-even cache uses `sessionStorage` and keying by cost/pricing inputs.

## Input experience
- The main operational setup uses an editorial-style table layout for organization staff.
- The setup row includes product and financial controls in one place:
      - Product Name
      - Bundle Size
      - Selling Price / Unit
      - Budget Available
      - Fixed Cost
      - Conversion Rate
- The page explains key terms before input:
      - Fixed cost: costs that do not scale with output
      - Conversion rate: raw-material-to-finished-product efficiency

## Caching strategy
- Cache key includes:
  - fixed cost
  - variable cost per unit
  - selling price per unit
- Behavior:
  - Fresh run: compute -> cache -> display
  - Cached hit: reuse -> skip recompute
  - On successful finalize/save: cache invalidated
  - On session end: cache naturally expires

## AI integration
- `promptDataGathering.md` defines strict structured signal gathering output.
- `promptAI.md` defines strict structured forecasting output.
- AI تدخل (intervenes) after break-even, before procurement.
- Forecast output includes low/expected/high demand and production recommendation.

## Supabase write policy
- Backend accepts finalized payload only.
- Required payload parts:
  - break-even metrics
  - cost model
  - forecast result
  - procurement decisions
- Persistence includes:
  - `pipeline_version`
  - `created_at`
  - audit event rows in `pipeline_audit_logs`

## Developer flow
1. User enters financial and operational inputs on frontend.
2. Frontend computes break-even asynchronously via `useBreakEven`.
3. Frontend requests forecast via `useForecast` and `/api/forecast`.
4. Frontend sends finalized payload to `/api/pipeline/run`.
5. Backend runs deterministic procurement->production->projection.
6. Backend saves finalized run + audit log to Supabase.
7. Analytics page reads historical finalized runs.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
      - `ALLOWED_GOOGLE_EMAILS` (comma-separated allowed Google emails)
3. Run SQL in Supabase:
   - `supabase/schema.sql`
4. Start local server:
   ```bash
   npm run dev
   ```

## Local first, deploy later
1. Build and validate flow locally first (`/login` -> `/auth/verify` -> dashboard).
2. After local acceptance, deploy to Vercel.
3. In Vercel, add the same environment variables from `.env.local`.
