import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, user } = await api.register(form);
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
      <h2>Create an account</h2>
      <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Full name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
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
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Account type</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="client">Client — I'm booking a venue</option>
            <option value="owner">Owner — I'm listing a venue</option>
          </select>
        </div>
        <button type="submit" className="btn btn-solid" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Creating account…" : "Register"}
        </button>
        {error && <div className="notice err">{error}</div>}
      </form>
      <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink-faint)" }}>
        Already have an account? <Link to="/login">Log in</Link>.
      </p>
    </section>
  );
}
