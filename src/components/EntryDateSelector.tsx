import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";

import { AuthControls } from "../constants/authControls";
import { AppColors } from "../constants/colors";
import {
  EntryDateSelectorUi,
  EntryRegistrationCopy,
} from "../constants/entryRegistration";
import { AppLayout } from "../constants/layout";
import { CompactTextProps } from "../constants/textLayout";
import { CardTitleTextStyle, ModalActionRowStyle } from "../constants/uiStyles";
import {
  formatSelectedDateWithYear,
  parseIsoDate,
  toIsoDate,
} from "../utils/calendar";
import { ActionButton } from "./ActionButton";
import { CalendarPickerModalShell } from "./calendarPicker/CalendarPickerModalShell";

type EntryDateSelectorProps = {
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
};

export function EntryDateSelector({
  onSelectDate,
  selectedDate,
}: EntryDateSelectorProps) {
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
    <>
      <Pressable
        accessibilityLabel={EntryRegistrationCopy.datePickerAccessibilityLabel}
        accessibilityRole="button"
        onPress={() => {
          Keyboard.dismiss();
          setIsPickerOpen(true);
        }}
        style={({ pressed }) => [
          styles.trigger,
          pressed ? styles.pressedTrigger : null,
        ]}
      >
        <Feather
          color={AppColors.mutedStrongText}
          name="calendar"
          size={EntryDateSelectorUi.iconSize}
        />
        <Text {...CompactTextProps} numberOfLines={1} style={styles.dateLabel}>
          {formatSelectedDateWithYear(selectedDate)}
        </Text>
        <Feather
          color={AppColors.mutedStrongText}
          name="chevron-down"
          size={EntryDateSelectorUi.iconSize}
        />
      </Pressable>
      <CalendarPickerModalShell
        isOpen={isPickerOpen}
        onClose={closePicker}
        scrollEnabled={false}
        title={EntryRegistrationCopy.datePickerTitle}
      >
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
        <View style={styles.actionRow}>
          <ActionButton
            label={EntryRegistrationCopy.datePickerConfirmAction}
            onPress={() => {
              onSelectDate(toIsoDate(draftDate));
              closePicker();
            }}
            size="inline"
            variant="primary"
          />
        </View>
      </CalendarPickerModalShell>
    </>
  );
}

const styles = StyleSheet.create({
  actionRow: ModalActionRowStyle,
  dateLabel: {
    ...CardTitleTextStyle,
    flex: 1,
  },
  pressedTrigger: {
    opacity: EntryDateSelectorUi.pressedOpacity,
  },
  trigger: {
    alignItems: "center",
    alignSelf: "stretch",
    borderBottomColor: AppColors.border,
    borderBottomWidth: AppLayout.dividerWidth,
    flexDirection: "row",
    gap: AppLayout.screenPadding,
    minHeight: AuthControls.controlHeight,
  },
});
