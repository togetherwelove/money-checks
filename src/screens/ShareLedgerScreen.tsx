import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { SharedLedgerPanel } from "../components/SharedLedgerPanel";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { DEFAULT_MEMBER_DISPLAY_NAME } from "../constants/ledgerDisplay";
import type { SubscriptionTier } from "../constants/subscription";
import {
  readCachedLedgerBookMembers,
  writeCachedLedgerBookMembers,
} from "../lib/ledgerBookMembersCache";
import { fetchLedgerBookMembers } from "../lib/ledgerBooks";
import { isLedgerBookEditableWithinPlanLimit } from "../lib/ledgerEditability";
import { fetchProfileDisplayName } from "../lib/profiles";
import { supabase } from "../lib/supabase";
import type { NotificationEvent } from "../notifications/domain/notificationEvents";
import type { LedgerBook } from "../types/ledgerBook";
import type { AccessibleLedgerBook } from "../types/ledgerBook";
import type {
  JoinSharedLedgerBookAttempt,
  JoinSharedLedgerBookPreview,
  JoinSharedLedgerBookResolution,
  LedgerBookJoinApprovalAttempt,
  LedgerBookJoinRequest,
  LedgerBookJoinRequestCountByBookId,
} from "../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import type { LedgerBookMemberRow } from "../types/supabase";

let shareMembersRealtimeChannelSequence = 0;

function createShareMembersRealtimeChannelName(bookId: string) {
  shareMembersRealtimeChannelSequence += 1;
  return `share-members-${bookId}-${shareMembersRealtimeChannelSequence}`;
}

type ShareLedgerScreenProps = {
  accessibleBooks: AccessibleLedgerBook[];
  activeBook: LedgerBook | null;
  onOpenSubscription: () => void;
  onApproveJoinRequest: (requestId: string) => Promise<LedgerBookJoinApprovalAttempt>;
  onBeforeCopyShareCode: () => Promise<void> | void;
  onCreateLedgerBook: (nextName: string) => Promise<boolean>;
  onDeleteActiveLedgerBook: () => Promise<boolean>;
  onJoinSharedLedgerBook: (
    shareCode: string,
    joinResolution?: JoinSharedLedgerBookResolution,
  ) => Promise<JoinSharedLedgerBookAttempt>;
  onBeforeSendJoinRequest: () => Promise<void> | void;
  onLeaveSharedLedgerBook: () => Promise<boolean>;
  onPreviewJoinSharedLedgerBook: (shareCode: string) => Promise<JoinSharedLedgerBookPreview>;
  onRenameActiveLedgerBook: (nextName: string) => Promise<boolean>;
  onRemoveSharedLedgerMember: (targetUserId: string) => Promise<boolean>;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  onSendPendingJoinRequestNotification: () => Promise<void>;
  onSendPushNotificationToBookMembers: (
    bookId: string,
    event: NotificationEvent,
    excludeUserIds: string[],
  ) => Promise<void>;
  onSendPushNotificationToUsers: (
    event: NotificationEvent,
    targetUserIds: string[],
    bookId?: string,
  ) => Promise<void>;
  onSwitchLedgerBook: (bookId: string) => Promise<boolean>;
  pendingJoinRequestCountsByBookId: LedgerBookJoinRequestCountByBookId;
  pendingJoinRequests: LedgerBookJoinRequest[];
  subscriptionTier: SubscriptionTier;
  userId: string;
};

