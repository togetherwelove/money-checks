import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import {
  EntryDirectionLabels,
  EntryDirectionToggleUi,
  getOppositeEntryDirection,
} from "../constants/entryDirection";
import type { LedgerEntryType } from "../types/ledger";

type EntryTypeToggleButtonProps = {
  onSelectType: (type: LedgerEntryType) => void;
  selectedType: LedgerEntryType;
};

const ENTRY_DIRECTION_ORDER: LedgerEntryType[] = ["expense", "income"];

export function EntryTypeToggleButton({ onSelectType, selectedType }: EntryTypeToggleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onSelectType(getOppositeEntryDirection(selectedType))}
      style={styles.container}
    >
      {ENTRY_DIRECTION_ORDER.map((type) => {
        const isActive = type === selectedType;
        return (
          <View
            key={type}
            style={[
              styles.option,
              type === "income" ? styles.overlappedOption : null,
              isActive && type === "expense" ? styles.activeExpenseOption : null,
              isActive && type === "income" ? styles.activeIncomeOption : null,
            ]}
          >
            <Text
              style={[
                styles.optionLabel,
                isActive && type === "expense" ? styles.activeExpenseLabel : null,
                isActive && type === "income" ? styles.activeIncomeLabel : null,
              ]}
            >
              {EntryDirectionLabels[type]}
            </Text>
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: AppColors.surfaceMuted,
    borderColor: AppColors.border,
    borderRadius: EntryDirectionToggleUi.compactBorderRadius,
    borderWidth: 1,
    flexDirection: "row",
    height: EntryDirectionToggleUi.compactHeight,
    paddingHorizontal: EntryDirectionToggleUi.compactHorizontalPadding,
  },
  option: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: EntryDirectionToggleUi.compactOptionRadius,
    borderWidth: 1,
    borderColor: "transparent",
    justifyContent: "center",
    minWidth: EntryDirectionToggleUi.compactOptionMinWidth,
    paddingHorizontal: EntryDirectionToggleUi.compactOptionHorizontalPadding,
  },
  overlappedOption: {
    marginLeft: EntryDirectionToggleUi.compactOptionOverlapOffset,
  },
  activeExpenseOption: {
    backgroundColor: AppColors.expenseSoft,
    borderColor: AppColors.expense,
  },
  activeIncomeOption: {
    backgroundColor: AppColors.incomeSoft,
    borderColor: AppColors.income,
  },
  optionLabel: {
    color: AppColors.mutedText,
    marginHorizontal: 4,
    fontSize: EntryDirectionToggleUi.compactTextFontSize,
    fontWeight: "700",
    lineHeight: EntryDirectionToggleUi.compactTextLineHeight,
  },
  activeExpenseLabel: {
    color: AppColors.expense,
    fontWeight: "800",
  },
  activeIncomeLabel: {
    color: AppColors.income,
    fontWeight: "800",
  },
});
