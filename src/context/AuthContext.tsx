"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { User, AuthResponse } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: { name?: string; phone?: string | null }) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.setAuthFailureHandler(() => setUser(null));
    return () => api.setAuthFailureHandler(null);
  }, []);

  // On mount, try to load the current session.
  // If the access token is expired, api.ts's interceptor will automatically
  // refresh it and retry — so we do NOT call refreshSession() manually here.
  // That avoids the old duplicate-refresh bug where bootstrap caused 2 refresh
  // attempts (one from the interceptor, one from AuthContext).
  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      try {
        const currentUser = await api.get<User>("/users/me");
        if (active) setUser(currentUser);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void hydrateSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    api.clearRefreshCooldown();
    setUser(data.user);
  }, []);

  const register = useCallback(async (registerData: RegisterData) => {
    const data = await api.post<AuthResponse>("/auth/register", registerData);
    api.clearRefreshCooldown();
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback(
    async (data: { name?: string; phone?: string | null }) => {
      const res = await api.put<{ message: string; user: User }>(
        "/users/update",
        data
      );
      setUser(res.user);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === "ADMIN",
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
