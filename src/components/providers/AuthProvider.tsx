"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  clearSession,
  loadSession,
  login as doLogin,
  register as doRegister,
  seedDemoUsers,
  type AuthResult,
  type Role,
  type Session,
} from "@/lib/auth";

interface Ctx {
  session: Session | null;
  ready: boolean;
  login: (email: string, password: string) => AuthResult;
  register: (name: string, email: string, password: string, role?: Role) => AuthResult;
  logout: () => void;
}

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDemoUsers(); // ensure demo login accounts exist for presentations
    setSession(loadSession());
    setReady(true);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const res = doLogin(email, password);
    if (res.ok) setSession(res.session);
    return res;
  }, []);

  const register = useCallback(
    (name: string, email: string, password: string, role: Role = "citizen") => {
      const res = doRegister(name, email, password, role);
      if (res.ok) setSession(res.session);
      return res;
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
