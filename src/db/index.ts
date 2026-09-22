import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { bootstrapStatements } from "./bootstrap";

// Netlify's own built-in database (Netlify DB, built on Neon) injects its connection
// string under NETLIFY_DATABASE_URL, not DATABASE_URL. Different Postgres add-ons use
// different names, so we check every name we might plausibly get instead of guessing one.
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DB_URL;

if (!databaseUrl) {
  // Don't throw here — this module is imported while Next.js collects page data during
  // `next build`, which runs before deploy-time env vars are guaranteed to be present.
  // Throwing at import time crashes the build itself. We let the Pool fail naturally the
  // first time a query actually runs instead.
  console.warn(
    "[db] No database connection string found (checked DATABASE_URL, NETLIFY_DATABASE_URL, NETLIFY_DB_URL) — database calls will fail at runtime.",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaRawQuery?: Pool["query"];
  __arenaSchemaReady?: Promise<void>;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    // Serverless: every function instance has its own pool, so keep each one small
    // (many instances x default 10 connections can exhaust a small hosted database).
    max: 5,
    idleTimeoutMillis: 20_000,
    // If the database can't be reached, fail after 15s with a real error instead of
    // hanging forever — a hung query is what makes an admin button look "dead".
    connectionTimeoutMillis: 15_000,
  });

globalForDb.__arenaNextJsPostgresqlPool = pool;

// Remember the ORIGINAL pool.query exactly once, so a module re-evaluation (dev hot
// reload) doesn't wrap the already-wrapped function again and stack up extra layers.
if (!globalForDb.__arenaRawQuery) {
  globalForDb.__arenaRawQuery = pool.query.bind(pool) as Pool["query"];
}
const rawQuery = globalForDb.__arenaRawQuery as (...a: unknown[]) => Promise<QueryResult<QueryResultRow>>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates every table (IF NOT EXISTS) the app needs. Runs once per server process,
 * memoized on globalThis so serverless cold starts don't re-run it needlessly and
 * concurrent requests on the same cold start all await the same promise instead of
 * racing to create tables at once.
 *
 * All statements are sent as ONE multi-statement query (a single round trip instead of
 * one per table), which noticeably shortens every cold start. If two cold instances
 * happen to create the same table at the very same moment Postgres can reject one of
 * them, so a couple of quick retries are built in.
 */
function ensureSchema(): Promise<void> {
  if (!globalForDb.__arenaSchemaReady) {
    globalForDb.__arenaSchemaReady = (async () => {
      const script = bootstrapStatements.join(";\n");
      let lastError: unknown;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Use rawQuery directly (not the wrapped pool.query below) to avoid recursing
          // back into ensureSchema while ensureSchema itself is still running.
          await rawQuery(script);
          return;
        } catch (error) {
          lastError = error;
          await sleep(200 * attempt);
        }
      }
      throw lastError;
    })().catch((error) => {
      // Reset so the next request can retry, instead of permanently caching a failure.
      globalForDb.__arenaSchemaReady = undefined;
      throw error;
    });
  }
  return globalForDb.__arenaSchemaReady;
}

// Wrap pool.query so literally every query — from any page, layout, or server action,
// no matter which one happens to run first — waits for tables to exist first. This
// closes the race between Next.js rendering the layout and the page in parallel.
// Only wrapped once per process (see __arenaRawQuery above).
const wrappedMarker = "__arenaWrapped" as const;
const poolWithMarker = pool as Pool & { [wrappedMarker]?: boolean };
if (!poolWithMarker[wrappedMarker]) {
  poolWithMarker[wrappedMarker] = true;
  (pool.query as any) = async (...args: unknown[]) => {
    await ensureSchema();
    return rawQuery(...args);
  };
}

export const db = drizzle(pool);
