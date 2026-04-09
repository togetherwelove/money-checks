import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";
import { resolveDeleteAccountAccessToken } from "./resolveDeleteAccountAccessToken";

describe("resolveDeleteAccountAccessToken", () => {
  it("returns the refreshed token when refresh succeeds", async () => {
    const authClient = {
      getSession: vi.fn(async () => ({
        data: {
          session: null,
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

  it("falls back to the stored session when refresh returns no token", async () => {
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

  it("throws when no usable session exists", async () => {
    const authClient = {
      getSession: vi.fn(async () => ({
        data: {
          session: null,
        },
      })),
      refreshSession: vi.fn(async () => ({
        data: {
          session: null,
        },
        error: new Error("refresh failed"),
      })),
    };

    await expect(resolveDeleteAccountAccessToken(authClient)).rejects.toThrow(
      AccountDeletionMessages.errorFallback,
    );
  });
});
