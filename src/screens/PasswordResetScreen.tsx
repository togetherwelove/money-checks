import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import {
  PasswordConfirmationRequirement,
  PasswordRequirementChecklist,
} from "../components/authScreen/PasswordRequirementChecklist";
import { AppColors } from "../constants/colors";
import { EmailAuthCopy } from "../constants/emailAuth";
import { KeyboardLayout } from "../constants/keyboard";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import {
  FormInputTextStyle,
  FormLabelTextStyle,
  StatusMessageTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import { resolvePasswordResetErrorMessage, updateEmailPassword } from "../lib/auth/passwordReset";
import { isPasswordValid } from "../lib/auth/passwordValidation";

type PasswordResetScreenProps = {
  onComplete: () => void;
};

export function PasswordResetScreen({ onComplete }: PasswordResetScreenProps) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const canSubmit = Boolean(
    isPasswordValid(password) && confirmPassword && password === confirmPassword,
  );

  const handleUpdatePassword = async () => {
    try {
      await updateEmailPassword(password);
      setStatusMessage(EmailAuthCopy.passwordReset.updateSuccess);
      onComplete();
    } catch (error) {
      setStatusMessage(resolvePasswordResetErrorMessage(error));
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.content}
      extraScrollHeight={KeyboardLayout.focusedInputExtraScrollHeightMin}
      style={styles.screen}
    >
      <View style={styles.heroSection}>
        <Text style={styles.brand}>{AppMessages.brand}</Text>
        <Text style={styles.title}>{EmailAuthCopy.passwordReset.updateTitle}</Text>
        <Text style={styles.subtitle}>{EmailAuthCopy.passwordReset.updateSubtitle}</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{EmailAuthCopy.passwordReset.newPasswordLabel}</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="new-password"
            importantForAutofill="no"
            onChangeText={setPassword}
            placeholder={EmailAuthCopy.passwordReset.newPasswordPlaceholder}
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={password}
          />
          <PasswordRequirementChecklist password={password} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{EmailAuthCopy.passwordReset.confirmPasswordLabel}</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="new-password"
            importantForAutofill="no"
            onChangeText={setConfirmPassword}
            placeholder={EmailAuthCopy.passwordReset.confirmPasswordPlaceholder}
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={confirmPassword}
          />
          <PasswordConfirmationRequirement confirmPassword={confirmPassword} password={password} />
        </View>
        <ActionButton
          disabled={!canSubmit}
          fullWidth
          label={EmailAuthCopy.passwordReset.updateAction}
          onPress={handleUpdatePassword}
          size="large"
          variant="primary"
        />
        {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flexGrow: 1,
    padding: AppLayout.screenPadding,
    gap: 16,
    justifyContent: "center",
  },
  heroSection: {
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  brand: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  title: {
    color: AppColors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: AppColors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    ...SurfaceCardStyle,
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  label: FormLabelTextStyle,
  input: FormInputTextStyle,
  status: {
    color: AppColors.primary,
    ...StatusMessageTextStyle,
  },
});
