# GETYOURCAVE

GETYOURCAVE is a premium storage marketplace built for three roles:
owners who list storage spaces, renters who book them, and admins who review
and moderate the platform. The app combines marketplace browsing, booking,
payments, contracts, messaging, document verification, and analytics in one
role-aware product.

The project is designed to feel like a polished service rather than a generic
admin app. It uses a custom server, Socket.IO for realtime messaging, Prisma
for data access, and a tailored dashboard experience for each role.

## What the app does

### Public visitors

- Browse approved and published storage listings
- Open individual listing detail pages
- Search and filter listings
- View map-based listing previews when coordinates are available
- Switch the website language between English and French

### Owners

- Create storage listings from a multi-step listing flow
- Save drafts and submit listings for approval
- Edit, publish, archive, or resubmit listings
- Review booking requests and update booking status
- Track invoices, contracts, and revenue
- Communicate with renters through messaging

### Renters

- Browse storage listings and request bookings
- Pay invoices through Stripe Checkout in test mode or live mode
- View booking, invoice, and contract history
- Manage active and past rentals
- Message owners about listings and reservations

### Admins

- Review and approve or reject listings
- Review and approve or reject verification documents
- Monitor bookings, invoices, and platform activity
- Manage moderation queues and platform analytics

## Core features

- Role-based authentication for `ADMIN`, `OWNER`, and `RENTER`
- Custom session auth using the `gyc_auth_token` cookie
- Owner and renter dashboards with live, role-specific data
- Public storage listing browse and detail pages
- Listing creation and moderation workflow
- Booking request lifecycle
- Invoice generation and invoice detail pages
- Stripe Checkout payment flow with webhook confirmation
- Contract generation and download
- Realtime messaging with profanity/content filtering
- Verification document upload and moderation
- OpenStreetMap / Leaflet map previews
- English/French translations with a navbar language switcher
- Mobile-friendly responsive layout

## Tech stack

- Next.js App Router
- React 19
- TypeScript
- Prisma
- PostgreSQL
- Socket.IO
- Stripe Checkout
- Leaflet / React-Leaflet
- i18next / react-i18next

## Local development

Install dependencies, seed the demo data, then run the dev server:

```bash
npm install
npm run db:seed-demo
npm run dev
```

If you only want the admin account and a cleared database for moderation testing, run:

```bash
npm run db:seed-admin
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Required environment variables

The app expects a PostgreSQL database and Stripe test keys for payment testing.
The main variables are:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=your-secret
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Demo accounts

All demo accounts use the password `Password123!`.

- Admin: `admin@getyourcave.com`
- Owner: `owner1@getyourcave.com`
- Owner: `owner2@getyourcave.com`
- Renter: `renter1@getyourcave.com`
- Renter: `renter2@getyourcave.com`

## Seeding commands

- `npm run db:seed-demo` clears the database and seeds the full demo dataset
- `npm run db:seed-admin` clears the database and seeds only the admin account
- `npm run db:reset -- --yes` clears all public tables without creating demo data

## Demo data included

The demo seed creates realistic data for manual testing:

- Approved and published listings for the public browse page
- Pending, rejected, draft, and archived listings
- Booking requests in multiple states
- Paid, unpaid, overdue, and cancelled invoices
- Contract records and generated contract documents
- Conversations with read and unread messages
- Verification document records for owners and renters
- Admin activity records and platform metrics

## Main workflows

1. Public visitor browses listings
2. Owner creates a draft listing and submits it
3. Admin approves the listing
4. Renter books the listing
5. Renter pays the invoice through Stripe Checkout
6. Webhook updates invoice and payment status
7. Owner and renter both see the updated booking state
8. Messaging works between renter and owner
9. Verification documents are uploaded and reviewed
10. Users switch between English and French in the navbar

## Notes

- The app uses a custom `server.ts` and Socket.IO server, so `next dev` alone is
  not the correct runtime.
- Public listings only show approved and published spaces.
- Stripe payments are confirmed through webhooks, not the checkout redirect.
- Translation defaults to English and persists across refreshes.
- The UI is intentionally styled as a premium, editorial storage marketplace.
