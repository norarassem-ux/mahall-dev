import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, user } = await api.login(form);
      login(token, user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-section" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2>Log in</h2>
      <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-solid" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Logging in…" : "Log in"}
        </button>
        {error && <div className="notice err">{error}</div>}
      </form>
      <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink-faint)" }}>
        Demo login: client@example.com / password123. No account? <Link to="/register">Register</Link>.
      </p>
    </section>
  );
}
