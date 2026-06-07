# GetYourCave — Codebase Analysis

---

## 1. Tech Stack & Framework Versions

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.2.5 |
| Runtime | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Database ORM | Prisma | ^7.8.0 |
| Database | PostgreSQL | (any, via `@prisma/adapter-pg`) |
| Auth | Custom HMAC-SHA256 JWT (no NextAuth) | — |
| Payments | Stripe (subscriptions + webhooks) | ^22.1.1 |
| Real-time | Socket.IO | ^4.8.3 |
| Styling | Tailwind CSS v4 | ^4 |
| Icons | Lucide React + Google Material Symbols | ^1.17.0 |
| Fonts | Manrope (Google Fonts) | — |
| Maps | React-Leaflet / Leaflet | ^5 / ^1.9.4 |
| i18n | react-i18next / i18next | ^17 / ^26 |
| Email | Nodemailer (SMTP) | ^8.0.10 |
| Contract gen | Docxtemplater + PizZip | ^3.68.7 / ^3.2.0 |
| Invoice gen | Custom PDF renderer (lib/invoices) | — |
| Server | Custom Node.js HTTP + Next.js handler (server.ts) | — |
| Dev runner | tsx watch | ^4.22.1 |

**Important:** The project uses a **custom Node.js server** (`server.ts`) that wraps Next.js and mounts the Socket.IO server on the same HTTP instance. It does **not** use the Next.js built-in `next start` command; it uses `tsx server.ts` for both dev and prod.

---

## 2. Project Structure

```
getyourcave/
├── app/                      # Next.js App Router pages and API routes
│   ├── page.tsx              # Public landing page
│   ├── layout.tsx            # Root layout (fonts, providers, AppChrome)
│   ├── globals.css           # Design tokens, global utility classes
│   ├── admin/                # Admin-only pages
│   ├── owner/                # Owner dashboard
│   ├── dashboard/            # Shared dashboard (contracts)
│   ├── storage/              # Public marketplace browsing
│   ├── create-listing/       # Owner listing creation
│   ├── invoices/             # Invoice management
│   ├── contracts/            # Contract management
│   ├── document/             # Verification document upload
│   ├── profile/              # User profile settings
│   ├── signup/               # Signup page
│   ├── forget_password_page/ # Forgot password page
│   ├── payments/             # Stripe success/cancel pages
│   └── api/                  # All API routes (see Section 4)
│
├── components/               # Reusable UI and page-level components
│   ├── layout/               # AppChrome, Topbar, Footer, Navigation, Notifications
│   ├── ui/                   # Primitives: Button, Card, Input, UserAvatar
│   ├── maps/                 # Leaflet map wrappers
│   ├── admin/                # Admin workspace components
│   ├── owner/                # Owner booking/listing action components
│   ├── renter/               # Renter booking action component
│   ├── invoices/             # Invoice workspace and detail
│   ├── contracts/            # Contracts workspace
│   ├── messages/             # Messaging workspace
│   ├── listings/             # Listing detail page component
│   ├── document/             # Verification document workspace
│   ├── profile/              # Profile settings workspace
│   └── providers/            # I18nProvider, NotificationsProvider
│
├── lib/                      # Business logic and shared utilities
│   ├── auth.ts               # JWT creation/verification, getCurrentUser, password hashing
│   ├── auth-routing.ts       # Role-based dashboard path helpers
│   ├── prisma.ts             # Prisma client singleton
│   ├── stripe.ts             # Stripe client + metadata helpers
│   ├── email.ts              # Nodemailer email senders
│   ├── uploads.ts            # File storage paths + helpers (local disk)
│   ├── notifications.ts      # createNotificationForUser
│   ├── messages.ts           # createConversationMessage, markConversationRead
│   ├── bookings.ts           # Booking business logic helpers
│   ├── listings.ts           # Listing query helpers
│   ├── marketplace-split.ts  # Platform commission calculation (20%/80%)
│   ├── contracts/            # Contract generation (Docxtemplater)
│   ├── invoices/             # Invoice generation + PDF rendering
│   ├── payments/             # Stripe session finalization helpers
│   ├── dashboard/            # Owner, renter, revenue dashboard aggregations
│   ├── socket/               # Socket.IO server + event constants
│   ├── validations/          # Zod-style schemas (auth, listing, booking, message)
│   ├── i18n.ts               # i18next client setup
│   ├── i18n.server.ts        # Server-side locale resolution
│   ├── geo.ts                # Geocoding helper
│   ├── admin.ts / admin-shared.ts # Admin log helpers
│   ├── csv.ts                # CSV export
│   └── units.ts / storage-types.ts / verification-types.ts # Label helpers
│
├── prisma/
│   ├── schema.prisma         # Full database schema
│   ├── migrations/           # 9 migration files (2026-05-16 → 2026-05-31)
│   ├── seed-admin.js         # Seeds an ADMIN user
│   └── seed-demo.ts          # Seeds demo data
│
├── locales/
│   ├── en/common.json        # English translations
│   └── fr/common.json        # French translations (default)
│
├── server.ts                 # Custom HTTP server entry point
├── next.config.ts            # (empty, no customizations)
├── .env / .env.example       # Environment variables
├── prisma.config.js          # Prisma config
└── proxy.ts                  # (exists but unused / not integrated)
```

