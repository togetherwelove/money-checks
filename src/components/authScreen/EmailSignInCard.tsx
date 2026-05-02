import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EmailAuthCopy } from "../../constants/emailAuth";
import { FormInputTextStyle, FormLabelTextStyle, SurfaceCardStyle } from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";

type EmailSignInCardProps = {
  email: string;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onOpenSignUp: () => void;
  onSubmit: () => void | Promise<void>;
  password: string;
};

export function EmailSignInCard({
  email,
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
});
