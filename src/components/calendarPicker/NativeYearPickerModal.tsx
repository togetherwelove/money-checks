import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CalendarPickerCopy } from "../../constants/calendarPicker";
import { AppColors } from "../../constants/colors";
import { parseIsoDate, toIsoDate } from "../../utils/calendar";
import { CalendarPickerModalShell } from "./CalendarPickerModalShell";

type NativeYearPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
};

export function NativeYearPickerModal({
  isOpen,
  onClose,
  onSelectDate,
  selectedDate,
}: NativeYearPickerModalProps) {
  const selectedDateValue = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
  const [draftDate, setDraftDate] = useState(selectedDateValue);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftDate(selectedDateValue);
  }, [isOpen, selectedDateValue]);

  return (
    <CalendarPickerModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={CalendarPickerCopy.yearPickerTitle}
    >
      <DateTimePicker
        display="spinner"
        mode="date"
        locale="ko-KR"
        onChange={(_event, nextDate) => {
          if (!nextDate) {
            return;
          }

          setDraftDate(nextDate);
        }}
        value={draftDate}
      />
      <Pressable
        onPress={() => {
          onSelectDate(toIsoDate(draftDate));
          onClose();
        }}
        style={styles.confirmButton}
      >
        <Text style={styles.confirmText}>{CalendarPickerCopy.yearPickerConfirmAction}</Text>
      </Pressable>
    </CalendarPickerModalShell>
  );
}

const styles = StyleSheet.create({
  note: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  confirmButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.primary,
  },
  confirmText: {
    color: AppColors.inverseText,
    fontSize: 13,
    fontWeight: "800",
  },
});
