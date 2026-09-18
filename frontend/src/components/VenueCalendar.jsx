import { useEffect, useState } from "react";
import { api } from "../api.js";

const STATUS_COLOR = {
  pending: "var(--gold)",
  confirmed: "var(--teal)",
  cancelled: "var(--ink-faint)",
};

function normalizeStatus(s) {
  return (s || "").toLowerCase();
}

// event_date is a free-text VARCHAR2 — AGENTS.md flags real rows in
// inconsistent formats (e.g. "15/5/2027" alongside ISO "2027-02-04").
// Best-effort parse; a booking whose date doesn't parse just won't plot.
function parseEventDate(raw) {
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function VenueCalendar({ venues }) {
  const [venueId, setVenueId] = useState(venues[0]?.id || "");
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    if (!venueId) return;
    setBookings(null);
    setError("");
    api
      .venueBookings(venueId)
      .then((d) => setBookings(d.bookings))
      .catch((err) => setError(err.message));
  }, [venueId]);

  if (venues.length === 0) return null;

  const byDay = new Map();
  (bookings || []).forEach((b) => {
    const d = parseEventDate(b.eventDate);
    if (!d) return;
    if (d.getFullYear() !== cursor.getFullYear() || d.getMonth() !== cursor.getMonth()) return;
    const key = d.getDate();
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(b);
  });

  const firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div className="field" style={{ margin: 0, minWidth: 220 }}>
          <label>Venue</label>
          <select value={venueId} onChange={(e) => setVenueId(e.target.value)}>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="btn"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            ←
          </button>
          <strong style={{ minWidth: 150, textAlign: "center" }}>{monthLabel}</strong>
          <button
            type="button"
            className="btn"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            →
          </button>
        </div>
      </div>

      {error && <div className="notice err">{error}</div>}

      {bookings === null ? (
        <p style={{ marginTop: 16 }}>Loading…</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 16 }}>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", textAlign: "center" }}>
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              const dayBookings = day ? byDay.get(day) || [] : [];
              return (
                <div
                  key={i}
                  style={{
                    minHeight: 56,
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: day ? "var(--bg-card)" : "transparent",
                    padding: 4,
                    fontSize: 12,
                  }}
                >
                  {day && <div style={{ color: "var(--ink-faint)" }}>{day}</div>}
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      title={`${normalizeStatus(b.status)} · ${b.guestCount || "?"} guests`}
                      style={{
                        marginTop: 2,
                        borderRadius: 5,
                        padding: "1px 5px",
                        fontSize: 10.5,
                        color: "#fff",
                        background: STATUS_COLOR[normalizeStatus(b.status)] || "var(--terracotta)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {normalizeStatus(b.status)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: "var(--ink-soft)", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>
              <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: "var(--gold)", marginRight: 5 }} />
              pending
            </span>
            <span>
              <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: "var(--teal)", marginRight: 5 }} />
              confirmed
            </span>
            <span>
              <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: "var(--ink-faint)", marginRight: 5 }} />
              cancelled
            </span>
          </div>
        </>
      )}
    </div>
  );
}
