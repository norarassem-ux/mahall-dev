import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";

export const contactRouter = Router();

// POST /api/contact — general marketing-site contact form (no venue attached)
contactRouter.post("/", async (req, res, next) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: "name, email and message are required" });
    }
    const entry = await db.insertInquiry({
      id: nanoid(10),
      venueId: null,
      venueName: "(general contact)",
      name,
      email,
      eventType: "",
      date: "",
      guests: null,
      message,
      status: "new",
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ ok: true, entry });
  } catch (err) { next(err); }
});
