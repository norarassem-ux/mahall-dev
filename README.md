# Mahal v1 — Event Venue Marketplace (Docker Deployment)

A full-stack React + Node.js platform for discovering and listing event venues in Morocco, now containerized with multi-stage Docker builds and docker-compose orchestration.

## Features

- **Venue Search & Discovery**: Browse 12+ seeded venues with advanced filtering (category, city, capacity, price)
- **Venue Listings**: Owners can create and manage venue listings
- **JWT Authentication**: Register, login, demo accounts included
- **Inquiry/Lead Capture**: Clients submit booking inquiries tied to venues
- **Real Aggregations**: Rating and review counts are trigger-computed from actual review data
- **Support Chat Widget**: Client-side FAQ bot (no external API)
- **Oracle Integration**: Optional dual-driver support (JSON default, Oracle via ORDS)

## Stack

- **Backend**: Express.js REST API (`backend/src`)
  - Data layer: pluggable (`DB_DRIVER=json` or `oracle`)
  - JSON store: local `db.json` for dev/demo
  - Oracle store: ORDS AutoREST gateway (no native driver needed)
- **Frontend**: React 18 + Vite SPA (`frontend/src`)
  - Responsive design (desktop, tablet, mobile)
  - Client-side routing with React Router
- **Database**: Optional Oracle 26ai + ORDS (provisioned with full schema and seed data)
- **Containerization**: Multi-stage Docker build + docker-compose

## Confirmed working locally (2026-09-11)

The full chain is live on the dev machine: **http://localhost:5173** (React
frontend, "Mahal — Morocco Venue Marketplace") → http://localhost:4000/api
(Node backend) → http://localhost:8080/ords/mahaldb (ORDS) → native Oracle
26ai — plus APEX workspace admin login at http://localhost:8080/ords/apex.

## Quick Start (Docker)

```bash
cd mahal-v1
docker compose up -d --build
```

Then:
- Frontend/Backend: http://localhost:4000
- API: http://localhost:4000/api/*
- Oracle DB: localhost:1521 (optional, provisioned)

Demo logins:
- **Client**: `client@example.com` / `password123`
- **Owner**: `owner@example.com` / `password123`

## Local Development (without Docker) — the setup actually in daily use

Three terminal windows, all required simultaneously — see
[`backend/oracle/RUNBOOK.md`](./backend/oracle/RUNBOOK.md) for the full
native Oracle/ORDS/APEX setup (listener port, provisioning order, the two
APEX-admin gotchas, and the "don't click into the ORDS window" warning):

```bash
# Window 1 — ORDS (http://localhost:8080)
C:\26_26\ords\bin\ords.exe --config C:\ords_config serve

# Window 2 — backend (http://localhost:4000, API only)
cd backend
npm install
cp .env.example .env    # set DB_DRIVER=oracle to use the real DB, or leave as json for no-DB dev
npm start

# Window 3 — frontend (http://localhost:5173 — the actual site)
cd frontend
npm install
npm run dev
```

Frontend proxies `/api` to backend on `:4000`.

## Files Added for Docker Deployment

- **`Dockerfile`**: Multi-stage build (frontend build + backend bundle)
- **`docker-compose.yml`**: Orchestrates backend, optional Oracle 26ai container
- **`.dockerignore`**: Excludes `.git`, `node_modules`, `.env`, etc.
- **`backend/.env`**: Pre-configured for JSON driver (`DB_DRIVER=json`)

## Switching to Oracle

**Native (no Docker) — the setup in daily use.** Update `backend/.env`:
```
DB_DRIVER=oracle
ORDS_BASE_URL=http://localhost:8080/ords/mahaldb
```
Then restart the backend (`npm start`). Full one-time provisioning steps,
the native Oracle/ORDS install, and known gotchas are in
[`backend/oracle/RUNBOOK.md`](./backend/oracle/RUNBOOK.md).

**Docker.** Update `backend/.env` instead:
```
DB_DRIVER=oracle
ORDS_BASE_URL=http://mahal-oracle-26ai:8080/ords/mahaldb
```
Then `docker compose up -d`.

See `backend/oracle/` for full schema, provisioning scripts, and ER diagram.

## API Endpoints

### Public
- `GET /api/health` — service status
- `GET /api/stats` — venue/city/category counts
- `GET /api/venues` — list all (search/filter: `?category=heritage&city=Marrakech&minGuests=50&maxPrice=5000&q=riad`)
- `GET /api/venues/:idOrSlug` — venue detail
- `POST /api/contact` — contact form

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` — current user (JWT)

### Venues (Owner)
- `POST /api/venues` — create listing (owner only)
- `GET /api/owner/venues` — my listings

### Inquiries (Public/Auth)
- `POST /api/inquiries` — submit booking inquiry
- `GET /api/owner/inquiries` — my leads (owner only)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch/PR workflow.

## License

Proprietary — Mahal Project
