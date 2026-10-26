import { type ComponentProps, useEffect, useRef } from "react";

import { AppLayout } from "../constants/layout";
import { LedgerBookManagementCopy } from "../constants/ledgerBookManagement";
import type { SubscriptionTier } from "../constants/subscription";
import { BottomContentInsetContext } from "../contexts/BottomContentInsetContext";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { LedgerBookManagementContent } from "./LedgerBookManagementContent";
import { BlockingOverlay } from "./BlockingOverlay";
import { NativeSelectionSheet } from "./NativeSelectionSheet";

type ShareProps = ComponentProps<typeof LedgerBookManagementContent>;
type Props = Pick<ShareProps, "onBeforeCopyShareCode" | "onBeforeSendJoinRequest" |
  "onSendPendingJoinRequestNotification" | "onSendPushNotificationToBookMembers" | "onSendPushNotificationToUsers"> & {
  isOpen: boolean;
  badgedBookIds: readonly string[];
  onClose: () => void;
  onDismiss?: () => void;
  onOpenSubscription: () => void;
  state: LedgerScreenState;
  subscriptionTier: SubscriptionTier;
  userId: string;
};

export function LedgerBookManagementSheet({ isOpen, onClose, onDismiss, state, ...props }: Props) {
  const bookId = state.activeBook?.id;
  const refreshShareCode = useRef(state.refreshExpiredShareCode);
  refreshShareCode.current = state.refreshExpiredShareCode;
  useEffect(() => {
    if (isOpen && bookId) void refreshShareCode.current();
  }, [isOpen, bookId]);

  return <NativeSelectionSheet isOpen={isOpen} onClose={onClose} onDismiss={onDismiss}
    title={LedgerBookManagementCopy.listTitle} dismissible={!state.isBusy}>
    <BottomContentInsetContext.Provider value={AppLayout.cardContentPadding}>
      <LedgerBookManagementContent {...props}
        accessibleBooks={state.accessibleBooks} activeBook={state.activeBook}
        onApproveJoinRequest={state.approveLedgerJoinRequest}
        onCreateLedgerBook={state.createLedgerBook}
        onDeleteActiveLedgerBook={state.deleteActiveLedgerBook}
        onJoinSharedLedgerBook={state.joinSharedLedgerBookByCode}
        onLeaveSharedLedgerBook={state.leaveSharedLedgerBook}
        onPreviewJoinSharedLedgerBook={state.previewSharedLedgerBookJoinByCode}
        onRejectJoinRequest={state.rejectLedgerJoinRequest}
        onRemoveSharedLedgerMember={state.removeSharedLedgerMember}
        onRenameActiveLedgerBook={state.renameActiveLedgerBook}
        onSwitchLedgerBook={state.switchLedgerBook}
        onTransferSharedLedgerOwnership={state.transferSharedLedgerOwnership}
        pendingJoinRequestCountsByBookId={state.pendingJoinRequestCountsByBookId}
        pendingJoinRequests={state.pendingJoinRequests} screenTitle={null} />
    </BottomContentInsetContext.Provider>
    {state.isBusy ? <BlockingOverlay /> : null}
  </NativeSelectionSheet>;
}
