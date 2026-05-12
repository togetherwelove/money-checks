import { useState } from "react";
import { Alert, View } from "react-native";

import { DEFAULT_MEMBER_DISPLAY_NAME } from "../constants/ledgerDisplay";
import { LedgerEditabilityCopy } from "../constants/ledgerEditability";
import { AppMessages } from "../constants/messages";
import { SharedLedgerJoinCopy } from "../constants/sharedLedgerJoin";
import { SharedLedgerJoinPreviewCopy } from "../constants/sharedLedgerJoinPreview";
import {
  SubscriptionConfig,
  type SubscriptionTier,
  SubscriptionTiers,
} from "../constants/subscription";
import { useLedgerBookNickname } from "../hooks/useLedgerBookNickname";
import { showNativeToast } from "../lib/nativeToast";
import { fetchOwnProfileDisplayName } from "../lib/profiles";
import {
  createMemberJoinedBookEvent,
  createMemberLeftBookEvent,
  createMemberRemovedFromBookEvent,
} from "../notifications/domain/notificationEventFactories";
import type { NotificationEvent } from "../notifications/domain/notificationEvents";
import type { AccessibleLedgerBook, LedgerBook } from "../types/ledgerBook";
import type {
  JoinSharedLedgerBookAttempt,
  JoinSharedLedgerBookPreview,
  JoinSharedLedgerBookPreviewStatus,
  JoinSharedLedgerBookResolution,
  LedgerBookJoinApprovalAttempt,
  LedgerBookJoinRequest,
  LedgerBookJoinRequestCountByBookId,
} from "../types/ledgerBookJoinRequest";
import { JoinSharedLedgerBookResolutions } from "../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import { LedgerBookManagementCard } from "./sharedLedgerPanel/LedgerBookManagementCard";
import { SharedLedgerBookCard } from "./sharedLedgerPanel/SharedLedgerBookCard";
import { SharedLedgerJoinCard } from "./sharedLedgerPanel/SharedLedgerJoinCard";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanel/sharedLedgerPanelStyles";

type SharedLedgerPanelProps = {
  accessibleBooks: AccessibleLedgerBook[];
  activeBook: LedgerBook | null;
  currentUserId: string;
  isReadOnlyDueToPlanLimit: boolean;
  members: LedgerBookMember[];
  onCreateLedgerBook: (nextName: string) => Promise<boolean>;
  onDeleteActiveLedgerBook: () => Promise<boolean>;
  onOpenSubscription: () => void;
  onApproveJoinRequest: (requestId: string) => Promise<LedgerBookJoinApprovalAttempt>;
  onBeforeCopyShareCode: () => Promise<void> | void;
  onKickMember: (targetUserId: string) => Promise<boolean>;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  onLeaveSharedLedgerBook: () => Promise<boolean>;
  onJoinSharedLedgerBook: (
    shareCode: string,
    joinResolution?: JoinSharedLedgerBookResolution,
  ) => Promise<JoinSharedLedgerBookAttempt>;
  onBeforeSendJoinRequest: () => Promise<void> | void;
  onPreviewJoinSharedLedgerBook: (shareCode: string) => Promise<JoinSharedLedgerBookPreview>;
  onRenameActiveLedgerBook: (nextName: string) => Promise<boolean>;
  onSwitchLedgerBook: (bookId: string) => Promise<boolean>;
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
  pendingJoinRequestCountsByBookId: LedgerBookJoinRequestCountByBookId;
  pendingJoinRequests: LedgerBookJoinRequest[];
  subscriptionTier: SubscriptionTier;
};

