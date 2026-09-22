# Deploying to Netlify

## What was breaking the build

`src/db/index.ts` threw an error at **import time** if `DATABASE_URL` wasn't
set. Next.js imports every route module during `next build` to collect page
data — before deploy-time env vars are necessarily wired up. That throw
crashed the entire build. Fixed: it now just logs a warning, and only fails
for real if a database call actually runs.

Also included, all standard requirements for a Next.js app router project to
build cleanly on Netlify:

- `netlify.toml` — tells Netlify to use `@netlify/plugin-nextjs`, the
  official adapter for app router, API routes, and server actions.
- `.nvmrc` / `engines.node` — pins Node 20.
- `.env.example` and `.gitignore` — so secrets don't get committed.

## The database is now fully self-setting-up

Two more things are fixed so you never have to touch a database dashboard
or run a terminal command again after this:

1. **`src/db/index.ts` checks every connection-string name Netlify might
   give you** — `DATABASE_URL`, `NETLIFY_DATABASE_URL`, or `NETLIFY_DB_URL`
   — instead of only one exact name. If you used Netlify's own built-in
   "Database" tab to provision Postgres, this now picks it up automatically.
2. **`src/db/bootstrap.ts` + the wrapped pool in `src/db/index.ts`**: the
   very first database query of any kind, from any page, now creates every
   table it needs first (`CREATE TABLE IF NOT EXISTS…`), before running.
   You do **not** need to run `drizzle-kit push` or any migration command —
   deploying is enough. Demo data still seeds itself on first load
   (`src/db/seed.ts`), same as before.

## What you need to do in the Netlify dashboard

1. **Push this project to a GitHub/GitLab repo** and connect it in Netlify
   ("Add new site" → "Import an existing project") — or keep using drag-and-
   drop deploys if you're not on Git.
2. Netlify auto-detects the build command from `netlify.toml`.
3. **Make sure a Postgres database is attached to the site**, by either:
   - Using Netlify's own **Database** tab (Project → Database → provision)
     — no external signup, and no env var to set by hand; Netlify wires up
     `NETLIFY_DATABASE_URL` for you, and this app now reads it automatically.
   - Or an external Postgres (e.g. [Neon](https://neon.tech),
     [Supabase](https://supabase.com)) — in that case, add it as
     `DATABASE_URL` under Site settings → Environment variables.
4. Deploy. That's it — tables and demo data create themselves on first
   request.

## If you already have a Netlify-provisioned database

Check Site settings → Environment variables. If you see a variable named
`NETLIFY_DATABASE_URL` (or similar) already listed against your site, you
don't need to do anything else — this build will pick it up. If you don't
see one there yet, open the Database tab in your Netlify project and look
for a "connect to site" / "link" action so its connection string gets
exposed to your deploys as an environment variable.
