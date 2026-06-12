import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "hometown-hub-auth";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { token: "", user: null };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  async function register(payload) {
    const result = await api.register(payload);
    setSession({ token: result.token, user: result.user });
    return result;
  }

  async function login(payload) {
    const result = await api.login(payload);
    setSession({ token: result.token, user: result.user });
    return result;
  }

  async function refreshUser() {
    if (!session.token) {
      return null;
    }

    const result = await api.getMe(session.token);
    setSession((current) => ({ ...current, user: result.user }));
    return result.user;
  }

  async function updateProfile(payload) {
    const result = await api.updateMe(payload, session.token);
    setSession((current) => ({ ...current, user: result.user }));
    return result.user;
  }

  function logout() {
    setSession({ token: "", user: null });
  }

  return (
    <AuthContext.Provider
      value={{
        token: session.token,
        user: session.user,
        isAuthenticated: Boolean(session.token),
        register,
        login,
        refreshUser,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
