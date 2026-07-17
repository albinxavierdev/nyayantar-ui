"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { defaultUser } from "@/lib/constants";

export type UserRole = "user" | "admin" | "sudo_admin" | "super_admin";

type User = {
  name: string;
  email: string;
  initials: string;
  role: UserRole;
};

type AuthContextValue = {
  loggedIn: boolean;
  user: User | null;
  login: (user?: Partial<User>) => void;
  logout: () => void;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = (next?: Partial<User>) => {
    setUser({ ...defaultUser, ...next });
    setLoggedIn(true);
  };

  const logout = () => {
    setLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ loggedIn, user, login, logout }}>
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
