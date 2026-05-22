# GETYOURCAVE

GETYOURCAVE is a premium storage marketplace for owners, renters, and admins.
It lets owners list storage spaces, renters browse and book them, admins review
listings and verifications, and everyone collaborate through contracts,
invoices, messaging, and payments.

## What the project does

- Owner, renter, and admin authentication with role-based dashboards
- Create, save, submit, approve, reject, archive, and browse storage listings
- Booking requests, booking status updates, and renter/owner dashboard flows
- Invoice generation, invoice detail views, and Stripe Checkout payment flow
- Contract generation, preview, and download
- Real-time messaging with server-side content filtering
- Document verification upload and moderation
- OpenStreetMap and Leaflet map previews for listings
- English/French website translation with a navbar language switcher
- Responsive layouts for mobile and desktop

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

```bash
npm install
npm run db:seed-demo
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo accounts

All demo accounts use the password `Password123!`.

- Admin: `admin@getyourcave.com`
- Owner: `owner1@getyourcave.com`
- Owner: `owner2@getyourcave.com`
- Renter: `renter1@getyourcave.com`
- Renter: `renter2@getyourcave.com`

## Notes

- The app uses a custom `server.ts` and Socket.IO server.
- Public listings only show approved and published spaces.
- Stripe is wired for test mode and uses webhook confirmation for payment state.
- Translation defaults to English and can be switched to French in the navbar.

