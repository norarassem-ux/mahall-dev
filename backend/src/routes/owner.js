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

// GET /api/owner/bookings?venueId= — the calendar feed for a venue
// (admins: any venue; owners: only their own — 403 if they ask for a
// venue they don't own). Omit venueId to list every booking the caller
// can see (admins: all; owners: across all their venues).
ownerRouter.get("/bookings", requireAuth, requireOwner, async (req, res, next) => {
  try {
    const { venueId } = req.query;
    if (req.user.role === "admin") {
      return res.json({ bookings: await db.listBookings(venueId || undefined) });
    }
    const venues = await db.listVenues();
    const myVenueIds = new Set(venues.filter((v) => v.ownerId === req.user.sub).map((v) => v.id));
    if (venueId && !myVenueIds.has(venueId)) {
      return res.status(403).json({ error: "Not your venue" });
    }
    const bookings = await db.listBookings(venueId || undefined);
    res.json({ bookings: venueId ? bookings : bookings.filter((b) => myVenueIds.has(b.venueId)) });
  } catch (err) { next(err); }
});
