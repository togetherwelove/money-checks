import type { BrowserNotificationPermissionState } from "./notifications/browserNotifications";

const NICKNAME_ONBOARDING_KEY_PREFIX = "moneychecks.auth-onboarding.nickname.v1";
const PERMISSION_ONBOARDING_KEY_PREFIX = "moneychecks.auth-onboarding.permission.v1";

export type AuthOnboardingStep = "nickname" | "notification-permission" | null;
export type StoredAuthOnboardingState = {
  hasCompletedNicknameOnboarding: boolean;
  hasCompletedPermissionOnboarding: boolean;
};

type AuthOnboardingStorage = {
  getItem: (key: string) => string | null;
};

type ResolveAuthOnboardingStepOptions = {
  hasCompletedNicknameOnboarding: boolean;
  hasCompletedPermissionOnboarding: boolean;
  isNotificationSupported: boolean;
  permissionState: BrowserNotificationPermissionState;
};

export function resolveAuthOnboardingStep(
  options: ResolveAuthOnboardingStepOptions,
): AuthOnboardingStep {
  if (!options.hasCompletedNicknameOnboarding) {
    return "nickname";
  }

  if (
    options.isNotificationSupported &&
    options.permissionState === "default" &&
    !options.hasCompletedPermissionOnboarding
  ) {
    return "notification-permission";
  }

  return null;
}

export function createNicknameOnboardingKey(userId: string): string {
  return `${NICKNAME_ONBOARDING_KEY_PREFIX}.${userId}`;
}

export function createPermissionOnboardingKey(userId: string): string {
  return `${PERMISSION_ONBOARDING_KEY_PREFIX}.${userId}`;
}

export function readStoredAuthOnboardingState(
  storage: AuthOnboardingStorage,
  userId: string,
): StoredAuthOnboardingState {
  return {
    hasCompletedNicknameOnboarding: storage.getItem(createNicknameOnboardingKey(userId)) === "true",
    hasCompletedPermissionOnboarding:
      storage.getItem(createPermissionOnboardingKey(userId)) === "true",
  };
}
