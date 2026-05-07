import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";
import { AppColors } from "../../constants/colors";
import { CommonActionCopy } from "../../constants/commonActions";
import { AppLayout } from "../../constants/layout";
import { ModalActionRowStyle, NoteTextStyle } from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";

type DeleteAccountSubscriptionWarningModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onContinueDelete: () => void;
  onOpenSubscriptionManagement: () => void;
};

export function DeleteAccountSubscriptionWarningModal({
  isOpen,
  onClose,
  onContinueDelete,
  onOpenSubscriptionManagement,
}: DeleteAccountSubscriptionWarningModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.sheetContent}>
            <View style={styles.header}>
              <Text style={styles.title}>{AccountDeletionMessages.subscriptionWarningTitle}</Text>
              <Pressable onPress={onClose}>
                <Text style={styles.closeText}>{CommonActionCopy.close}</Text>
              </Pressable>
            </View>
            <Text style={styles.description}>
              {AccountDeletionMessages.subscriptionWarningDescription}
            </Text>
            <View style={styles.actionRow}>
              <ActionButton
                label={CommonActionCopy.cancel}
                onPress={onClose}
                size="inline"
                variant="secondary"
              />
              <ActionButton
                label={AccountDeletionMessages.subscriptionWarningManageAction}
                onPress={onOpenSubscriptionManagement}
                size="inline"
                variant="secondary"
              />
              <ActionButton
                label={AccountDeletionMessages.subscriptionWarningContinueAction}
                onPress={onContinueDelete}
                size="inline"
                variant="destructive"
              />
            </View>
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
    marginHorizontal: AppLayout.screenPadding * 2,
    borderRadius: AppLayout.cardRadius,
    overflow: "hidden",
    backgroundColor: AppColors.surface,
  },
  sheetContent: {
    padding: AppLayout.screenPadding * 2,
    gap: AppLayout.cardGap,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    color: AppColors.text,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  closeText: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  description: {
    color: AppColors.expense,
    fontSize: NoteTextStyle.fontSize,
    fontWeight: "700",
    lineHeight: NoteTextStyle.lineHeight,
  },
  actionRow: {
    ...ModalActionRowStyle,
    flexWrap: "wrap",
  },
});