---

## 3. Frontend Routes & Pages

| Route | File | Purpose | Auth Required |
|---|---|---|---|
| `/` | `app/page.tsx` | Public landing page — hero, featured listings, simulator, testimonials | No |
| `/signup` | `app/signup/page.tsx` | User registration | No |
| `/forget_password_page` | `app/forget_password_page/page.tsx` | Forgot password flow | No |
| `/storage` | `app/storage/page.tsx` | Public marketplace listing search | No |
| `/storage/[id]` | `app/storage/[id]/page.tsx` | Individual listing detail page | No |
| `/storage/listing-details` | `app/storage/listing-details/page.tsx` | Alternate listing detail view | No |
| `/create-listing` | `app/create-listing/page.tsx` | Create a new storage listing | OWNER |
| `/owner/dashboard` | `app/owner/dashboard/page.tsx` | Owner dashboard — bookings, revenue, listings | OWNER |
| `/dashboard/contracts` | `app/dashboard/contracts/page.tsx` | Contract management for all roles | Auth |
| `/contracts` | `app/contracts/page.tsx` | Contracts list / workspace | Auth |
| `/invoices` | `app/invoices/page.tsx` | Invoice list | Auth |
| `/invoices/[id]` | `app/invoices/[id]/page.tsx` | Invoice detail + payment | Auth |
| `/document` | `app/document/page.tsx` | Upload identity/ownership verification documents | Auth |
| `/profile` | `app/profile/page.tsx` | User profile settings | Auth |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | Admin overview dashboard | ADMIN |
| `/admin/users` | `app/admin/users/page.tsx` | Admin user management | ADMIN |
| `/payments/success` | `app/payments/success/page.tsx` | Stripe checkout success redirect | Auth |
| `/payments/cancel` | `app/payments/cancel/page.tsx` | Stripe checkout cancel redirect | Auth |

**Note:** There is no dedicated `/login` page file under `app/` — login is likely handled inside `AppChrome` or a modal. There is also no `/renter/dashboard` page file visible, which may be missing.

---

## 4. Backend/API Routes

### Auth
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login step 1 (returns challenge if 2FA enabled) |
| POST | `/api/auth/login/verify` | Login step 2 — OTP verification |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/session` | Return current user session |
| POST | `/api/auth/forgot-password` | Initiate password reset (sends email) |
| POST | `/api/auth/forgot-password/verify` | Verify reset token |
| POST | `/api/auth/forgot-password/reset` | Set new password |

### Listings
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/listings` | Public list of approved listings (with filters) |
| POST | `/api/listings` | Create listing (OWNER) |
| GET/PUT | `/api/listings/[id]` | Get or update listing |
| DELETE | `/api/listings/[id]/delete` | Delete listing |

### Bookings
| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/bookings` | List / create bookings |
| GET/PUT | `/api/bookings/[id]` | Get / update booking status |

### Owner
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/owner/dashboard` | Owner dashboard stats |
| GET | `/api/owner/bookings` | Owner's bookings list |
| GET | `/api/owner/listings` | Owner's listings |
| GET | `/api/owner/revenue` | Revenue stats |

