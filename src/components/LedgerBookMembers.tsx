import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { LedgerBookMembersLayout, LedgerBookMembersUi } from "../constants/ledgerBookMembers";
import { AppMessages } from "../constants/messages";
import { SubscriptionMessages } from "../constants/subscription";
import type { LedgerBookMember, LedgerBookMemberRole } from "../types/ledgerBookMember";
import { TextLinkButton } from "./TextLinkButton";

type LedgerBookMembersProps = {
  currentUserId: string;
  members: LedgerBookMember[];
  onOpenSubscription: () => void;
  onKickMember: (targetUserId: string) => Promise<boolean>;
  shouldShowSharedMemberLimitNotice: boolean;
};

export function LedgerBookMembers({
  currentUserId,
  members,
  onOpenSubscription,
  onKickMember,
  shouldShowSharedMemberLimitNotice,
}: LedgerBookMembersProps) {
  const canManageMembers = members.some(
    (member) => member.userId === currentUserId && member.role === "owner",
  );
  const shouldScrollMembers = members.length > LedgerBookMembersUi.maxVisibleMembers;
  const memberListContent = (
    <View style={styles.memberList}>
      {members.map((member, memberIndex) => {
        const isOwner = member.role === "owner";
        const canKickMember = canManageMembers && !isOwner && member.userId !== currentUserId;
        const memberRoleLabel = getRoleLabel(member.role);

        return (
          <View
            key={member.userId}
            style={[styles.memberRow, memberIndex > 0 ? styles.memberRowDivider : null]}
          >
            <View style={styles.memberIdentity}>
              <Text numberOfLines={1} style={styles.memberName}>
                {member.displayName}
              </Text>
              {member.userId === currentUserId ? (
                <Text style={styles.selfBadge}>{AppMessages.accountMemberSelfSuffix}</Text>
              ) : null}
            </View>
            <View style={styles.memberActions}>
              <Text
                style={[
                  styles.memberRoleBadge,
                  isOwner ? styles.ownerRoleBadge : styles.editorRoleBadge,
                ]}
              >
                {memberRoleLabel}
              </Text>
              {canKickMember ? (
                <Pressable
                  hitSlop={LedgerBookMembersUi.actionHitSlop}
                  onPress={() => void onKickMember(member.userId)}
                  style={styles.memberActionButton}
                >
                  <Text style={styles.kickAction}>{AppMessages.accountKickAction}</Text>
                </Pressable>
              ) : null}
            </View>
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
}

function getRoleLabel(role?: LedgerBookMemberRole): string {
  if (role === "owner") {
    return AppMessages.accountRoleOwner;
  }

  if (role === "viewer") {
    return AppMessages.accountRoleViewer;
  }

  return AppMessages.accountRoleEditor;
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
  editorRoleBadge: {
    color: AppColors.mutedText,
    backgroundColor: AppColors.surfaceMuted,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: LedgerBookMembersUi.rowHeight,
    flexShrink: 0,
  },
  memberActionButton: {
    borderWidth: 1,
    borderColor: AppColors.expenseSoft,
    borderRadius: LedgerBookMembersUi.roleBadgeHorizontalPadding,
    backgroundColor: AppColors.expenseSoft,
    justifyContent: "center",
    paddingHorizontal: LedgerBookMembersUi.actionButtonHorizontalPadding,
    paddingVertical: LedgerBookMembersUi.actionButtonVerticalPadding,
  },
  kickAction: {
    color: AppColors.expense,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: LedgerBookMembersUi.rowTextLineHeight,
  },
});
