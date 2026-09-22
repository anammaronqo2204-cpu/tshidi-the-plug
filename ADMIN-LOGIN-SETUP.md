# Admin login setup

Admin login used to run on Firebase Authentication. It now runs on two environment
variables only you control — no third-party account, so nobody else can ever lock you
out of your own site again.

## 1. Set the two required variables

In Netlify: **Site settings → Environment variables → Add a variable**, twice:

- `ADMIN_PASSWORD` — whatever password you want to log into `/admin` with.
- `ADMIN_SESSION_SECRET` — any long random string. It's never shown to anyone and you
  never need to type it in — it's only used behind the scenes to make sure nobody can
  forge a login session. Generate one with:
  ```
  openssl rand -hex 32
  ```
  (or just mash the keyboard for 40+ random characters — it doesn't need to be
  memorable, just long and not reused anywhere else).

Set both locally too, in `.env.local`, if you ever run the site on your own computer.

## 2. Redeploy

Trigger a new deploy (pushing to GitHub does this automatically if it's connected, or
use "Trigger deploy" in Netlify) so the site picks up the new variables.

## 3. Log in

Go to `yoursite.com/login` and enter the password you set as `ADMIN_PASSWORD`.

## Changing your password later

Update `ADMIN_PASSWORD` in Netlify's environment variables and redeploy. That's it —
no console, no account recovery, no email reset flow to get stuck on.

## Never change `ADMIN_SESSION_SECRET` once it's set

Changing it invalidates every current login session (everyone gets logged out) — that's
harmless, just log back in — but there's no reason to rotate it unless you think it's
been leaked.
