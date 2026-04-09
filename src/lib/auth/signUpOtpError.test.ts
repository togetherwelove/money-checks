import { describe, expect, it } from "vitest";

import { formatSignUpOtpCooldownLabel, parseSignUpOtpRetrySeconds } from "./signUpOtpError";

describe("signUpOtpError", () => {
  it("parses resend retry seconds from the auth error", () => {
    expect(
      parseSignUpOtpRetrySeconds(
        new Error("For security purposes, you can only request this after 56 seconds."),
      ),
    ).toBe(56);
  });

  it("formats cooldown labels as mm:ss", () => {
    expect(formatSignUpOtpCooldownLabel(300)).toBe("5:00");
    expect(formatSignUpOtpCooldownLabel(59)).toBe("0:59");
  });
});
