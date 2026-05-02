import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { AppLayout } from "../constants/layout";
import { ModalActionRowStyle } from "../constants/uiStyles";
import { parseIsoDate, toIsoDate } from "../utils/calendar";
import { ActionButton } from "./ActionButton";

const ENTRY_DATE_PICKER_TITLE = "?좎쭨 ?좏깮";

type EntryDatePickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (isoDate: string) => void;
  selectedDate: string;
};

export function EntryDatePickerModal({
  isOpen,
  onClose,
  onSelectDate,
  selectedDate,
}: EntryDatePickerModalProps) {
  const selectedDateValue = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
  const [draftDate, setDraftDate] = useState(selectedDateValue);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftDate(selectedDateValue);
  }, [isOpen, selectedDateValue]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{ENTRY_DATE_PICKER_TITLE}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>{CommonActionCopy.close}</Text>
            </Pressable>
          </View>
          <DateTimePicker
            display="inline"
            locale="ko-KR"
            mode="date"
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
              label={CommonActionCopy.confirm}
              onPress={() => {
                onSelectDate(toIsoDate(draftDate));
                onClose();
              }}
              size="inline"
              variant="primary"
            />
          </View>
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
  actionRow: ModalActionRowStyle,
});
