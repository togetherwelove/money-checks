import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text } from "react-native";
import { getAppColors } from "../../constants/colors";
import { EntryComposerUi } from "../../constants/entryComposer";
import { EntryRegistrationCopy } from "../../constants/entryRegistration";
import { CompactTextProps } from "../../constants/textLayout";
import { formatSelectedDateWithYear, parseIsoDate, toIsoDate } from "../../utils/calendar";

export type EntryHeaderDatePickerProps = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  disabled?: boolean;
  variant?: "default" | "navigation";
};

export function EntryHeaderDatePicker({
  selectedDate,
  onSelectDate,
  disabled = false,
}: EntryHeaderDatePickerProps) {
  const styles = getStyles();
  useAppTheme();
  const [open, setOpen] = useState(false);
  const value = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={EntryRegistrationCopy.datePickerAccessibilityLabel}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        style={styles.trigger}
        onPress={() => {
          if (!disabled) {
            Keyboard.dismiss();
            setOpen(true);
          }
        }}
      >
        <Text {...CompactTextProps} numberOfLines={1} style={styles.label}>
          {formatSelectedDateWithYear(selectedDate)}
        </Text>
      </Pressable>
      {open && !disabled ? (
        <DateTimePicker
          mode="date"
          display="default"
          value={value}
          onChange={(event, date) => {
            setOpen(false);
            if (!disabled && event.type === "set" && date) onSelectDate(toIsoDate(date));
          }}
        />
      ) : null}
    </>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    trigger: {
      minHeight: EntryComposerUi.sheetControlSize,
      justifyContent: "center",
      maxWidth: "100%",
    },
    label: {
      color: getAppColors().text,
      fontSize: EntryComposerUi.sheetFieldFontSize,
      fontWeight: "600",
    },
  }),
);
