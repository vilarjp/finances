export const csrfHeaderName = "x-csrf-token";

export const authDurations = {
  accessTokenSeconds: 15 * 60,
  refreshTokenSeconds: 30 * 24 * 60 * 60,
  concurrentRefreshGraceMs: 10 * 1000,
} as const;