### Renter
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/renter/dashboard` | Renter dashboard stats |
| GET | `/api/renter/bookings` | Renter's booking history |

### Payments
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/payments/checkout` | Create Stripe checkout session (subscription mode) |
| POST | `/api/payments/webhook` | Stripe webhook handler |
| GET | `/api/payments/export` | CSV export of payments |

### Invoices
| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/invoices` | List / create invoices |
| GET/PUT | `/api/invoices/[id]` | Get / update invoice |
| GET | `/api/invoices/[id]/pdf` | Download invoice PDF |
| GET | `/api/invoices/export` | CSV export |

### Contracts
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/contracts/generate` | Generate contract from booking (DOCX) |
| GET | `/api/contracts/[id]/download` | Download generated contract DOCX |
| POST | `/api/contracts/[id]/sign` | Sign a contract |

### Messaging
| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/messages/conversations` | List or create conversations |
| GET | `/api/messages/conversations/[id]` | Get conversation + messages |
| POST | `/api/messages/conversations/[id]/read` | Mark messages as read |
| POST | `/api/messages/attachments` | Upload file attachment |

### Admin
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/admin/dashboard` | Admin platform-wide stats |
| GET/POST | `/api/admin/users` | List users |
| GET/PUT/DELETE | `/api/admin/users/[id]` | Manage individual user |
| POST | `/api/admin/users/[id]/verify` | Verify a user |
| GET | `/api/admin/listings` | All listings |
| POST | `/api/admin/listings/[id]/approve` | Approve listing |
| POST | `/api/admin/listings/[id]/reject` | Reject listing |
| GET | `/api/admin/verifications` | Pending verification documents |
| POST | `/api/admin/verifications/[id]/approve` | Approve document |
| POST | `/api/admin/verifications/[id]/reject` | Reject document |
| GET | `/api/admin/revenue` | Platform-wide revenue |
| GET | `/api/admin/activity` | Admin activity log |

