import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { LedgerBookMembersLayout, LedgerBookMembersUi } from "../constants/ledgerBookMembers";
import { AppMessages } from "../constants/messages";
import type { LedgerBookMember, LedgerBookMemberRole } from "../types/ledgerBookMember";

type LedgerBookMembersProps = {
  currentUserId: string;
  members: LedgerBookMember[];
  onKickMember: (targetUserId: string) => Promise<boolean>;
};

export function LedgerBookMembers({
  currentUserId,
  members,
  onKickMember,
}: LedgerBookMembersProps) {
  const currentMember = members.find((member) => member.userId === currentUserId);
  const canManageMembers = currentMember?.role === "owner";
  const shouldScrollMembers = members.length > LedgerBookMembersUi.maxVisibleMembers;
  const memberListContent = (
    <View style={styles.memberList}>
      {members.map((member) => (
        <View key={member.userId} style={styles.memberRow}>
          <Text style={styles.memberName}>
            {member.displayName}
            {member.userId === currentUserId ? ` ${AppMessages.accountMemberSelfSuffix}` : ""}
          </Text>
          <View style={styles.memberActions}>
            <Text style={styles.memberRole}>{getRoleLabel(member.role)}</Text>
            {canManageMembers && member.role !== "owner" && member.userId !== currentUserId ? (
              <Pressable onPress={() => void onKickMember(member.userId)}>
                <Text style={styles.kickAction}>{AppMessages.accountKickAction}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={styles.summaryRow}>
        <InfoBlock
          label={AppMessages.accountMemberCount}
          value={`${members.length}${AppMessages.accountMemberCountSuffix}`}
        />
        <InfoBlock label={AppMessages.accountRoleLabel} value={getRoleLabel(currentMember?.role)} />
      </View>

      <Text style={styles.memberTitle}>{AppMessages.accountMembersTitle}</Text>
      {shouldScrollMembers ? (
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={styles.memberListScroll}
        >
          {memberListContent}
        </ScrollView>
      ) : (
        memberListContent
      )}
    </View>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
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
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoBlock: {
    flex: 1,
    gap: 3,
  },
  label: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  value: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  memberList: {},
  memberListScroll: {
    maxHeight: LedgerBookMembersLayout.listMaxHeight,
  },
  memberTitle: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "700",
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingTop: 10,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    minHeight: LedgerBookMembersUi.rowHeight,
    paddingVertical: 2,
  },
  memberName: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  memberRole: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  kickAction: {
    color: AppColors.expense,
    fontSize: 12,
    fontWeight: "700",
  },
});
