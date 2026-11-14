import { useAppTheme } from "../../hooks/useAppTheme";
import { DatePicker, Host } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  datePickerStyle,
  disabled as disabledModifier,
  labelsHidden,
  font,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useMemo } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { EntryComposerUi } from "../../constants/entryComposer";
import { EntryRegistrationCopy } from "../../constants/entryRegistration";
import { getAppColors } from "../../constants/colors";
import { AppScreenTitleUi } from "../../constants/layout";
import { parseIsoDate, toIsoDate } from "../../utils/calendar";
import type { EntryHeaderDatePickerProps } from "./EntryHeaderDatePicker";

export function EntryHeaderDatePicker({
  selectedDate,
  onSelectDate,
  disabled = false,
  variant = "default",
}: EntryHeaderDatePickerProps) {
  const colorScheme = useAppTheme();
  const selection = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
  const appearanceModifiers = useMemo(
    () =>
      variant === "navigation"
        ? [font(AppScreenTitleUi.datePickerFont), tint(getAppColors().primary)]
        : [],
    [variant, colorScheme],
  );
  return (
    <View
      onTouchStart={() => {
        if (!disabled) Keyboard.dismiss();
      }}
    >
      <Host
        matchContents={{ horizontal: true }}
        style={styles.host}
        alignment="center"
        colorScheme={colorScheme}
      >
        <DatePicker
          title={EntryRegistrationCopy.datePickerAccessibilityLabel}
          selection={selection}
          onDateChange={(date) => {
            if (!disabled) onSelectDate(toIsoDate(date));
          }}
          modifiers={[
            datePickerStyle("compact"),
            labelsHidden(),
            ...appearanceModifiers,
            disabledModifier(disabled),
            accessibilityLabel(EntryRegistrationCopy.datePickerAccessibilityLabel),
          ]}
        />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { height: EntryComposerUi.sheetControlSize, maxWidth: "100%" },
});
