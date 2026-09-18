import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [status, setStatus] = useState(null); // 'saving' | 'ok' | 'err'
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setStatus("err");
      setError("Passwords don't match");
      return;
    }
    try {
      await api.resetPassword({ token, newPassword: form.newPassword });
      setStatus("ok");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setStatus("err");
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <section className="page-section" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h2>Reset password</h2>
        <div className="notice err" style={{ marginTop: 16 }}>
          No reset token found in the link. Request a new one from{" "}
          <Link to="/forgot-password">Forgot password</Link>.
        </div>
      </section>
    );
  }

  return (
    <section className="page-section" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2>Reset password</h2>
      <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
        <div className="field">
          <label>New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-solid" disabled={status === "saving"} style={{ width: "100%" }}>
          {status === "saving" ? "Saving…" : "Set new password"}
        </button>
        {status === "ok" && <div className="notice ok">Password reset — redirecting to log in…</div>}
        {status === "err" && <div className="notice err">{error}</div>}
      </form>
    </section>
  );
}
