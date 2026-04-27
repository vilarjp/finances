import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo } from "react";

import { currentUserQueryKey, fetchCurrentUser, setCurrentUserQueryData } from "@entities/user";
import { apiSessionClearedEventName } from "@shared/api/http-client";

import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const currentUserQuery = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    const handleSessionCleared = () => {
      setCurrentUserQueryData(queryClient, null);
    };

    globalThis.addEventListener(apiSessionClearedEventName, handleSessionCleared);

    return () => {
      globalThis.removeEventListener(apiSessionClearedEventName, handleSessionCleared);
    };
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: currentUserQuery.data ?? null,
      isBootstrapping: currentUserQuery.isPending,
    }),
    [currentUserQuery.data, currentUserQuery.isPending],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
