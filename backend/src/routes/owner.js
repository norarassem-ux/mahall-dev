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

// admin@mahal.city (venueId null) is the one and only account with full
// access to every venue. Each of the 12 per-venue admin accounts
// (venue-admin-<slug>@mahal.city, see backend/oracle/10_venue_admin_scope.sql)
// carries a venueId and is scoped to just that one venue — same shape as
// an owner scoped to their own listings. Returns null for "unrestricted".
function scopedVenueIds(user, venues) {
  if (user.role === "admin") {
    return user.venueId ? new Set([user.venueId]) : null;
  }
  return new Set(venues.filter((v) => v.ownerId === user.sub).map((v) => v.id));
}

// GET /api/owner/venues — my listings (admin@mahal.city sees every
// venue; a per-venue admin or an owner sees only their own)
ownerRouter.get("/venues", requireAuth, requireOwner, async (req, res, next) => {
  try {
    const venues = await db.listVenues();
    const ids = scopedVenueIds(req.user, venues);
    res.json({ venues: ids ? venues.filter((v) => ids.has(v.id)) : venues });
  } catch (err) { next(err); }
});

// GET /api/owner/inquiries — leads for my listings (admin@mahal.city:
// every lead; a per-venue admin or an owner: only their own venue's)
ownerRouter.get("/inquiries", requireAuth, requireOwner, async (req, res, next) => {
  try {
    const [venues, inquiries] = await Promise.all([db.listVenues(), db.listInquiries()]);
    const ids = scopedVenueIds(req.user, venues);
    res.json({ inquiries: ids ? inquiries.filter((i) => ids.has(i.venueId)) : inquiries });
  } catch (err) { next(err); }
});

// GET /api/owner/bookings?venueId= — the calendar feed for a venue
// (admin@mahal.city: any venue; a per-venue admin or an owner: only
// their own — 403 if they ask for a venue they don't have). Omit
// venueId to list every booking the caller can see.
ownerRouter.get("/bookings", requireAuth, requireOwner, async (req, res, next) => {
  try {
    const { venueId } = req.query;
    const venues = await db.listVenues();
    const ids = scopedVenueIds(req.user, venues);
    if (!ids) {
      return res.json({ bookings: await db.listBookings(venueId || undefined) });
    }
    if (venueId && !ids.has(venueId)) {
      return res.status(403).json({ error: "Not your venue" });
    }
    const bookings = await db.listBookings(venueId || undefined);
    res.json({ bookings: venueId ? bookings : bookings.filter((b) => ids.has(b.venueId)) });
  } catch (err) { next(err); }
});