export function SharedLedgerPanel({
  accessibleBooks,
  activeBook,
  currentUserId,
  isReadOnlyDueToPlanLimit,
  members,
  onCreateLedgerBook,
  onDeleteActiveLedgerBook,
  onOpenSubscription,
  onApproveJoinRequest,
  onBeforeCopyShareCode,
  onKickMember,
  onRejectJoinRequest,
  onLeaveSharedLedgerBook,
  onJoinSharedLedgerBook,
  onBeforeSendJoinRequest,
  onPreviewJoinSharedLedgerBook,
  onRenameActiveLedgerBook,
  onSwitchLedgerBook,
  onSendPendingJoinRequestNotification,
  onSendPushNotificationToBookMembers,
  onSendPushNotificationToUsers,
  pendingJoinRequestCountsByBookId,
  pendingJoinRequests,
  subscriptionTier,
}: SharedLedgerPanelProps) {
  const [shareCodeInput, setShareCodeInput] = useState("");
  const currentMemberRole =
    members.find((member) => member.userId === currentUserId)?.role ??
    (activeBook?.ownerId === currentUserId ? "owner" : null);
  const canEditBookName =
    !isReadOnlyDueToPlanLimit && (currentMemberRole === "owner" || currentMemberRole === "editor");
  const {
    bookNameInput,
    canEditBookName: canEditDisplayedBookName,
    displayedBookName,
    handleChangeBookName,
    handleSaveBookName,
  } = useLedgerBookNickname({
    activeBook,
    canEditBookName,
    onSaveBookName: onRenameActiveLedgerBook,
  });
  const sharedMemberLimit =
    subscriptionTier === SubscriptionTiers.plus
      ? SubscriptionConfig.plusSharedMemberLimit
      : SubscriptionConfig.freeSharedMemberLimit;
  const shouldShowSharedMemberLimitNotice =
    currentMemberRole === "owner" && members.length >= sharedMemberLimit;
  const blockReadOnlyShareActionIfNeeded = () => {
    if (!isReadOnlyDueToPlanLimit) {
      return false;
    }

    showNativeToast(LedgerEditabilityCopy.planLimitReadOnly);
    return true;
  };

  const handleJoin = async () => {
    if (blockReadOnlyShareActionIfNeeded()) {
      return;
    }

    const nextShareCode = shareCodeInput.trim();
    if (!nextShareCode) {
      showNativeToast(SharedLedgerJoinCopy.requiredShareCodeError);
      return;
    }

    const joinPreview = await onPreviewJoinSharedLedgerBook(nextShareCode);
    const joinResolution = await resolveConfirmedJoinResolution(joinPreview);
    if (!joinResolution) {
      return;
    }

    if (shouldShowAdBeforeJoinRequest(joinPreview.status)) {
      await onBeforeSendJoinRequest();
    }

    const joinAttempt = await onJoinSharedLedgerBook(nextShareCode, joinResolution);

    const didSucceed = Boolean(joinAttempt.result);
    showNativeToast(
      joinAttempt.result === "requested"
        ? AppMessages.accountJoinRequestSuccess
        : joinAttempt.result === "joined"
          ? AppMessages.accountJoinSuccess
          : (joinAttempt.errorMessage ?? AppMessages.accountJoinError),
    );

    if (didSucceed) {
      setShareCodeInput("");
    }

    if (joinAttempt.result === "requested") {
      await onSendPendingJoinRequestNotification();
      return;
    }

    if (joinAttempt.result === "joined" && joinAttempt.book) {
      const actorName = await resolveCurrentActorName();
      await onSendPushNotificationToBookMembers(
        joinAttempt.book.id,
        createMemberJoinedBookEvent(actorName, joinAttempt.book.name),
        [currentUserId],
      );
    }
  };

  const handleLeave = async () => {
    if (activeBook) {
      const actorName = await resolveCurrentActorName();
      await onSendPushNotificationToBookMembers(
        activeBook.id,
        createMemberLeftBookEvent(actorName, activeBook.name),
        [currentUserId],
      );
    }

    const didLeave = await onLeaveSharedLedgerBook();
    showNativeToast(
      didLeave ? AppMessages.accountDisconnectSuccess : AppMessages.accountDisconnectError,
    );
  };

  const handleKickMember = async (targetUserId: string) => {
    if (blockReadOnlyShareActionIfNeeded()) {
      return false;
    }

    if (activeBook) {
      const actorName = await resolveCurrentActorName();
      await onSendPushNotificationToUsers(
        createMemberRemovedFromBookEvent(actorName, activeBook.name),
        [targetUserId],
        activeBook.id,
      );
    }

    const didKick = await onKickMember(targetUserId);
    showNativeToast(didKick ? AppMessages.accountKickSuccess : AppMessages.accountKickError);

    return didKick;
  };

  const handleApproveJoinRequest = async (requestId: string) => {
    if (blockReadOnlyShareActionIfNeeded()) {
      return {
        didApprove: false,
        errorMessage: LedgerEditabilityCopy.planLimitReadOnly,
      };
    }

    const approveAttempt = await onApproveJoinRequest(requestId);
    showNativeToast(
      approveAttempt.didApprove
        ? AppMessages.accountJoinApproveSuccess
        : (approveAttempt.errorMessage ?? AppMessages.accountJoinApproveError),
    );

    if (approveAttempt.didApprove && activeBook) {
      const approvedRequest = pendingJoinRequests.find((request) => request.id === requestId);
      if (approvedRequest) {
        await onSendPushNotificationToBookMembers(
          activeBook.id,
          createMemberJoinedBookEvent(approvedRequest.requesterDisplayName, activeBook.name),
          [currentUserId, approvedRequest.requesterUserId],
        );
      }
    }

    return approveAttempt;
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    if (blockReadOnlyShareActionIfNeeded()) {
      return false;
    }

    const didReject = await onRejectJoinRequest(requestId);
    showNativeToast(
      didReject ? AppMessages.accountJoinRejectSuccess : AppMessages.accountJoinRejectError,
    );
    return didReject;
  };

  const canLeaveSharedBook = Boolean(activeBook && activeBook.ownerId !== currentUserId);

  return (
    <View style={styles.panel}>
      <LedgerBookManagementCard
        accessibleBooks={accessibleBooks}
        activeBook={activeBook}
        canLeaveSharedBook={canLeaveSharedBook}
        currentUserId={currentUserId}
        isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
        members={members}
        onCreateLedgerBook={onCreateLedgerBook}
        onDeleteActiveLedgerBook={onDeleteActiveLedgerBook}
        onKickMember={handleKickMember}
        onLeave={handleLeave}
        onOpenSubscription={onOpenSubscription}
        onSwitchLedgerBook={onSwitchLedgerBook}
        pendingJoinRequestCountsByBookId={pendingJoinRequestCountsByBookId}
        shouldShowSharedMemberLimitNotice={shouldShowSharedMemberLimitNotice}
        subscriptionTier={subscriptionTier}
      />
      <SharedLedgerBookCard
        activeBook={activeBook}
        bookName={displayedBookName}
        bookNameInput={bookNameInput}
        canEditBookName={canEditDisplayedBookName}
        currentUserId={currentUserId}
        isOwner={currentMemberRole === "owner"}
        isReadOnlyDueToPlanLimit={isReadOnlyDueToPlanLimit}
        onApproveJoinRequest={handleApproveJoinRequest}
        onBeforeCopyShareCode={onBeforeCopyShareCode}
        onChangeBookName={handleChangeBookName}
        onRejectJoinRequest={handleRejectJoinRequest}
        onSaveBookName={handleSaveBookName}
        pendingJoinRequests={pendingJoinRequests}
      />
      <SharedLedgerJoinCard
        disabled={isReadOnlyDueToPlanLimit}
        onChangeShareCodeInput={(value) => {
          setShareCodeInput(value.toUpperCase());
        }}
        onJoin={handleJoin}
        shareCodeInput={shareCodeInput}
      />
    </View>
  );

  async function resolveCurrentActorName() {
    try {
      return (
        (await fetchOwnProfileDisplayName(currentUserId)).trim() || DEFAULT_MEMBER_DISPLAY_NAME
      );
    } catch {
      return DEFAULT_MEMBER_DISPLAY_NAME;
    }
  }

  async function resolveConfirmedJoinResolution(
    joinPreview: JoinSharedLedgerBookPreview,
  ): Promise<JoinSharedLedgerBookResolution | null> {
    if (joinPreview.status === "own_book" || joinPreview.status === "already_member") {
      return JoinSharedLedgerBookResolutions.standard;
    }

    if (joinPreview.status === "can_request") {
      const didConfirm = await confirmJoinRequest(
        SharedLedgerJoinPreviewCopy.confirmRequestTitle,
        SharedLedgerJoinPreviewCopy.confirmRequestMessage,
        SharedLedgerJoinPreviewCopy.confirmRequestAction,
      );
      return didConfirm ? JoinSharedLedgerBookResolutions.standard : null;
    }

    if (joinPreview.status === "can_request_with_personal_book_discard") {
      const didConfirm = await confirmJoinRequest(
        SharedLedgerJoinPreviewCopy.confirmDiscardTitle,
        SharedLedgerJoinPreviewCopy.confirmDiscardMessage,
        SharedLedgerJoinPreviewCopy.confirmDiscardAction,
      );
      return didConfirm ? JoinSharedLedgerBookResolutions.discardPersonalBookOnApproval : null;
    }

    showNativeToast(resolveJoinPreviewBlockedMessage(joinPreview.status));
    return null;
  }
}

