import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type { User } from "../model/types";
import { currentUserQueryKey } from "./current-user";

function isCurrentUserQueryKey(queryKey: QueryKey) {
  return (
    queryKey.length === currentUserQueryKey.length &&
    queryKey.every((value, index) => value === currentUserQueryKey[index])
  );
}

export function clearUserScopedQueryData(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => !isCurrentUserQueryKey(query.queryKey),
  });
}

export function setCurrentUserQueryData(queryClient: QueryClient, user: User | null) {
  clearUserScopedQueryData(queryClient);
  queryClient.setQueryData(currentUserQueryKey, user);
}
