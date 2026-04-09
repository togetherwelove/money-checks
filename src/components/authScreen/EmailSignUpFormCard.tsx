import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EmailAuthCopy } from "../../constants/emailAuth";
import {
  FormInputTextStyle,
  FormLabelTextStyle,
  NoteTextStyle,
  StatusMessageTextStyle,
  SurfaceCardStyle,
} from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";

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
}: EmailSignUpFormCardProps) {
  const canSubmit = Boolean(
    email.trim() && password && confirmPassword && password === confirmPassword,
  );

  return (
    <View style={styles.card}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.signUp.emailLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          importantForAutofill="yes"
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
          importantForAutofill="yes"
          onChangeText={onChangePassword}
          placeholder={EmailAuthCopy.signUp.passwordPlaceholder}
          secureTextEntry
          style={styles.input}
          textContentType="newPassword"
          value={password}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.signUp.passwordConfirmLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="new-password"
          importantForAutofill="yes"
          onChangeText={onChangeConfirmPassword}
          placeholder={EmailAuthCopy.signUp.passwordConfirmPlaceholder}
          secureTextEntry
          style={styles.input}
          textContentType="newPassword"
          value={confirmPassword}
        />
      </View>
      <View style={styles.actionGroup}>
        <ActionButton
          disabled={!canSubmit}
          fullWidth
          label={EmailAuthCopy.signUp.requestOtpAction}
          onPress={onSubmit}
          size="large"
          variant="primary"
        />
        <ActionButton
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

const styles = StyleSheet.create({
  card: {
    ...SurfaceCardStyle,
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  label: FormLabelTextStyle,
  input: FormInputTextStyle,
  actionGroup: {
    gap: 8,
  },
  noticeBlock: {
    gap: 4,
    paddingTop: 4,
  },
  noticeTitle: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  noticeText: NoteTextStyle,
  status: {
    color: AppColors.primary,
    ...StatusMessageTextStyle,
  },
});
