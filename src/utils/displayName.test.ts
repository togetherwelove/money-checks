import { describe, expect, it } from "vitest";

import { isValidDisplayName, normalizeDisplayNameCandidate } from "./displayName";

describe("displayName", () => {
  it("treats email-like values as invalid display names", () => {
    expect(normalizeDisplayNameCandidate("user@example.com")).toBe("");
    expect(isValidDisplayName("user@example.com")).toBe(false);
  });

  it("requires a non-empty non-email display name", () => {
    expect(isValidDisplayName("")).toBe(false);
    expect(isValidDisplayName("   ")).toBe(false);
    expect(isValidDisplayName("머니체크")).toBe(true);
  });
});
