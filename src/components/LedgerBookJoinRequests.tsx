import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import { SharedLedgerJoinPreviewCopy } from "../constants/sharedLedgerJoinPreview";
import { SharedLedgerPanelUi } from "../constants/sharedLedgerPanel";
import type {
  LedgerBookJoinApprovalStatus,
  LedgerBookJoinRequest,
} from "../types/ledgerBookJoinRequest";
import { ActionButton } from "./ActionButton";

type LedgerBookJoinRequestsProps = {
  onApproveRequest: (requestId: string) => Promise<boolean>;
  onRejectRequest: (requestId: string) => Promise<boolean>;
  requests: LedgerBookJoinRequest[];
};

export function LedgerBookJoinRequests({
  onApproveRequest,
  onRejectRequest,
  requests,
}: LedgerBookJoinRequestsProps) {
  if (!requests.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{AppMessages.accountJoinRequestsTitle}</Text>
      <View style={styles.list}>
        {requests.map((request) => (
          <View key={request.id} style={styles.row}>
            <Text style={styles.name}>{request.requesterDisplayName}</Text>
            <JoinRequestStatusText approvalStatus={request.approvalStatus} />
            <View style={styles.actions}>
              <ActionButton
                label={AppMessages.accountJoinRejectAction}
                onPress={() => onRejectRequest(request.id)}
                variant="secondary"
              />
              <ActionButton
                disabled={!canApproveJoinRequest(request.approvalStatus)}
                label={AppMessages.accountJoinApproveAction}
                onPress={() => onApproveRequest(request.id)}
                variant="primary"
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function JoinRequestStatusText({
  approvalStatus,
}: {
  approvalStatus: LedgerBookJoinApprovalStatus;
}) {
  const message = resolveApprovalStatusMessage(approvalStatus);
  if (!message) {
    return null;
  }

  return <Text style={styles.status}>{message}</Text>;
}

function canApproveJoinRequest(approvalStatus: LedgerBookJoinApprovalStatus): boolean {
  return (
    approvalStatus === "can_approve" || approvalStatus === "can_approve_with_personal_book_merge"
  );
}

function resolveApprovalStatusMessage(approvalStatus: LedgerBookJoinApprovalStatus): string | null {
  if (approvalStatus === "can_approve") {
    return null;
  }

  if (approvalStatus === "can_approve_with_personal_book_merge") {
    return SharedLedgerJoinPreviewCopy.approvalMergeReady;
  }

  if (approvalStatus === "needs_personal_book_merge_confirmation") {
    return SharedLedgerJoinPreviewCopy.approvalNeedsMergeConfirmation;
  }

  if (approvalStatus === "blocked_shared_owner_free") {
    return SharedLedgerJoinPreviewCopy.ownerBlocked;
  }

  if (approvalStatus === "blocked_shared_editor_free") {
    return SharedLedgerJoinPreviewCopy.editorBlocked;
  }

  if (approvalStatus === "blocked_target_member_limit") {
    return SharedLedgerJoinPreviewCopy.targetMemberLimit;
  }

  return SharedLedgerJoinPreviewCopy.accessibleLimit;
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  title: {
    color: AppColors.text,
    fontSize: SharedLedgerPanelUi.sectionTitleFontSize,
    fontWeight: "800",
    lineHeight: SharedLedgerPanelUi.sectionTitleLineHeight,
    paddingTop: 2,
  },
  list: {
    gap: 8,
  },
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  name: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  status: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
