import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: {
    resend: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    verifyOtp: vi.fn(),
  },
}));

vi.mock("../supabase", () => ({
  supabase: {
    auth: authMock,
  },
}));

import {
  normalizeEmail,
  resendEmailSignUpOtp,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  verifyEmailSignUpOtp,
} from "./emailPasswordAuth";
import { signOutFromApp } from "./signOut";

describe("emailPasswordAuth", () => {
  beforeEach(() => {
    authMock.resend.mockReset();
    authMock.signInWithPassword.mockReset();
    authMock.signOut.mockReset();
    authMock.signUp.mockReset();
    authMock.verifyOtp.mockReset();
  });

  it("normalizes email input", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });

  it("signs in with the normalized email and password", async () => {
    authMock.signInWithPassword.mockResolvedValue({ error: null });

    await signInWithEmailPassword("  USER@Example.COM ", "Secret123!");

    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "Secret123!",
    });
  });

  it("returns signed-in when sign-up creates a session", async () => {
    authMock.signUp.mockResolvedValue({
      data: {
        session: { access_token: "token" },
      },
      error: null,
    });

    await expect(
      signUpWithEmailPassword("  USER@Example.COM ", "Secret123!", "captcha-token"),
    ).resolves.toBe("signed-in");

    expect(authMock.signUp).toHaveBeenCalledWith({
      email: "user@example.com",
      options: {
        captchaToken: "captcha-token",
      },
      password: "Secret123!",
    });
  });

  it("returns otp-required when sign-up does not create a session", async () => {
    authMock.signUp.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });

    await expect(
      signUpWithEmailPassword("  USER@Example.COM ", "Secret123!", "captcha-token"),
    ).resolves.toBe("otp-required");
  });

  it("verifies sign-up otp with the normalized email", async () => {
    authMock.verifyOtp.mockResolvedValue({ error: null });

    await verifyEmailSignUpOtp("  USER@Example.COM ", "123456");

    expect(authMock.verifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "123456",
      type: "email",
    });
  });

  it("resends the sign-up otp with the normalized email", async () => {
    authMock.resend.mockResolvedValue({ error: null });

    await resendEmailSignUpOtp("  USER@Example.COM ");

    expect(authMock.resend).toHaveBeenCalledWith({
      email: "user@example.com",
      type: "signup",
    });
  });

  it("signs the user out without oauth-specific logic", async () => {
    authMock.signOut.mockResolvedValue({ error: null });

    await signOutFromApp();

    expect(authMock.signOut).toHaveBeenCalledTimes(1);
  });
});
