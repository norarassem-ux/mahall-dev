# Mahal v1 — public site (Wing B)

React + Node.js implementation of the public-facing side of Mahal, per the
training blueprint's "Dev Plan" tab (`Training - Dev Plan/mahal_training_plan v2.html`).
This covers the **React/Node wing** (Gamal's track) — venue listing/search, venue
detail with inquiry form, owner listing creation, account/auth, and static
marketing pages.

Not included: the Oracle APEX admin console (Wing A / Nora's track) — that
needs someone logged into an APEX workspace, which this can't do on its own
(see [backend/oracle/CREDENTIALS.local.md](backend/oracle/CREDENTIALS.local.md),
gitignored, for the login).

Contributing? See [CONTRIBUTING.md](./CONTRIBUTING.md) for the branch/PR
workflow — short version: branch off `main`, PR back in, squash-merge.

## Stack

- `backend/` — Express REST API. Data layer is a pluggable store
  (`backend/src/db.js`, `DB_DRIVER=json` or `oracle`):
  - `jsonStore` — a local JSON file, zero setup, used by default.
  - `oracleStore` — talks to a local Oracle DB through **ORDS AutoREST**
    (no native `oracledb` driver needed). See
    [backend/oracle/](backend/oracle/) for the schema, provisioning
    scripts, and [ER-DIAGRAM.md](backend/oracle/ER-DIAGRAM.md).
- `frontend/` — React (Vite) SPA. Design tokens lifted from the existing
  WordPress build's `mahall-core-v1.0.css` (cream/gold/teal theme) so it's
  visually consistent with the rest of the Mahal brand.

## Run it

```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm install
cp .env.example .env    # DB_DRIVER=json needs no further setup
npm run seed             # writes backend/data/db.json with 10 sample venues + 2 demo users
npm start

# Terminal 2 — frontend (http://localhost:5173, proxies /api to :4000)
cd frontend
npm install
npm run dev
```

Demo logins (seeded): `client@example.com` / `owner@example.com`, password `password123`.

### Running against Oracle instead

Needs a local Oracle DB + APEX + ORDS install. Start ORDS
(`java -jar ords.war --config <dir> serve`), then run the scripts in
[backend/oracle/](backend/oracle/) in order: `provision_mahaldb.sql`,
`enable_rest_mahaldb.sql`, `seed_mahaldb.sql`, `seed_reviews.sql`. Set
`DB_DRIVER=oracle` in `backend/.env` and restart the backend — no frontend
or route changes needed either way.

## What's built

- `GET /api/venues` — search & filter (category, city, minGuests, maxPrice, q)
- `GET /api/venues/:idOrSlug`
- `POST /api/venues` — create a listing (owner accounts only)
- `POST /api/auth/register`, `/login`, `GET /me` — JWT auth
- `POST /api/inquiries` — booking/inquiry request tied to a venue (captures
  `user_id` if the submitter is logged in, stays anonymous otherwise)
- `POST /api/inquiries/rfp` — batch request to multiple venues
- `POST /api/contact` — general marketing-site contact form
- `GET /api/owner/venues`, `/api/owner/inquiries` — owner-scoped "my
  listings" / "my leads" (filtered by `venues.owner_id`)
- Pages: Home (hero, category grid, editorial picks, how-it-works),
  Venues (search/filter), Venue detail (with inquiry form), List your venue
  (owner-only creation form), Owner dashboard (my venues + leads),
  Register, Login, About, Contact, FAQ
- `venues.rating`/`reviews_count` are real, trigger-computed aggregates
  off a `reviews` table now, not static seed numbers — see ER-DIAGRAM.md
- Support chat widget (floating, bottom-right) — a free, rule-based FAQ
  bot (`frontend/src/components/SupportWidget.jsx`), keyword-matched
  against canned answers about pricing/booking/listing. No external API,
  no API key, no cost — entirely client-side.

## What's next (per the training plan)

- Booking/payment/review *creation* flows — the `bookings`, `payments`,
  and `reviews` tables exist (see ER-DIAGRAM.md) but there's no UI yet
  for a client to actually book, pay, or leave a review
- Owner dashboard: listing edit/status management (currently read-only —
  view listings and leads, no editing yet)
- Venue comparison (`/compare`) and saved venues
- Static marketing pages (About/Contact/FAQ exist; gallery/services still open)
- SEO, analytics, deploy pipeline — see "Pure website" and "QA, Launch" phases
