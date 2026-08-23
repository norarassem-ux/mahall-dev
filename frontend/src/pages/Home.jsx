import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import VenueCard from "../components/VenueCard.jsx";

const CATEGORIES = [
  {
    slug: "heritage",
    name: "Heritage & cultural",
    tagline: "Riads, kasbahs, medina palaces",
    img: "https://images.unsplash.com/photo-1624805098931-098c0d918b34?auto=format&fit=crop&w=800&q=60",
  },
  {
    slug: "resort",
    name: "Hospitality & resort",
    tagline: "Luxury hotels and destination resorts",
    img: "https://images.unsplash.com/photo-1624804821465-5c7c80f99bd1?auto=format&fit=crop&w=800&q=60",
  },
  {
    slug: "private",
    name: "Private & exclusive",
    tagline: "Villas, estates, members' clubs",
    img: "https://images.unsplash.com/photo-1757439402359-aed14d39fc1b?auto=format&fit=crop&w=800&q=60",
  },
  {
    slug: "nature",
    name: "Nature & adventure",
    tagline: "Desert camps, mountain retreats",
    img: "https://images.unsplash.com/photo-1757438059326-f53e8a5adf46?auto=format&fit=crop&w=800&q=60",
  },
  {
    slug: "coastal",
    name: "Coastal & leisure",
    tagline: "Beach clubs, surf lodges, waterfront",
    img: "https://images.unsplash.com/photo-1519594445471-0e5f86b3fb09?auto=format&fit=crop&w=800&q=60",
  },
  {
    slug: "urban",
    name: "Urban & lifestyle",
    tagline: "Rooftop bars, concept spaces",
    img: "https://images.unsplash.com/photo-1758165532022-a68f291317ba?auto=format&fit=crop&w=800&q=60",
  },
  {
    slug: "corporate",
    name: "Corporate & MICE",
    tagline: "Conference centres, event spaces",
    img: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=60",
  },
  {
    slug: "entertainment",
    name: "Entertainment & production",
    tagline: "Studios, stages, outdoor arenas",
    img: "https://images.unsplash.com/photo-1768053921689-1bc09db904c9?auto=format&fit=crop&w=800&q=60",
  },
];

const EDITORIAL_PICKS = [
  {
    name: "Riad Zahra",
    slug: "riad-zahra",
    tag: "Heritage · Marrakech",
    loc: "Medina, Marrakech",
    blurb:
      "The courtyard fountain you'll hear before you see it. At golden hour, the tadelakt walls turn the whole space amber. A first choice for ceremonies under 100.",
    img: "https://images.unsplash.com/photo-1624805098931-098c0d918b34?auto=format&fit=crop&w=800&q=60",
  },
  {
    name: "Agafay Desert Lodge",
    slug: "agafay-desert-lodge",
    tag: "Nature · Marrakech",
    loc: "Agafay Desert, 30min from Marrakech",
    blurb:
      "Rocky desert, not sandy — and all the better for it. The infinity pool at dusk with the Atlas silhouette behind it is genuinely unlike anything else in Morocco.",
    img: "https://images.unsplash.com/photo-1624804821465-5c7c80f99bd1?auto=format&fit=crop&w=800&q=60",
  },
  {
    name: "Atlas Beach Club",
    slug: "atlas-beach-club",
    tag: "Coastal · Essaouira",
    loc: "Essaouira coast",
    blurb:
      "Wind, salt air, and the bluest light in Morocco. Essaouira's trade winds cool even August events — perfect for brands and shoots that need an edge.",
    img: "https://images.unsplash.com/photo-1757439402359-aed14d39fc1b?auto=format&fit=crop&w=800&q=60",
  },
];

const STEPS = [
  {
    icon: "🔍",
    title: "Browse & compare",
    body: "Search by event type, city, or guest count. Filter by category to narrow it down fast.",
  },
  {
    icon: "✉",
    title: "Send an inquiry",
    body: "Contact a venue directly from its listing. Hosts reply by email — no middleman.",
  },
  {
    icon: "✓",
    title: "Confirm & book",
    body: "Agree terms directly with the venue. No platform fees on the conversation.",
  },
];

const HERO_IMG = "https://images.unsplash.com/photo-1757438059326-f53e8a5adf46?auto=format&fit=crop&w=2000&q=70";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.listVenues().then((data) => setFeatured(data.venues.slice(0, 6)));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/venues${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <>
      <section className="hero" style={{ backgroundImage: `url(${HERO_IMG})` }}>
        <div className="eyebrow">Morocco → MENA · est. 2026</div>
        <h1>
          Spaces with stories. <em>Events that belong nowhere else.</em>
        </h1>
        <p>
          Riads, kasbahs, desert camps, beach clubs — Morocco's most distinctive venues, ready to
          host your next event.
        </p>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            placeholder='"outdoor wedding for 120 near Marrakech"'
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit" className="btn btn-solid">
            Search
          </button>
        </form>
        <div className="search-hint">describe what you need in plain language</div>
      </section>

      <section id="categories">
        <div className="eyebrow">Browse by category</div>
        <h2 style={{ marginTop: 6 }}>Eight worlds, one ecosystem</h2>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/venues?category=${c.slug}`}
              className="cat-card"
              style={{ backgroundImage: `url(${c.img})` }}
            >
              <h3>{c.name}</h3>
              <p>{c.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="eyebrow">Summer 2026 picks</div>
        <h2 style={{ marginTop: 6 }}>Venues we love right now</h2>
        <p style={{ color: "var(--ink-soft)", marginTop: 8, maxWidth: "60ch" }}>
          Three spaces our team has visited, photographed, and can personally vouch for.
        </p>
        <div className="edit-grid">
          {EDITORIAL_PICKS.map((p) => (
            <Link key={p.slug} to={`/venues/${p.slug}`} className="edit-card">
              <div className="edit-img" style={{ backgroundImage: `url(${p.img})` }}>
                <span className="venue-tag">{p.tag}</span>
              </div>
              <div className="edit-body">
                <h3>{p.name}</h3>
                <div className="loc">{p.loc}</div>
                <p>{p.blurb}</p>
                <div className="curator">Mahal editorial team</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="eyebrow">Featured listings</div>
        <h2 style={{ marginTop: 6 }}>Where your next event could happen</h2>
        <div className="venue-grid">
          {featured.map((v) => (
            <VenueCard key={v.id} venue={v} />
          ))}
        </div>
        <Link to="/venues" className="btn">
          Browse all venues ➤
        </Link>
      </section>

      <section>
        <div className="eyebrow">Three steps</div>
        <h2 style={{ marginTop: 6 }}>How Mahal works</h2>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step-card" key={s.title}>
              <div className="step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <h2>Own a space worth discovering?</h2>
        <p>
          List your venue on Mahal and start receiving qualified inquiries from event planners,
          brands, and travellers across Morocco.
        </p>
        <Link to="/list-your-venue" className="btn btn-solid">
          Register your venue ➤
        </Link>
      </section>
    </>
  );
}
