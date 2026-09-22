import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "tshidi_admin_session";

// 12 hours — same session length as before.
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12;
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000;

// Admin login is a single shared password, not per-person accounts — set once as an
// env var only you control (Netlify -> Site settings -> Environment variables), so
// there's no third-party account (Firebase or otherwise) anyone else can lock you out
// of. Both of these are REQUIRED in every environment:
//   ADMIN_PASSWORD        — whatever password you want to log in with
//   ADMIN_SESSION_SECRET  — any long random string, used only to sign session cookies
//                            so they can't be forged. Doesn't need to be memorable —
//                            generate one with `openssl rand -hex 32` and never share it.
// To change the password later: update ADMIN_PASSWORD in Netlify and redeploy (or just
// trigger "Clear cache and deploy" — no code change needed).

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set. Add it to your environment variables — see .env.example.",
    );
  }
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Builds a signed, tamper-proof session cookie value: "<expiryMs>.<hmac>". */
export function createSessionValue(): string {
  const expires = Date.now() + SESSION_MAX_AGE_MS;
  return `${expires}.${sign(String(expires))}`;
}

function isValidSession(value: string): boolean {
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature) return false;
  if (!timingSafeEqualHex(signature, sign(expiresAt))) return false;
  return Number(expiresAt) > Date.now();
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  const session = store.get(ADMIN_COOKIE)?.value;
  if (!session) return false;
  try {
    return isValidSession(session);
  } catch {
    // Missing ADMIN_SESSION_SECRET, malformed cookie, etc.
    return false;
  }
}

export async function requireAdmin() {
  if (!(await isAdminAuthed())) redirect("/login");
}

/** Constant-time comparison of the submitted password against ADMIN_PASSWORD. */
export function checkAdminPassword(candidate: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || !candidate) return false;
  const a = crypto.createHash("sha256").update(candidate).digest("hex");
  const b = crypto.createHash("sha256").update(real).digest("hex");
  return timingSafeEqualHex(a, b);
}
