import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EmailAuthCopy } from "../../constants/emailAuth";
import {
  FormInputTextStyle,
  FormLabelTextStyle,
  StatusMessageTextStyle,
  SurfaceCardStyle,
} from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";

type PasswordResetRequestCardProps = {
  email: string;
  onBack: () => void;
  onChangeEmail: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  statusMessage: string | null;
};

export function PasswordResetRequestCard({
  email,
  onBack,
  onChangeEmail,
  onSubmit,
  statusMessage,
}: PasswordResetRequestCardProps) {
  const canSubmit = Boolean(email.trim());

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>{EmailAuthCopy.passwordReset.requestSubtitle}</Text>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.signIn.emailLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          importantForAutofill="yes"
          keyboardType="email-address"
          onChangeText={onChangeEmail}
          placeholder={EmailAuthCopy.signIn.emailPlaceholder}
          style={styles.input}
          textContentType="username"
          value={email}
        />
      </View>
      <View style={styles.actionGroup}>
        <ActionButton
          disabled={!canSubmit}
          fullWidth
          label={EmailAuthCopy.passwordReset.requestAction}
          onPress={onSubmit}
          size="large"
          variant="primary"
        />
        <ActionButton
          fullWidth
          label={EmailAuthCopy.passwordReset.backToSignInAction}
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
  header: {
    gap: 4,
  },
  subtitle: {
    color: AppColors.mutedStrongText,
    fontSize: 13,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  label: FormLabelTextStyle,
  input: FormInputTextStyle,
  actionGroup: {
    gap: 8,
  },
  status: {
    color: AppColors.primary,
    ...StatusMessageTextStyle,
  },
});
