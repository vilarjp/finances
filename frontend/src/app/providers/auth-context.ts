import { createContext, useContext } from "react";

import type { User } from "@entities/user";

export interface AuthContextValue {
  user: User | null;
  isBootstrapping: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
