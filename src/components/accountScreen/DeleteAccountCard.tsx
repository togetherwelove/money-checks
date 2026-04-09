import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AccountDeletionMessages } from "../../constants/accountDeletionMessages";
import { AppColors } from "../../constants/colors";
import { DisabledAutofillProps } from "../../constants/inputAutofill";
import {
  CardTitleTextStyle,
  CompactLabelTextStyle,
  FormInputTextStyle,
  NoteTextStyle,
  StatusMessageTextStyle,
  SurfaceCardStyle,
} from "../../constants/uiStyles";
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
          loading={isDeleting}
          onPress={handleDeleteAccount}
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
    ...SurfaceCardStyle,
    gap: 8,
    borderColor: AppColors.expense,
  },
  title: CardTitleTextStyle,
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
  label: CompactLabelTextStyle,
  input: FormInputTextStyle,
  hint: NoteTextStyle,
  status: {
    color: AppColors.expense,
    ...StatusMessageTextStyle,
  },
  actionRow: {
    paddingTop: 2,
  },
});
