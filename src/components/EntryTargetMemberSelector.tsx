import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthControls } from "../constants/authControls";
import { AppColors } from "../constants/colors";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { CompactTextProps } from "../constants/textLayout";
import { AppLayout } from "../constants/layout";
import { EntryComposerUi } from "../constants/entryComposer";
import { EntryDetailFieldStyle, EntryDetailLabelStyle, EntryDetailValueStyle, EntryDetailRowStyle } from "../constants/entryDetailStyles";
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
  if (members.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.label}>{EntryRegistrationCopy.targetMemberLabel}</Text></View>
      <View style={styles.optionList}>
        {members.map((member) => {
          const isSelected = member.userId === selectedMemberId;
          return (
            <Pressable
              key={member.userId}
              onPress={() => onSelectMember(member)}
              style={[styles.option, isSelected ? styles.optionSelected : null]}
            >
              <Text
                {...CompactTextProps}
                style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}
              >
                {member.displayName}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: EntryDetailFieldStyle,
  header: EntryDetailRowStyle,
  label: EntryDetailLabelStyle,
  optionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppLayout.screenPadding,
  },
  option: {
    borderWidth: AppLayout.dividerWidth,
    borderColor: AppColors.border,
    borderRadius: AuthControls.borderRadius,
    backgroundColor: AppColors.background,
    paddingHorizontal: EntryComposerUi.detailsPadding,
    paddingVertical: AppLayout.compactGap,
  },
  optionSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.screenBackground,
  },
  optionLabel: {
    ...EntryDetailValueStyle,
  },
  optionLabelSelected: {
    color: AppColors.primary,
  },
});
