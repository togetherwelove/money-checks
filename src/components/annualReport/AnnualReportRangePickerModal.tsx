import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { NativePickerSheet } from "../NativePickerSheet";
import { AnnualReportCopy, AnnualReportUi, type AnnualReportRangeMode } from "../../constants/annualReport";
import { AnnualReportPeriodOptions } from "./AnnualReportPeriodOptions";
import { AppColors } from "../../constants/colors";
import { parseIsoDate, toIsoDate } from "../../utils/calendar";

type AnnualReportRangePickerModalProps = {
  disabled?: boolean;
  selectedYear: number | null;
  onSelectPeriod: (mode: AnnualReportRangeMode) => Promise<boolean>;
  endDate: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => Promise<boolean>;
  startDate: string;
};

type ActiveRangeField = "end" | "start";

export function AnnualReportRangePickerModal({
  disabled = false,
  selectedYear,
  onSelectPeriod,
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
    <NativePickerSheet
      isOpen={isOpen}
      onClose={onClose}
      title={selectedYear !== null ? AnnualReportCopy.optionTitle : AnnualReportCopy.customRangeTitle}
      action={selectedYear === null ? { label: AnnualReportCopy.downloadAction, disabled,
        onPress: () => { void onConfirm(toIsoDate(draftStartDate), toIsoDate(draftEndDate)); } } : undefined}
    >
      {selectedYear !== null ? (
        <AnnualReportPeriodOptions selectedYear={selectedYear} onSelect={onSelectPeriod} />
      ) : (
        <>
          <View style={styles.rangeFields}>
            <DateFieldButton
              disabled={disabled}
              isActive={activeField === "start"}
              label={AnnualReportCopy.rangeStartLabel}
              onPress={() => setActiveField("start")}
              value={toIsoDate(draftStartDate)}
            />
            <DateFieldButton
              disabled={disabled}
              isActive={activeField === "end"}
              label={AnnualReportCopy.rangeEndLabel}
              onPress={() => setActiveField("end")}
              value={toIsoDate(draftEndDate)}
            />
          </View>
          <View style={styles.pickerSlot}>
            <DateTimePicker
              display="spinner"
              locale="ko-KR"
              mode="date"
              onChange={(_event, nextDate) => {
                if (!nextDate || disabled) {
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
        </>
      )}
    </NativePickerSheet>
  );
}

function DateFieldButton({
  disabled,
  isActive,
  label,
  onPress,
  value,
}: {
  disabled: boolean;
  isActive: boolean;
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <Pressable
      disabled={disabled}
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
