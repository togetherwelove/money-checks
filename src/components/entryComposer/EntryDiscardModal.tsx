import { Modal, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EntryRegistrationCopy as Copy } from "../../constants/entryRegistration";
import { AppLayout } from "../../constants/layout";
import { ActionButtonLabelTextStyle, ModalActionRowStyle, NoteTextStyle } from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";

export function EntryDiscardModal({ visible, onCancel, onDiscard }: {
  visible: boolean;
  onCancel: () => void;
  onDiscard: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>{Copy.discardChangesTitle}</Text>
          <Text style={styles.message}>{Copy.discardChangesMessage}</Text>
          <View style={ModalActionRowStyle}>
            <ActionButton label={Copy.discardChangesCancelAction} onPress={onCancel} />
            <ActionButton label={Copy.discardChangesConfirmAction} onPress={onDiscard} variant="destructive" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", padding: AppLayout.cardContentPadding, backgroundColor: AppColors.overlay },
  dialog: { padding: AppLayout.cardContentPadding, gap: AppLayout.cardGap, borderRadius: AppLayout.cardRadius, backgroundColor: AppColors.surface },
  title: { ...ActionButtonLabelTextStyle, color: AppColors.text },
  message: NoteTextStyle,
});
