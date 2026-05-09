# Deploying to Vercel

This app uses **Neon Postgres** (database) and **Vercel Blob** (image storage), both with generous free tiers.

## One-time setup

### 1. Create the Neon database
1. Sign up at https://neon.tech (free, no credit card)
2. Create a project — pick any name, default region is fine
3. Copy the **pooled connection string** from the project dashboard (looks like `postgres://user:pwd@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`)

### 2. Push this code to GitHub
Create a new GitHub repo and push this folder. Vercel deploys from a Git remote.

### 3. Create the Vercel project
1. Sign up at https://vercel.com (free, can use GitHub login)
2. **Add New… → Project**, import the GitHub repo
3. Vercel auto-detects the build via `vercel.json` — leave defaults
4. Before deploying, click **Environment Variables** and add:
   - `DATABASE_URL` = your Neon pooled connection string
5. Click **Deploy**. The first deploy will fail at runtime (no Blob token yet) — that's OK, fix it next.

### 4. Provision Vercel Blob
1. In your Vercel project: **Storage → Create Database → Blob**
2. Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your project's env vars
3. Trigger a redeploy (push a commit, or **Deployments → … → Redeploy**)

### 5. Initialize the database schema
From your local machine (with `.env` set up — see `.env.example`):
```bash
npm install
npm run init-db
```
This creates the tables in your Neon DB.

### 6. Seed the cat food catalog
```bash
npm run seed
```
This downloads ~2,400 entries from Open Pet Food Facts and inserts them into your Neon DB. Takes a couple minutes. Run this once; pass `--force` to reseed.

### 7. Visit the app
Your URL is `https://<project-name>.vercel.app`. You can rename the project in Vercel Settings to get a shorter URL like `https://catfoodtracker.vercel.app` (if available).

---

## Local development

Set up a `.env` (copy from `.env.example`) — point both vars at the same Neon DB / Blob store you use in production, or use separate ones.

```bash
npm install
npm run dev          # starts both server (3001) and client (5173)
```

Open http://localhost:5173

---

## Updating after changes

Push to GitHub. Vercel auto-deploys on push to the default branch.

If you change the schema:
1. Edit `server/db/schema.sql`
2. Run `npm run init-db` (idempotent — uses `CREATE TABLE IF NOT EXISTS`)
3. For destructive changes, add explicit migration SQL to a new script

---

## Troubleshooting

- **App loads but API calls 500**: check Vercel project logs — usually a missing `DATABASE_URL` or `BLOB_READ_WRITE_TOKEN`.
- **Image upload fails**: confirm `BLOB_READ_WRITE_TOKEN` is set in Vercel env vars; the `/api/upload/image` endpoint will return a clear error if it's missing.
- **Database is empty**: you forgot `npm run init-db` or `npm run seed`.
- **Cold start latency**: free Vercel functions have ~1-3s cold start. Hot requests are fast.
