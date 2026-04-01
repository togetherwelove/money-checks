import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { signInWithGoogle } from "../lib/auth/googleAuth";
import { clearWebAuthError, readWebAuthError } from "../lib/auth/webAuthError";

export function AuthScreen() {
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const authError = readWebAuthError();
    if (!authError) {
      return;
    }

    setAuthErrorMessage(
      authError.description ?? authError.code ?? "Authentication failed during redirect.",
    );
    clearWebAuthError();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "Authentication failed during redirect.";
      setAuthErrorMessage(nextMessage);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.brand}>{AppMessages.brand}</Text>
      <Text style={styles.title}>{AppMessages.authTitle}</Text>
      <Text style={styles.subtitle}>{AppMessages.authSubtitle}</Text>
      {authErrorMessage ? <Text style={styles.errorText}>{authErrorMessage}</Text> : null}
      <ActionButton
        label={AppMessages.authButton}
        onPress={() => void handleGoogleLogin()}
        variant="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: AppLayout.screenPadding,
    gap: 12,
    backgroundColor: AppColors.background,
  },
  brand: {
    color: AppColors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: AppColors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: AppColors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: AppColors.expense,
    fontSize: 12,
    lineHeight: 18,
  },
});
