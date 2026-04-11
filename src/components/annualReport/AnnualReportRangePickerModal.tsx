import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../../components/ActionButton";
import { CalendarPickerModalShell } from "../../components/calendarPicker/CalendarPickerModalShell";
import { AnnualReportCopy } from "../../constants/annualReport";
import { AppColors } from "../../constants/colors";
import { ModalActionRowStyle } from "../../constants/uiStyles";
import { parseIsoDate, toIsoDate } from "../../utils/calendar";

type AnnualReportRangePickerModalProps = {
  endDate: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => Promise<boolean>;
  startDate: string;
};

export function AnnualReportRangePickerModal({
  endDate,
  isOpen,
  onClose,
  onConfirm,
  startDate,
}: AnnualReportRangePickerModalProps) {
  const initialStartDate = useMemo(() => parseIsoDate(startDate), [startDate]);
  const initialEndDate = useMemo(() => parseIsoDate(endDate), [endDate]);
  const [draftStartDate, setDraftStartDate] = useState(initialStartDate);
  const [draftEndDate, setDraftEndDate] = useState(initialEndDate);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftStartDate(initialStartDate);
    setDraftEndDate(initialEndDate);
  }, [initialEndDate, initialStartDate, isOpen]);

  return (
    <CalendarPickerModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={AnnualReportCopy.customRangeTitle}
    >
      <View style={styles.field}>
        <Text style={styles.label}>{AnnualReportCopy.rangeStartLabel}</Text>
        <DateTimePicker
          display="spinner"
          locale="ko-KR"
          mode="date"
          onChange={(_event, nextDate) => {
            if (!nextDate) {
              return;
            }
            setDraftStartDate(nextDate);
          }}
          value={draftStartDate}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{AnnualReportCopy.rangeEndLabel}</Text>
        <DateTimePicker
          display="spinner"
          locale="ko-KR"
          mode="date"
          onChange={(_event, nextDate) => {
            if (!nextDate) {
              return;
            }
            setDraftEndDate(nextDate);
          }}
          value={draftEndDate}
        />
      </View>
      <View style={styles.actionRow}>
        <ActionButton
          label={AnnualReportCopy.downloadAction}
          onPress={() => onConfirm(toIsoDate(draftStartDate), toIsoDate(draftEndDate))}
          size="inline"
          variant="primary"
        />
      </View>
    </CalendarPickerModalShell>
  );
}

const styles = StyleSheet.create({
  actionRow: ModalActionRowStyle,
  field: {
    gap: 4,
  },
  label: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
});
