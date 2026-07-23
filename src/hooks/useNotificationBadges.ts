import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { NotificationBadgeDatabase } from "../constants/notificationBadges";
import { logAppError } from "../lib/logAppError";
import {
  type NotificationBadgeScope,
  type NotificationBadgeSnapshot,
  createEmptyNotificationBadgeSnapshot,
  dismissPresentedNotificationBadges,
  fetchNotificationBadgeSnapshot,
  markNotificationBadgeScopeRead,
  readCachedNotificationBadgeSnapshot,
  resolveSnapshotAfterReadingScope,
  writeCachedNotificationBadgeSnapshot,
} from "../lib/notifications/notificationBadges";
import { supabase } from "../lib/supabase";

type NotificationBadgesState = {
  hasResolved: boolean;
  markRead: (bookId: string, scope: NotificationBadgeScope) => Promise<boolean>;
  refresh: () => Promise<void>;
  snapshot: NotificationBadgeSnapshot;
  syncRevision: number;
};

export function useNotificationBadges(userId: string): NotificationBadgesState {
  const cachedSnapshotRef = useRef<NotificationBadgeSnapshot | null | undefined>(undefined);
  if (cachedSnapshotRef.current === undefined) {
    cachedSnapshotRef.current = readCachedNotificationBadgeSnapshot(userId);
  }
  const [snapshot, setSnapshot] = useState(
    cachedSnapshotRef.current ?? createEmptyNotificationBadgeSnapshot(),
  );
  const [hasResolved, setHasResolved] = useState(cachedSnapshotRef.current !== null);
  const [syncRevision, setSyncRevision] = useState(0);
  const latestRefreshIdRef = useRef(0);
  const activeMarkKeysRef = useRef(new Set<string>());

  const applySnapshot = useCallback(
    (nextSnapshot: NotificationBadgeSnapshot) => {
      setSnapshot(nextSnapshot);
      writeCachedNotificationBadgeSnapshot(userId, nextSnapshot);
      setHasResolved(true);
      setSyncRevision((currentRevision) => currentRevision + 1);
    },
    [userId],
  );

  const refresh = useCallback(async () => {
    const refreshId = latestRefreshIdRef.current + 1;
    latestRefreshIdRef.current = refreshId;

    try {
      const nextSnapshot = await fetchNotificationBadgeSnapshot();
      if (refreshId !== latestRefreshIdRef.current) {
        return;
      }

      applySnapshot(nextSnapshot);
    } catch (error) {
      if (refreshId !== latestRefreshIdRef.current) {
        return;
      }

      setHasResolved(true);
      logAppError("NotificationBadges", error, {
        step: "fetch_notification_badge_state",
      });
    }
  }, [applySnapshot]);

  const markRead = useCallback(
    async (bookId: string, scope: NotificationBadgeScope) => {
      const markKey = `${bookId}:${scope}`;
      if (activeMarkKeysRef.current.has(markKey)) {
        return false;
      }

      activeMarkKeysRef.current.add(markKey);
      try {
        await markNotificationBadgeScopeRead(bookId, scope);
        setSnapshot((currentSnapshot) => {
          const nextSnapshot = resolveSnapshotAfterReadingScope(currentSnapshot, bookId, scope);
          if (nextSnapshot !== currentSnapshot) {
            writeCachedNotificationBadgeSnapshot(userId, nextSnapshot);
          }
          return nextSnapshot;
        });

        void dismissPresentedNotificationBadges(bookId, scope).catch((error) => {
          logAppError("NotificationBadges", error, {
            bookId,
            scope,
            step: "dismiss_presented_notification_badges",
          });
        });
        void refresh();
        return true;
      } catch (error) {
        logAppError("NotificationBadges", error, {
          bookId,
          scope,
          step: "mark_notification_badges_read",
        });
        return false;
      } finally {
        activeMarkKeysRef.current.delete(markKey);
      }
    },
    [refresh, userId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel(`notification-badges-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: NotificationBadgeDatabase.ledgerEntriesTable,
        },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: NotificationBadgeDatabase.joinRequestsTable,
        },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `user_id=eq.${userId}`,
          schema: "public",
          table: NotificationBadgeDatabase.readStatesTable,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  return {
    hasResolved,
    markRead,
    refresh,
    snapshot,
    syncRevision,
  };
}
