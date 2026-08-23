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

## Local Development (without Docker)

```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm install
cp .env.example .env    # DB_DRIVER=json (default)
npm run seed
npm start

# Terminal 2 — frontend (http://localhost:5173)
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

## Switching to Oracle (if running Oracle container)

1. Update `backend/.env`:
   ```
   DB_DRIVER=oracle
   ORDS_BASE_URL=http://mahal-oracle-26ai:8080/ords/mahaldb
   ```

2. Restart backend:
   ```bash
   docker compose up -d
   ```

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
