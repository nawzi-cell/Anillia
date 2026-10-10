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

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    // The login response already contains the user — use it directly instead
    // of a separate /api/auth/me round-trip (which was flaky behind caches).
    const user = await apiFetch<User>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setUser(user);
    return user;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<User | null> => {
      const user = await apiFetch<User>("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      setUser(user);
      return user;
    },
    []
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
