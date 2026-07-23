import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  type CalendarExpenseColorMode,
  CalendarExpenseColorModes,
  CalendarExpenseColorOptions,
  CalendarExpenseColorUi,
} from "../../constants/calendarExpenseColor";
import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";

type CalendarExpenseColorSelectorProps = {
  mode: CalendarExpenseColorMode;
  onChange: (mode: CalendarExpenseColorMode) => void;
};

export function CalendarExpenseColorSelector({
  mode,
  onChange,
}: CalendarExpenseColorSelectorProps) {
  return (
    <View accessibilityRole="radiogroup" style={styles.container}>
      {CalendarExpenseColorOptions.map((option) => {
        const isSelected = option.value === mode;
        const swatchColor =
          option.value === CalendarExpenseColorModes.defaultText
            ? AppColors.text
            : AppColors.expense;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              isSelected ? styles.selectedSegment : null,
              pressed ? styles.pressedSegment : null,
            ]}
          >
            <View style={[styles.swatch, { backgroundColor: swatchColor }]} />
            <Text style={[styles.label, isSelected ? styles.selectedLabel : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: AppLayout.compactGap,
  },
  label: {
    color: AppColors.mutedText,
    fontSize: CalendarExpenseColorUi.labelFontSize,
    fontWeight: "700",
  },
  pressedSegment: {
    opacity: CalendarExpenseColorUi.pressedOpacity,
  },
  segment: {
    minHeight: CalendarExpenseColorUi.segmentMinHeight,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: AppLayout.compactGap,
    borderColor: AppColors.border,
    borderRadius: CalendarExpenseColorUi.segmentRadius,
    borderWidth: CalendarExpenseColorUi.segmentBorderWidth,
    backgroundColor: AppColors.background,
  },
  selectedLabel: {
    color: AppColors.text,
  },
  selectedSegment: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primarySoft,
  },
  swatch: {
    width: CalendarExpenseColorUi.swatchSize,
    height: CalendarExpenseColorUi.swatchSize,
    borderColor: AppColors.border,
    borderRadius: CalendarExpenseColorUi.swatchSize / 2,
    borderWidth: CalendarExpenseColorUi.swatchBorderWidth,
  },
});
