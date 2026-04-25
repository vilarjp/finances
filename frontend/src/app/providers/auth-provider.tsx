import { useQuery } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";

import { fetchCurrentUser } from "@entities/user";

import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: PropsWithChildren) {
  const currentUserQuery = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 60_000,
  });

  const value = useMemo(
    () => ({
      user: currentUserQuery.data ?? null,
      isBootstrapping: currentUserQuery.isPending,
    }),
    [currentUserQuery.data, currentUserQuery.isPending],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
