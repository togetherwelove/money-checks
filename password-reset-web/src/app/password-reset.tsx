import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppColors } from "../config/colors";
import { PasswordResetCopy, PasswordResetUi } from "../config/passwordReset";
import {
  isPasswordValidationComplete,
  validatePassword,
} from "../lib/passwordValidation";
import { hasPasswordRecoveryRedirect, supabase } from "../lib/supabase";

type RecoveryState = "invalid" | "loading" | "ready" | "success";

export default function PasswordResetPage() {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("loading");
  const validation = useMemo(
    () => validatePassword(password, confirmPassword),
    [confirmPassword, password],
  );
  const canSubmit =
    recoveryState === "ready" && !isSubmitting && isPasswordValidationComplete(validation);

  useEffect(() => {
    let isMounted = true;

    const resolveRecoverySession = (
      event: AuthChangeEvent | null,
      session: Session | null,
    ) => {
      if (!isMounted) {
        return;
      }

      const isRecoverySession = event === "PASSWORD_RECOVERY" || hasPasswordRecoveryRedirect;
      setRecoveryState(isRecoverySession && session ? "ready" : "invalid");
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        resolveRecoverySession(event, session);
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        resolveRecoverySession(null, null);
        return;
      }

      resolveRecoverySession(null, data.session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      await supabase.auth.signOut({ scope: "global" });
      setRecoveryState("success");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage(PasswordResetCopy.updateError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: PasswordResetCopy.title }} />
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.brand}>{PasswordResetCopy.brand}</Text>
          <Text style={styles.title}>{resolveTitle(recoveryState)}</Text>
          <Text style={styles.subtitle}>{resolveDescription(recoveryState)}</Text>
        </View>

        <View style={styles.card}>
          {recoveryState === "loading" ? (
            <View style={styles.centeredState}>
              <ActivityIndicator color={AppColors.primary} size="large" />
              <Text style={styles.stateText}>{PasswordResetCopy.sessionLoading}</Text>
            </View>
          ) : recoveryState === "ready" ? (
            <>
              <PasswordField
                label={PasswordResetCopy.passwordLabel}
                onChangeText={setPassword}
                placeholder={PasswordResetCopy.passwordPlaceholder}
                value={password}
              />
              <PasswordField
                label={PasswordResetCopy.confirmPasswordLabel}
                onChangeText={setConfirmPassword}
                placeholder={PasswordResetCopy.confirmPasswordPlaceholder}
                value={confirmPassword}
              />
              <View style={styles.requirements}>
                <RequirementItem
                  complete={validation.minimumLength}
                  label={PasswordResetCopy.requirements.minimumLength}
                />
                <RequirementItem
                  complete={validation.lowercase}
                  label={PasswordResetCopy.requirements.lowercase}
                />
                <RequirementItem
                  complete={validation.uppercase}
                  label={PasswordResetCopy.requirements.uppercase}
                />
                <RequirementItem
                  complete={validation.digit}
                  label={PasswordResetCopy.requirements.digit}
                />
                <RequirementItem
                  complete={validation.confirmation}
                  label={PasswordResetCopy.requirements.confirmation}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={!canSubmit}
                onPress={() => void handleSubmit()}
                style={({ pressed }) => [
                  styles.submitButton,
                  !canSubmit ? styles.submitButtonDisabled : null,
                  pressed && canSubmit ? styles.submitButtonPressed : null,
                ]}
              >
                {isSubmitting ? <ActivityIndicator color={AppColors.white} /> : null}
                <Text style={styles.submitButtonText}>
                  {isSubmitting
                    ? PasswordResetCopy.submittingAction
                    : PasswordResetCopy.submitAction}
                </Text>
              </Pressable>
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </>
          ) : (
            <View style={styles.centeredState}>
              <View style={styles.stateIcon}>
                <Text style={styles.stateIconText}>{recoveryState === "success" ? "✓" : "!"}</Text>
              </View>
              <Text style={styles.stateText}>{resolveDescription(recoveryState)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

type PasswordFieldProps = {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

function PasswordField({ label, onChangeText, placeholder, value }: PasswordFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="new-password"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={AppColors.mutedText}
        secureTextEntry
        style={styles.input}
        value={value}
      />
    </View>
  );
}

type RequirementItemProps = {
  complete: boolean;
  label: string;
};

function RequirementItem({ complete, label }: RequirementItemProps) {
  return (
    <View style={styles.requirementItem}>
      <Text style={[styles.requirementMark, complete ? styles.requirementComplete : null]}>
        {complete ? "✓" : "○"}
      </Text>
      <Text style={[styles.requirementText, complete ? styles.requirementComplete : null]}>
        {label}
      </Text>
    </View>
  );
}

function resolveTitle(recoveryState: RecoveryState): string {
  if (recoveryState === "success") {
    return PasswordResetCopy.successTitle;
  }

  if (recoveryState === "invalid") {
    return PasswordResetCopy.invalidLinkTitle;
  }

  return PasswordResetCopy.title;
}

function resolveDescription(recoveryState: RecoveryState): string {
  if (recoveryState === "success") {
    return PasswordResetCopy.successDescription;
  }

  if (recoveryState === "invalid") {
    return PasswordResetCopy.invalidLinkDescription;
  }

  return PasswordResetCopy.subtitle;
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: AppColors.background,
    flex: 1,
    minHeight: "100%",
  },
  content: {
    gap: PasswordResetUi.sectionGap,
    justifyContent: "center",
    maxWidth: PasswordResetUi.contentMaxWidth,
    minHeight: "100%",
    padding: PasswordResetUi.screenPadding,
    width: "100%",
  },
  hero: {
    gap: 8,
  },
  brand: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  title: {
    color: AppColors.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: AppColors.mutedText,
    fontSize: 15,
    lineHeight: 23,
  },
  card: {
    backgroundColor: AppColors.card,
    borderColor: AppColors.border,
    borderRadius: PasswordResetUi.cardRadius,
    borderWidth: 1,
    gap: PasswordResetUi.sectionGap,
    padding: PasswordResetUi.cardPadding,
  },
  field: {
    gap: PasswordResetUi.fieldGap,
  },
  label: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: AppColors.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  requirements: {
    gap: 7,
  },
  requirementItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  requirementMark: {
    color: AppColors.mutedText,
    fontSize: 14,
    width: 16,
  },
  requirementText: {
    color: AppColors.mutedText,
    fontSize: 13,
  },
  requirementComplete: {
    color: AppColors.primary,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  submitButtonDisabled: {
    backgroundColor: AppColors.disabled,
  },
  submitButtonPressed: {
    backgroundColor: AppColors.primaryPressed,
  },
  submitButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  errorText: {
    color: AppColors.error,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  centeredState: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 20,
  },
  stateIcon: {
    alignItems: "center",
    backgroundColor: AppColors.successBackground,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  stateIconText: {
    color: AppColors.primary,
    fontSize: 28,
    fontWeight: "800",
  },
  stateText: {
    color: AppColors.mutedText,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
});
