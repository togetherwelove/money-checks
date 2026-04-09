import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";
import { AppColors } from "../../constants/colors";
import { DisabledAutofillProps } from "../../constants/inputAutofill";
import { AppLayout } from "../../constants/layout";
import { deleteOwnAccount } from "../../lib/auth/deleteAccount";
import { ActionButton } from "../ActionButton";

export function DeleteAccountCard() {
  const [confirmText, setConfirmText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isReadyToDelete = confirmText.trim() === AccountDeletionMessages.triggerWord;

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setStatusMessage(AccountDeletionMessages.deleting);

    try {
      await deleteOwnAccount();
    } catch (error) {
      console.error("[DeleteAccountCard] Delete account failed", error);
      setStatusMessage(resolveDeleteErrorMessage(error));
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{AccountDeletionMessages.title}</Text>
      <Text style={styles.description}>{AccountDeletionMessages.description}</Text>
      <Text style={styles.warning}>{AccountDeletionMessages.instruction}</Text>
      <Text style={styles.label}>{AccountDeletionMessages.confirmLabel}</Text>
      <TextInput
        {...DisabledAutofillProps}
        editable={!isDeleting}
        onChangeText={(value) => {
          setConfirmText(value);
          if (statusMessage) {
            setStatusMessage(null);
          }
        }}
        placeholder={AccountDeletionMessages.confirmPlaceholder}
        style={styles.input}
        value={confirmText}
      />
      <Text style={styles.hint}>{AccountDeletionMessages.confirmHint}</Text>
      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
      <View style={styles.actionRow}>
        <ActionButton
          disabled={!isReadyToDelete || isDeleting}
          label={AccountDeletionMessages.action}
          onPress={() => void handleDeleteAccount()}
          variant="destructive"
        />
      </View>
    </View>
  );
}

function resolveDeleteErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return AccountDeletionMessages.errorFallback;
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.expense,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.surface,
  },
  title: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  description: {
    color: AppColors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  warning: {
    color: AppColors.expense,
    fontSize: 12,
    fontWeight: "700",
  },
  label: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    backgroundColor: AppColors.background,
    color: AppColors.text,
    fontSize: 16,
  },
  hint: {
    color: AppColors.mutedText,
    fontSize: 12,
  },
  status: {
    color: AppColors.expense,
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    paddingTop: 2,
  },
});
