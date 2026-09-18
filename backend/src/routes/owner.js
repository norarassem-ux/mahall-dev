import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

export const ownerRouter = Router();

function requireOwner(req, res, next) {
  if (req.user.role !== "owner" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Owner accounts only" });
  }
  next();
}

// GET /api/owner/venues — my listings (admins see every venue, not just
// their own — that's what "admin" means here: the owner-scoping below
// simply doesn't apply to them)
ownerRouter.get("/venues", requireAuth, requireOwner, async (req, res, next) => {
  try {
    const venues = await db.listVenues();
    res.json({ venues: req.user.role === "admin" ? venues : venues.filter((v) => v.ownerId === req.user.sub) });
  } catch (err) { next(err); }
});

// GET /api/owner/inquiries — leads for my listings (admins: every lead)
ownerRouter.get("/inquiries", requireAuth, requireOwner, async (req, res, next) => {
  try {
    const [venues, inquiries] = await Promise.all([db.listVenues(), db.listInquiries()]);
    if (req.user.role === "admin") {
      return res.json({ inquiries });
    }
    const myVenueIds = new Set(venues.filter((v) => v.ownerId === req.user.sub).map((v) => v.id));
    res.json({ inquiries: inquiries.filter((i) => myVenueIds.has(i.venueId)) });
  } catch (err) { next(err); }
});
