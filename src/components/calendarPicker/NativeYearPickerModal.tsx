import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { CalendarPickerCopy } from "../../constants/modal";
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
      title={CalendarPickerCopy.title}
      action={{ label: CalendarPickerCopy.applyAction, onPress: () => {
        onSelectDate(toIsoDate(draftDate));
        onClose();
      } }}
    >
      <DateTimePicker
        style={styles.wheel}
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
    </CalendarPickerModalShell>
  );
}

const styles = StyleSheet.create({ wheel: { alignSelf: "center" } });
