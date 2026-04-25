import { afterAll, afterEach, vi } from "vitest";

import { stopTestMongoReplicaSet } from "./mongodb-memory.js";

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await stopTestMongoReplicaSet();
});
