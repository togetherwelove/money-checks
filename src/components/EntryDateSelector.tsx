import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { Feather } from "./AppIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";

import {
  getEntryDetailLabelStyle,
  getEntryDetailValueStyle,
  EntryDetailRowStyle,
} from "../constants/entryDetailStyles";
import { getAppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { EntryComposerUi } from "../constants/entryComposer";
import { EntryDateSelectorUi, EntryRegistrationCopy } from "../constants/entryRegistration";
import { CompactTextProps } from "../constants/textLayout";
import { SettingValueActionStyle } from "../constants/uiStyles";
import { formatSelectedDateWithYear, parseIsoDate, toIsoDate } from "../utils/calendar";
import { NativePickerSheet } from "./NativePickerSheet";
import { EntryInlineDatePicker } from "./EntryInlineDatePicker";

type EntryDateSelectorProps = {
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
  inline?: boolean;
  compact?: boolean;
  header?: boolean;
  disabled?: boolean;
};

export function EntryDateSelector({
  onSelectDate,
  selectedDate,
  inline = false,
  compact = false,
  header = false,
  disabled = false,
}: EntryDateSelectorProps) {
  const styles = getStyles();
  useAppTheme();
  const selectedDateValue = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
  const [draftDate, setDraftDate] = useState(selectedDateValue);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (isPickerOpen) {
      setDraftDate(selectedDateValue);
    }
  }, [isPickerOpen, selectedDateValue]);

  const closePicker = () => {
    setIsPickerOpen(false);
  };

  return (
    <View
      style={
        inline ? [styles.inlineContainer, isPickerOpen && styles.expandedContainer] : undefined
      }
    >
      <Pressable
        accessibilityLabel={EntryRegistrationCopy.datePickerAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ expanded: isPickerOpen, disabled }}
        disabled={disabled}
        onPress={() => {
          if (disabled) return;
          Keyboard.dismiss();
          setIsPickerOpen((open) => !open);
        }}
        style={({ pressed }) => [
          styles.trigger,
          compact && styles.compactTrigger,
          inline && styles.connectedTrigger,
          header && styles.headerTrigger,
          pressed ? styles.pressedTrigger : null,
        ]}
      >
        {header ? null : compact ? (
          <Feather
            name="calendar"
            color={getAppColors().mutedText}
            size={EntryDateSelectorUi.iconSize}
          />
        ) : (
          <Text style={styles.label}>{EntryRegistrationCopy.dateLabel}</Text>
        )}
        <View style={[styles.valueAction, inline && isPickerOpen && styles.expandedValueAction]}>
          <Text
            {...CompactTextProps}
            numberOfLines={1}
            style={[styles.dateLabel, compact && styles.compactDate]}
          >
            {formatSelectedDateWithYear(selectedDate)}
          </Text>
          <Feather
            color={getAppColors().mutedStrongText}
            name={isPickerOpen ? "chevron-up" : "chevron-down"}
            size={EntryDateSelectorUi.iconSize}
          />
        </View>
      </Pressable>
      <NativePickerSheet
        inline={inline}
        showHeader={!inline}
        isOpen={isPickerOpen}
        dismissible={!disabled}
        onClose={closePicker}
        scrollEnabled={false}
        title={EntryRegistrationCopy.datePickerTitle}
        action={
          !inline
            ? {
                label: EntryRegistrationCopy.datePickerConfirmAction,
                onPress: () => {
                  if (disabled) return;
                  onSelectDate(toIsoDate(draftDate));
                  closePicker();
                },
                disabled,
              }
            : undefined
        }
      >
        {inline ? (
          <EntryInlineDatePicker
            value={selectedDateValue}
            onChange={(date) => {
              onSelectDate(toIsoDate(date));
            }}
          />
        ) : (
          <DateTimePicker
            display="inline"
            locale="ko-KR"
            mode="date"
            onChange={(_event, nextDate) => {
              if (nextDate) {
                setDraftDate(nextDate);
              }
            }}
            value={draftDate}
          />
        )}
      </NativePickerSheet>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    headerTrigger: {
      alignSelf: "center",
      backgroundColor: getAppColors().transparent,
      paddingHorizontal: AppLayout.compactGap,
      gap: AppLayout.compactGap,
    },
    inlineContainer: {
      alignSelf: "flex-start",
      maxWidth: "100%",
      overflow: "hidden",
      borderRadius: EntryComposerUi.sheetCardRadius,
      backgroundColor: getAppColors().surfaceMuted,
    },
    expandedContainer: { alignSelf: "stretch" },
    connectedTrigger: { alignSelf: "stretch", borderRadius: 0, justifyContent: "flex-start" },
    expandedValueAction: { flex: 1, justifyContent: "space-between" },
    compactTrigger: {
      alignSelf: "flex-start",
      minHeight: EntryComposerUi.fieldHeight,
      backgroundColor: getAppColors().surfaceMuted,
      borderRadius: EntryComposerUi.sheetCardRadius,
      paddingHorizontal: AppLayout.cardContentPadding,
      gap: AppLayout.cardGap,
    },
    compactDate: { fontSize: EntryComposerUi.sheetFieldFontSize, fontWeight: "600" },
    label: getEntryDetailLabelStyle(),
    valueAction: { ...SettingValueActionStyle, flexShrink: 1 },
    dateLabel: {
      ...getEntryDetailValueStyle(),
      flexShrink: 1,
    },
    pressedTrigger: {
      opacity: EntryDateSelectorUi.pressedOpacity,
    },
    trigger: {
      ...EntryDetailRowStyle,
    },
  }),
);
