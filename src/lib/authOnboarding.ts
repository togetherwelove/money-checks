const NICKNAME_ONBOARDING_KEY_PREFIX = "moneychecks.auth-onboarding.nickname.v1";
const PERMISSION_ONBOARDING_KEY_PREFIX = "moneychecks.auth-onboarding.permission.v1";

export type AuthOnboardingStep = "nickname" | null;
export type StoredAuthOnboardingState = {
  hasCompletedNicknameOnboarding: boolean;
  hasCompletedPermissionOnboarding: boolean;
};

type AuthOnboardingStorage = {
  getItem: (key: string) => string | null;
};

type ResolveAuthOnboardingStepOptions = {
  hasCompletedNicknameOnboarding: boolean;
  hasResolvedDisplayName: boolean;
};

export function resolveAuthOnboardingStep(
  options: ResolveAuthOnboardingStepOptions,
): AuthOnboardingStep {
  if (!options.hasCompletedNicknameOnboarding && !options.hasResolvedDisplayName) {
    return "nickname";
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
