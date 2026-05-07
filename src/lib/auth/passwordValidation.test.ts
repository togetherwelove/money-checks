import { describe, expect, it } from "vitest";

import {
  getPasswordRequirementStates,
  isPasswordConfirmationValid,
  isPasswordValid,
} from "./passwordValidation";

describe("passwordValidation", () => {
  it("requires at least 8 characters with letters and digits", () => {
    expect(isPasswordValid("abcd1234")).toBe(true);
    expect(isPasswordValid("abcdefg")).toBe(false);
    expect(isPasswordValid("12345678")).toBe(false);
    expect(isPasswordValid("abcdef12".slice(0, 7))).toBe(false);
  });

  it("returns requirement states for checklist rendering", () => {
    expect(getPasswordRequirementStates("abc").map((requirement) => requirement.isMet)).toEqual([
      false,
      true,
      false,
    ]);
  });

  it("requires password confirmation to be non-empty and equal", () => {
    expect(isPasswordConfirmationValid("abcd1234", "abcd1234")).toBe(true);
    expect(isPasswordConfirmationValid("abcd1234", "")).toBe(false);
    expect(isPasswordConfirmationValid("abcd1234", "abcd1235")).toBe(false);
  });
});
