export function getAuthRedirectPath(state: unknown) {
  if (typeof state !== "object" || state === null || !("from" in state)) {
    return "/";
  }

  const from = state.from;

  if (typeof from !== "object" || from === null || !("pathname" in from)) {
    return "/";
  }

  const { pathname } = from;

  if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return "/";
  }

  return pathname;
}
