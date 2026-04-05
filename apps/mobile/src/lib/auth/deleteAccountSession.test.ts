import { describe, expect, it, vi } from "vitest";

import { resolveDeleteAccountAccessToken } from "./deleteAccountSession";

describe("resolveDeleteAccountAccessToken", () => {
  it("returns the refreshed access token when refresh succeeds", async () => {
    const authClient = {
      getSession: vi.fn(async () => ({
        data: {
          session: {
            access_token: "stale-token",
          },
        },
      })),
      refreshSession: vi.fn(async () => ({
        data: {
          session: {
            access_token: "fresh-token",
          },
        },
        error: null,
      })),
    };

    await expect(resolveDeleteAccountAccessToken(authClient)).resolves.toBe("fresh-token");
    expect(authClient.getSession).not.toHaveBeenCalled();
  });

  it("falls back to the stored session when refresh does not return a session", async () => {
    const authClient = {
      getSession: vi.fn(async () => ({
        data: {
          session: {
            access_token: "stored-token",
          },
        },
      })),
      refreshSession: vi.fn(async () => ({
        data: {
          session: null,
        },
        error: null,
      })),
    };

    await expect(resolveDeleteAccountAccessToken(authClient)).resolves.toBe("stored-token");
    expect(authClient.getSession).toHaveBeenCalledTimes(1);
  });
});
