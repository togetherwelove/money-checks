import type { ComponentProps } from "react";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { LedgerBookManagementContent } from "./LedgerBookManagementContent";

export type LedgerBookManagementViewProps = Pick<ComponentProps<typeof LedgerBookManagementContent>,
  "badgedBookIds" | "onBeforeCopyShareCode" | "onBeforeSendJoinRequest" |
  "onSendPendingJoinRequestNotification" | "onSendPushNotificationToBookMembers" |
  "onSendPushNotificationToUsers" | "onOpenSubscription" | "subscriptionTier" | "userId"> & {
  state: LedgerScreenState;
};

export function LedgerBookManagementView({ state, ...props }: LedgerBookManagementViewProps) {
  return (
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
  );
}
