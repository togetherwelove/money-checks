import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import { SharedLedgerJoinPreviewCopy } from "../constants/sharedLedgerJoinPreview";
import { SharedLedgerJoinRequestUi, SharedLedgerPanelUi } from "../constants/sharedLedgerPanel";
import type {
  LedgerBookJoinApprovalAttempt,
  LedgerBookJoinApprovalStatus,
  LedgerBookJoinRequest,
} from "../types/ledgerBookJoinRequest";
import { formatRelativeTime } from "../utils/relativeTime";
import { ActionButton } from "./ActionButton";

type LedgerBookJoinRequestsProps = {
  onApproveRequest: (requestId: string) => Promise<LedgerBookJoinApprovalAttempt>;
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
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getRequesterInitial(request.requesterDisplayName)}
                </Text>
              </View>
              <View style={styles.requestMeta}>
                <Text numberOfLines={1} style={styles.name}>
                  {request.requesterDisplayName}
                </Text>
                <Text style={styles.requestedAt}>{formatRelativeTime(request.requestedAt)}</Text>
              </View>
            </View>
            <JoinRequestStatusText approvalStatus={request.approvalStatus} />
            <View style={styles.actions}>
              <ActionButton
                label={AppMessages.accountJoinRejectAction}
                onPress={() => onRejectRequest(request.id)}
                size="inline"
                variant="secondary"
              />
              {canApproveJoinRequest(request.approvalStatus) ? (
                <ActionButton
                  label={AppMessages.accountJoinApproveAction}
                  onPress={() => onApproveRequest(request.id)}
                  size="inline"
                  variant="primary"
                />
              ) : null}
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

  const tone = resolveApprovalStatusTone(approvalStatus);

  return (
    <View
      style={[
        styles.statusBadge,
        tone === "warning" ? styles.warningStatusBadge : null,
        tone === "blocked" ? styles.blockedStatusBadge : null,
      ]}
    >
      <Text
        style={[
          styles.status,
          tone === "warning" ? styles.warningStatusText : null,
          tone === "blocked" ? styles.blockedStatusText : null,
        ]}
      >
        {message}
      </Text>
    </View>
  );
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

function resolveApprovalStatusTone(
  approvalStatus: LedgerBookJoinApprovalStatus,
): "blocked" | "warning" {
  if (
    approvalStatus === "can_approve_with_personal_book_merge" ||
    approvalStatus === "needs_personal_book_merge_confirmation"
  ) {
    return "warning";
  }

  return "blocked";
}

function getRequesterInitial(displayName: string): string {
  return (
    displayName.trim().charAt(0).toUpperCase() || SharedLedgerJoinRequestUi.requesterFallbackInitial
  );
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
  requestCard: {
    gap: SharedLedgerPanelUi.joinRequestCardGap,
    paddingHorizontal: SharedLedgerPanelUi.joinRequestCardPaddingHorizontal,
    paddingVertical: SharedLedgerPanelUi.joinRequestCardPaddingVertical,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: SharedLedgerPanelUi.joinRequestCardRadius,
    backgroundColor: AppColors.background,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SharedLedgerPanelUi.joinRequestHeaderGap,
  },
  avatar: {
    width: SharedLedgerPanelUi.joinRequestAvatarSize,
    height: SharedLedgerPanelUi.joinRequestAvatarSize,
    borderRadius: SharedLedgerPanelUi.joinRequestAvatarSize,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.surfaceStrong,
  },
  avatarText: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  requestMeta: {
    flex: 1,
    minWidth: 0,
    gap: SharedLedgerPanelUi.joinRequestMetaGap,
  },
  name: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  requestedAt: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: SharedLedgerPanelUi.joinRequestStatusRadius,
    backgroundColor: AppColors.surfaceMuted,
    paddingHorizontal: SharedLedgerPanelUi.joinRequestStatusPaddingHorizontal,
    paddingVertical: SharedLedgerPanelUi.joinRequestStatusPaddingVertical,
  },
  warningStatusBadge: {
    backgroundColor: AppColors.accentSoft,
  },
  blockedStatusBadge: {
    backgroundColor: AppColors.expenseSoft,
  },
  status: {
    color: AppColors.mutedStrongText,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: SharedLedgerPanelUi.joinRequestStatusTextLineHeight,
  },
  warningStatusText: {
    color: AppColors.accent,
  },
  blockedStatusText: {
    color: AppColors.expense,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SharedLedgerPanelUi.joinRequestActionGap,
  },
});
