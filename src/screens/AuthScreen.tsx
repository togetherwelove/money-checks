import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { ScreenSlideTransition } from "../components/ScreenSlideTransition";
import { AuthLandingCard } from "../components/authScreen/AuthLandingCard";
import { EmailSignInCard } from "../components/authScreen/EmailSignInCard";
import { AuthLandingCopy } from "../constants/authLanding";
import { AppColors } from "../constants/colors";
import { EmailAuthCopy } from "../constants/emailAuth";
import { AppLayout } from "../constants/layout";
import { LegalLinks } from "../constants/legal";
import { AppMessages } from "../constants/messages";
import {
  canUseAppleSignIn,
  isAppleSignInCancelled,
  signInWithApple,
} from "../lib/auth/appleSignIn";
import { signInWithEmailPassword } from "../lib/auth/emailPasswordAuth";
import {
  canUseGoogleSignIn,
  isGoogleSignInCancelled,
  signInWithGoogle,
} from "../lib/auth/googleSignIn";
import { showNativeToast } from "../lib/nativeToast";
import { SignUpScreen } from "./SignUpScreen";

type AuthScreenProps = {
  initialErrorMessage?: string | null;
};

export function AuthScreen({ initialErrorMessage = null }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [screen, setScreen] = useState<"landing" | "email-sign-in" | "sign-up">("landing");
  const showAppleSignIn = canUseAppleSignIn();
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
      if (isGoogleSignInCancelled(error)) {
        return;
      }

      console.error("[AuthScreen] Google sign-in failed", error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (error) {
      if (isAppleSignInCancelled(error)) {
        return;
      }

      console.error("[AuthScreen] Apple sign-in failed", error);
    }
  };

  const handleOpenLegalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showNativeToast(AuthLandingCopy.legalLinkError);
    }
  };

  return (
    <ScreenSlideTransition screenKey={screen}>
      {screen === "sign-up" ? (
        <SignUpScreen
          onBackToSignIn={() => {
            setPassword("");
            setScreen("landing");
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

          {screen === "email-sign-in" ? (
            <>
              <EmailSignInCard
                email={email}
                onChangeEmail={setEmail}
                onChangePassword={setPassword}
                onOpenSignUp={() => {
                  setPassword("");
                  setScreen("sign-up");
                }}
                onSubmit={handleSubmit}
                password={password}
              />
              <Pressable
                onPress={() => {
                  setPassword("");
                  setScreen("landing");
                }}
                style={styles.backLinkButton}
              >
                <Text style={styles.backLinkText}>{AuthLandingCopy.backToMethodsAction}</Text>
              </Pressable>
            </>
          ) : (
            <AuthLandingCard
              onAppleSignIn={showAppleSignIn ? handleAppleSignIn : null}
              onEmailSignIn={() => setScreen("email-sign-in")}
              onEmailSignUp={() => {
                setPassword("");
                setScreen("sign-up");
              }}
              onGoogleSignIn={showGoogleSignIn ? handleGoogleSignIn : null}
              onOpenPrivacyPolicy={() => {
                void handleOpenLegalLink(LegalLinks.privacyPolicyUrl);
              }}
              onOpenTermsOfUse={() => {
                void handleOpenLegalLink(LegalLinks.termsOfUseUrl);
              }}
            />
          )}

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
  backLinkButton: {
    alignSelf: "center",
    paddingVertical: 4,
  },
  backLinkText: {
    color: AppColors.mutedStrongText,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  supportLabel: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
});
