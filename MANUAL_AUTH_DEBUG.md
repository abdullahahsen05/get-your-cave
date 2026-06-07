# Auth / Login Debug Guide
**Recommended: use `http://localhost:3000` for the browser (not ngrok)**

---

## Step 0 — Use localhost for the browser

**The recommended testing mode:**

1. Open `http://localhost:3000/login` in your browser
2. Login and do the entire flow through `http://localhost:3000`
3. ngrok is only needed as a webhook receiver for Stripe — never for the browser

Why: auth cookies are domain-specific. Logging in at `localhost:3000` sets a cookie for
`localhost`. If Stripe then redirects to `ngrok-free.dev`, the browser does not send the
`localhost` cookie there — you appear logged out. Keep everything on localhost.

If you previously tested on ngrok and have stale state, open a fresh Incognito window.

---

## Step 1 — Use the debug endpoint to confirm auth state

After clicking Sign In, open a new tab and visit:

```
https://muppet-backache-move.ngrok-free.dev/api/debug/auth-state
```

Expected response after successful login:

```json
{
  "hasCookie": true,
  "userResolved": true,
  "userRole": "ADMIN",
  "userStatus": "ACTIVE",
  "host": "muppet-backache-move.ngrok-free.dev",
  "appUrl": "https://muppet-backache-move.ngrok-free.dev",
  "nodeEnv": "development"
}
```

If you see `"hasCookie": false` — the cookie was never set. See Step 3.
If you see `"hasCookie": true, "userResolved": false` — cookie exists but JWT verify failed. See Step 4.
If you see `"userResolved": true` but you're still on the login page — the redirect is being cancelled. See Step 5.

---

## Step 2 — Check DevTools Network tab

1. Open DevTools (F12) → Network tab
2. On the login page, enter credentials and click Sign In
3. Look for the `login` request in the Network tab

**Check `/api/auth/login` response:**
- Status: should be `200`
- Response body: should contain `"requiresTwoFactor": false` and `"user": {...}`
- Response headers: should contain `Set-Cookie: gyc_auth_token=...`

If status is `401` — wrong email/password. Check that the admin was seeded:
```
node prisma/seed-admin.js --yes
```
Then retry with `admin@getyourcave.com` / `Password123!`

If status is `200` but no `Set-Cookie` header — the route is not setting the cookie. This is a server bug.

If status is `200` with `Set-Cookie` but login still fails — see Step 3.

---

## Step 3 — Check DevTools Application tab for cookies

1. DevTools → Application → Cookies → `https://muppet-backache-move.ngrok-free.dev`
2. After login, you should see: `gyc_auth_token` with a long JWT value

If the cookie is **not there** after a `200` login response:
- The browser rejected the cookie. This would be unusual but can happen with browser extensions or strict cookie settings.
- Try in incognito with extensions disabled.
- The `Set-Cookie` response should look like:
  ```
  gyc_auth_token=<jwt>; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax
  ```
  Note: no `Secure` flag in dev mode. Browsers accept non-Secure cookies over HTTPS.

---

## Step 4 — Check if JWT verification fails

If `hasCookie: true` but `userResolved: false` from the debug endpoint, the JWT is being rejected during verification. This means:
- `AUTH_SECRET` env var changed between when the token was signed and when it's verified
- The token was signed with one secret and verified with another (shouldn't happen in the same session)

Fix: log out, clear cookies, log in again. If still failing, check `.env` for `AUTH_SECRET` consistency.

---

## Step 5 — Confirm the redirect destination

If `userResolved: true` from the debug endpoint but login still sends you back to `/login`:

The login page calls `router.replace(resolveDestination(user))`. The destination is:
- ADMIN with ACTIVE status → `/admin/dashboard`
- OWNER/RENTER with ACTIVE status → `/owner/dashboard` or `/renter/dashboard`
- OWNER/RENTER with PENDING_VERIFICATION status → `/document`

Then `/admin/dashboard` has a server guard:
```javascript
if (!currentUser) redirect("/login?next=/admin/dashboard");
```

If the redirect is happening, it means the SERVER can't find the cookie when rendering the dashboard. This is the stale-browser-state issue — use incognito.

---

## Step 6 — Confirm server is running updated code

After any code change, the Next.js dev server hot-reloads pages automatically. But if the server process was killed and restarted, confirm it's using the right env:

```
NODE_ENV=development npx tsx server.ts
```

Confirm output: `> Server listening at http://0.0.0.0:3000 as development`

---

## Step 7 — Seed the admin account if missing

```
node prisma/seed-admin.js --yes
```

Then:
```
Email:    admin@getyourcave.com
Password: Password123!
```

---

## Common Error Table

| Symptom | Cause | Fix |
|---|---|---|
| Login page stays the same after clicking Sign In | `router.refresh()` cancelled navigation | Fixed in code — update was applied in this session |
| Redirected to `/login` immediately after dashboard loads | Server can't read auth cookie | Use incognito, login at ngrok URL only |
| `hasCookie: false` in debug endpoint after login | Cookie wasn't set (rare) | Check Network → `Set-Cookie` header; try incognito |
| `hasCookie: true, userResolved: false` | JWT verification failed | Re-login in fresh incognito session |
| Language toggle freezes | `router.refresh()` was blocking | Fixed in code — LanguageSwitcher no longer calls router.refresh() |
| `401` from `/api/auth/login` | Wrong password or user doesn't exist | Re-seed admin: `node prisma/seed-admin.js --yes` |
| `500` from `/api/auth/login` | SMTP error during 2FA email (only in production) | Dev mode has 2FA disabled — should not hit this |

---

## What the fixes address

The root cause of all navigation bugs was: **`router.refresh()` called immediately after `router.replace()` cancels the navigation** in Next.js App Router. This affected:

| File | Bug | Fix |
|---|---|---|
| `app/login/page.tsx` | `router.replace + router.refresh()` after login | Removed `router.refresh()` |
| `app/signup/page.tsx` | Same | Removed `router.refresh()` |
| `components/layout/LogoutButton.tsx` | Same | Removed `router.refresh()` |
| `components/layout/UserMenu.tsx` | Same | Removed `router.refresh()` |
| `components/layout/LanguageSwitcher.tsx` | `router.refresh()` causing slow re-renders | Removed entirely — `i18n.changeLanguage()` is sufficient |
