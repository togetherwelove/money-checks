import { useCallback, useEffect, useMemo, useState } from "react";

import { appStorage } from "../lib/appStorage";
import {
  type AuthOnboardingStep,
  createNicknameOnboardingKey,
  createPermissionOnboardingKey,
  readStoredAuthOnboardingState,
  resolveAuthOnboardingStep,
} from "../lib/authOnboarding";
import { fetchOwnProfileDisplayName } from "../lib/profiles";
import { normalizeDisplayNameCandidate } from "../utils/displayName";

type AuthOnboardingState = {
  completeNicknameOnboarding: (displayName: string) => void;
  completePermissionOnboarding: () => void;
  hasCompletedPermissionOnboarding: boolean;
  isLoading: boolean;
  step: AuthOnboardingStep;
};

type UseAuthOnboardingOptions = {
  fallbackDisplayName: string;
  userId: string;
};

export function useAuthOnboarding({
  fallbackDisplayName,
  userId,
}: UseAuthOnboardingOptions): AuthOnboardingState {
  const initialStoredState = readStoredAuthOnboardingState(appStorage, userId);
  const initialResolvedDisplayName = normalizeDisplayNameCandidate(fallbackDisplayName);
  const [isLoading, setIsLoading] = useState(
    !initialStoredState.hasCompletedNicknameOnboarding && !initialResolvedDisplayName,
  );
  const [profileDisplayName, setProfileDisplayName] = useState(initialResolvedDisplayName);
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
    const shouldWaitForProfileDisplayName =
      !nextStoredState.hasCompletedNicknameOnboarding && !nextFallbackDisplayName;

    setProfileDisplayName(nextFallbackDisplayName);
    setHasCompletedNicknameOnboarding(nextStoredState.hasCompletedNicknameOnboarding);
    setHasCompletedPermissionOnboarding(nextStoredState.hasCompletedPermissionOnboarding);
    setIsLoading(shouldWaitForProfileDisplayName);

    if (nextFallbackDisplayName && !nextStoredState.hasCompletedNicknameOnboarding) {
      appStorage.setItem(createNicknameOnboardingKey(userId), "true");
      setHasCompletedNicknameOnboarding(true);
    }

    void fetchOwnProfileDisplayName(userId)
      .then((fetchedDisplayName) => {
        const nextProfileDisplayName = normalizeDisplayNameCandidate(fetchedDisplayName);
        if (!isMounted) {
          return;
        }

        if (nextProfileDisplayName) {
          setProfileDisplayName(nextProfileDisplayName);
          if (!nextStoredState.hasCompletedNicknameOnboarding) {
            appStorage.setItem(createNicknameOnboardingKey(userId), "true");
            setHasCompletedNicknameOnboarding(true);
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackDisplayName, userId]);

  const step = useMemo(
    () =>
      resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding,
        hasResolvedDisplayName: Boolean(profileDisplayName),
      }),
    [hasCompletedNicknameOnboarding, profileDisplayName],
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
    hasCompletedPermissionOnboarding,
    isLoading,
    step,
  };
}
