import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { EmailAuthCard } from "../components/authScreen/EmailAuthCard";
import { AppColors } from "../constants/colors";
import { EmailAuthCopy } from "../constants/emailAuth";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { signInWithEmailPassword, signUpWithEmailPassword } from "../lib/auth/emailPasswordAuth";

type AuthScreenProps = {
  initialErrorMessage?: string | null;
};

export function AuthScreen({ initialErrorMessage = null }: AuthScreenProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialErrorMessage) {
      return;
    }

    console.error("[AuthScreen] Session error", initialErrorMessage);
  }, [initialErrorMessage]);

  const handleSubmit = async () => {
    try {
      if (mode === "sign-up") {
        const result = await signUpWithEmailPassword(email, password);
        if (result === "confirmation-required") {
          setPassword("");
          setConfirmPassword("");
          setMode("sign-in");
          setStatusMessage(EmailAuthCopy.confirmationStatus);
        }
        return;
      }

      await signInWithEmailPassword(email, password);
    } catch (error) {
      console.error("[AuthScreen] Email password auth failed", error);
    }
  };

  return (
    <KeyboardAwareScrollView
      centerContent
      contentContainerStyle={styles.content}
      style={styles.screen}
    >
      <View style={styles.heroSection}>
        <Text style={styles.brand}>{AppMessages.brand}</Text>
        <Text style={styles.title}>{EmailAuthCopy.title}</Text>
        <Text style={styles.subtitle}>{EmailAuthCopy.subtitle}</Text>
      </View>

      <EmailAuthCard
        confirmPassword={confirmPassword}
        email={email}
        mode={mode}
        onChangeConfirmPassword={(value) => {
          setConfirmPassword(value);
          if (statusMessage) {
            setStatusMessage(null);
          }
        }}
        onChangeEmail={(value) => {
          setEmail(value);
          if (statusMessage) {
            setStatusMessage(null);
          }
        }}
        onChangeMode={(value) => {
          setMode(value);
          setPassword("");
          setConfirmPassword("");
          setStatusMessage(null);
        }}
        onChangePassword={(value) => {
          setPassword(value);
          if (statusMessage) {
            setStatusMessage(null);
          }
        }}
        onSubmit={() => {
          void handleSubmit();
        }}
        password={password}
        statusMessage={statusMessage}
      />

      <View style={styles.supportCard}>
        <Text style={styles.supportLabel}>{EmailAuthCopy.supportLabel}</Text>
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
    padding: AppLayout.screenPadding,
    gap: 12,
  },
  heroSection: {
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
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
  supportCard: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  supportLabel: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
});
