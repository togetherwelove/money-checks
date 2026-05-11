import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EmailAuthCopy, EmailSignUpOtpUi } from "../../constants/emailAuth";
import {
  FormInputTextStyle,
  FormLabelTextStyle,
  InsetBoxStyle,
  StatusMessageTextStyle,
  SurfaceCardStyle,
} from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";
import { TextLinkButton } from "../TextLinkButton";

type EmailSignUpOtpCardProps = {
  email: string;
  onChangeToken: (value: string) => void;
  onEditCredentials: () => void;
  onResend: () => void | Promise<void>;
  onSubmit: () => void | Promise<void>;
  resendDisabled: boolean;
  resendLabel: string;
  resending?: boolean;
  statusMessage: string | null;
  submitting?: boolean;
  token: string;
};

export function EmailSignUpOtpCard({
  email,
  onChangeToken,
  onEditCredentials,
  onResend,
  onSubmit,
  resendDisabled,
  resendLabel,
  resending = false,
  statusMessage,
  submitting = false,
  token,
}: EmailSignUpOtpCardProps) {
  const canSubmit = Boolean(token.trim());

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{EmailAuthCopy.signUp.otpTitle}</Text>
        <Text style={styles.subtitle}>{EmailAuthCopy.signUp.otpSubtitle}</Text>
      </View>
      <View style={styles.emailBox}>
        <Text style={styles.emailLabel}>{EmailAuthCopy.signUp.emailLabel}</Text>
        <Text style={styles.emailValue}>{email.trim()}</Text>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EmailAuthCopy.signUp.otpLabel}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="one-time-code"
          importantForAutofill="yes"
          editable={!submitting}
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={onChangeToken}
          placeholder={EmailAuthCopy.signUp.otpPlaceholder}
          style={styles.input}
          textContentType="oneTimeCode"
          value={token}
        />
      </View>
      <View style={styles.actionGroup}>
        <ActionButton
          disabled={!canSubmit || submitting}
          fullWidth
          label={EmailAuthCopy.signUp.verifyOtpAction}
          loading={submitting}
          onPress={onSubmit}
          size="large"
          variant="primary"
        />
        <View style={styles.secondaryActionRow}>
          <ActionButton
            disabled={resendDisabled || submitting || resending}
            label={resendLabel}
            loading={resending}
            onPress={onResend}
            size="inline"
            variant="secondary"
          />
          <TextLinkButton
            align="center"
            disabled={submitting || resending}
            label={EmailAuthCopy.signUp.editCredentialsAction}
            onPress={onEditCredentials}
          />
        </View>
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
  title: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: AppColors.mutedStrongText,
    fontSize: 13,
    lineHeight: 20,
  },
  emailBox: {
    ...InsetBoxStyle,
    gap: 4,
  },
  emailLabel: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },
  emailValue: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  fieldGroup: {
    gap: 6,
  },
  label: FormLabelTextStyle,
  input: FormInputTextStyle,
  actionGroup: {
    gap: EmailSignUpOtpUi.actionGroupGap,
  },
  secondaryActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: EmailSignUpOtpUi.secondaryActionGap,
  },
  status: {
    color: AppColors.primary,
    ...StatusMessageTextStyle,
  },
});
