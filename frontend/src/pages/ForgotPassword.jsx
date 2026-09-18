import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // 'sending' | 'ok' | 'err'
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const data = await api.forgotPassword({ email });
      setResult(data);
      setStatus("ok");
    } catch (err) {
      setStatus("err");
      setError(err.message);
    }
  }

  return (
    <section className="page-section" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2>Forgot password</h2>
      <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-solid" disabled={status === "sending"} style={{ width: "100%" }}>
          {status === "sending" ? "Sending…" : "Send reset link"}
        </button>
        {status === "err" && <div className="notice err">{error}</div>}
      </form>

      {status === "ok" && result && (
        <div className="card" style={{ marginTop: 16 }}>
          <p>{result.note}</p>
          {result.resetPath && (
            <p style={{ marginTop: 10 }}>
              <Link to={result.resetPath} className="btn btn-solid">
                Reset your password
              </Link>
            </p>
          )}
        </div>
      )}

      <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink-faint)" }}>
        <Link to="/login">Back to log in</Link>
      </p>
    </section>
  );
}
