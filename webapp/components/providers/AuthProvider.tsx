"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type UserRole = "user" | "admin" | "sudo_admin" | "super_admin";

type User = {
  name: string | null;
  email: string;
  initials: string;
  role: UserRole;
  plan?: string;
  purchased?: boolean;
};

type AuthContextValue = {
  loggedIn: boolean;
  user: User | null;
  login: (user?: Partial<User>) => void;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  admin: 1,
  sudo_admin: 2,
  super_admin: 3,
};

export function hasRole(user: User | null, allowed: UserRole[]): boolean {
  if (!user) return false;
  const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
  return allowed.some((role) => userLevel >= ROLE_HIERARCHY[role]);
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/$/, "");

// The session is an httpOnly+Secure+SameSite cookie set by the backend.
// We keep only a client-side mirror of `loggedIn` for UX; the backend is
// the authoritative gate on every API call (cookies sent automatically).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // On mount, ask the backend whether a session cookie is valid (survives refresh).
  useEffect(() => {
    let active = true;
    fetch(`${BACKEND_BASE}/auth/me`, {
      method: "GET",
      headers: { "X-Requested-With": "nyayantar" },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.authenticated && data.user) {
          const u = data.user;
          const name: string | null = u.name ?? null;
          const email: string = u.email ?? "";
          const role: UserRole = (u.role as UserRole) || "user";
          const initials = (name || email)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p: string) => p[0]?.toUpperCase())
            .join("") || (email ? email[0]?.toUpperCase() : "U");
          setUser({
            name,
            email,
            role,
            initials: initials || "U",
            plan: u.plan ?? "free",
            purchased: Boolean(u.purchased),
          });
          setLoggedIn(true);
        }
      })
      .catch(() => {
        /* network error -> stay logged out */
      });
    return () => {
      active = false;
    };
  }, []);

  const login = (next?: Partial<User>) => {
    const merged: User = { name: null, email: "", initials: "U", role: "user", plan: "free", purchased: false, ...next };
    setUser(merged);
    setLoggedIn(true);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_BASE}/auth/logout`, {
        method: "POST",
        headers: { "X-Requested-With": "nyayantar" },
        credentials: "include",
      });
    } catch {
      // ignore network errors on logout; clear local state anyway
    }
    setLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ loggedIn, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// Headers for API calls: same-origin cookies are sent via credentials:"include".
// X-Requested-With provides CSRF protection (not sendable cross-site).
export function getAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Requested-With": "nyayantar",
  };
}
