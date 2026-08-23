import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mahall-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="brand">Mahal</div>
          <p>Morocco's most distinctive venue marketplace. From medina riads to Sahara camps.</p>
        </div>
        <div className="footer-col">
          <div className="eyebrow">Explore</div>
          <Link to="/venues">All venues</Link>
          <Link to="/venues?category=heritage">Heritage spaces</Link>
          <Link to="/venues?category=coastal">Coastal venues</Link>
          <Link to="/venues?category=corporate">Corporate</Link>
        </div>
        <div className="footer-col">
          <div className="eyebrow">Owners</div>
          <Link to="/list-your-venue">List your venue</Link>
          <Link to="/pricing">Pricing & plans</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
        <div className="footer-col">
          <div className="eyebrow">Help</div>
          <Link to="/register">Register</Link>
          <Link to="/login">Log in</Link>
          <Link to="/contact">Contact us</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/about">About</Link>
        </div>
      </div>
      <div className="footer-bottom">&copy; 2026 Mahal — Morocco → MENA</div>
    </footer>
  );
}
