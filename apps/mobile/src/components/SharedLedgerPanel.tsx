import { useState } from "react";
import { View } from "react-native";

import { AppMessages } from "../constants/messages";
import type { LedgerBook } from "../types/ledgerBook";
import type {
  JoinSharedLedgerBookAttempt,
  LedgerBookJoinRequest,
} from "../types/ledgerBookJoinRequest";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import { SharedLedgerBookCard } from "./sharedLedgerPanel/SharedLedgerBookCard";
import { SharedLedgerJoinCard } from "./sharedLedgerPanel/SharedLedgerJoinCard";
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
  pendingJoinRequests,
}: SharedLedgerPanelProps) {
  const [shareCodeInput, setShareCodeInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasJoinError, setHasJoinError] = useState(false);
  const isSharedOwner =
    Boolean(activeBook && activeBook.ownerId === currentUserId) &&
    members.some((member) => member.userId !== currentUserId);

  const handleJoin = async () => {
    if (isSharedOwner) {
      return;
    }

    const nextShareCode = shareCodeInput.trim();
    if (!nextShareCode) {
      return;
    }

    const joinAttempt = await onJoinSharedLedgerBook(nextShareCode);
    const didSucceed = Boolean(joinAttempt.result);
    setHasJoinError(!didSucceed);
    setStatusMessage(
      joinAttempt.result === "requested"
        ? AppMessages.accountJoinRequestSuccess
        : joinAttempt.result === "joined"
          ? AppMessages.accountJoinSuccess
          : (joinAttempt.errorMessage ?? AppMessages.accountJoinError),
    );

    if (didSucceed) {
      setShareCodeInput("");
    }
  };

  const handleLeave = async () => {
    const didLeave = await onLeaveSharedLedgerBook();
    setHasJoinError(!didLeave);
    setStatusMessage(
      didLeave ? AppMessages.accountDisconnectSuccess : AppMessages.accountDisconnectError,
    );
  };

  const handleKickMember = async (targetUserId: string) => {
    const didKick = await onKickMember(targetUserId);
    setHasJoinError(!didKick);
    setStatusMessage(didKick ? AppMessages.accountKickSuccess : AppMessages.accountKickError);
    return didKick;
  };

  const handleApproveJoinRequest = async (requestId: string) => {
    const didApprove = await onApproveJoinRequest(requestId);
    setHasJoinError(!didApprove);
    setStatusMessage(
      didApprove ? AppMessages.accountJoinApproveSuccess : AppMessages.accountJoinApproveError,
    );
    return didApprove;
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    const didReject = await onRejectJoinRequest(requestId);
    setHasJoinError(!didReject);
    setStatusMessage(
      didReject ? AppMessages.accountJoinRejectSuccess : AppMessages.accountJoinRejectError,
    );
    return didReject;
  };

  const canLeaveSharedBook = Boolean(activeBook && activeBook.ownerId !== currentUserId);

  return (
    <View style={styles.panel}>
      <SharedLedgerBookCard
        activeBook={activeBook}
        currentUserId={currentUserId}
        members={members}
        onApproveJoinRequest={handleApproveJoinRequest}
        onKickMember={handleKickMember}
        onRejectJoinRequest={handleRejectJoinRequest}
        pendingJoinRequests={pendingJoinRequests}
      />
      <SharedLedgerJoinCard
        canLeaveSharedBook={canLeaveSharedBook}
        hasJoinError={hasJoinError}
        isJoinBlocked={isSharedOwner}
        onChangeShareCodeInput={(value) => {
          setShareCodeInput(value.toUpperCase());
          if (statusMessage) {
            setStatusMessage(null);
          }
        }}
        onJoin={() => void handleJoin()}
        onLeave={() => void handleLeave()}
        shareCodeInput={shareCodeInput}
        statusMessage={statusMessage}
      />
    </View>
  );
}