### Verification & Profile
| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/verification-documents` | List / upload verification docs |
| GET/DELETE | `/api/verification-documents/[id]` | Get / delete a document |
| POST | `/api/verification/submit` | Submit verification request |
| POST | `/api/uploads/verification-documents` | File upload endpoint |
| GET/PUT | `/api/profile` | Get / update user profile |
| POST | `/api/profile/avatar` | Upload avatar image |

### Other
| Method | Route | Purpose |
|---|---|---|
| GET/PUT/DELETE | `/api/notifications/[id]` | Get / mark-read / delete notification |
| GET | `/api/notifications` | List notifications |
| GET | `/api/geocode` | Geocode address via external service |

---

## 5. Integrations

### Database — PostgreSQL + Prisma
- Prisma v7 with `@prisma/adapter-pg` (driver adapter pattern)
- Connection string via `DATABASE_URL`
- 9 migrations from `2026-05-16` to `2026-05-31`
- Most recent migration (`20260531010000`) adds Stripe Connect fields, TemporaryDocument table, and new enum values — **but this migration has NOT been applied yet** (it is in the git untracked files list)

### Authentication
- **Fully custom** — no NextAuth or Lucia
- HS256 JWT stored as an `httpOnly` cookie named `gyc_auth_token` (7-day TTL)
- Two-factor login via OTP email (enabled in production only via `isLoginTwoFactorEnabled()`)
- Password hashing with bcryptjs (12 rounds)
- `LoginChallenge` table stores OTP hashes with 10-minute TTL and max 5 attempts
- `PasswordResetToken` table for forgot-password flows

### Payments — Stripe
- **Subscription mode** (not one-time checkout) — renter pays monthly recurring
- `card` and `sepa_debit` payment methods
- Platform commission: 20% of rental price, owner keeps 80% (see `lib/marketplace-split.ts`)
- Webhook at `/api/payments/webhook` handles `checkout.session.completed` and subscription events
- The most recent migration adds `stripeCustomerId`, `stripeConnectAccountId`, `stripeOnboardingComplete`, `stripePayoutsEnabled` columns to `User` — Stripe Connect for owner payouts is planned but the schema migration has not been applied

### Storage / File Uploads
- **Local disk only** — no S3 or cloud storage
- Files stored under `public/uploads/`:
  - `verification-documents/`
  - `messages/` (chat attachments)
  - `avatars/`
- All file names are UUID-randomized to prevent collisions
- Supported formats: PDF, JPEG, PNG for documents; JPEG, PNG, WEBP, GIF for images

### Email — Nodemailer
- SMTP-based (configured for Gmail app passwords by default)
- 4 email types: message notification, general notification, login OTP, password reset
- If SMTP env vars are absent, emails silently fail (returns `{ sent: false }`)

### Real-time — Socket.IO
- Runs on the same HTTP server as Next.js (not a separate process)
- Auth via `gyc_auth_token` cookie parsed from the Socket handshake
- Events: `join_conversation`, `leave_conversation`, `send_message`, `message_read`, `typing`, `stop_typing`, `notification_created`, `notifications_updated`
- Each user joins a personal room `user:{id}` and can join conversation rooms `conversation:{id}`

### Contracts — Docxtemplater
- Contracts generated as `.docx` files from Word template files stored in `docs/templates/`
- Generated files saved to `docs/generated/`
- 3 contract types: `LONG_TERM_RENTAL`, `SEASONAL_RENTAL`, `PLATFORM_INTRODUCTION`
- Type inferred from booking duration (months)
- Signatures stored as JSON inside the `GeneratedContract.contractData` field (not as separate DOCX annotations)

### i18n
- Supports French (`fr`) and English (`en`)
- Default locale is French
- Translation files in `locales/en/common.json` and `locales/fr/common.json`
- Client-side via `react-i18next`; server-side via `lib/i18n.server.ts`

### Maps — Leaflet
- Used for listing location display and address selection during listing creation
- Map components in `components/maps/`
- Geocoding via `/api/geocode` (implementation in `lib/geo.ts`)

---

## 6. Environment Variables

All required variables — copy from `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/getyourcave"
AUTH_SECRET="replace-with-a-long-random-secret"        # Required in production
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_APP_PASSWORD="your-gmail-app-password"
SMTP_FROM_EMAIL="GetYourCave <your-email@gmail.com>"
```

**Optional (not documented but used in code):**
- `PORT` — server port (default `3000`)
- `HOSTNAME` — bind hostname (default `0.0.0.0`)
- `NODE_ENV` — `development` or `production` (affects 2FA, secure cookies, fallback auth secret)

---

## 7. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up .env
cp .env.example .env
# Edit .env with your PostgreSQL connection, Stripe keys, and SMTP credentials

# 3. Run migrations
npx prisma migrate deploy

# 4. (Optional) Seed an admin user
npm run db:seed-admin

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

**For Stripe webhooks locally**, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

**Scripts:**
- `npm run dev` — starts Next.js + Socket.IO in watch mode via `tsx watch server.ts`
- `npm run build` — Next.js production build
- `npm run start` — production server
- `npm run db:seed-demo` — seed demo listings/bookings
- `npm run db:seed-admin` — seed an admin user
- `npm run db:reset` — reset database

---

## 8. User Roles & Permissions

Three roles defined in the `UserRole` enum:

| Role | Access |
|---|---|
| `ADMIN` | Full platform access; can approve/reject listings, users, documents; view all data; manage revenue |
| `OWNER` | Create and manage storage listings; view/respond to bookings; access earnings dashboard; sign contracts; generate invoices |
| `RENTER` | Browse listings; create bookings; pay via Stripe; view contracts and invoices; message owners |

**Account Statuses:** `ACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION`, `DELETED`

**Verification:**
- Both owners and renters have `verificationStatus` on their profile: `NOT_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED`
- Identity documents (ID card, passport) and proof-of-ownership are uploaded and reviewed by admins

**Role-based routing** (from `lib/auth-routing.ts`):
- ADMIN → `/admin/dashboard`
- OWNER → `/owner/dashboard`
- RENTER → `/renter/dashboard` (note: this page does not appear to exist as an `app/` file)

**2FA:** Enabled for all users in production. Controlled by `twoFactorEnabled` per-user flag AND `isLoginTwoFactorEnabled()` (production-only global toggle).

---

## 9. Data Models & Relationships

```
User
├── OwnerProfile (1:1)  — wallet, IBAN, Stripe Connect, verification
├── RenterProfile (1:1) — address, verification status
├── Notification[]
├── LoginChallenge[]
├── PasswordResetToken[]
└── VerificationDocument[]

