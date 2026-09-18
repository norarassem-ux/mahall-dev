const BASE = "/api";

function authHeaders() {
  const token = localStorage.getItem("mahal_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  listVenues: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))
    ).toString();
    return request(`/venues${qs ? `?${qs}` : ""}`);
  },
  getVenue: (idOrSlug) => request(`/venues/${idOrSlug}`),
  createVenue: (payload) => request("/venues", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  sendInquiry: (payload) => request("/inquiries", { method: "POST", body: JSON.stringify(payload) }),
  sendContact: (payload) => request("/contact", { method: "POST", body: JSON.stringify(payload) }),
  myVenues: () => request("/owner/venues"),
  myLeads: () => request("/owner/inquiries"),
  updateMe: (payload) => request("/auth/me", { method: "PATCH", body: JSON.stringify(payload) }),
  changePassword: (payload) => request("/auth/change-password", { method: "POST", body: JSON.stringify(payload) }),
  forgotPassword: (payload) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify(payload) }),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: JSON.stringify(payload) }),
  myInquiries: () => request("/inquiries/mine"),
};