export function ShareLedgerScreen({
  accessibleBooks,
  activeBook,
  onOpenSubscription,
  onApproveJoinRequest,
  onBeforeCopyShareCode,
  onBeforeSendJoinRequest,
  onCreateLedgerBook,
  onDeleteActiveLedgerBook,
  onLeaveSharedLedgerBook,
  onJoinSharedLedgerBook,
  onPreviewJoinSharedLedgerBook,
  onRemoveSharedLedgerMember,
  onRenameActiveLedgerBook,
  onRejectJoinRequest,
  onSendPendingJoinRequestNotification,
  onSendPushNotificationToBookMembers,
  onSendPushNotificationToUsers,
  onSwitchLedgerBook,
  pendingJoinRequestCountsByBookId,
  pendingJoinRequests,
  subscriptionTier,
  userId,
}: ShareLedgerScreenProps) {
  const [members, setMembers] = useState<LedgerBookMember[]>([]);
  const activeBookId = activeBook?.id ?? null;
  const isActiveBookReadOnlyDueToPlanLimit =
    Boolean(activeBook) &&
    !isLedgerBookEditableWithinPlanLimit(subscriptionTier, accessibleBooks, activeBook?.id);

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      if (!activeBookId) {
        setMembers([]);
        return;
      }

      const cachedMembers = readCachedLedgerBookMembers(activeBookId);
      if (cachedMembers) {
        setMembers(cachedMembers);
      }

      try {
        const nextMembers = await fetchLedgerBookMembers(activeBookId);
        writeCachedLedgerBookMembers(activeBookId, nextMembers);
        if (isMounted) {
          setMembers(nextMembers);
        }
      } catch {
        if (isMounted && !cachedMembers) {
          setMembers([]);
        }
      }
    };

    void loadMembers();

    if (!activeBookId) {
      return () => {
        isMounted = false;
      };
    }

    const channel = supabase
      .channel(createShareMembersRealtimeChannelName(activeBookId))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_book_members",
          filter: `book_id=eq.${activeBookId}`,
        },
        (payload) => {
          void handleMemberChange(
            payload as RealtimePostgresChangesPayload<Record<string, unknown>>,
          );
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [activeBookId]);

  const handleKickMember = async (targetUserId: string) => {
    const didKick = await onRemoveSharedLedgerMember(targetUserId);
    if (didKick) {
      setMembers((currentMembers) => {
        const nextMembers = currentMembers.filter((member) => member.userId !== targetUserId);
        if (activeBookId) {
          writeCachedLedgerBookMembers(activeBookId, nextMembers);
        }
        return nextMembers;
      });
    }
    return didKick;
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <SharedLedgerPanel
        accessibleBooks={accessibleBooks}
        activeBook={activeBook}
        currentUserId={userId}
        isReadOnlyDueToPlanLimit={isActiveBookReadOnlyDueToPlanLimit}
        members={members}
        onCreateLedgerBook={onCreateLedgerBook}
        onDeleteActiveLedgerBook={onDeleteActiveLedgerBook}
        onOpenSubscription={onOpenSubscription}
        onApproveJoinRequest={onApproveJoinRequest}
        onBeforeCopyShareCode={onBeforeCopyShareCode}
        onBeforeSendJoinRequest={onBeforeSendJoinRequest}
        onKickMember={handleKickMember}
        onLeaveSharedLedgerBook={onLeaveSharedLedgerBook}
        onJoinSharedLedgerBook={onJoinSharedLedgerBook}
        onPreviewJoinSharedLedgerBook={onPreviewJoinSharedLedgerBook}
        onRejectJoinRequest={onRejectJoinRequest}
        onRenameActiveLedgerBook={onRenameActiveLedgerBook}
        onSwitchLedgerBook={onSwitchLedgerBook}
        onSendPendingJoinRequestNotification={onSendPendingJoinRequestNotification}
        onSendPushNotificationToBookMembers={onSendPushNotificationToBookMembers}
        onSendPushNotificationToUsers={onSendPushNotificationToUsers}
        pendingJoinRequestCountsByBookId={pendingJoinRequestCountsByBookId}
        pendingJoinRequests={pendingJoinRequests}
        subscriptionTier={subscriptionTier}
      />
    </KeyboardAwareScrollView>
  );

  async function handleMemberChange(
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ) {
    if (payload.eventType === "DELETE") {
      const deletedUserId = typeof payload.old.user_id === "string" ? payload.old.user_id : null;
      if (!deletedUserId) {
        return;
      }

      setMembers((currentMembers) =>
        persistActiveBookMembers(
          currentMembers.filter((member) => member.userId !== deletedUserId),
        ),
      );
      return;
    }

    const changedMember = payload.new as LedgerBookMemberRow;
    let displayName = DEFAULT_MEMBER_DISPLAY_NAME;
    try {
      displayName =
        (await fetchProfileDisplayName(changedMember.user_id)).trim() ||
        DEFAULT_MEMBER_DISPLAY_NAME;
    } catch {
      displayName = DEFAULT_MEMBER_DISPLAY_NAME;
    }

    setMembers((currentMembers) => {
      const nextMember: LedgerBookMember = {
        displayName,
        role: changedMember.role,
        userId: changedMember.user_id,
      };
      const hasExistingMember = currentMembers.some(
        (member) => member.userId === changedMember.user_id,
      );
      const nextMembers = hasExistingMember
        ? currentMembers.map((member) =>
            member.userId === changedMember.user_id ? nextMember : member,
          )
        : [...currentMembers, nextMember];

      return persistActiveBookMembers(sortLedgerBookMembers(nextMembers));
    });
  }

  function persistActiveBookMembers(nextMembers: LedgerBookMember[]) {
    if (activeBookId) {
      writeCachedLedgerBookMembers(activeBookId, nextMembers);
    }

    return nextMembers;
  }
}

function sortLedgerBookMembers(members: LedgerBookMember[]): LedgerBookMember[] {
  return [...members].sort((left, right) => left.displayName.localeCompare(right.displayName));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
    gap: AppLayout.cardGap,
  },
});
