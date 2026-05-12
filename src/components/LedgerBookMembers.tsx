import { Feather } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { LedgerBookMembersLayout, LedgerBookMembersUi } from "../constants/ledgerBookMembers";
import {
  AppMessages,
  buildAccountKickAccessibilityLabel,
  buildAccountKickConfirmMessage,
} from "../constants/messages";
import { SubscriptionMessages } from "../constants/subscription";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import { TextLinkButton } from "./TextLinkButton";

type LedgerBookMembersProps = {
  currentUserId: string;
  isManagementDisabled?: boolean;
  members: LedgerBookMember[];
  onOpenSubscription: () => void;
  onKickMember: (targetUserId: string) => Promise<boolean>;
  shouldShowSharedMemberLimitNotice: boolean;
};

export function LedgerBookMembers({
  currentUserId,
  isManagementDisabled = false,
  members,
  onOpenSubscription,
  onKickMember,
  shouldShowSharedMemberLimitNotice,
}: LedgerBookMembersProps) {
  const pendingKickMemberIdRef = useRef<string | null>(null);
  const [pendingKickMemberId, setPendingKickMemberId] = useState<string | null>(null);
  const canManageMembers = members.some(
    (member) => member.userId === currentUserId && member.role === "owner",
  );
  const shouldScrollMembers = members.length > LedgerBookMembersUi.maxVisibleMembers;
  const memberListContent = (
    <View style={styles.memberList}>
      {members.map((member, memberIndex) => {
        const isOwner = member.role === "owner";
        const canKickMember =
          canManageMembers && !isManagementDisabled && !isOwner && member.userId !== currentUserId;
        const selfBadgeLabel = stripWrappingParentheses(AppMessages.accountMemberSelfSuffix);
        const isKickActionDisabled = pendingKickMemberId !== null;

        return (
          <View
            key={member.userId}
            style={[styles.memberRow, memberIndex > 0 ? styles.memberRowDivider : null]}
          >
            <View style={styles.memberIdentity}>
              <Text numberOfLines={1} style={styles.memberName}>
                {member.displayName}
              </Text>
              {isOwner ? (
                <Text style={[styles.memberRoleBadge, styles.ownerRoleBadge]}>
                  {AppMessages.accountRoleOwner}
                </Text>
              ) : null}
              {member.userId === currentUserId ? (
                <Text style={styles.selfBadge}>{selfBadgeLabel}</Text>
              ) : null}
            </View>
            {canKickMember ? (
              <View style={styles.memberActions}>
                <Pressable
                  accessibilityLabel={buildAccountKickAccessibilityLabel(member.displayName)}
                  accessibilityRole="button"
                  disabled={isKickActionDisabled}
                  hitSlop={LedgerBookMembersUi.actionHitSlop}
                  onPress={() =>
                    confirmKickMember(member.displayName, {
                      onCancel: releasePendingKickMember,
                      onConfirm: () => handleConfirmKickMember(member.userId),
                      onOpen: () => reservePendingKickMember(member.userId),
                    })
                  }
                  style={[
                    styles.memberActionButton,
                    isKickActionDisabled ? styles.disabledMemberActionButton : null,
                  ]}
                >
                  <Feather
                    color={AppColors.expense}
                    name="user-minus"
                    size={LedgerBookMembersUi.actionIconSize}
                  />
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.memberTitle}>{AppMessages.accountMembersTitle}</Text>
      {shouldScrollMembers ? (
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          style={styles.memberListScroll}
        >
          {memberListContent}
        </ScrollView>
      ) : (
        memberListContent
      )}
      {shouldShowSharedMemberLimitNotice ? (
        <TextLinkButton
          label={SubscriptionMessages.sharedLedgerLimitDescription}
          onPress={onOpenSubscription}
        />
      ) : null}
    </View>
  );

  function reservePendingKickMember(memberId: string): boolean {
    if (pendingKickMemberIdRef.current) {
      return false;
    }

    pendingKickMemberIdRef.current = memberId;
    setPendingKickMemberId(memberId);
    return true;
  }

  function releasePendingKickMember() {
    pendingKickMemberIdRef.current = null;
    setPendingKickMemberId(null);
  }

  async function handleConfirmKickMember(memberId: string): Promise<boolean> {
    try {
      return await onKickMember(memberId);
    } finally {
      releasePendingKickMember();
    }
  }
}

function stripWrappingParentheses(label: string): string {
  return label.replace(/^\((.*)\)$/, "$1");
}

function confirmKickMember(
  displayName: string,
  actions: {
    onCancel: () => void;
    onConfirm: () => Promise<boolean>;
    onOpen: () => boolean;
  },
) {
  if (!actions.onOpen()) {
    return;
  }

  Alert.alert(
    AppMessages.accountKickConfirmTitle,
    buildAccountKickConfirmMessage(displayName),
    [
      {
        onPress: actions.onCancel,
        style: "cancel",
        text: CommonActionCopy.cancel,
      },
      {
        onPress: () => void actions.onConfirm(),
        style: "destructive",
        text: AppMessages.accountKickAction,
      },
    ],
    {
      onDismiss: actions.onCancel,
    },
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 6,
  },
  memberList: {
    overflow: "hidden",
    borderWidth: 1,
    borderTopColor: AppColors.border,
    borderColor: AppColors.border,
    borderRadius: LedgerBookMembersUi.listBorderRadius,
    backgroundColor: AppColors.background,
  },
  memberListScroll: {
    maxHeight: LedgerBookMembersLayout.listMaxHeight,
  },
  memberTitle: {
    color: AppColors.mutedStrongText,
    fontSize: LedgerBookMembersUi.labelFontSize,
    fontWeight: "700",
    lineHeight: LedgerBookMembersUi.labelLineHeight,
    marginBottom: LedgerBookMembersUi.labelBottomMargin,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: LedgerBookMembersUi.rowHeight,
    paddingHorizontal: LedgerBookMembersUi.rowHorizontalPadding,
    paddingVertical: LedgerBookMembersUi.rowVerticalPadding,
  },
  memberRowDivider: {
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  memberIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: LedgerBookMembersUi.memberIdentityGap,
  },
  memberName: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: LedgerBookMembersUi.rowTextLineHeight,
    flexShrink: 1,
  },
  selfBadge: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: LedgerBookMembersUi.badgeLineHeight,
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderWidth: 1,
    borderRadius: LedgerBookMembersUi.selfBadgeHorizontalPadding,
    paddingHorizontal: LedgerBookMembersUi.selfBadgeHorizontalPadding,
    paddingVertical: LedgerBookMembersUi.selfBadgeVerticalPadding,
    flexShrink: 0,
  },
  memberRoleBadge: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: LedgerBookMembersUi.badgeLineHeight,
    borderRadius: LedgerBookMembersUi.roleBadgeHorizontalPadding,
    paddingHorizontal: LedgerBookMembersUi.roleBadgeHorizontalPadding,
    paddingVertical: LedgerBookMembersUi.roleBadgeVerticalPadding,
    flexShrink: 0,
  },
  ownerRoleBadge: {
    color: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  memberActionButton: {
    borderWidth: 1,
    borderColor: AppColors.expenseSoft,
    borderRadius: LedgerBookMembersUi.actionButtonBorderRadius,
    backgroundColor: AppColors.expenseSoft,
    alignItems: "center",
    justifyContent: "center",
    height: LedgerBookMembersUi.actionButtonSize,
    width: LedgerBookMembersUi.actionButtonSize,
  },
  disabledMemberActionButton: {
    opacity: LedgerBookMembersUi.disabledActionButtonOpacity,
  },
});
