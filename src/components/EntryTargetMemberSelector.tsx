import { Feather } from "./AppIcons";
import { MenuView, type MenuAction } from "@react-native-menu/menu";
import { useMemo } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";

import { AppSettingsUi } from "../constants/appSettings";
import { AppColors } from "../constants/colors";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { CompactTextProps } from "../constants/textLayout";
import { AppLayout } from "../constants/layout";
import { EntryDetailLabelStyle, EntryDetailValueStyle, EntryDetailRowStyle } from "../constants/entryDetailStyles";
import type { LedgerBookMember } from "../types/ledgerBookMember";

type EntryTargetMemberSelectorProps = {
  members: LedgerBookMember[];
  onSelectMember: (member: LedgerBookMember) => void;
  selectedMemberId: string;
};

export function EntryTargetMemberSelector({
  members,
  onSelectMember,
  selectedMemberId,
}: EntryTargetMemberSelectorProps) {
  const actions = useMemo<MenuAction[]>(
    () => members.map((member) => ({
      id: member.userId,
      title: member.displayName,
      state: member.userId === selectedMemberId ? "on" : "off",
    })),
    [members, selectedMemberId],
  );
  const selectedMember = members.find((member) => member.userId === selectedMemberId);
  if (members.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text numberOfLines={1} style={styles.label}>{EntryRegistrationCopy.targetMemberLabel}</Text>
      <MenuView
        style={styles.menu}
        actions={actions}
        title={EntryRegistrationCopy.targetMemberLabel}
        onOpenMenu={() => Keyboard.dismiss()}
        onPressAction={({ nativeEvent }) => {
          const member = members.find((item) => item.userId === nativeEvent.event);
          if (member) onSelectMember(member);
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={EntryRegistrationCopy.targetMemberLabel}
          accessibilityValue={{ text: selectedMember?.displayName ?? EntryRegistrationCopy.targetMemberPlaceholder }}
          style={styles.option}
        >
          <Text {...CompactTextProps} numberOfLines={1} style={styles.optionLabel}>
            {selectedMember?.displayName ?? EntryRegistrationCopy.targetMemberPlaceholder}
          </Text>
          <Feather name="chevron-down" color={AppColors.mutedText} size={AppSettingsUi.selectionChevronIconSize} />
        </Pressable>
      </MenuView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: EntryDetailRowStyle,
  menu: { flexShrink: 1 },
  label: EntryDetailLabelStyle,
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: AppLayout.compactGap,
    minHeight: EntryDetailRowStyle.minHeight,
  },
  optionLabel: { ...EntryDetailValueStyle, flexShrink: 1, color: AppColors.primary },
});
