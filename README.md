# N.E.W Procurement Intelligence

A private business analysis tool for N.E.W organization staff. Tracks daily sales, calculates break-even, generates procurement recommendations, and stores history.

Access is restricted to authorized Google accounts only.

---

## What It Does

- **8-step daily workflow**: enter costs and products once, then come back each day to enter sales and run the analysis
- **Break-even calculation**: automatically figures out how many units need to be sold to cover all costs
- **AI-assisted forecast**: generates low / expected / high demand estimates before procurement decisions
- **Procurement and production planning**: derives what to order and how much to produce from the forecast
- **Saves finalized records** to Supabase with full audit logging (every save and delete is tracked)
- **Analytics page**: shows historical records so trends can be tracked over time
- **Lock mode**: prevents accidental edits to setup data (Steps 1–2 and the Materials page) while entering daily numbers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + React 18 |
| Backend | Next.js Route Handlers |
| Database | Supabase (Postgres + Auth) |
| Hosting | Vercel |
| Animations | GSAP |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ALLOWED_GOOGLE_EMAILS=user@example.com,other@example.com
```

`ALLOWED_GOOGLE_EMAILS` is a comma-separated list. Only these accounts can log in.

### 3. Run the database schema

In your Supabase SQL editor, run:

```
supabase/schema.sql
```

### 4. Start local development

```bash
npm run dev
```

---

## Access Control

- Login at `/login` using Google OAuth (via Supabase Auth)
- Only accounts in `ALLOWED_GOOGLE_EMAILS` can access the app
- Unauthorized accounts are shown an error and redirected back to login

---

## Data Pipeline

```
User inputs (frontend)
  → Break-even calculation (client-side, cached in sessionStorage)
  → AI Forecast request  (/api/forecast)
  → Procurement Engine   (server-side, deterministic)
  → Production Engine    (server-side, deterministic)
  → Save + Audit Log     (/api/pipeline/run → Supabase)
```

Only finalized payloads are written to the database. The pipeline requires:
- Break-even metrics
- Cost model
- Forecast result
- Procurement decisions

---

## Caching

Break-even is computed client-side and cached in `sessionStorage`. The cache key is based on fixed cost, variable cost per unit, and selling price. The cache is invalidated when a record is saved.

---

## Deployment

1. Push to GitHub
2. Connect the repo to [Vercel](https://vercel.com)
3. Add the same environment variables from `.env.local` in the Vercel dashboard
4. Deploy

---

## Project Structure

```
app/                    Next.js pages (App Router)
  ├── page.tsx          Business analysis workspace (home)
  ├── analytics/        Historical records view
  ├── materials/        Material requirements setup
  ├── logs/             Audit log viewer
  ├── guide/            Plain-language user guide
  ├── about/            Technical project overview
  └── api/              Route handlers (forecast, pipeline, auth, etc.)

components/
  ├── SharedPageHeader.tsx            Shared nav used across all pages
  └── workspaces/
      ├── business-analysis/          8-step analysis wizard
      ├── analytics/                  Analytics workspace
      ├── materials/                  Materials workspace
      └── LogsWorkspace.tsx           Logs workspace
```
