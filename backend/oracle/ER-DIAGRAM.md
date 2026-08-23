# MAHALDB — entity relationship diagram

This documents the schema actually in use by the running app (`MAHALDB`,
provisioned by [`provision_mahaldb.sql`](provision_mahaldb.sql)). It does
**not** cover `MAHAL_APP` (the earlier, superseded flat-schema attempt) or
`TEST` (a separate, pre-existing workspace/schema this project never
touches) — see [`CREDENTIALS.local.md`](CREDENTIALS.local.md) for how
those relate.

```mermaid
erDiagram
    CITIES ||--o{ VENUES : "located in"
    CATEGORIES ||--o{ VENUES : "categorized as"
    APP_USERS ||--o{ VENUES : "owns"
    APP_USERS ||--o{ INQUIRIES : "submitted (optional)"
    VENUES ||--o{ INQUIRIES : "receives"
    VENUES ||--o{ BOOKINGS : "booked as"
    APP_USERS ||--o{ BOOKINGS : "makes"
    BOOKINGS ||--o{ PAYMENTS : "paid via"
    VENUES ||--o{ REVIEWS : "reviewed as"
    APP_USERS ||--o{ REVIEWS : "writes"

    CITIES {
        number city_id PK
        varchar2 city_name UK
    }
    CATEGORIES {
        number category_id PK
        varchar2 slug UK
        varchar2 category_name
    }
    APP_USERS {
        varchar2 id PK
        varchar2 email UK
        varchar2 name
        varchar2 role "client / owner"
        varchar2 password_hash
        timestamp created_at
    }
    VENUES {
        varchar2 id PK
        varchar2 name
        varchar2 slug UK
        number category_id FK
        number city_id FK
        varchar2 owner_id FK "-> app_users.id"
        varchar2 area
        number capacity
        number price_from
        clob amenities "JSON array"
        number rating "trigger-computed from reviews"
        number reviews_count "trigger-computed from reviews"
        varchar2 host_name
        varchar2 host_email
        varchar2 host_phone
        clob description
        varchar2 status "live / pending / suspended"
        number featured "0 or 1"
        varchar2 image_url "Unsplash photo, defaulted by category if unset"
        timestamp created_at
    }
    INQUIRIES {
        varchar2 id PK
        varchar2 venue_id FK
        varchar2 user_id FK "nullable — anonymous inquiries allowed"
        varchar2 venue_name "denormalized copy"
        varchar2 name
        varchar2 email
        varchar2 event_type
        varchar2 event_date
        number guests
        clob message
        varchar2 status "new / accepted / declined / archived"
        timestamp created_at
    }
    BOOKINGS {
        varchar2 id PK
        varchar2 venue_id FK
        varchar2 guest_id FK "-> app_users.id"
        varchar2 event_date
        number guest_count
        varchar2 status "pending / confirmed / cancelled"
        number total_price
        timestamp created_at
    }
    PAYMENTS {
        varchar2 id PK
        varchar2 booking_id FK
        number amount
        varchar2 payment_method
        varchar2 payment_status "pending / paid / refunded"
        timestamp paid_at
    }
    REVIEWS {
        varchar2 id PK
        varchar2 venue_id FK
        varchar2 user_id FK
        number rating "1-5"
        varchar2 comment_text
        timestamp created_at
    }
```

## How the write paths work

- **`venues_flat`** is a *view* (not shown above), not a table — it joins
  `VENUES` + `CATEGORIES` + `CITIES` back into one flat shape so the Node
  backend's REST calls don't need to know the schema is normalized
  underneath.
- Reads go through AutoREST against that view. **Writes don't** — Oracle
  rejects the `RETURNING ROWID` clause ORDS generates for inserts through
  a join view (`ORA-22816`), so venue creation goes through a small
  custom ORDS PL/SQL handler (`/venue-create/`, see
  `enable_rest_mahaldb.sql`) that resolves the category, looks up (or
  creates) the city, and inserts directly.
- `venues.rating` / `reviews_count` are **not** stored independently —
  they're maintained by a compound trigger (`reviews_sync_venue_rating`)
  that recomputes both from real rows in `reviews` on every insert/
  update/delete. A plain row-level trigger can't do this (Oracle raises
  `ORA-04091`, "table is mutating," if a trigger queries the table it's
  firing on), hence the compound trigger with a `BEFORE EACH ROW` /
  `AFTER STATEMENT` split.

## What's still deliberately not built

- **No booking, payment, or review *creation* flow in the app.** The
  tables and FKs exist and are seeded with sample data
  (`seed_reviews.sql`) so `venues.rating`/`reviews_count` are real, but
  there's no UI yet for a client to actually leave a review, make a
  booking, or pay a deposit — building that (plus e.g. Stripe
  integration) is separate, larger scope than "the schema exists."
- **`INQUIRIES.user_id`** is only populated when the submitter happens to
  be logged in (`optionalAuth` in the backend) — anonymous inquiries are
  still allowed and leave it `NULL`.
