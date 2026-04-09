import { readStoredAuthOnboardingState, resolveAuthOnboardingStep } from "./authOnboarding";

describe("resolveAuthOnboardingStep", () => {
  it("shows nickname onboarding before any other step", () => {
    expect(
      resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding: false,
        hasCompletedPermissionOnboarding: false,
        isNotificationSupported: true,
        permissionState: "default",
      }),
    ).toBe("nickname");
  });

  it("shows permission onboarding after nickname when permission is still undecided", () => {
    expect(
      resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding: true,
        hasCompletedPermissionOnboarding: false,
        isNotificationSupported: true,
        permissionState: "default",
      }),
    ).toBe("notification-permission");
  });

  it("skips permission onboarding when permission is already decided", () => {
    expect(
      resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding: true,
        hasCompletedPermissionOnboarding: false,
        isNotificationSupported: true,
        permissionState: "granted",
      }),
    ).toBeNull();
  });

  it("does not return to nickname onboarding after it has been completed", () => {
    expect(
      resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding: true,
        hasCompletedPermissionOnboarding: false,
        isNotificationSupported: true,
        permissionState: "default",
      }),
    ).toBe("notification-permission");
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
