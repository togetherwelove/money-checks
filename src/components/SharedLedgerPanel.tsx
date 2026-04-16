import { useState } from "react";
import { View } from "react-native";

import { DEFAULT_MEMBER_DISPLAY_NAME } from "../constants/ledgerDisplay";
import { AppMessages } from "../constants/messages";
import { useLedgerBookNickname } from "../hooks/useLedgerBookNickname";
import { showNativeToast } from "../lib/nativeToast";
import { fetchOwnProfileDisplayName } from "../lib/profiles";
import {
  createMemberJoinedBookEvent,
  createMemberLeftBookEvent,
  createMemberRemovedFromBookEvent,
} from "../notifications/domain/notificationEventFactories";
import type { NotificationEvent } from "../notifications/domain/notificationEvents";
import type { LedgerBook } from "../types/ledgerBook";
import type {
  JoinSharedLedgerBookAttempt,
  LedgerBookJoinRequest,
} from "../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import { SharedLedgerBookCard } from "./sharedLedgerPanel/SharedLedgerBookCard";
import { SharedLedgerJoinCard } from "./sharedLedgerPanel/SharedLedgerJoinCard";
import { isJoinRequestBlockedByActiveSharedLedger } from "./sharedLedgerPanel/joinRequestBlock";
import { sharedLedgerPanelStyles as styles } from "./sharedLedgerPanel/sharedLedgerPanelStyles";

type SharedLedgerPanelProps = {
  activeBook: LedgerBook | null;
  currentUserId: string;
  members: LedgerBookMember[];
  onApproveJoinRequest: (requestId: string) => Promise<boolean>;
  onKickMember: (targetUserId: string) => Promise<boolean>;
  onRejectJoinRequest: (requestId: string) => Promise<boolean>;
  onLeaveSharedLedgerBook: () => Promise<boolean>;
  onJoinSharedLedgerBook: (shareCode: string) => Promise<JoinSharedLedgerBookAttempt>;
  onRenameActiveLedgerBook: (nextName: string) => Promise<boolean>;
  onSendPendingJoinRequestNotification: (requesterName: string) => Promise<void>;
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
  pendingJoinRequests: LedgerBookJoinRequest[];
};

export function SharedLedgerPanel({
  activeBook,
  currentUserId,
  members,
  onApproveJoinRequest,
  onKickMember,
  onRejectJoinRequest,
  onLeaveSharedLedgerBook,
  onJoinSharedLedgerBook,
  onRenameActiveLedgerBook,
  onSendPendingJoinRequestNotification,
  onSendPushNotificationToBookMembers,
  onSendPushNotificationToUsers,
  pendingJoinRequests,
}: SharedLedgerPanelProps) {
  const [shareCodeInput, setShareCodeInput] = useState("");
  const currentMemberRole =
    members.find((member) => member.userId === currentUserId)?.role ??
    (activeBook?.ownerId === currentUserId ? "owner" : "viewer");
  const canEditBookName = currentMemberRole === "owner" || currentMemberRole === "editor";
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
  const isJoinBlocked = isJoinRequestBlockedByActiveSharedLedger({
    activeBook,
    currentUserId,
    members,
  });

  const handleJoin = async () => {
    if (isJoinBlocked) {
      return;
    }

    const nextShareCode = shareCodeInput.trim();
    if (!nextShareCode) {
      return;
    }

    const joinAttempt = await onJoinSharedLedgerBook(nextShareCode);
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
      await onSendPendingJoinRequestNotification(await resolveCurrentActorName());
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
    const didLeave = await onLeaveSharedLedgerBook();
    showNativeToast(
      didLeave ? AppMessages.accountDisconnectSuccess : AppMessages.accountDisconnectError,
    );

    if (didLeave && activeBook) {
      const actorName = await resolveCurrentActorName();
      await onSendPushNotificationToBookMembers(
        activeBook.id,
        createMemberLeftBookEvent(actorName, activeBook.name),
        [currentUserId],
      );
    }
  };

  const handleKickMember = async (targetUserId: string) => {
    const didKick = await onKickMember(targetUserId);
    showNativeToast(didKick ? AppMessages.accountKickSuccess : AppMessages.accountKickError);

    if (didKick && activeBook) {
      const actorName = await resolveCurrentActorName();
      await onSendPushNotificationToUsers(
        createMemberRemovedFromBookEvent(actorName, activeBook.name),
        [targetUserId],
        activeBook.id,
      );
    }

    return didKick;
  };

  const handleApproveJoinRequest = async (requestId: string) => {
    const didApprove = await onApproveJoinRequest(requestId);
    showNativeToast(
      didApprove ? AppMessages.accountJoinApproveSuccess : AppMessages.accountJoinApproveError,
    );

    if (didApprove && activeBook) {
      const approvedRequest = pendingJoinRequests.find((request) => request.id === requestId);
      if (approvedRequest) {
        await onSendPushNotificationToBookMembers(
          activeBook.id,
          createMemberJoinedBookEvent(approvedRequest.requesterDisplayName, activeBook.name),
          [currentUserId, approvedRequest.requesterUserId],
        );
      }
    }

    return didApprove;
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    const didReject = await onRejectJoinRequest(requestId);
    showNativeToast(
      didReject ? AppMessages.accountJoinRejectSuccess : AppMessages.accountJoinRejectError,
    );
    return didReject;
  };

  const canLeaveSharedBook = Boolean(activeBook && activeBook.ownerId !== currentUserId);

  return (
    <View style={styles.panel}>
      <SharedLedgerBookCard
        activeBook={activeBook}
        bookName={displayedBookName}
        bookNameInput={bookNameInput}
        canEditBookName={canEditDisplayedBookName}
        currentUserId={currentUserId}
        isOwner={currentMemberRole === "owner"}
        members={members}
        onApproveJoinRequest={handleApproveJoinRequest}
        onChangeBookName={handleChangeBookName}
        onKickMember={handleKickMember}
        onRejectJoinRequest={handleRejectJoinRequest}
        onSaveBookName={handleSaveBookName}
        pendingJoinRequests={pendingJoinRequests}
      />
      <SharedLedgerJoinCard
        canLeaveSharedBook={canLeaveSharedBook}
        isJoinBlocked={isJoinBlocked}
        onChangeShareCodeInput={(value) => {
          setShareCodeInput(value.toUpperCase());
        }}
        onJoin={handleJoin}
        onLeave={handleLeave}
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
}
