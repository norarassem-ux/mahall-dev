import { useState } from "react";
import { api } from "../api.js";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await api.sendContact(form);
      setStatus("ok");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("err");
      setError(err.message);
    }
  }

  return (
    <section className="page-section" style={{ maxWidth: 480 }}>
      <div className="eyebrow">Get in touch</div>
      <h2>Contact us</h2>
      <p style={{ marginBottom: 20 }}>
        Questions about listing a venue, a booking, or partnering with Mahal — send a message and
        we'll reply by email.
      </p>
      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Name</label>
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
          <label>Message</label>
          <textarea
            required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-solid" disabled={status === "sending"} style={{ width: "100%" }}>
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        {status === "ok" && <div className="notice ok">Message sent — thanks, we'll be in touch.</div>}
        {status === "err" && <div className="notice err">{error}</div>}
      </form>
    </section>
  );
}
