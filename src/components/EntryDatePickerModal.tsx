import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { EntryDatePickerCopy } from "../constants/entryDatePickerCopy";
import { AppLayout } from "../constants/layout";
import type { LedgerEntry } from "../types/ledger";
import {
  addMonths,
  buildMonthlyLedger,
  getMonthKey,
  parseIsoDate,
  toIsoDate,
} from "../utils/calendar";
import { IconActionButton } from "./IconActionButton";
import { MonthCalendar } from "./MonthCalendar";
import { WeekdayHeader } from "./WeekdayHeader";

type EntryDatePickerModalProps = {
  entries: LedgerEntry[];
  isOpen: boolean;
  mode: "native" | "web-calendar";
  onClose: () => void;
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
};

export function EntryDatePickerModal({
  entries,
  isOpen,
  mode,
  onClose,
  onSelectDate,
  selectedDate,
}: EntryDatePickerModalProps) {
  const selectedDateValue = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
  const [draftDate, setDraftDate] = useState(selectedDateValue);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selectedDateValue));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftDate(selectedDateValue);
    setVisibleMonth(new Date(selectedDateValue));
  }, [isOpen, selectedDateValue]);

  const monthSummary = useMemo(
    () => buildMonthlyLedger(getMonthKey(visibleMonth), entries).days,
    [entries, visibleMonth],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{EntryDatePickerCopy.title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>{EntryDatePickerCopy.closeAction}</Text>
            </Pressable>
          </View>
          {mode === "native" ? (
            <>
              <DateTimePicker
                display="inline"
                mode="date"
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
                <Text style={styles.confirmText}>{EntryDatePickerCopy.confirmAction}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.monthRow}>
                <IconActionButton
                  icon="chevron-left"
                  onPress={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, -1))}
                />
                <Text style={styles.monthLabel}>
                  {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
                </Text>
                <IconActionButton
                  icon="chevron-right"
                  onPress={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, 1))}
                />
              </View>
              <WeekdayHeader />
              <MonthCalendar
                days={monthSummary}
                onSelectDate={(isoDate) => {
                  onSelectDate(isoDate);
                  onClose();
                }}
                selectedDate={selectedDate}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: AppColors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    marginHorizontal: 16,
    padding: 16,
    gap: 12,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  closeText: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "700",
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
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  monthLabel: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
});
