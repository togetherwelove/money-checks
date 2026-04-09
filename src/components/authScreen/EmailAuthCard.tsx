import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EmailAuthCopy } from "../../constants/emailAuth";
import { ActionButton } from "../ActionButton";

type EmailAuthCardProps = {
  confirmPassword: string;
  email: string;
  mode: "sign-in" | "sign-up";
  onChangeConfirmPassword: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangeMode: (value: "sign-in" | "sign-up") => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  password: string;
  statusMessage: string | null;
};

export function EmailAuthCard({
  confirmPassword,
  email,
  mode,
  onChangeConfirmPassword,
  onChangeEmail,
  onChangeMode,
  onChangePassword,
  onSubmit,
  password,
  statusMessage,
}: EmailAuthCardProps) {
  const trimmedEmail = email.trim();
  const isSignUp = mode === "sign-up";
  const canSubmit = isSignUp
    ? Boolean(trimmedEmail && password && confirmPassword && password === confirmPassword)
    : Boolean(trimmedEmail && password);

  return (
    <View style={styles.card}>
      <Text style={styles.note}>{EmailAuthCopy.secureNote}</Text>
      <View style={styles.modeRow}>
        <ActionButton
          label={EmailAuthCopy.modeSignIn}
          onPress={() => onChangeMode("sign-in")}
          variant={isSignUp ? "secondary" : "primary"}
        />
        <ActionButton
          label={EmailAuthCopy.modeSignUp}
          onPress={() => onChangeMode("sign-up")}
          variant={isSignUp ? "primary" : "secondary"}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.emailLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          importantForAutofill="yes"
          keyboardType="email-address"
          textContentType="username"
          onChangeText={onChangeEmail}
          placeholder={EmailAuthCopy.emailPlaceholder}
          style={styles.input}
          value={email}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.passwordLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete={isSignUp ? "new-password" : "password"}
          importantForAutofill="yes"
          onChangeText={onChangePassword}
          placeholder={EmailAuthCopy.passwordPlaceholder}
          secureTextEntry
          style={styles.input}
          textContentType={isSignUp ? "newPassword" : "password"}
          value={password}
        />
      </View>
      {isSignUp ? (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{EmailAuthCopy.passwordConfirmLabel}</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="new-password"
            importantForAutofill="yes"
            onChangeText={onChangeConfirmPassword}
            placeholder={EmailAuthCopy.passwordConfirmPlaceholder}
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={confirmPassword}
          />
        </View>
      ) : null}

      <View style={styles.actionGroup}>
        <ActionButton
          disabled={!canSubmit}
          label={isSignUp ? EmailAuthCopy.signUpAction : EmailAuthCopy.signInAction}
          onPress={onSubmit}
          variant="primary"
        />
      </View>

      <Text style={styles.helper}>
        {isSignUp ? EmailAuthCopy.helperSignUp : EmailAuthCopy.helperSignIn}
      </Text>
      {isSignUp ? <Text style={styles.notice}>{EmailAuthCopy.signUpNotice}</Text> : null}
      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 24,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  note: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    color: AppColors.text,
    fontSize: 16,
  },
  actionGroup: {
    gap: 8,
  },
  helper: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 18,
  },
  notice: {
    color: AppColors.mutedStrongText,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  status: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
});
