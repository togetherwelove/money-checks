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
import { runStartupCheck, startupErrorMessage } from "../lib/startupCheck";
import { normalizeDisplayNameCandidate } from "../utils/displayName";

type AuthOnboardingState = {
  completeNicknameOnboarding: (displayName: string) => void;
  completePermissionOnboarding: () => void;
  hasCompletedPermissionOnboarding: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  retry: () => void;
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
  const [attempt, setAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    const controller = new AbortController();
    setErrorMessage(null);
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

    void runStartupCheck((signal) => fetchOwnProfileDisplayName(userId, signal), controller.signal)
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
      .catch((error) => {
        if (isMounted && shouldWaitForProfileDisplayName) {
          setErrorMessage(startupErrorMessage(error));
        }
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fallbackDisplayName, userId, attempt]);

  const retry = useCallback(() => {
    setErrorMessage(null);
    setIsLoading(true);
    setAttempt((value) => value + 1);
  }, []);

  const step = useMemo(
    () =>
      isLoading || errorMessage ? null : resolveAuthOnboardingStep({
        hasCompletedNicknameOnboarding,
        hasResolvedDisplayName: Boolean(profileDisplayName),
      }),
    [hasCompletedNicknameOnboarding, profileDisplayName, isLoading, errorMessage],
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
    errorMessage,
    retry,
    step,
  };
}
