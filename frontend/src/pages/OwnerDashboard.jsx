import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import VenueCard from "../components/VenueCard.jsx";

export default function OwnerDashboard() {
  const { user, ready } = useAuth();
  const [venues, setVenues] = useState(null);
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");

  const isOwnerOrAdmin = user && (user.role === "owner" || user.role === "admin");

  useEffect(() => {
    if (!isOwnerOrAdmin) return;
    Promise.all([api.myVenues(), api.myLeads()])
      .then(([v, l]) => {
        setVenues(v.venues);
        setLeads(l.inquiries);
      })
      .catch((err) => setError(err.message));
  }, [user]);

  if (!ready) return null;

  if (!isOwnerOrAdmin) {
    return (
      <section className="page-section" style={{ maxWidth: 480 }}>
        <div className="eyebrow">Owner dashboard</div>
        <h2>Owner accounts only</h2>
        <p style={{ marginTop: 12 }}>
          <Link to="/login">Log in</Link> with an owner account to see your listings and leads.
        </p>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="eyebrow">{user.role === "admin" ? "Admin dashboard — all venues" : "Owner dashboard"}</div>
      <h2>Welcome, {user.name}</h2>

      {error && <div className="notice err">{error}</div>}

      <h3 style={{ marginTop: 32, marginBottom: 12, fontSize: 18 }}>My venues</h3>
      {!venues ? (
        <p>Loading…</p>
      ) : venues.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>
          No listings yet. <Link to="/list-your-venue">List your first venue</Link>.
        </p>
      ) : (
        <div className="venue-grid">
          {venues.map((v) => (
            <VenueCard key={v.id} venue={v} />
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 32, marginBottom: 12, fontSize: 18 }}>Leads</h3>
      {!leads ? (
        <p>Loading…</p>
      ) : leads.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>No inquiries yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {leads.map((l) => (
            <div className="card" key={l.id}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <strong>{l.venueName}</strong>
                <span className="eyebrow">{l.status}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 13.5, color: "var(--ink-soft)" }}>
                {l.name} &lt;{l.email}&gt;
                {l.eventType && ` · ${l.eventType}`}
                {l.date && ` · ${l.date}`}
                {l.guests && ` · ${l.guests} guests`}
              </div>
              {l.message && <p style={{ marginTop: 8, fontSize: 13.5 }}>{l.message}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
