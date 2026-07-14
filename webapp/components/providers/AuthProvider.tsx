"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { defaultUser } from "@/lib/constants";

type User = {
  name: string;
  email: string;
  initials: string;
};

type AuthContextValue = {
  loggedIn: boolean;
  user: User | null;
  login: (user?: Partial<User>) => void;
  logout: () => void;
};

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
