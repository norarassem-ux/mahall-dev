// Oracle store — talks to the local Oracle DB through ORDS AutoREST
// (http://localhost:8080/ords/mahaldb/...), provisioned by
// backend/oracle/provision_mahaldb.sql. No native Oracle client needed:
// ORDS exposes each table/view as a plain REST/JSON resource, plus one
// custom PL/SQL handler (/venue-create/) for writes through the view.
const BASE = process.env.ORDS_BASE_URL || "http://localhost:8080/ords/mahaldb";

async function ordsGet(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`ORDS GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function ordsPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ORDS POST ${path} failed: ${res.status} ${await res.text()}`);
  // Custom PL/SQL handlers (e.g. /venue-create/) return 200 with no body.
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function ordsPut(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ORDS PUT ${path} failed: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function mapVenueRow(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    city: row.city,
    area: row.area,
    capacity: row.capacity,
    price_from: row.price_from,
    amenities: row.amenities ? JSON.parse(row.amenities) : [],
    rating: row.rating,
    reviews_count: row.reviews_count,
    host_name: row.host_name,
    host_email: row.host_email,
    host_phone: row.host_phone,
    description: row.description,
    status: row.status,
    featured: !!row.featured,
    ownerId: row.owner_id,
    image: row.image_url,
    createdAt: row.created_at,
  };
}

function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    // Null for every account except the 12 per-venue admins (see
    // backend/oracle/10_venue_admin_scope.sql) — non-null scopes an
    // admin to exactly one venue, same as an owner scoped to their own
    // listings (see routes/owner.js's scopedVenueIds).
    venueId: row.venue_id || null,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

function mapInquiryRow(row) {
  return {
    id: row.id,
    venueId: row.venue_id,
    venueName: row.venue_name,
    name: row.name,
    email: row.email,
    eventType: row.event_type,
    date: row.event_date,
    guests: row.guests,
    message: row.message,
    status: row.status,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

function mapBookingRow(row) {
  return {
    id: row.id,
    venueId: row.venue_id,
    guestId: row.guest_id,
    eventDate: row.event_date,
    guestCount: row.guest_count,
    status: row.status,
    totalPrice: row.total_price,
    createdAt: row.created_at,
  };
}

export const oracleStore = {
  // ---- venues ----
  async listVenues() {
    const data = await ordsGet("/venues/?limit=1000");
    return (data.items || []).map(mapVenueRow);
  },
  async getVenue(idOrSlug) {
    const venues = await this.listVenues();
    return venues.find((v) => v.id === idOrSlug || v.slug === idOrSlug);
  },
  async insertVenue(venue) {
    // venues_flat is a join view (city/category are FKs under the hood) —
    // AutoREST can't INSERT through it (ORA-22816 on its RETURNING ROWID),
    // so writes go through a small custom ORDS handler instead that
    // resolves/creates the city and looks up the category itself.
    await ordsPost("/venue-create/", {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      category: venue.category,
      city: venue.city,
      area: venue.area,
      capacity: venue.capacity,
      price_from: venue.price_from,
      amenities: JSON.stringify(venue.amenities || []),
      host_name: venue.host_name,
      host_email: venue.host_email,
      host_phone: venue.host_phone,
      description: venue.description,
      status: venue.status,
      featured: venue.featured ? 1 : 0,
      owner_id: venue.ownerId,
      image_url: venue.image || null,
    });
    return venue;
  },

  // ---- users ----
  async listUsers() {
    const data = await ordsGet("/users/?limit=1000");
    return (data.items || []).map(mapUserRow);
  },
  async getUserByEmail(email) {
    const users = await this.listUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  async getUserById(id) {
    const users = await this.listUsers();
    return users.find((u) => u.id === id);
  },
  async insertUser(user) {
    await ordsPost("/users/", {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      venue_id: user.venueId || null,
      password_hash: user.passwordHash,
    });
    return user;
  },
  // Partial update — fetches the current row so unspecified fields
  // (notably password_hash) are preserved, then PUTs the merged row.
  // AutoREST's item endpoint is keyed by the table's PK (id).
  async updateUser(id, fields) {
    const current = await this.getUserById(id);
    if (!current) throw new Error(`User ${id} not found`);
    const merged = { ...current, ...fields };
    // venue_id is included even though `fields` never sets it directly —
    // PUT replaces the whole row, so omitting it here would silently
    // erase a venue-admin's scope the next time they change their
    // password or edit their profile.
    await ordsPut(`/users/${id}`, {
      id: merged.id,
      email: merged.email,
      name: merged.name,
      role: merged.role,
      venue_id: merged.venueId || null,
      password_hash: merged.passwordHash,
    });
    return merged;
  },

  // ---- inquiries (leads) ----
  async listInquiries(venueId) {
    const data = await ordsGet("/inquiries/?limit=1000");
    const items = (data.items || []).map(mapInquiryRow);
    return venueId ? items.filter((i) => i.venueId === venueId) : items;
  },
  async insertInquiry(inquiry) {
    await ordsPost("/inquiries/", {
      id: inquiry.id,
      venue_id: inquiry.venueId,
      venue_name: inquiry.venueName,
      name: inquiry.name,
      email: inquiry.email,
      event_type: inquiry.eventType,
      event_date: inquiry.date,
      guests: inquiry.guests,
      message: inquiry.message,
      status: inquiry.status,
      user_id: inquiry.userId || null,
    });
    return inquiry;
  },

  // ---- bookings (created by approving an inquiry) ----
  async listBookings(venueId) {
    const data = await ordsGet("/bookings/?limit=1000");
    const items = (data.items || []).map(mapBookingRow);
    return venueId ? items.filter((b) => b.venueId === venueId) : items;
  },

  // Approve/reject call custom ORDS PL/SQL handlers (backend/oracle/
  // 09_admin_dashboard.sql) rather than plain AutoREST — the guard
  // rules (re-approve blocked, reject unconditional, guest resolution
  // by email, price estimation) live in the DB so this behaves
  // identically to the APEX "Manage Inquiries" Approve/Reject links.
  async approveInquiry(id) {
    await ordsPost("/inquiry-approve/", { inquiry_id: id });
  },
  async rejectInquiry(id) {
    await ordsPost("/inquiry-reject/", { inquiry_id: id });
  },

  reset() {
    throw new Error("reset() isn't supported against Oracle — re-run backend/oracle/provision.sql instead");
  },
};
