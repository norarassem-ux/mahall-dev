import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "./db.js";

const CATEGORIES = [
  { slug: "heritage", name: "Heritage & cultural" },
  { slug: "resort", name: "Hospitality & resort" },
  { slug: "private", name: "Private & exclusive" },
  { slug: "nature", name: "Nature & adventure" },
  { slug: "coastal", name: "Coastal & leisure" },
  { slug: "urban", name: "Urban & lifestyle" },
  { slug: "corporate", name: "Corporate & MICE" },
  { slug: "entertainment", name: "Entertainment & production" },
];

// Same photo set used by the Oracle seed (backend/oracle/add_venue_photos.sql)
// and by venues.js as the default for owner-created listings.
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

function makeVenue({ name, category, city, area, capacity, price, amenities, rating, reviews, image }) {
  return {
    id: nanoid(10),
    name,
    slug: slugify(name),
    category,
    city,
    area,
    capacity,
    price_from: price,
    amenities,
    rating,
    reviews_count: reviews,
    host_name: "Amina K.",
    host_email: "owner@example.com",
    host_phone: "+212 6 00 00 00 00",
    description: `${name} is a distinctive ${CATEGORIES.find((c) => c.slug === category)?.name.toLowerCase()} venue in ${city}, ${area}. Capacity for up to ${capacity} guests.`,
    // Explicit override where a category has multiple venues, so they
    // don't all show the same category-default photo.
    image: image || CATEGORY_IMAGE[category],
    status: "live",
    featured: Math.random() > 0.6,
    createdAt: new Date().toISOString(),
  };
}

// Matches mahal.city's real "Featured listings" — names, cities,
// categories, capacities and prices. See backend/oracle/seed_mahaldb.sql
// for the Oracle-mode equivalent (kept in sync manually).
const venues = [
  makeVenue({ name: "Riad Zahra", category: "heritage", city: "Marrakech", area: "Medina", capacity: 80, price: 4000, amenities: ["Rooftop terrace", "Central courtyard", "Catering option"], rating: 5, reviews: 2 }),
  makeVenue({ name: "Dunes Camp Erg", category: "nature", city: "Merzouga", area: "Erg Chebbi dunes", capacity: 60, price: 6500, amenities: ["Berber tents", "Stargazing deck", "Camel trek option"], rating: 4.5, reviews: 2 }),
  makeVenue({ name: "Atlas Beach Club", category: "coastal", city: "Essaouira", area: "Essaouira coast", capacity: 200, price: 3200, amenities: ["Ocean-view terrace", "Fireplace lounge", "Surf-adjacent"], rating: 4.5, reviews: 2 }),
  makeVenue({ name: "Villa Janoub", category: "private", city: "Tangier", area: "Malabata", capacity: 120, price: 8000, amenities: ["Private garden", "Infinity pool", "On-site chef"], rating: 4.5, reviews: 2 }),
  makeVenue({ name: "Kasbah Ait Noir", category: "heritage", city: "Ouarzazate", area: "Ait Ben Haddou", capacity: 100, price: 5400, amenities: ["Desert panorama", "Sunset ceremony spot", "Traditional courtyard"], rating: 5, reviews: 2, image: "https://images.unsplash.com/photo-1628962601069-ffe240250c35?auto=format&fit=crop&w=800&q=60" }),
  makeVenue({ name: "Skyline Rooftop", category: "urban", city: "Casablanca", area: "Gauthier", capacity: 180, price: 2800, amenities: ["Rooftop bar", "Skyline views", "DJ booth"], rating: 4, reviews: 2 }),
  makeVenue({ name: "Palmeraie Resort", category: "resort", city: "Marrakech", area: "Palmeraie", capacity: 300, price: 7200, amenities: ["Pool deck", "Ballroom", "On-site chef", "Valet parking"], rating: 4.5, reviews: 2 }),
  makeVenue({ name: "Centre Atlantique", category: "corporate", city: "Rabat", area: "Agdal", capacity: 500, price: 9500, amenities: ["AV equipment", "Breakout rooms", "Simultaneous translation booths"], rating: 4.5, reviews: 2 }),
  makeVenue({ name: "Studio Lumiere", category: "entertainment", city: "Casablanca", area: "Racine", capacity: 120, price: 3900, amenities: ["Stage & lighting rig", "Green room", "Live sound"], rating: 4, reviews: 2 }),
  makeVenue({ name: "Riad Bab El Oud", category: "heritage", city: "Fes", area: "Fes el Bali", capacity: 50, price: 3600, amenities: ["Central courtyard", "Rooftop terrace", "Traditional hammam"], rating: 5, reviews: 2, image: "https://images.unsplash.com/photo-1540396515873-dd778f7679e7?auto=format&fit=crop&w=800&q=60" }),
  makeVenue({ name: "Agafay Desert Lodge", category: "nature", city: "Marrakech", area: "Agafay Desert, 30min from Marrakech", capacity: 80, price: 5800, amenities: ["Infinity pool", "Berber tents", "Atlas views"], rating: 4.5, reviews: 2, image: "https://images.unsplash.com/photo-1677838929227-e0fc8a5885ea?auto=format&fit=crop&w=800&q=60" }),
  makeVenue({ name: "El Jadida Chateau", category: "heritage", city: "El Jadida", area: "Cite Portugaise", capacity: 150, price: 4800, amenities: ["Historic courtyard", "Sea-facing terrace", "Wine cellar"], rating: 4.5, reviews: 2, image: "https://images.unsplash.com/photo-1708823081954-1a9fd9266e9d?auto=format&fit=crop&w=800&q=60" }),
];

const demoUsers = [
  {
    id: nanoid(10),
    email: "client@example.com",
    name: "Demo Client",
    role: "client",
    passwordHash: bcrypt.hashSync("password123", 10),
    createdAt: new Date().toISOString(),
  },
  {
    id: nanoid(10),
    email: "owner@example.com",
    name: "Demo Owner",
    role: "owner",
    passwordHash: bcrypt.hashSync("password123", 10),
    createdAt: new Date().toISOString(),
  },
];

db.reset({ venues, users: demoUsers, inquiries: [] });

console.log(`Seeded ${venues.length} venues and ${demoUsers.length} demo users.`);
console.log("Demo logins: client@example.com / owner@example.com, password: password123");