function shouldShowAdBeforeJoinRequest(status: JoinSharedLedgerBookPreviewStatus): boolean {
  return status === "can_request" || status === "can_request_with_personal_book_discard";
}

function confirmJoinRequest(title: string, message: string, confirmAction: string) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      {
        style: "cancel",
        text: SharedLedgerJoinPreviewCopy.cancelAction,
        onPress: () => resolve(false),
      },
      {
        onPress: () => resolve(true),
        text: confirmAction,
      },
    ]);
  });
}

function resolveJoinPreviewBlockedMessage(status: JoinSharedLedgerBookPreviewStatus): string {
  if (status === "blocked_shared_owner_free") {
    return SharedLedgerJoinPreviewCopy.ownerBlocked;
  }

  if (status === "blocked_shared_editor_free") {
    return SharedLedgerJoinPreviewCopy.editorBlocked;
  }

  if (status === "blocked_target_member_limit") {
    return SharedLedgerJoinPreviewCopy.targetMemberLimit;
  }

  if (status === "pending_request") {
    return SharedLedgerJoinPreviewCopy.alreadyPending;
  }

  if (status === "join_cooldown") {
    return SharedLedgerJoinPreviewCopy.joinCooldown;
  }

  if (status === "invalid_code" || status === "expired_code") {
    return SharedLedgerJoinPreviewCopy.invalidCode;
  }

  return SharedLedgerJoinPreviewCopy.accessibleLimit;
}
