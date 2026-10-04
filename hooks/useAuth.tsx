"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, type User } from "@/lib/api/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (name: string, email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<User | null> => {
    try {
      const data = await apiFetch<{ user: User }>("/api/auth/me");
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<User | null> => {
      await apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
      // Return the refreshed session so callers can verify the browser
      // actually kept the session cookie before navigating.
      return refresh();
    },
    [refresh]
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<User | null> => {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      return refresh();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
