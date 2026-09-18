import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("mahal_token");
    if (!token) {
      setReady(true);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem("mahal_token"))
      .finally(() => setReady(true));
  }, []);

  function login(token, userData) {
    localStorage.setItem("mahal_token", token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("mahal_token");
    setUser(null);
  }

  // For after a profile edit (PATCH /auth/me) — updates the in-memory
  // user without touching the token, which doesn't change.
  function updateProfile(userData) {
    setUser((u) => ({ ...u, ...userData }));
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
