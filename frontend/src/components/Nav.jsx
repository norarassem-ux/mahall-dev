import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Nav() {
  const { user, logout } = useAuth();

  return (
    <nav className="mahall-nav">
      <Link to="/" className="brand">
        Mahal
      </Link>
      <div className="links">
        <Link to="/venues">Venues</Link>
        <Link to="/#categories">Categories</Link>
        <Link to="/list-your-venue">For owners</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/faq">FAQ</Link>
      </div>
      <div className="actions">
        {user ? (
          <>
            <span className="eyebrow">{user.name}</span>
            {user.role === "owner" && (
              <>
                <Link to="/dashboard" className="btn">
                  Dashboard
                </Link>
                <Link to="/list-your-venue" className="btn btn-solid">
                  List venue
                </Link>
              </>
            )}
            <button className="btn" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn">
              Log in
            </Link>
            <Link to="/register" className="btn btn-solid">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
