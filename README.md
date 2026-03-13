# Denver Live Music

A full-stack web app that aggregates every live music event in the Denver metro area — from Ball Arena down to Lion's Lair — into a single, filterable calendar.

**Live:** https://denverlivemusic.netlify.app

## Features

- Browse all upcoming shows across 25+ Denver venues
- Filter by venue, artist name, date range, and neighborhood
- URL-driven filters (shareable, bookmarkable)
- Individual venue pages with upcoming events
- User accounts with followed venues and artists
- Nightly automated sync from Ticketmaster & Bandsintown APIs
- Weekly newsletter preferences (coming soon)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database & Auth | Supabase (Postgres + Auth) |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Date handling | date-fns |
| Deployment | Netlify + @netlify/plugin-nextjs |
| Data sources | Ticketmaster Discovery API, Bandsintown API |
| Scheduled jobs | Netlify Scheduled Functions |

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) account (free tier works)
- A [Ticketmaster Developer](https://developer.ticketmaster.com) account
- A [Bandsintown](https://artists.bandsintown.com/bandsintown-api) app name

### 1. Clone the repo

```bash
git clone https://github.com/your-username/denver-live-music.git
cd denver-live-music
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values (see [Environment Variables](#environment-variables) below).

### 4. Set up Supabase

1. Create a new Supabase project at https://app.supabase.com
2. Go to **SQL Editor** and run the migration:
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run it in the SQL Editor
3. Run the seed data:
   - Copy the contents of `supabase/seed.sql`
   - Paste and run it in the SQL Editor
4. Copy your project URL and keys from **Project Settings > API** into `.env.local`

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app will redirect to `/events`.

Since no events are in the database yet, run the sync (see below) or add test data via the Supabase dashboard.

---

## Getting API Keys

### Ticketmaster

1. Go to https://developer.ticketmaster.com
2. Sign up and create an app
3. Copy your **Consumer Key** — this is your `TICKETMASTER_API_KEY`

### Bandsintown

1. Bandsintown uses an `app_id` parameter (not an OAuth key)
2. Set `BANDSINTOWN_APP_ID` to any string identifying your app, e.g. `denver-live-music`
3. For production use, register at https://artists.bandsintown.com/bandsintown-api

---

## Running a Manual Sync

The sync fetches all upcoming events from Ticketmaster and Bandsintown for the Denver metro area and upserts them into your database.

### Via npm script (local)

```bash
npm run sync
```

### Via API endpoint

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "x-sync-secret: your-SYNC_SECRET-value"
```

The endpoint returns a JSON summary of events upserted and any errors.

---

## How the Sync Scheduler Works

The nightly sync is implemented as a **Netlify Scheduled Function** in `netlify/functions/sync-events.ts`.

- **Schedule:** `0 4 * * *` — runs every day at 4:00 AM UTC (10:00 PM Mountain Time)
- **What it does:** Calls `runFullSync()` which:
  1. Fetches all music events within 30 miles of Denver from the Ticketmaster API (up to 1,000 events)
  2. Fetches upcoming events from Bandsintown for each venue using the `bandsintown` strategy
  3. Matches events to our venue records via Ticketmaster venue IDs or fuzzy name matching
  4. Upserts events using `UNIQUE(external_id, source)` for deduplication
  5. Logs a summary of events upserted, skipped, and any errors

On Netlify, this function runs automatically. You can also trigger it manually from the Netlify dashboard under **Functions**.

---

## Deploying to Netlify

### 1. Push to GitHub

```bash
git remote add origin https://github.com/your-username/denver-live-music.git
git push -u origin main
```

### 2. Import to Netlify

1. Go to https://app.netlify.com
2. Click **Add new site > Import an existing project**
3. Connect your GitHub repository
4. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `.next`

### 3. Add environment variables

In Netlify dashboard: **Site settings > Environment variables**, add all variables from `.env.local.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TICKETMASTER_API_KEY`
- `BANDSINTOWN_APP_ID`
- `NEXT_PUBLIC_SITE_URL` (set to your Netlify URL)
- `SYNC_SECRET`

### 4. Configure Supabase Auth redirect URLs

In Supabase dashboard: **Authentication > URL Configuration**, add:
- Site URL: `https://your-site.netlify.app`
- Redirect URLs: `https://your-site.netlify.app/auth/callback`

### 5. Deploy

Netlify will automatically build and deploy on every push to main.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Yes |
| `TICKETMASTER_API_KEY` | Ticketmaster Discovery API key | Yes |
| `BANDSINTOWN_APP_ID` | Bandsintown app identifier string | Yes |
| `NEXT_PUBLIC_SITE_URL` | Your deployed site URL (no trailing slash) | Yes |
| `SYNC_SECRET` | Random secret to protect the `/api/sync` endpoint | Yes |

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security and must **never** be exposed to the browser. It is only used in server-side sync code.

---

## Project Structure

```
denver-live-music/
├── netlify/functions/
│   └── sync-events.ts          # Nightly scheduled sync function
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with Navbar
│   │   ├── page.tsx             # Redirects to /events
│   │   ├── events/page.tsx      # Main events calendar
│   │   ├── venues/
│   │   │   ├── page.tsx         # All venues grid
│   │   │   └── [slug]/page.tsx  # Individual venue page
│   │   ├── auth/                # Login, signup, OAuth callback
│   │   ├── account/             # User preferences (protected)
│   │   └── api/sync/route.ts    # Manual sync trigger endpoint
│   ├── components/              # Reusable UI components
│   ├── lib/
│   │   ├── supabase/            # Browser + server Supabase clients
│   │   ├── sync/                # Ticketmaster + Bandsintown sync engine
│   │   └── utils/               # Date formatting, slugify helpers
│   └── types/index.ts           # All shared TypeScript types
└── supabase/
    ├── migrations/001_initial_schema.sql
    └── seed.sql                 # 25 Denver venue seed data
```

---

## Contributing

Issues and PRs welcome! Please open an issue first to discuss significant changes.