OwnerProfile
├── Listing[]
├── Booking[] (as owner)
├── Contract[] (as owner)
└── Invoice[] (as owner)

Listing
├── ListingImage[]
├── ListingAmenity[] → Amenity[]
├── Booking[]
├── Review[]
├── Conversation[]
└── FavoriteListing[]

Booking
├── GeneratedContract (1:1)
├── Contract[]          ← legacy contract model (dual model situation)
├── Payment[]
├── Invoice[]
└── Conversation[]

GeneratedContract      ← primary contract model used in current code
├── ContractTemplate
└── signatures stored in contractData JSON

Contract               ← older/alternative model; partially used
├── ContractTemplate
├── ContractSignature[]
└── (owner, renter via OwnerProfile/RenterProfile)

Payment (1:1 optional with Invoice)

Invoice
├── InvoiceItem[]
├── Payment? (optional)
├── OwnerProfile?
└── RenterProfile?
```

**Commission model:** 20% platform, 80% owner. Calculated by `calculateMarketplaceSplit()` in `lib/marketplace-split.ts`.

---

## 10. UI/Theme Conventions

These conventions are consistent across the entire codebase and **must not be broken**:

### Color Palette
- **Primary (dark navy):** `#141b2d` / `#212733` — used for headings, primary buttons, dark backgrounds
- **Secondary (orange):** `#F26A1B` / `#f76b15` — used for CTAs, accents, badges, active states
- **Background:** `#f5f5f5` with a subtle orange radial gradient at the top
- **Surface:** `#ffffff` (cards)
- **Text:** `#232a3a` (primary), `#6b7280` (muted)
- **Border:** `#e6e7ea`

### Typography
- Font: **Manrope** (Google Fonts, weights 400–800)
- Icons: **Google Material Symbols Outlined** (variable font)
- Additional icons: **Lucide React**
- Type scale classes: `.font-h1`, `.font-h2`, `.font-h3`, `.font-display`, `.font-body-md`, `.font-body-sm`, `.font-body-lg`, `.font-label-caps`

### Component Conventions
- **Cards:** `rounded-[14px]` or `rounded-[20px]` on smaller cards; `2rem` border-radius via `.gyc-card`; `box-shadow: 0 4px 14px rgba(20,25,40,0.06)` pattern
- **Buttons:** Fully pill-shaped (`rounded-full`); primary = dark navy; accent = orange
- **Inputs:** Pill-shaped (`.gyc-input`)
- **Page shell:** `.page-shell` (max-width 1440px, auto margins) or `.section-shell` (max-width 1200px)
- **Footer:** Dark (`#181d28`) with large top border-radius (48px)

