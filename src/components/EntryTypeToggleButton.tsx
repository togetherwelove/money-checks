import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getAppColors } from "../constants/colors";
import { EntryTypeToggleUi } from "../constants/entryRegistration";
import { CompactTextProps } from "../constants/textLayout";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import type { LedgerEntryType } from "../types/ledger";

type EntryTypeToggleButtonProps = {
  disabled?: boolean;
  dimWhenDisabled?: boolean;
  onSelectType: (type: LedgerEntryType) => void;
  selectedType: LedgerEntryType;
};

const ENTRY_DIRECTION_ORDER: LedgerEntryType[] = ["expense", "income"];

export function EntryTypeToggleButton({
  disabled = false,
  dimWhenDisabled = true,
  onSelectType,
  selectedType,
}: EntryTypeToggleButtonProps) {
  const styles = getStyles();
  useAppTheme();
  const expenseTextStyle = useExpenseTextColor().textStyle;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onSelectType(selectedType === "expense" ? "income" : "expense")}
      style={[styles.container, disabled && dimWhenDisabled && styles.disabledContainer]}
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
              {...CompactTextProps}
              style={[
                styles.optionLabel,
                isActive && type === "expense" ? expenseTextStyle : null,
                isActive && type === "income" ? styles.activeIncomeLabel : null,
                isActive ? styles.activeLabel : null,
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

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    disabledContainer: { backgroundColor: getAppColors().surfaceStrong },
    container: {
      alignItems: "center",
      alignSelf: "stretch",
      flexDirection: "row",
      minHeight: EntryTypeToggleUi.containerHeight,
      paddingHorizontal: 0,
    },
    option: {
      alignItems: "center",
      alignSelf: "stretch",
      borderBottomColor: getAppColors().transparent,
      borderBottomWidth: EntryTypeToggleUi.indicatorHeight,
      flex: 1,
      justifyContent: "center",
      minWidth: EntryTypeToggleUi.optionMinWidth,
      paddingHorizontal: EntryTypeToggleUi.optionPaddingHorizontal,
    },
    activeExpenseOption: {
      borderBottomColor: getAppColors().expense,
    },
    activeIncomeOption: {
      borderBottomColor: getAppColors().income,
    },
    optionLabel: {
      color: getAppColors().mutedText,
      marginHorizontal: EntryTypeToggleUi.labelMarginHorizontal,
      fontSize: EntryTypeToggleUi.labelFontSize,
      fontWeight: "700",
      lineHeight: EntryTypeToggleUi.labelLineHeight,
    },
    activeLabel: {
      fontWeight: "800",
    },
    activeIncomeLabel: {
      color: getAppColors().income,
      fontWeight: "800",
    },
  }),
);
