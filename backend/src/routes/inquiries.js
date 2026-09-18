import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { optionalAuth, requireAuth, requireAdmin } from "../auth.js";

export const inquiriesRouter = Router();

// POST /api/inquiries — booking/inquiry request from a venue detail page
inquiriesRouter.post("/", optionalAuth, async (req, res, next) => {
  try {
    const { venueId, name, email, eventType, date, guests, message } = req.body || {};
    if (!venueId || !name || !email) {
      return res.status(400).json({ error: "venueId, name and email are required" });
    }
    const venue = await db.getVenue(venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    const inquiry = await db.insertInquiry({
      id: nanoid(10),
      venueId: venue.id,
      venueName: venue.name,
      name,
      email,
      eventType: eventType || "",
      date: date || "",
      guests: guests || null,
      message: message || "",
      status: "new",
      userId: req.user?.sub || null,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ ok: true, inquiry });
  } catch (err) { next(err); }
});

// POST /api/inquiries/rfp — batch request to multiple venues
inquiriesRouter.post("/rfp", optionalAuth, async (req, res, next) => {
  try {
    const { venueIds, name, email, eventType, date, guests, message } = req.body || {};
    if (!Array.isArray(venueIds) || venueIds.length === 0 || !name || !email) {
      return res.status(400).json({ error: "venueIds (array), name and email are required" });
    }
    const venues = (await Promise.all(venueIds.map((id) => db.getVenue(id)))).filter(Boolean);
    const created = await Promise.all(
      venues.map((venue) =>
        db.insertInquiry({
          id: nanoid(10),
          venueId: venue.id,
          venueName: venue.name,
          name,
          email,
          eventType: eventType || "",
          date: date || "",
          guests: guests || null,
          message: message || "",
          status: "new",
          userId: req.user?.sub || null,
          createdAt: new Date().toISOString(),
        })
      )
    );
    res.status(201).json({ ok: true, count: created.length, inquiries: created });
  } catch (err) { next(err); }
});

// GET /api/inquiries?venueId= — raw cross-venue listing. Previously had
// NO auth check at all (any venueId, by anyone) despite the comment
// calling it "owner-side" — that was a real gap, not intentional design;
// /api/owner/inquiries (properly scoped to the caller's own venues) is
// what the owner dashboard actually uses. Gated to admin now that a real
// admin role exists; nothing in the frontend depended on it being open.
inquiriesRouter.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.json({ inquiries: await db.listInquiries(req.query.venueId) });
  } catch (err) { next(err); }
});

// GET /api/inquiries/mine — the logged-in user's own submitted inquiries
// (for the Account page), regardless of role.
inquiriesRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const all = await db.listInquiries();
    res.json({ inquiries: all.filter((i) => i.userId === req.user.sub) });
  } catch (err) { next(err); }
});

// POST /api/inquiries/:id/approve — admin-only. Turns the inquiry into a
// `bookings` row (status "pending") and marks it "approved". Guard rules
// (blocked only if the inquiry has no venue, or is already approved) and
// guest-resolution/price-estimation live in the DB (Oracle: the
// /inquiry-approve/ ORDS handler from backend/oracle/09_admin_dashboard.sql;
// offline: db.approveInquiry's matching logic) so this stays consistent
// with the same Approve action already live on APEX's Manage Inquiries page.
inquiriesRouter.post("/:id/approve", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const booking = await db.approveInquiry(req.params.id);
    res.json({ ok: true, booking });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not approve inquiry" });
  }
});

// POST /api/inquiries/:id/reject — admin-only. Unconditional, no guard —
// "Reject can still override an approval" is an explicit product decision
// (see AGENTS.md); a reject after an approval does not touch the booking
// row it created.
inquiriesRouter.post("/:id/reject", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const inquiry = await db.rejectInquiry(req.params.id);
    res.json({ ok: true, inquiry });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not reject inquiry" });
  }
});
