import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import StarRating from "../components/StarRating.jsx";

export default function VenueDetail() {
  const { idOrSlug } = useParams();
  const { user } = useAuth();
  const [venue, setVenue] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", eventType: "", date: "", guests: "", message: "" });
  const [status, setStatus] = useState(null); // 'sending' | 'ok' | 'err'
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getVenue(idOrSlug)
      .then(setVenue)
      .catch(() => setNotFound(true));
  }, [idOrSlug]);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: user.name, email: user.email }));
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await api.sendInquiry({ venueId: venue.id, ...form });
      setStatus("ok");
      setForm({ name: user?.name || "", email: user?.email || "", eventType: "", date: "", guests: "", message: "" });
    } catch (err) {
      setStatus("err");
      setError(err.message);
    }
  }

  if (notFound) return <p style={{ padding: "40px 0" }}>Venue not found.</p>;
  if (!venue) return <p style={{ padding: "40px 0" }}>Loading…</p>;

  return (
    <section style={{ padding: "24px 0" }}>
      <div className="eyebrow">{venue.category}</div>
      <h1>{venue.name}</h1>
      <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>
        {venue.city}, {venue.area} · up to {venue.capacity.toLocaleString()} guests ·{" "}
        <StarRating rating={venue.rating} count={venue.reviews_count} showLabel={false} /> ({venue.reviews_count}{" "}
        reviews)
      </p>

      <div className="venue-hero" style={venue.image ? { backgroundImage: `url(${venue.image})` } : undefined} />

      <div className="venue-layout">
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>About this venue</h2>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.7 }}>{venue.description}</p>

          <h2 style={{ fontSize: 20, margin: "24px 0 10px" }}>Amenities</h2>
          <div>
            {venue.amenities.map((a) => (
              <span key={a} className="amen">
                {a}
              </span>
            ))}
          </div>

          <h2 style={{ fontSize: 20, margin: "24px 0 10px" }}>Host</h2>
          <p style={{ color: "var(--ink-soft)" }}>{venue.host_name}</p>
        </div>

        <div className="card">
          <div style={{ marginBottom: 14 }}>
            from <b style={{ color: "var(--gold)", fontFamily: "Fraunces, serif", fontSize: 20 }}>
              {venue.price_from.toLocaleString()} MAD
            </b>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Your name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Event type</label>
              <input
                value={form.eventType}
                onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                placeholder="Wedding, offsite, shoot…"
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field">
              <label>Guest count</label>
              <input
                type="number"
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Message</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-solid" disabled={status === "sending"} style={{ width: "100%" }}>
              {status === "sending" ? "Sending…" : "Send inquiry"}
            </button>
            {status === "ok" && <div className="notice ok">Inquiry sent — the host will reply by email.</div>}
            {status === "err" && <div className="notice err">{error}</div>}
          </form>
        </div>
      </div>
    </section>
  );
}
