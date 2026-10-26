import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AccountDeletionMessages } from "../../constants/accountDeletion";
import {
  CompactLabelTextStyle,
  FormInputTextStyle,
  StatusMessageTextStyle,
} from "../../constants/uiStyles";
import { deleteOwnAccount } from "../../lib/auth/deleteAccount";
import { ActionButton } from "../ActionButton";
import { NativePickerSheet } from "../NativePickerSheet";

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

  return (
    <NativePickerSheet isOpen={isOpen} onClose={handleClose} dismissible={!isDeleting} title={AccountDeletionMessages.confirmTitle}>
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
    </NativePickerSheet>
  );
}

function resolveDeleteErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

const styles = StyleSheet.create({
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
