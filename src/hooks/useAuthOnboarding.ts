import { useCallback, useEffect, useMemo, useState } from "react";

import { appStorage } from "../lib/appStorage";
import {
  type AuthOnboardingStep,
  createNicknameOnboardingKey,
  createPermissionOnboardingKey,
  readStoredAuthOnboardingState,
  resolveAuthOnboardingStep,
} from "../lib/authOnboarding";
import type { BrowserNotificationPermissionState } from "../lib/notifications/browserNotifications";
import { fetchOwnProfileDisplayName } from "../lib/profiles";
import { normalizeDisplayNameCandidate } from "../utils/displayName";

type AuthOnboardingState = {
  completeNicknameOnboarding: (displayName: string) => void;
  completePermissionOnboarding: () => void;
  isLoading: boolean;
  step: AuthOnboardingStep;
  suggestedDisplayName: string;
};

type UseAuthOnboardingOptions = {
  fallbackDisplayName: string;
  isNotificationSupported: boolean;
  permissionState: BrowserNotificationPermissionState;
  userId: string;
};

export function useAuthOnboarding({
  fallbackDisplayName,
  isNotificationSupported,
  permissionState,
  userId,
}: UseAuthOnboardingOptions): AuthOnboardingState {
  const initialStoredState = readStoredAuthOnboardingState(appStorage, userId);
  const [isLoading] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState(
    normalizeDisplayNameCandidate(fallbackDisplayName),
  );
  const [hasCompletedNicknameOnboarding, setHasCompletedNicknameOnboarding] = useState(
    initialStoredState.hasCompletedNicknameOnboarding,
  );
  const [hasCompletedPermissionOnboarding, setHasCompletedPermissionOnboarding] = useState(
    initialStoredState.hasCompletedPermissionOnboarding,
  );

  useEffect(() => {
    let isMounted = true;
    const nextFallbackDisplayName = normalizeDisplayNameCandidate(fallbackDisplayName);
    const nextStoredState = readStoredAuthOnboardingState(appStorage, userId);

    setProfileDisplayName(nextFallbackDisplayName);
    setHasCompletedNicknameOnboarding(nextStoredState.hasCompletedNicknameOnboarding);
    setHasCompletedPermissionOnboarding(nextStoredState.hasCompletedPermissionOnboarding);

    void fetchOwnProfileDisplayName(userId)
      .then((fetchedDisplayName) => {
        const nextProfileDisplayName = normalizeDisplayNameCandidate(fetchedDisplayName);
        if (!isMounted || !nextProfileDisplayName) {
          return;
        }

        setProfileDisplayName(nextProfileDisplayName);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [fallbackDisplayName, userId]);

  const step = useMemo(
    () =>
      resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding,
        hasCompletedPermissionOnboarding,
        isNotificationSupported,
        permissionState,
      }),
    [
      hasCompletedNicknameOnboarding,
      hasCompletedPermissionOnboarding,
      isNotificationSupported,
      permissionState,
    ],
  );

  const completeNicknameOnboarding = useCallback(
    (displayName: string) => {
      appStorage.setItem(createNicknameOnboardingKey(userId), "true");
      setProfileDisplayName(normalizeDisplayNameCandidate(displayName));
      setHasCompletedNicknameOnboarding(true);
    },
    [userId],
  );

  const completePermissionOnboarding = useCallback(() => {
    appStorage.setItem(createPermissionOnboardingKey(userId), "true");
    setHasCompletedPermissionOnboarding(true);
  }, [userId]);

  return {
    completeNicknameOnboarding,
    completePermissionOnboarding,
    isLoading,
    step,
    suggestedDisplayName: profileDisplayName,
  };
}
