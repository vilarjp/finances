import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "./errors";

describe("getApiErrorMessage", () => {
  it("uses error messages with a stable fallback for unknown failures", () => {
    expect(getApiErrorMessage(new Error("Backend failed."), "Fallback failed.")).toBe(
      "Backend failed.",
    );
    expect(getApiErrorMessage("nope", "Fallback failed.")).toBe("Fallback failed.");
  });
});
