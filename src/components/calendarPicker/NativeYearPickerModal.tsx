import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { CalendarPickerCopy } from "../../constants/calendarPicker";
import { ModalActionRowStyle } from "../../constants/uiStyles";
import { parseIsoDate, toIsoDate } from "../../utils/calendar";
import { ActionButton } from "../ActionButton";
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
      <View style={styles.actionRow}>
        <ActionButton
          label={CalendarPickerCopy.yearPickerConfirmAction}
          onPress={() => {
            onSelectDate(toIsoDate(draftDate));
            onClose();
          }}
          size="inline"
          variant="primary"
        />
      </View>
    </CalendarPickerModalShell>
  );
}

const styles = StyleSheet.create({
  actionRow: ModalActionRowStyle,
});
