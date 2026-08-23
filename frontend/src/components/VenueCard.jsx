import { Link } from "react-router-dom";
import StarRating from "./StarRating.jsx";

export default function VenueCard({ venue }) {
  return (
    <Link to={`/venues/${venue.slug}`} className="venue-card">
      <div className="thumb" style={venue.image ? { backgroundImage: `url(${venue.image})` } : undefined}>
        <span className="venue-tag">{venue.category}</span>
      </div>
      <div className="body">
        <h3>{venue.name}</h3>
        <div className="meta">
          {venue.city} · up to {venue.capacity.toLocaleString()} guests ·{" "}
          <StarRating rating={venue.rating} count={venue.reviews_count} />
        </div>
        <div className="price">
          from <b>{venue.price_from.toLocaleString()} MAD</b>
        </div>
      </div>
    </Link>
  );
}
