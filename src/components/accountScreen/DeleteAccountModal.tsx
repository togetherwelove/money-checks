import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import {
  CompactLabelTextStyle,
  FormInputTextStyle,
  StatusMessageTextStyle,
} from "../../constants/uiStyles";
import { deleteOwnAccount } from "../../lib/auth/deleteAccount";
import { ActionButton } from "../ActionButton";

type DeleteAccountModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isReadyToDelete = confirmText.trim() === "삭제";

  const handleClose = () => {
    if (isDeleting) {
      return;
    }

    setConfirmText("");
    setStatusMessage(null);
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setStatusMessage("계정을 삭제하고 있어요.");

    try {
      await deleteOwnAccount();
    } catch (error) {
      console.error("[DeleteAccountModal] Delete account failed", error);
      setStatusMessage(resolveDeleteErrorMessage(error));
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={handleClose} transparent visible>
      <View style={styles.overlay}>
        <Pressable onPress={handleClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.sheetContent}>
            <View style={styles.header}>
              <Text style={styles.title}>계정을 삭제할까요?</Text>
              <Pressable disabled={isDeleting} onPress={handleClose}>
                <Text style={styles.closeText}>닫기</Text>
              </Pressable>
            </View>
            <Text style={styles.warning}>
              계정 삭제 시 프로필, 가계부 기록, 참여 정보가 완전히 삭제돼요. 이 작업은 되돌릴 수
              없어요.
            </Text>
            <Text style={styles.label}>확인 문구</Text>
            <TextInput
              editable={!isDeleting}
              onChangeText={(value) => {
                setConfirmText(value);
                if (statusMessage) {
                  setStatusMessage(null);
                }
              }}
              placeholder="'삭제'를 입력하면 계정이 완전히 삭제돼요."
              style={styles.input}
              value={confirmText}
            />
            {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
            <View style={styles.actionRow}>
              <ActionButton
                disabled={!isReadyToDelete || isDeleting}
                label="계정 삭제"
                loading={isDeleting}
                onPress={handleDeleteAccount}
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

function resolveDeleteErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.";
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
  warning: {
    color: AppColors.expense,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  label: CompactLabelTextStyle,
  input: FormInputTextStyle,
  status: {
    color: AppColors.expense,
    ...StatusMessageTextStyle,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
});
