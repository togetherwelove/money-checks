import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: {
    resetPasswordForEmail: vi.fn(),
    setSession: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock("../supabase", () => ({
  supabase: {
    auth: authMock,
  },
}));

vi.mock("expo-auth-session", () => ({
  makeRedirectUri: () => "moneychecks://password-reset",
}));

import {
  completePasswordRecoveryRedirect,
  isPasswordRecoveryRedirectUrl,
  requestEmailPasswordReset,
  updateEmailPassword,
} from "./passwordReset";

describe("passwordReset", () => {
  beforeEach(() => {
    authMock.resetPasswordForEmail.mockReset();
    authMock.setSession.mockReset();
    authMock.updateUser.mockReset();
  });

  it("requests a password reset email with the normalized email", async () => {
    authMock.resetPasswordForEmail.mockResolvedValue({ error: null });

    await requestEmailPasswordReset("  USER@Example.COM ");

    expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("password-reset"),
      }),
    );
  });

  it("detects and completes a password recovery redirect", async () => {
    authMock.setSession.mockResolvedValue({ error: null });
    const redirectUrl =
      "moneychecks://password-reset#type=recovery&access_token=access&refresh_token=refresh";

    expect(isPasswordRecoveryRedirectUrl(redirectUrl)).toBe(true);

    await completePasswordRecoveryRedirect(redirectUrl);

    expect(authMock.setSession).toHaveBeenCalledWith({
      access_token: "access",
      refresh_token: "refresh",
    });
  });

  it("updates the current user's password", async () => {
    authMock.updateUser.mockResolvedValue({ error: null });

    await updateEmailPassword("NewSecret123!");

    expect(authMock.updateUser).toHaveBeenCalledWith({
      password: "NewSecret123!",
    });
  });
});
