import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

// Wraps a protected page. Waits for AuthContext's initial /auth/me check
// (`ready`) before deciding, so a logged-in user on a hard refresh isn't
// bounced to /login for a flash before their token is verified. Optional
// `roles` restricts to specific roles (e.g. ["owner", "admin"]) — the
// same "admin bypasses owner-only" pattern used in the backend.
export default function RequireAuth({ roles, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <p style={{ padding: "60px 0" }}>You don't have access to this page.</p>;
  }

  return children;
}
