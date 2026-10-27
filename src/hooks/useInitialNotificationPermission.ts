import { useEffect, useRef } from "react";
import { InitialPermissionTiming } from "../constants/initialPermissions";
import { scheduleIdleTask } from "../lib/idleScheduler";
import type { useAuthOnboarding } from "./useAuthOnboarding";
import type { useLedgerNotifications } from "./useLedgerNotifications";

type Options = {
  authOnboarding: Pick<
    ReturnType<typeof useAuthOnboarding>,
    | "isLoading"
    | "errorMessage"
    | "step"
    | "hasCompletedPermissionOnboarding"
    | "completePermissionOnboarding"
  >;
  notifications: Pick<
    ReturnType<typeof useLedgerNotifications>,
    "isSupported" | "permissionState" | "requestNotifications"
  >;
  isLedgerLoading: boolean;
  hasSettledInitialAdTrackingPermission: boolean;
};

export function useInitialNotificationPermission({
  authOnboarding,
  notifications,
  isLedgerLoading,
  hasSettledInitialAdTrackingPermission,
}: Options) {
  const hasScheduledInitialPermissionRequestRef = useRef(false);
  const hasStartedInitialPermissionRequestRef = useRef(false);
  const permissionRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (permissionRequestTimeoutRef.current) {
        clearTimeout(permissionRequestTimeoutRef.current);
        permissionRequestTimeoutRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (
      authOnboarding.hasCompletedPermissionOnboarding ||
      notifications.permissionState === "default" ||
      notifications.permissionState === "unsupported"
    ) {
      return;
    }

    authOnboarding.completePermissionOnboarding();
  }, [
    authOnboarding.completePermissionOnboarding,
    authOnboarding.hasCompletedPermissionOnboarding,
    notifications.permissionState,
  ]);

  useEffect(() => {
    if (
      authOnboarding.isLoading ||
      authOnboarding.errorMessage ||
      authOnboarding.step !== null ||
      authOnboarding.hasCompletedPermissionOnboarding ||
      !notifications.isSupported ||
      notifications.permissionState !== "default" ||
      isLedgerLoading ||
      !hasSettledInitialAdTrackingPermission ||
      hasScheduledInitialPermissionRequestRef.current
    ) {
      return;
    }

    hasScheduledInitialPermissionRequestRef.current = true;
    const idleTask = scheduleIdleTask(() => {
      permissionRequestTimeoutRef.current = setTimeout(() => {
        permissionRequestTimeoutRef.current = null;
        hasStartedInitialPermissionRequestRef.current = true;
        void notifications
          .requestNotifications()
          .finally(authOnboarding.completePermissionOnboarding);
      }, InitialPermissionTiming.notificationRequestDelayMs);
    });

    return () => {
      idleTask.cancel();
      if (permissionRequestTimeoutRef.current) {
        clearTimeout(permissionRequestTimeoutRef.current);
        permissionRequestTimeoutRef.current = null;
      }

      if (!hasStartedInitialPermissionRequestRef.current) {
        hasScheduledInitialPermissionRequestRef.current = false;
      }
    };
  }, [
    authOnboarding.completePermissionOnboarding,
    authOnboarding.hasCompletedPermissionOnboarding,
    authOnboarding.isLoading,
    authOnboarding.errorMessage,
    authOnboarding.step,
    hasSettledInitialAdTrackingPermission,
    isLedgerLoading,
    notifications.isSupported,
    notifications.permissionState,
    notifications.requestNotifications,
  ]);
}
