# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (from repo root)
npm run dev           # Start Express (port 3001) + Vite (port 5173) concurrently
npm run dev:server    # Express only
npm run dev:client    # Vite only

# Database
npm run init-db       # Idempotent table creation (safe to re-run)
npm run seed          # Import ~2,400 cat foods from Open Pet Food Facts (skips if >100 products exist; pass --force to override)

# Client (from client/)
npm run lint          # ESLint
npm run build         # Production build → client/dist/
```

There are no automated tests.

## Architecture

**Stack**: Express.js backend + React 19 SPA, deployed on Vercel (serverless). Database is Neon Postgres. Images stored in Vercel Blob.

**Dual entry points for the Express app**:
- `server/index.js` — local dev server, listens on port 3001
- `api/index.js` — Vercel serverless handler; both import from `server/app.js`

**Vercel routing** (`vercel.json`): all `/api/*` requests go to `api/index.js`; everything else serves `client/dist/`.

**Vite proxy** (`client/vite.config.js`): `/api` → `http://localhost:3001` during local dev, so client code never needs to change between environments.

## Database

Raw SQL via `@neondatabase/serverless` tagged template literals — no ORM:
```js
const rows = await sql`SELECT * FROM cats WHERE id = ${id}`;
```

Schema is in `server/db/schema.sql`; run `npm run init-db` to apply it (uses `CREATE TABLE IF NOT EXISTS`).

Four tables: `cats`, `food_products` (global catalog), `food_preferences` (per-cat ratings with `status`: `liked` / `disliked` / `neutral`), `settings` (key-value, currently unused).

## API

All routes are in `server/routes/`. Key non-obvious endpoint:

- `GET /api/search/foods` — smart search that unions `food_products` and `food_preferences`, deduplicates by `brand|product`, and ranks results by match position, completeness, image presence, then alphabetically. Returns top 25.
- `POST /api/upload/image` — mints a Vercel Blob client upload token; the client uploads directly to Blob to bypass Vercel's 4.5MB serverless body limit.

## Client

`client/src/api.js` is the centralized fetch wrapper — all API calls go through it. It handles JSON parsing and throws on non-2xx (except 204, returned as `null`).

Routes are defined in `client/src/App.jsx` using React Router v7. Pages live in `client/src/pages/`, shared UI in `client/src/components/`.

## Environment Variables

Required in `.env` (see `.env.example`):
- `DATABASE_URL` — Neon Postgres connection string
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token (only needed for image uploads)
