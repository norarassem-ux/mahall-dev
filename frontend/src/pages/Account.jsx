import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Account() {
  const { user, updateProfile } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name || "", email: user?.email || "" });
  const [profileStatus, setProfileStatus] = useState(null); // 'saving' | 'ok' | 'err'
  const [profileError, setProfileError] = useState("");

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwStatus, setPwStatus] = useState(null);
  const [pwError, setPwError] = useState("");

  const [inquiries, setInquiries] = useState(null); // null = loading
  const [inquiriesError, setInquiriesError] = useState("");

  useEffect(() => {
    api
      .myInquiries()
      .then((data) => setInquiries(data.inquiries))
      .catch((err) => setInquiriesError(err.message));
  }, []);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileStatus("saving");
    setProfileError("");
    try {
      const updated = await api.updateMe(profileForm);
      updateProfile(updated);
      setProfileStatus("ok");
    } catch (err) {
      setProfileStatus("err");
      setProfileError(err.message);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwStatus("saving");
    setPwError("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwStatus("err");
      setPwError("New password and confirmation don't match");
      return;
    }
    try {
      await api.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwStatus("ok");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwStatus("err");
      setPwError(err.message);
    }
  }

  if (!user) return null; // RequireAuth handles the redirect before this ever renders

  return (
    <section className="page-section" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2>My account</h2>
      <p style={{ color: "var(--ink-soft)", marginTop: 4 }}>
        Signed in as <strong>{user.email}</strong> ({user.role})
      </p>

      <h3 style={{ marginTop: 28 }}>Profile</h3>
      <form onSubmit={handleProfileSubmit} className="card" style={{ marginTop: 12 }}>
        <div className="field">
          <label>Name</label>
          <input
            required
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            required
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-solid" disabled={profileStatus === "saving"}>
          {profileStatus === "saving" ? "Saving…" : "Save profile"}
        </button>
        {profileStatus === "ok" && <div className="notice ok">Profile updated.</div>}
        {profileStatus === "err" && <div className="notice err">{profileError}</div>}
      </form>

      <h3 style={{ marginTop: 28 }}>Change password</h3>
      <form onSubmit={handlePasswordSubmit} className="card" style={{ marginTop: 12 }}>
        <div className="field">
          <label>Current password</label>
          <input
            type="password"
            required
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          />
        </div>
        <div className="field">
          <label>New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input
            type="password"
            required
            minLength={8}
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-solid" disabled={pwStatus === "saving"}>
          {pwStatus === "saving" ? "Updating…" : "Change password"}
        </button>
        {pwStatus === "ok" && <div className="notice ok">Password changed.</div>}
        {pwStatus === "err" && <div className="notice err">{pwError}</div>}
      </form>

      <h3 style={{ marginTop: 28 }}>My inquiries</h3>
      <div className="card" style={{ marginTop: 12 }}>
        {inquiriesError && <div className="notice err">{inquiriesError}</div>}
        {inquiries === null && !inquiriesError && <p>Loading…</p>}
        {inquiries && inquiries.length === 0 && <p style={{ color: "var(--ink-soft)" }}>No inquiries yet.</p>}
        {inquiries && inquiries.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "6px 8px" }}>Venue</th>
                <th style={{ padding: "6px 8px" }}>Event type</th>
                <th style={{ padding: "6px 8px" }}>Date</th>
                <th style={{ padding: "6px 8px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((i) => (
                <tr key={i.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "6px 8px" }}>{i.venueName}</td>
                  <td style={{ padding: "6px 8px" }}>{i.eventType || "—"}</td>
                  <td style={{ padding: "6px 8px" }}>{i.date || "—"}</td>
                  <td style={{ padding: "6px 8px" }}>{i.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
