import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { getAppColors } from "../../constants/colors";
import { EmailAuthCopy } from "../../constants/emailAuth";
import {
  getFormInputTextStyle,
  getFormLabelTextStyle,
  StatusMessageTextStyle,
  getActionSurfaceStyle,
} from "../../constants/uiStyles";
import { isPasswordValid } from "../../lib/auth/passwordValidation";
import { ActionButton } from "../ActionButton";
import {
  PasswordConfirmationRequirement,
  PasswordRequirementChecklist,
} from "./PasswordRequirementChecklist";

type EmailSignUpFormCardProps = {
  confirmPassword: string;
  email: string;
  onBack: () => void;
  onChangeConfirmPassword: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  password: string;
  statusMessage: string | null;
  submitDisabled?: boolean;
  submitLabel?: string;
  submitting?: boolean;
};

export function EmailSignUpFormCard({
  confirmPassword,
  email,
  onBack,
  onChangeConfirmPassword,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  password,
  statusMessage,
  submitDisabled = false,
  submitLabel,
  submitting = false,
}: EmailSignUpFormCardProps) {
  const styles = getStyles();
  useAppTheme();
  const canSubmit = Boolean(
    email.trim() && isPasswordValid(password) && confirmPassword && password === confirmPassword,
  );

  return (
    <View style={styles.card}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.signUp.emailLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          importantForAutofill="yes"
          editable={!submitting}
          keyboardType="email-address"
          onChangeText={onChangeEmail}
          placeholder={EmailAuthCopy.signUp.emailPlaceholder}
          style={styles.input}
          textContentType="username"
          value={email}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.signUp.passwordLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="new-password"
          importantForAutofill="no"
          editable={!submitting}
          onChangeText={onChangePassword}
          placeholder={EmailAuthCopy.signUp.passwordPlaceholder}
          secureTextEntry
          style={styles.input}
          textContentType="newPassword"
          value={password}
        />
        <PasswordRequirementChecklist password={password} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.signUp.passwordConfirmLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="new-password"
          importantForAutofill="no"
          editable={!submitting}
          onChangeText={onChangeConfirmPassword}
          placeholder={EmailAuthCopy.signUp.passwordConfirmPlaceholder}
          secureTextEntry
          style={styles.input}
          textContentType="newPassword"
          value={confirmPassword}
        />
        <PasswordConfirmationRequirement confirmPassword={confirmPassword} password={password} />
      </View>
      <View style={styles.actionGroup}>
        <ActionButton
          disabled={!canSubmit || submitDisabled || submitting}
          fullWidth
          label={submitLabel ?? EmailAuthCopy.signUp.requestOtpAction}
          loading={submitting}
          onPress={onSubmit}
          size="large"
          variant="primary"
        />
        <ActionButton
          disabled={submitting}
          fullWidth
          label={EmailAuthCopy.signUp.backAction}
          onPress={onBack}
          size="large"
          variant="secondary"
        />
      </View>
      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    card: {
      ...getActionSurfaceStyle(),
      gap: 12,
    },
    fieldGroup: {
      gap: 6,
    },
    label: getFormLabelTextStyle(),
    input: getFormInputTextStyle(),
    actionGroup: {
      gap: 8,
    },
    status: {
      color: getAppColors().primary,
      ...StatusMessageTextStyle,
    },
  }),
);
