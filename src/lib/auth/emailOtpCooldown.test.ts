import { describe, expect, it } from "vitest";

import {
  calculateEmailOtpResendAvailableAt,
  calculateRemainingEmailOtpCooldownSeconds,
  createEmailOtpCooldownKey,
  formatEmailOtpCooldownLabel,
} from "./emailOtpCooldown";

describe("emailOtpCooldown", () => {
  it("uses the normalized email as the cooldown key", () => {
    expect(createEmailOtpCooldownKey("  USER@Example.COM ")).toBe("user@example.com");
  });

  it("calculates remaining cooldown seconds", () => {
    expect(calculateRemainingEmailOtpCooldownSeconds(10_500, 10_000)).toBe(1);
    expect(calculateRemainingEmailOtpCooldownSeconds(10_000, 10_000)).toBe(0);
    expect(calculateRemainingEmailOtpCooldownSeconds(null, 10_000)).toBe(0);
  });

  it("formats cooldown labels as mm:ss", () => {
    expect(formatEmailOtpCooldownLabel(300)).toBe("5:00");
    expect(formatEmailOtpCooldownLabel(59)).toBe("0:59");
  });

  it("adds the configured cooldown duration", () => {
    expect(calculateEmailOtpResendAvailableAt(1_000)).toBe(301_000);
  });
});
