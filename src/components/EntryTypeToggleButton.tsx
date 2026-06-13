import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
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
    backgroundColor: AppColors.surfaceMuted,
    borderColor: AppColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    height: 32,
    paddingHorizontal: 0,
  },
  option: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "transparent",
    justifyContent: "center",
    minWidth: 48,
    paddingHorizontal: 10,
  },
  overlappedOption: {
    marginLeft: -4,
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
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
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
