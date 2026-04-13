import { describe, expect, it } from "vitest";

import { resolveGoogleAuthSession } from "./googleAuthSession";

describe("resolveGoogleAuthSession", () => {
  it("reads Supabase tokens from hash params", () => {
    expect(
      resolveGoogleAuthSession(
        "moneychecks://auth/callback#access_token=access-token&refresh_token=refresh-token",
      ),
    ).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("reads Supabase tokens from query params", () => {
    expect(
      resolveGoogleAuthSession(
        "moneychecks://auth/callback?access_token=access-token&refresh_token=refresh-token",
      ),
    ).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });
});
