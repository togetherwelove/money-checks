import { readStoredAuthOnboardingState, resolveAuthOnboardingStep } from "./authOnboarding";

describe("resolveAuthOnboardingStep", () => {
  it("shows nickname onboarding before any other step", () => {
    expect(
      resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding: false,
        hasResolvedDisplayName: false,
      }),
    ).toBe("nickname");
  });

  it("skips nickname onboarding when a usable display name is already available", () => {
    expect(
      resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding: false,
        hasResolvedDisplayName: true,
      }),
    ).toBeNull();
  });

  it("does not show permission onboarding after nickname", () => {
    expect(
      resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding: true,
        hasResolvedDisplayName: false,
      }),
    ).toBeNull();
  });

  it("does not return to nickname onboarding after it has been completed", () => {
    expect(
      resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding: true,
        hasResolvedDisplayName: false,
      }),
    ).toBeNull();
  });
});

describe("readStoredAuthOnboardingState", () => {
  it("reads both onboarding completion flags from storage", () => {
    const storage = {
      getItem: vi.fn((key: string) => {
        if (key.includes("nickname")) {
          return "true";
        }

        return "false";
      }),
    };

    expect(readStoredAuthOnboardingState(storage, "user-1")).toEqual({
      hasCompletedNicknameOnboarding: true,
      hasCompletedPermissionOnboarding: false,
    });
  });
});
