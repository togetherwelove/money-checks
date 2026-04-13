import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { ScreenSlideTransition } from "../components/ScreenSlideTransition";
import { EmailSignInCard } from "../components/authScreen/EmailSignInCard";
import { AppColors } from "../constants/colors";
import { EmailAuthCopy } from "../constants/emailAuth";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { signInWithEmailPassword } from "../lib/auth/emailPasswordAuth";
import { canUseGoogleSignIn, signInWithGoogle } from "../lib/auth/googleSignIn";
import { SignUpScreen } from "./SignUpScreen";

type AuthScreenProps = {
  initialErrorMessage?: string | null;
};

export function AuthScreen({ initialErrorMessage = null }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [screen, setScreen] = useState<"sign-in" | "sign-up">("sign-in");
  const showGoogleSignIn = canUseGoogleSignIn();

  useEffect(() => {
    if (!initialErrorMessage) {
      return;
    }

    console.error("[AuthScreen] Session error", initialErrorMessage);
  }, [initialErrorMessage]);

  const handleSubmit = async () => {
    try {
      await signInWithEmailPassword(email, password);
    } catch (error) {
      console.error("[AuthScreen] Email password sign-in failed", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("[AuthScreen] Google sign-in failed", error);
    }
  };

  return (
    <ScreenSlideTransition screenKey={screen}>
      {screen === "sign-up" ? (
        <SignUpScreen
          onBackToSignIn={() => {
            setPassword("");
            setScreen("sign-in");
          }}
        />
      ) : (
        <KeyboardAwareScrollView
          centerContent
          contentContainerStyle={styles.content}
          style={styles.screen}
        >
          <View style={styles.heroSection}>
            <Text style={styles.brand}>{AppMessages.brand}</Text>
            <Text style={styles.title}>{EmailAuthCopy.signIn.title}</Text>
          </View>

          <EmailSignInCard
            email={email}
            onGoogleSignIn={showGoogleSignIn ? handleGoogleSignIn : null}
            onChangeEmail={setEmail}
            onChangePassword={setPassword}
            onOpenSignUp={() => {
              setPassword("");
              setScreen("sign-up");
            }}
            onSubmit={handleSubmit}
            password={password}
          />

          <View style={styles.supportCard}>
            <Text style={styles.supportLabel}>{EmailAuthCopy.supportLabel}</Text>
          </View>
        </KeyboardAwareScrollView>
      )}
    </ScreenSlideTransition>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    gap: 16,
    justifyContent: "center",
  },
  heroSection: {
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
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
