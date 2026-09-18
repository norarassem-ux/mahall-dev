// Offline fallback store — a local JSON file. Same interface as
// oracleStore.js so routes never know which one they're talking to.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "..", "data", "db.json");

function loadRaw() {
  if (!fs.existsSync(DATA_FILE)) {
    return { venues: [], users: [], inquiries: [], bookings: [] };
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  if (!data.bookings) data.bookings = [];
  return data;
}

function saveRaw(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let state = loadRaw();

function persist() {
  saveRaw(state);
}

export const jsonStore = {
  // ---- venues ----
  listVenues() {
    return state.venues;
  },
  getVenue(idOrSlug) {
    return state.venues.find(
      (v) => v.id === idOrSlug || v.slug === idOrSlug
    );
  },
  insertVenue(venue) {
    state.venues.push(venue);
    persist();
    return venue;
  },

  // ---- users ----
  listUsers() {
    return state.users;
  },
  getUserByEmail(email) {
    return state.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  },
  getUserById(id) {
    return state.users.find((u) => u.id === id);
  },
  insertUser(user) {
    state.users.push(user);
    persist();
    return user;
  },
  updateUser(id, fields) {
    const idx = state.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`User ${id} not found`);
    state.users[idx] = { ...state.users[idx], ...fields };
    persist();
    return state.users[idx];
  },

  // ---- inquiries (leads) ----
  listInquiries(venueId) {
    return venueId
      ? state.inquiries.filter((i) => i.venueId === venueId)
      : state.inquiries;
  },
  insertInquiry(inquiry) {
    state.inquiries.push(inquiry);
    persist();
    return inquiry;
  },

  // ---- bookings (created by approving an inquiry) ----
  // Mirrors the guard rules in backend/oracle/09_admin_dashboard.sql's
  // /inquiry-approve//-reject/ handlers so offline (DB_DRIVER unset) dev
  // behaves the same as the Oracle-backed app: approve is blocked only
  // if there's no venue or it's already approved; reject is unconditional.
  listBookings(venueId) {
    return venueId
      ? state.bookings.filter((b) => b.venueId === venueId)
      : state.bookings;
  },
  approveInquiry(id) {
    const inquiry = state.inquiries.find((i) => i.id === id);
    if (!inquiry) throw new Error("Inquiry not found");
    if (!inquiry.venueId) throw new Error("Inquiry has no venue and cannot become a booking");
    if (inquiry.status === "approved") throw new Error("Inquiry is already approved");

    let guestId = inquiry.userId || null;
    if (!guestId) {
      const match = state.users.find(
        (u) => u.email.toLowerCase().trim() === (inquiry.email || "").toLowerCase().trim()
      );
      guestId = match ? match.id : null;
    }
    const venue = state.venues.find((v) => v.id === inquiry.venueId);

    const booking = {
      id: "bk" + nanoid(10),
      venueId: inquiry.venueId,
      guestId,
      eventDate: inquiry.date || null,
      guestCount: inquiry.guests || null,
      status: "pending",
      totalPrice: venue?.price_from ?? null,
      createdAt: new Date().toISOString(),
    };
    state.bookings.push(booking);
    inquiry.status = "approved";
    persist();
    return booking;
  },
  rejectInquiry(id) {
    const inquiry = state.inquiries.find((i) => i.id === id);
    if (!inquiry) throw new Error("Inquiry not found");
    inquiry.status = "rejected";
    persist();
    return inquiry;
  },

  // ---- bulk replace (used by seed script) ----
  reset(next) {
    state = next;
    persist();
  },
};
