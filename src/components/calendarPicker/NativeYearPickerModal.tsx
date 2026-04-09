import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";

import { CalendarPickerCopy } from "../../constants/calendarPicker";
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
      <ActionButton
        label={CalendarPickerCopy.yearPickerConfirmAction}
        fullWidth
        onPress={() => {
          onSelectDate(toIsoDate(draftDate));
          onClose();
        }}
        variant="primary"
      />
    </CalendarPickerModalShell>
  );
}