### Tailwind v4 Overrides
`globals.css` **overrides many standard Tailwind utility names** to use design tokens:
- `.rounded-lg` is redefined to `border-radius: 2rem` (not Tailwind's default `0.5rem`)
- `.rounded-xl` is redefined to `border-radius: 3rem`
- `.bg-white` is mapped to `var(--gyc-surface)` (not pure `#ffffff`)
- `.bg-stone-50/100/200` are mapped to custom surface containers
- This means any new component importing standard Tailwind classes will get the custom GYC values, not standard ones — **always verify actual rendered values**

---

## 11. Known Risks, Bugs & Incomplete Areas

### Critical
1. **Unapplied migration:** `prisma/migrations/20260531010000_add_stripe_connect_and_temporary_documents/` is listed as **untracked in git**, meaning `prisma migrate deploy` has likely NOT been run. This migration adds Stripe Connect columns to `User` and creates the `TemporaryDocument` table. The Prisma schema may be out of sync with the database.

2. **Missing `/renter/dashboard` page:** `lib/auth-routing.ts` routes renters to `/renter/dashboard` but there is no `app/renter/dashboard/page.tsx` in the file tree. Logged-in renters may hit a 404 after login.

3. **Dual Contract model:** There are two contract models — `GeneratedContract` (the current one used in all routes) and `Contract` (an older, more complex model with `ContractSignature` records). The `Contract` table still exists in the schema and is still referenced on `Booking`, creating confusion and potential inconsistency.

### Payment / Business Logic
4. **Stripe subscription vs. one-time:** Payments are set up as recurring **subscriptions** (not one-time charges), but the booking model supports `durationMonths`. It's unclear how subscription cancellation at end-of-term is handled — there is no cron job or subscription lifecycle management visible.

5. **Stripe Connect not wired up:** The most recent migration adds `stripeConnectAccountId` / `stripePayoutsEnabled` to `User`, but there is no API route or UI for onboarding owners onto Stripe Connect. Owner payouts appear to be tracked manually in `OwnerProfile.walletBalance` rather than through Stripe.

6. **`stripeAccountId` mismatch:** `OwnerProfile` has `stripeAccountId` (from the original schema) while the new migration adds `stripeConnectAccountId` to `User`. Two separate fields for what appears to be the same concept.

### Security
7. **Open CORS in Socket.IO:** `server.ts` sets `cors: { origin: true, credentials: true }`, which allows any origin. In production, this should be locked down to `NEXT_PUBLIC_APP_URL`.

8. **`AUTH_SECRET` fallback in dev:** If `AUTH_SECRET` is missing in development, it silently falls back to a hardcoded string. This is intentional but could be accidentally deployed to staging without the secret set.

9. **Local disk file storage:** All uploads (verification docs, avatars, chat files) are stored on the local server filesystem under `public/uploads/`. This is not horizontally scalable and files will be lost on server restart/deploy in containerized environments (e.g., Render, Railway, Heroku).

### UI / Incomplete Areas
10. **`proxy.ts` file exists but appears unused** — it's in the root but not imported anywhere.

11. **No `/login` page file:** The login UI is not a standalone route. It likely lives in a modal or `AppChrome` component, but it's not a proper page, which may cause issues with direct navigation or SEO.

12. **Leaflet CSS imported in `layout.tsx`** (`import "leaflet/dist/leaflet.css"`) which loads the CSS globally on every page, even non-map pages. This is harmless but slightly wasteful.

13. **`grenier-cave (1).html`** — a loose HTML file in the project root, likely a design mockup/reference. Should not be deployed.

14. **Revenue simulator on landing page uses hardcoded rates** — `rateMap` and city multipliers are hardcoded values, not pulled from the database. If pricing strategy changes, this needs a code update.

---

## 12. Where Client Changes Would Be Implemented

| Change Type | Location |
|---|---|
| Landing page copy / sections | `app/page.tsx` |
| Translation strings | `locales/en/common.json`, `locales/fr/common.json` |
| Brand colors / design tokens | `app/globals.css` (`:root` and `@theme inline` blocks) |
| Navigation items | `components/layout/navigation.ts` |
| Footer content | `components/layout/Footer.tsx` |
| Marketplace search / filters | `app/storage/page.tsx` + `app/api/listings/route.ts` |
| Listing detail page | `components/listings/ListingDetailPage.tsx` |
| Booking flow (new booking form) | `app/storage/[id]/page.tsx` or `ListingDetailPage.tsx` + `app/api/bookings/route.ts` |
| Payment flow / Stripe settings | `app/api/payments/checkout/route.ts`, `app/api/payments/webhook/route.ts` |
| Commission rate change | `lib/marketplace-split.ts` (`MARKETPLACE_COMMISSION_RATE`) |
| Contract templates | `docs/templates/` (DOCX files, not in repo visible area) + `lib/contracts/` |
| Invoice PDF layout | `lib/invoices/renderInvoicePdf.ts` |
| Email templates | `lib/email.ts` (inline HTML strings) |
| Admin user management | `components/admin/AdminUsersWorkspace.tsx` + `app/api/admin/users/` |
| Admin dashboard metrics | `components/admin/AdminDashboardWorkspace.tsx` + `app/api/admin/dashboard/route.ts` |
| Owner dashboard | `app/owner/dashboard/page.tsx` + `app/api/owner/dashboard/route.ts` |
| Notifications logic | `lib/notifications.ts` + `lib/socket/server.ts` |
| New user role or permission | `prisma/schema.prisma` (enum) + `lib/auth.ts` (`hasRequiredRole`) + all API route guards |
| Profile settings | `components/profile/ProfileSettingsWorkspace.tsx` + `app/api/profile/route.ts` |
| Map / geocoding | `components/maps/` + `app/api/geocode/route.ts` + `lib/geo.ts` |
