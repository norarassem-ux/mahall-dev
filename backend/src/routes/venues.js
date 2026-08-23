import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

export const venuesRouter = Router();

const VALID_CATEGORIES = [
  "heritage", "resort", "private", "nature",
  "coastal", "urban", "corporate", "entertainment",
];

// Sensible default photo per category, used when an owner doesn't supply one.
const CATEGORY_IMAGE = {
  heritage: "https://images.unsplash.com/photo-1624805098931-098c0d918b34?auto=format&fit=crop&w=800&q=60",
  resort: "https://images.unsplash.com/photo-1624804821465-5c7c80f99bd1?auto=format&fit=crop&w=800&q=60",
  private: "https://images.unsplash.com/photo-1757439402359-aed14d39fc1b?auto=format&fit=crop&w=800&q=60",
  nature: "https://images.unsplash.com/photo-1757438059326-f53e8a5adf46?auto=format&fit=crop&w=800&q=60",
  coastal: "https://images.unsplash.com/photo-1519594445471-0e5f86b3fb09?auto=format&fit=crop&w=800&q=60",
  urban: "https://images.unsplash.com/photo-1758165532022-a68f291317ba?auto=format&fit=crop&w=800&q=60",
  corporate: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=60",
  entertainment: "https://images.unsplash.com/photo-1768053921689-1bc09db904c9?auto=format&fit=crop&w=800&q=60",
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/venues?category=&city=&minGuests=&maxPrice=&q=
venuesRouter.get("/", async (req, res, next) => {
  try {
  const { category, city, minGuests, maxPrice, q } = req.query;
  let results = await db.listVenues();

  if (category) results = results.filter((v) => v.category === category);
  if (city) results = results.filter((v) => v.city.toLowerCase() === String(city).toLowerCase());
  if (minGuests) results = results.filter((v) => v.capacity >= Number(minGuests));
  if (maxPrice) results = results.filter((v) => v.price_from <= Number(maxPrice));
  if (q) {
    const needle = String(q).toLowerCase();
    results = results.filter(
      (v) =>
        v.name.toLowerCase().includes(needle) ||
        v.city.toLowerCase().includes(needle) ||
        v.amenities.some((a) => a.toLowerCase().includes(needle))
    );
  }

  res.json({ count: results.length, venues: results });
  } catch (err) { next(err); }
});

// POST /api/venues — create a listing (owners only)
venuesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only owner accounts can list a venue" });
    }
    const { name, category, city, area, capacity, price_from, amenities, description, host_phone, image } = req.body || {};
    if (!name || !category || !city || !capacity || !price_from) {
      return res.status(400).json({ error: "name, category, city, capacity and price_from are required" });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` });
    }

    const venue = await db.insertVenue({
      id: nanoid(10),
      name,
      slug: `${slugify(name)}-${nanoid(5).toLowerCase()}`,
      category,
      city,
      area: area || "",
      capacity: Number(capacity),
      price_from: Number(price_from),
      amenities: Array.isArray(amenities) ? amenities : [],
      rating: 0,
      reviews_count: 0,
      host_name: req.user.name,
      host_email: req.user.email,
      host_phone: host_phone || "",
      ownerId: req.user.sub,
      image: image || CATEGORY_IMAGE[category],
      description: description || "",
      status: "live",
      featured: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(venue);
  } catch (err) { next(err); }
});

venuesRouter.get("/:idOrSlug", async (req, res, next) => {
  try {
  const venue = await db.getVenue(req.params.idOrSlug);
  if (!venue) return res.status(404).json({ error: "Venue not found" });
  res.json(venue);
  } catch (err) { next(err); }
});
