import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthControls } from "../constants/authControls";
import { AppColors } from "../constants/colors";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { CompactTextProps } from "../constants/textLayout";
import { FormLabelTextStyle } from "../constants/uiStyles";
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
      <Text style={styles.label}>{EntryRegistrationCopy.targetMemberLabel}</Text>
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
  container: {
    gap: 6,
  },
  label: FormLabelTextStyle,
  optionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: AuthControls.borderRadius,
    backgroundColor: AppColors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.screenBackground,
  },
  optionLabel: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  optionLabelSelected: {
    color: AppColors.primary,
  },
});
