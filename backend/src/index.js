import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

import { venuesRouter } from "./routes/venues.js";
import { authRouter } from "./routes/auth.js";
import { inquiriesRouter } from "./routes/inquiries.js";
import { contactRouter } from "./routes/contact.js";
import { ownerRouter } from "./routes/owner.js";
import { db } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "mahal-backend" }));

// Small public summary endpoint — venue/city/category counts for landing-page stats.
app.get("/api/stats", async (req, res, next) => {
  try {
    const venues = await db.listVenues();
    res.json({
      venues: venues.length,
      cities: new Set(venues.map((v) => v.city)).size,
      categories: new Set(venues.map((v) => v.category)).size,
    });
  } catch (err) { next(err); }
});

app.use("/api/venues", venuesRouter);
app.use("/api/auth", authRouter);
app.use("/api/inquiries", inquiriesRouter);
app.use("/api/contact", contactRouter);
app.use("/api/owner", ownerRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Single-service deploy: if a built frontend exists (../../frontend/dist,
// produced by `npm run build` in frontend/), serve it and fall back to
// index.html for any non-API route so client-side routing (BrowserRouter)
// survives a hard refresh on a deep link. No-op in local dev, where the
// frontend is served separately by Vite on :5173 and this directory won't exist.
const FRONTEND_DIST = path.join(__dirname, "..", "..", "frontend", "dist");
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Mahal backend listening on http://localhost:${PORT}`);
});
