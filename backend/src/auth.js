import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Chain after requireAuth. Admins have full access across owner-scoped
// resources (see routes/owner.js) — a real account created directly in
// the DB, not something self-registration can produce (see
// routes/auth.js's /register, which only ever assigns client/owner).
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin accounts only" });
  }
  next();
}

const RESET_TOKEN_PURPOSE = "password_reset";

// Short-lived, single-purpose token standing in for a real "email me a
// reset link" flow — this project has no SMTP/email service configured
// (see RUNBOOK's WordPress pre-launch checklist for the same open gap),
// so /forgot-password hands the token straight back in the API response
// instead of emailing it. Same JWT_SECRET/library as login tokens, but
// scoped by `purpose` so a normal login token can't be used to reset a
// password and vice versa.
export function signResetToken(user) {
  return jwt.sign({ sub: user.id, purpose: RESET_TOKEN_PURPOSE }, JWT_SECRET, { expiresIn: "30m" });
}

export function verifyResetToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  if (payload.purpose !== RESET_TOKEN_PURPOSE) throw new Error("Not a reset token");
  return payload;
}

// Attaches req.user if a valid token is present, but never rejects —
// for endpoints (inquiries, contact) anonymous visitors can also use.
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // ignore — proceed unauthenticated
    }
  }
  next();
}
