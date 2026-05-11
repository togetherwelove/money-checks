import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { ScreenSlideTransition } from "../components/ScreenSlideTransition";
import { AuthLandingCard } from "../components/authScreen/AuthLandingCard";
import { AuthLanguageSwitch } from "../components/authScreen/AuthLanguageSwitch";
import { EmailSignInCard } from "../components/authScreen/EmailSignInCard";
import { EmailSignUpAgreementCard } from "../components/authScreen/EmailSignUpAgreementCard";
import { PasswordResetRequestCard } from "../components/authScreen/PasswordResetRequestCard";
import {
  SignUpCaptchaChallenge as AuthCaptchaChallenge,
  type SignUpCaptchaChallengeHandle as AuthCaptchaChallengeHandle,
} from "../components/authScreen/SignUpCaptchaChallenge";
import { AppleAuthCopy } from "../constants/appleAuth";
import { AuthLandingCopy } from "../constants/authLanding";
import { AppColors } from "../constants/colors";
import { EmailAuthCopy } from "../constants/emailAuth";
import { GoogleAuthCopy } from "../constants/googleAuth";
import { KeyboardLayout } from "../constants/keyboard";
import { AppLayout } from "../constants/layout";
import { LegalLinks } from "../constants/legal";
import { AppMessages } from "../constants/messages";
import {
  canUseAppleSignIn,
  isAppleSignInCancelled,
  signInWithApple,
} from "../lib/auth/appleSignIn";
import {
  resolveEmailPasswordSignInErrorMessage,
  signInWithEmailPassword,
} from "../lib/auth/emailPasswordAuth";
import {
  canUseGoogleSignIn,
  isGoogleSignInCancelled,
  signInWithGoogle,
} from "../lib/auth/googleSignIn";
import {
  requestEmailPasswordReset,
  resolvePasswordResetErrorMessage,
} from "../lib/auth/passwordReset";
import { showNativeToast } from "../lib/nativeToast";
import { SignUpScreen } from "./SignUpScreen";

type AuthScreenProps = {
  initialErrorMessage?: string | null;
};

type AuthScreenMode =
  | "landing"
  | "email-sign-in"
  | "password-reset-request"
  | "sign-up"
  | "social-agreement";
type SocialSignInProvider = "apple" | "google";

