import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import VenueCard from "../components/VenueCard.jsx";
import VenueCalendar from "../components/VenueCalendar.jsx";

export default function OwnerDashboard() {
  const { user, ready } = useAuth();
  const [venues, setVenues] = useState(null);
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const [actioning, setActioning] = useState(null);
  const [actionError, setActionError] = useState("");

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

  async function handleDecision(inquiryId, action) {
    setActionError("");
    setActioning(inquiryId);
    try {
      if (action === "approve") {
        await api.approveInquiry(inquiryId);
        setLeads((prev) => prev.map((l) => (l.id === inquiryId ? { ...l, status: "approved" } : l)));
      } else {
        await api.rejectInquiry(inquiryId);
        setLeads((prev) => prev.map((l) => (l.id === inquiryId ? { ...l, status: "rejected" } : l)));
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActioning(null);
    }
  }

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
      {actionError && <div className="notice err">{actionError}</div>}
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
              {user.role === "admin" && (
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-teal"
                    disabled={actioning === l.id || l.status === "approved"}
                    onClick={() => handleDecision(l.id, "approve")}
                  >
                    {actioning === l.id ? "Working…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={actioning === l.id}
                    onClick={() => handleDecision(l.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {user.role === "admin" && venues && venues.length > 0 && (
        <>
          <h3 style={{ marginTop: 32, marginBottom: 12, fontSize: 18 }}>Booking calendar</h3>
          <VenueCalendar venues={venues} />
        </>
      )}
    </section>
  );
}
