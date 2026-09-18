// Offline fallback store — a local JSON file. Same interface as
// oracleStore.js so routes never know which one they're talking to.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "..", "data", "db.json");

function loadRaw() {
  if (!fs.existsSync(DATA_FILE)) {
    return { venues: [], users: [], inquiries: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
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

  // ---- bulk replace (used by seed script) ----
  reset(next) {
    state = next;
    persist();
  },
};
