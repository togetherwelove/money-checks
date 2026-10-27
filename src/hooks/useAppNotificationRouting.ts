import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { NotificationBadgeScopes } from "../constants/notificationBadges";
import { logAppError } from "../lib/logAppError";
import { resolveEntryNotificationReadTarget } from "../lib/notifications/entryNotificationReads";
import { resolveNotificationActionRoute } from "../lib/notifications/notificationActions";
import {
  canMarkNotificationBadgeScopeRead,
  resolveBookNotificationBadgeCount,
} from "../lib/notifications/notificationBadges";
import type { LedgerAppScreen } from "../types/app";
import type { LedgerScreenState } from "./ledgerScreenState/types";
import type { useEntryNotificationReads } from "./useEntryNotificationReads";
import type { useLedgerNotifications } from "./useLedgerNotifications";
import type { useNotificationBadges } from "./useNotificationBadges";

type Options = {
  currentScreen: LedgerAppScreen;
  isLedgerManagementOpen: boolean;
  ledgerState: Pick<LedgerScreenState, "activeBook">;
  notificationBadges: ReturnType<typeof useNotificationBadges>;
  notifications: Pick<ReturnType<typeof useLedgerNotifications>, "registerActionCategories">;
  markEntryNotificationsRead: ReturnType<typeof useEntryNotificationReads>;
  userId: string;
  navigateToStackScreen: (screen: Exclude<LedgerAppScreen, "calendar" | "entry">) => void;
  returnToCalendarRoot: () => void;
};

export function useAppNotificationRouting({
  currentScreen,
  isLedgerManagementOpen,
  ledgerState,
  notificationBadges,
  notifications,
  markEntryNotificationsRead,
  userId,
  navigateToStackScreen,
  returnToCalendarRoot,
}: Options) {
  const lastReadNotificationBadgeScreenKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!notificationBadges.hasResolved) {
      return;
    }

    void Notifications.setBadgeCountAsync(notificationBadges.snapshot.totalUnreadCount).catch(
      (error) => {
        logAppError("App", error, {
          step: "set_notification_badge_count",
        });
      },
    );
  }, [
    notificationBadges.hasResolved,
    notificationBadges.snapshot.totalUnreadCount,
    notificationBadges.syncRevision,
  ]);

  useEffect(() => {
    const activeBook = ledgerState.activeBook;
    const targetScope =
      isLedgerManagementOpen || currentScreen === "share"
        ? NotificationBadgeScopes.joinRequests
        : currentScreen === "all-entries"
          ? NotificationBadgeScopes.ledgerEntries
          : null;
    const canMarkRead =
      activeBook &&
      targetScope &&
      canMarkNotificationBadgeScopeRead(targetScope, activeBook.ownerId === userId);
    if (!activeBook || !targetScope || !canMarkRead) {
      lastReadNotificationBadgeScreenKeyRef.current = null;
      return;
    }

    const activeBookId = activeBook.id;
    const unreadCount = resolveBookNotificationBadgeCount(
      notificationBadges.snapshot,
      activeBookId,
      targetScope,
    );
    const screenKey = `${activeBookId}:${targetScope}`;
    if (lastReadNotificationBadgeScreenKeyRef.current === screenKey && unreadCount === 0) {
      return;
    }

    lastReadNotificationBadgeScreenKeyRef.current = screenKey;
    void notificationBadges.markRead(activeBookId, targetScope).then((didMarkRead) => {
      if (!didMarkRead && lastReadNotificationBadgeScreenKeyRef.current === screenKey) {
        lastReadNotificationBadgeScreenKeyRef.current = null;
      }
    });
  }, [
    currentScreen,
    isLedgerManagementOpen,
    ledgerState.activeBook?.id,
    ledgerState.activeBook?.ownerId,
    notificationBadges.markRead,
    notificationBadges.snapshot,
    userId,
  ]);

  useEffect(() => {
    void notifications.registerActionCategories().catch((error) => {
      logAppError("App", error, {
        step: "register_notification_action_categories",
      });
    });
  }, [notifications.registerActionCategories]);

  useEffect(() => {
    const clearLastNotificationResponse = () => {
      try {
        Notifications.clearLastNotificationResponse();
      } catch (error) {
        logAppError("App", error, {
          step: "clear_last_notification_response",
        });
      }
    };

    const handleNotificationReceived = () => {
      void notificationBadges.refresh();
    };

    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      const readTarget = resolveEntryNotificationReadTarget(data);
      if (readTarget) {
        void markEntryNotificationsRead(readTarget.bookId, [readTarget.entryId]);
      } else {
        void notificationBadges.refresh();
      }
      clearLastNotificationResponse();
      const targetScreen = resolveNotificationActionRoute(
        response.actionIdentifier,
        response.notification.request.content.data,
      );

      if (targetScreen === "calendar") {
        returnToCalendarRoot();
        return;
      }

      navigateToStackScreen(targetScreen);
    };

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      handleNotificationReceived,
    );
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          handleNotificationResponse(response);
        }
      })
      .catch((error) => {
        logAppError("App", error, {
          step: "get_last_notification_response",
        });
      });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [
    markEntryNotificationsRead,
    navigateToStackScreen,
    notificationBadges.refresh,
    returnToCalendarRoot,
  ]);
}
