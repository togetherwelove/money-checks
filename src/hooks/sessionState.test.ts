import { AppMessages } from "../constants/messages";

import {
  createResolvedSessionState,
  createSessionErrorState,
  loadInitialSession,
} from "./sessionState";

describe("loadInitialSession", () => {
  it("returns the resolved session state when getSession succeeds", async () => {
    const session = { access_token: "token" } as never;

    await expect(
      loadInitialSession(async () => ({
        data: {
          session,
        },
      })),
    ).resolves.toEqual({
      errorMessage: null,
      isLoading: false,
      session,
    });
  });

  it("returns a non-loading error state when getSession fails", async () => {
    await expect(
      loadInitialSession(async () => Promise.reject(new Error("broken"))),
    ).resolves.toEqual(createSessionErrorState());
  });
});

describe("createResolvedSessionState", () => {
  it("clears the loading and error state on auth changes", () => {
    const session = { access_token: "token" } as never;

    expect(createResolvedSessionState(session)).toEqual({
      errorMessage: null,
      isLoading: false,
      session,
    });
  });
});

describe("createSessionErrorState", () => {
  it("uses the shared auth session error copy", () => {
    expect(createSessionErrorState()).toEqual({
      errorMessage: AppMessages.authSessionError,
      isLoading: false,
      session: null,
    });
  });
});
