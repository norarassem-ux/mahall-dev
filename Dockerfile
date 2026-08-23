FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package + frontend + backend source (no node_modules)
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY frontend/src ./frontend/src
COPY frontend/index.html ./frontend/
COPY frontend/vite.config.js ./frontend/
COPY backend/package*.json ./backend/
COPY backend/src ./backend/src
COPY backend/oracle ./backend/oracle
COPY backend/data ./backend/data

# Build frontend
RUN npm --prefix frontend ci && npm --prefix frontend run build

# Install backend deps
RUN npm --prefix backend ci

# --- Runtime stage ---
FROM node:20-alpine

WORKDIR /app

# Copy built frontend
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy backend with deps
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/src ./backend/src
COPY --from=builder /app/backend/data ./backend/data
COPY --from=builder /app/backend/oracle ./backend/oracle

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "backend/src/index.js"]
