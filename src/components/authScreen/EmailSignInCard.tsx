import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EmailAuthCopy } from "../../constants/emailAuth";
import { GoogleAuthCopy } from "../../constants/googleAuth";
import { FormInputTextStyle, FormLabelTextStyle, SurfaceCardStyle } from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";
import { GoogleSignInButton } from "./GoogleSignInButton";

type EmailSignInCardProps = {
  email: string;
  onGoogleSignIn?: (() => void | Promise<void>) | null;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onOpenSignUp: () => void;
  onSubmit: () => void | Promise<void>;
  password: string;
};

export function EmailSignInCard({
  email,
  onGoogleSignIn = null,
  onChangeEmail,
  onChangePassword,
  onOpenSignUp,
  onSubmit,
  password,
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
          disabled={!canSubmit}
          fullWidth
          label={EmailAuthCopy.signIn.submitAction}
          onPress={onSubmit}
          size="large"
          variant="primary"
        />
      </View>
      <Pressable onPress={onOpenSignUp} style={styles.linkButton}>
        <Text style={styles.linkText}>{EmailAuthCopy.signIn.openSignUpAction}</Text>
      </Pressable>
      {onGoogleSignIn ? (
        <View style={styles.googleSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{GoogleAuthCopy.dividerLabel}</Text>
            <View style={styles.dividerLine} />
          </View>
          <GoogleSignInButton onPress={onGoogleSignIn} />
        </View>
      ) : null}
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
  linkButton: {
    alignSelf: "center",
    paddingVertical: 4,
  },
  linkText: {
    color: AppColors.mutedStrongText,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  googleSection: {
    gap: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.border,
  },
  dividerText: {
    color: AppColors.mutedStrongText,
    fontSize: 12,
    fontWeight: "600",
  },
});
