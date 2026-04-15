import { Picker } from "@react-native-picker/picker";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { AppLayout } from "../constants/layout";
import { ModalActionRowStyle } from "../constants/uiStyles";
import { MAX_INSTALLMENT_MONTHS, formatInstallmentLabel } from "../lib/installments";
import { ONE_TIME_INSTALLMENT_MONTHS } from "../utils/ledgerEntries";
import { ActionButton } from "./ActionButton";

type InstallmentPickerModalProps = {
  installmentMonths: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectInstallmentMonths: (installmentMonths: number) => void;
};

const INSTALLMENT_OPTIONS = Array.from(
  { length: MAX_INSTALLMENT_MONTHS },
  (_value, index) => index + ONE_TIME_INSTALLMENT_MONTHS,
);

export function InstallmentPickerModal({
  installmentMonths,
  isOpen,
  onClose,
  onSelectInstallmentMonths,
}: InstallmentPickerModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{EntryRegistrationCopy.installmentPickerTitle}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>{CommonActionCopy.close}</Text>
            </Pressable>
          </View>
          <Picker
            itemStyle={styles.item}
            selectedValue={installmentMonths}
            onValueChange={(value) => onSelectInstallmentMonths(Number(value))}
          >
            {INSTALLMENT_OPTIONS.map((option) => (
              <Picker.Item key={option} label={formatInstallmentLabel(option)} value={option} />
            ))}
          </Picker>
          <View style={styles.actionRow}>
            <ActionButton
              label={CommonActionCopy.confirm}
              onPress={onClose}
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
  item: {
    color: AppColors.text,
    fontSize: 18,
  },
  actionRow: ModalActionRowStyle,
});
