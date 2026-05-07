import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../../components/ActionButton";
import { CalendarPickerModalShell } from "../../components/calendarPicker/CalendarPickerModalShell";
import { AnnualReportCopy, AnnualReportUi } from "../../constants/annualReport";
import { CalendarPickerLocale } from "../../constants/calendarPicker";
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

type ActiveRangeField = "end" | "start";

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
  const [activeField, setActiveField] = useState<ActiveRangeField>("start");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftStartDate(initialStartDate);
    setDraftEndDate(initialEndDate);
    setActiveField("start");
  }, [initialEndDate, initialStartDate, isOpen]);

  const activeDate = activeField === "start" ? draftStartDate : draftEndDate;

  return (
    <CalendarPickerModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={AnnualReportCopy.customRangeTitle}
    >
      <View style={styles.rangeFields}>
        <DateFieldButton
          isActive={activeField === "start"}
          label={AnnualReportCopy.rangeStartLabel}
          onPress={() => setActiveField("start")}
          value={toIsoDate(draftStartDate)}
        />
        <DateFieldButton
          isActive={activeField === "end"}
          label={AnnualReportCopy.rangeEndLabel}
          onPress={() => setActiveField("end")}
          value={toIsoDate(draftEndDate)}
        />
      </View>
      <View style={styles.pickerSlot}>
        <DateTimePicker
          display="spinner"
          locale={CalendarPickerLocale}
          mode="date"
          onChange={(_event, nextDate) => {
            if (!nextDate) {
              return;
            }
            if (activeField === "start") {
              setDraftStartDate(nextDate);
              return;
            }
            setDraftEndDate(nextDate);
          }}
          value={activeDate}
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

function DateFieldButton({
  isActive,
  label,
  onPress,
  value,
}: {
  isActive: boolean;
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.dateFieldButton, isActive ? styles.activeDateFieldButton : null]}
    >
      <Text style={[styles.label, isActive ? styles.activeLabel : null]}>{label}</Text>
      <Text numberOfLines={1} style={styles.dateFieldValue}>
        {value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionRow: ModalActionRowStyle,
  activeDateFieldButton: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceMuted,
  },
  activeLabel: {
    color: AppColors.primary,
  },
  dateFieldButton: {
    flex: 1,
    gap: 4,
    paddingHorizontal: AnnualReportUi.rangeFieldPaddingHorizontal,
    paddingVertical: AnnualReportUi.rangeFieldPaddingVertical,
    borderWidth: AnnualReportUi.rangeFieldBorderWidth,
    borderColor: AppColors.border,
    borderRadius: AnnualReportUi.rangeFieldPaddingHorizontal,
    backgroundColor: AppColors.background,
  },
  dateFieldValue: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  label: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  pickerSlot: {
    gap: AnnualReportUi.rangePickerGap,
  },
  rangeFields: {
    flexDirection: "row",
    gap: AnnualReportUi.rangeFieldGap,
  },
});
