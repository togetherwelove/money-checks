import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  },
}));

vi.mock("../supabase", () => ({
  supabase: {
    auth: authMock,
  },
}));

import {
  normalizeEmail,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "./emailPasswordAuth";
import { signOutFromApp } from "./signOut";

describe("emailPasswordAuth", () => {
  beforeEach(() => {
    authMock.signInWithPassword.mockReset();
    authMock.signOut.mockReset();
    authMock.signUp.mockReset();
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

    await expect(signUpWithEmailPassword("  USER@Example.COM ", "Secret123!")).resolves.toBe(
      "signed-in",
    );
  });

  it("returns confirmation-required when sign-up does not create a session", async () => {
    authMock.signUp.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });

    await expect(signUpWithEmailPassword("  USER@Example.COM ", "Secret123!")).resolves.toBe(
      "confirmation-required",
    );
  });

  it("signs the user out without oauth-specific logic", async () => {
    authMock.signOut.mockResolvedValue({ error: null });

    await signOutFromApp();

    expect(authMock.signOut).toHaveBeenCalledTimes(1);
  });
});
