import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import VenueCard from "../components/VenueCard.jsx";

const CATEGORIES = [
  { slug: "", name: "All" },
  { slug: "heritage", name: "Heritage & cultural" },
  { slug: "resort", name: "Hospitality & resort" },
  { slug: "private", name: "Private & exclusive" },
  { slug: "nature", name: "Nature & adventure" },
  { slug: "coastal", name: "Coastal & leisure" },
  { slug: "urban", name: "Urban & lifestyle" },
  { slug: "corporate", name: "Corporate & MICE" },
  { slug: "entertainment", name: "Entertainment & production" },
];

export default function Venues() {
  const [params, setParams] = useSearchParams();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  const q = params.get("q") || "";
  const category = params.get("category") || "";

  useEffect(() => {
    setLoading(true);
    api
      .listVenues({ q, category })
      .then((data) => setVenues(data.venues))
      .finally(() => setLoading(false));
  }, [q, category]);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <section className="page-section">
      <h2>Browse venues</h2>

      <div className="search-bar" style={{ marginTop: 16 }}>
        <input
          placeholder="Search by venue, city or amenity…"
          value={q}
          onChange={(e) => updateParam("q", e.target.value)}
        />
      </div>

      <div className="cat-row">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            className={`filter-pill ${category === c.slug ? "active" : ""}`}
            onClick={() => updateParam("category", c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading venues…</p>
      ) : venues.length === 0 ? (
        <p>No venues match your search.</p>
      ) : (
        <div className="venue-grid">
          {venues.map((v) => (
            <VenueCard key={v.id} venue={v} />
          ))}
        </div>
      )}
    </section>
  );
}