export function AuthScreen({ initialErrorMessage = null }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [hasAgreedToSocialPrivacy, setHasAgreedToSocialPrivacy] = useState(false);
  const [hasAgreedToSocialTerms, setHasAgreedToSocialTerms] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingSocialSignInProvider, setPendingSocialSignInProvider] =
    useState<SocialSignInProvider | null>(null);
  const [screen, setScreen] = useState<AuthScreenMode>("landing");
  const [isEmailSignInSubmitting, setIsEmailSignInSubmitting] = useState(false);
  const captchaChallengeRef = useRef<AuthCaptchaChallengeHandle>(null);
  const showAppleSignIn = canUseAppleSignIn();
  const showGoogleSignIn = canUseGoogleSignIn();
  const title = resolveAuthScreenTitle(screen, pendingSocialSignInProvider);

  useEffect(() => {
    if (!initialErrorMessage) {
      return;
    }

    console.error("[AuthScreen] Session error", initialErrorMessage);
  }, [initialErrorMessage]);

  const handleSubmit = async () => {
    if (isEmailSignInSubmitting) {
      return;
    }

    setIsEmailSignInSubmitting(true);
    try {
      const captchaToken = await captchaChallengeRef.current?.requestToken();
      if (!captchaToken) {
        return;
      }

      await signInWithEmailPassword(email, password, captchaToken);
    } catch (error) {
      console.error("[AuthScreen] Email password sign-in failed", error);
      showNativeToast(resolveEmailPasswordSignInErrorMessage(error));
    } finally {
      setIsEmailSignInSubmitting(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    try {
      await requestEmailPasswordReset(email);
      showNativeToast(EmailAuthCopy.passwordReset.requestSuccess);
      setScreen("email-sign-in");
    } catch (error) {
      showNativeToast(resolvePasswordResetErrorMessage(error));
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
      showNativeToast(GoogleAuthCopy.signInError);
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
      showNativeToast(AppleAuthCopy.signInError);
    }
  };

  const handleOpenLegalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showNativeToast(EmailAuthCopy.legalLinkError);
    }
  };

  const handleToggleAllSocialAgreements = () => {
    const shouldAgree = !(hasAgreedToSocialTerms && hasAgreedToSocialPrivacy);
    setHasAgreedToSocialTerms(shouldAgree);
    setHasAgreedToSocialPrivacy(shouldAgree);
  };

  const handleOpenSocialAgreement = (provider: SocialSignInProvider) => {
    setPendingSocialSignInProvider(provider);
    setScreen("social-agreement");
  };

  const handleBackFromSocialAgreement = () => {
    setPendingSocialSignInProvider(null);
    setHasAgreedToSocialTerms(false);
    setHasAgreedToSocialPrivacy(false);
    setScreen("landing");
  };

  const handleContinueSocialSignIn = () => {
    if (pendingSocialSignInProvider === "google") {
      void handleGoogleSignIn();
      return;
    }

    if (pendingSocialSignInProvider === "apple") {
      void handleAppleSignIn();
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
          contentContainerStyle={styles.content}
          extraScrollHeight={KeyboardLayout.focusedInputExtraScrollHeightMin}
          style={styles.screen}
        >
          <AuthLanguageSwitch />
          <View style={styles.heroSection}>
            {screen === "landing" ? null : <Text style={styles.brand}>{AppMessages.brand}</Text>}
            {screen === "landing" ? (
              <Text style={styles.title}>
                {EmailAuthCopy.signIn.titlePrefix}
                <Text style={styles.titleHighlight}>{EmailAuthCopy.signIn.titleBrand}</Text>
                {EmailAuthCopy.signIn.titleSuffix}
              </Text>
            ) : (
              <Text style={styles.title}>{title}</Text>
            )}
          </View>

          {screen === "email-sign-in" ? (
            <>
              <EmailSignInCard
                email={email}
                onChangeEmail={setEmail}
                onChangePassword={setPassword}
                onOpenPasswordReset={() => {
                  setPassword("");
                  setScreen("password-reset-request");
                }}
                onOpenSignUp={() => {
                  setPassword("");
                  setScreen("sign-up");
                }}
                onSubmit={handleSubmit}
                password={password}
                submitting={isEmailSignInSubmitting}
              />
              <Pressable
                disabled={isEmailSignInSubmitting}
                onPress={() => {
                  setPassword("");
                  setScreen("landing");
                }}
                style={[
                  styles.backLinkButton,
                  isEmailSignInSubmitting ? styles.disabledBackLinkButton : null,
                ]}
              >
                <Text style={styles.backLinkText}>{AuthLandingCopy.backToMethodsAction}</Text>
              </Pressable>
            </>
          ) : screen === "password-reset-request" ? (
            <>
              <PasswordResetRequestCard
                email={email}
                onBack={() => {
                  setScreen("email-sign-in");
                }}
                onChangeEmail={setEmail}
                onSubmit={handleRequestPasswordReset}
                statusMessage={null}
              />
              <Pressable
                onPress={() => {
                  setScreen("landing");
                }}
                style={styles.backLinkButton}
              >
                <Text style={styles.backLinkText}>{AuthLandingCopy.backToMethodsAction}</Text>
              </Pressable>
            </>
          ) : screen === "social-agreement" ? (
            <EmailSignUpAgreementCard
              hasAgreedToPrivacy={hasAgreedToSocialPrivacy}
              hasAgreedToTerms={hasAgreedToSocialTerms}
              onBack={handleBackFromSocialAgreement}
              onNext={handleContinueSocialSignIn}
              onOpenPrivacyPolicy={() => {
                void handleOpenLegalLink(LegalLinks.privacyPolicyUrl);
              }}
              onOpenTermsOfUse={() => {
                void handleOpenLegalLink(LegalLinks.termsOfUseUrl);
              }}
              onToggleAll={handleToggleAllSocialAgreements}
              onTogglePrivacy={() => setHasAgreedToSocialPrivacy((currentValue) => !currentValue)}
              onToggleTerms={() => setHasAgreedToSocialTerms((currentValue) => !currentValue)}
            />
          ) : (
            <AuthLandingCard
              onAppleSignIn={showAppleSignIn ? () => handleOpenSocialAgreement("apple") : null}
              onEmailSignIn={() => setScreen("email-sign-in")}
              onEmailSignUp={() => {
                setPassword("");
                setScreen("sign-up");
              }}
              onGoogleSignIn={showGoogleSignIn ? () => handleOpenSocialAgreement("google") : null}
            />
          )}

          <View style={styles.supportCard}>
            <Text style={styles.supportLabel}>{EmailAuthCopy.legalConsentNotice}</Text>
          </View>
          <AuthCaptchaChallenge ref={captchaChallengeRef} />
        </KeyboardAwareScrollView>
      )}
    </ScreenSlideTransition>
  );
}

function resolveAuthScreenTitle(
  screen: AuthScreenMode,
  pendingSocialSignInProvider: SocialSignInProvider | null,
): string {
  if (screen === "email-sign-in") {
    return EmailAuthCopy.signIn.emailTitle;
  }

  if (screen === "password-reset-request") {
    return EmailAuthCopy.passwordReset.requestTitle;
  }

  if (screen === "social-agreement") {
    if (pendingSocialSignInProvider === "google") {
      return EmailAuthCopy.signIn.googleAgreementTitle;
    }

    if (pendingSocialSignInProvider === "apple") {
      return EmailAuthCopy.signIn.appleAgreementTitle;
    }
  }

  return EmailAuthCopy.signIn.title;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flexGrow: 1,
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
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  title: {
    color: AppColors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  titleHighlight: {
    color: AppColors.primary,
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
  disabledBackLinkButton: {
    opacity: 0.45,
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
