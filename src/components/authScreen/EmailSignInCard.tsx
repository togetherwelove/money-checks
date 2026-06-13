import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EmailAuthCopy } from "../../constants/emailAuth";
import { FormInputTextStyle, FormLabelTextStyle, SurfaceCardStyle } from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";

type EmailSignInCardProps = {
  email: string;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onOpenPasswordReset: () => void;
  onOpenSignUp: () => void;
  onSubmit: () => void | Promise<void>;
  password: string;
  submitting?: boolean;
};

export function EmailSignInCard({
  email,
  onChangeEmail,
  onChangePassword,
  onOpenPasswordReset,
  onOpenSignUp,
  onSubmit,
  password,
  submitting = false,
}: EmailSignInCardProps) {
  const canSubmit = Boolean(email.trim() && password);

  return (
    <View style={styles.card}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.signIn.emailLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          importantForAutofill="yes"
          keyboardType="email-address"
          editable={!submitting}
          onChangeText={onChangeEmail}
          placeholder={EmailAuthCopy.signIn.emailPlaceholder}
          style={styles.input}
          textContentType="username"
          value={email}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.signIn.passwordLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          importantForAutofill="yes"
          editable={!submitting}
          onChangeText={onChangePassword}
          placeholder={EmailAuthCopy.signIn.passwordPlaceholder}
          secureTextEntry
          style={styles.input}
          textContentType="password"
          value={password}
        />
      </View>
      <View style={styles.actionGroup}>
        <ActionButton
          disabled={!canSubmit || submitting}
          fullWidth
          label={EmailAuthCopy.signIn.submitAction}
          loading={submitting}
          onPress={onSubmit}
          size="large"
          variant="primary"
        />
      </View>
      <View style={styles.linkRow}>
        <Pressable
          disabled={submitting}
          onPress={onOpenPasswordReset}
          style={[styles.linkButton, submitting ? styles.disabledLinkButton : null]}
        >
          <Text style={styles.linkText}>{EmailAuthCopy.signIn.forgotPasswordAction}</Text>
        </Pressable>
        <Text style={styles.linkDivider}>·</Text>
        <Pressable
          disabled={submitting}
          onPress={onOpenSignUp}
          style={[styles.linkButton, submitting ? styles.disabledLinkButton : null]}
        >
          <Text style={styles.linkText}>{EmailAuthCopy.signIn.openSignUpAction}</Text>
        </Pressable>
      </View>
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
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  linkButton: {
    paddingVertical: 4,
  },
  disabledLinkButton: {
    opacity: 0.45,
  },
  linkDivider: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "600",
  },
  linkText: {
    color: AppColors.mutedStrongText,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
