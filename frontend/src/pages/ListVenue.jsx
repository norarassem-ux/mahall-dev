import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

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

export default function ListVenue() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    category: "heritage",
    city: "",
    area: "",
    capacity: "",
    price_from: "",
    amenities: "",
    description: "",
    host_phone: "",
  });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  if (!ready) return null;

  if (!user) {
    return (
      <section className="page-section" style={{ maxWidth: 480 }}>
        <div className="eyebrow">For owners</div>
        <h2>List your venue</h2>
        <p style={{ marginTop: 12 }}>
          You need an owner account to list a venue. <Link to="/register">Register</Link> (pick
          "Owner") or <Link to="/login">log in</Link> if you already have one.
        </p>
      </section>
    );
  }

  if (user.role !== "owner") {
    return (
      <section className="page-section" style={{ maxWidth: 480 }}>
        <div className="eyebrow">For owners</div>
        <h2>List your venue</h2>
        <p style={{ marginTop: 12 }}>
          Your account (<strong>{user.email}</strong>) is registered as a client. Listing venues
          is available to owner accounts only — register a separate owner account to continue.
        </p>
      </section>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const venue = await api.createVenue({
        name: form.name,
        category: form.category,
        city: form.city,
        area: form.area,
        capacity: Number(form.capacity),
        price_from: Number(form.price_from),
        amenities: form.amenities
          .split("\n")
          .map((a) => a.trim())
          .filter(Boolean),
        description: form.description,
        host_phone: form.host_phone,
      });
      navigate(`/venues/${venue.slug}`);
    } catch (err) {
      setStatus("err");
      setError(err.message);
    }
  }

  return (
    <section className="page-section" style={{ maxWidth: 560 }}>
      <div className="eyebrow">For owners</div>
      <h2>List your venue</h2>
      <p style={{ marginTop: 8, marginBottom: 20 }}>
        Listing as <strong>{user.name}</strong> ({user.email}). Goes live immediately.
      </p>
      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Venue name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>City</label>
          <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="field">
          <label>Area / neighbourhood</label>
          <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        </div>
        <div className="field">
          <label>Max capacity (guests)</label>
          <input
            type="number"
            required
            min="1"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Starting price (MAD)</label>
          <input
            type="number"
            required
            min="0"
            value={form.price_from}
            onChange={(e) => setForm({ ...form, price_from: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Amenities (one per line)</label>
          <textarea
            value={form.amenities}
            onChange={(e) => setForm({ ...form, amenities: e.target.value })}
            placeholder={"Rooftop terrace\nCentral courtyard\nCatering option"}
          />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="field">
          <label>Contact phone</label>
          <input value={form.host_phone} onChange={(e) => setForm({ ...form, host_phone: e.target.value })} />
        </div>
        <button type="submit" className="btn btn-solid" disabled={status === "sending"} style={{ width: "100%" }}>
          {status === "sending" ? "Publishing…" : "Publish listing"}
        </button>
        {status === "err" && <div className="notice err">{error}</div>}
      </form>
    </section>
  );
}
