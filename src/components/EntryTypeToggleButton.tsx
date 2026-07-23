import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { EntryTypeToggleUi } from "../constants/entryRegistration";
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
      onPress={() => onSelectType(selectedType === "expense" ? "income" : "expense")}
      style={styles.container}
    >
      {ENTRY_DIRECTION_ORDER.map((type) => {
        const isActive = type === selectedType;
        return (
          <View
            key={type}
            style={[
              styles.option,
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
              {type === "expense" ? "지출" : "수입"}
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
    alignSelf: "flex-start",
    borderBottomColor: AppColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: EntryTypeToggleUi.containerHeight,
    paddingHorizontal: 0,
  },
  option: {
    alignItems: "center",
    alignSelf: "stretch",
    borderBottomColor: AppColors.transparent,
    borderBottomWidth: EntryTypeToggleUi.indicatorHeight,
    justifyContent: "center",
    minWidth: EntryTypeToggleUi.optionMinWidth,
    paddingHorizontal: EntryTypeToggleUi.optionPaddingHorizontal,
  },
  activeExpenseOption: {
    borderBottomColor: AppColors.expense,
  },
  activeIncomeOption: {
    borderBottomColor: AppColors.income,
  },
  optionLabel: {
    color: AppColors.mutedText,
    marginHorizontal: EntryTypeToggleUi.labelMarginHorizontal,
    fontSize: EntryTypeToggleUi.labelFontSize,
    fontWeight: "700",
    lineHeight: EntryTypeToggleUi.labelLineHeight,
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
