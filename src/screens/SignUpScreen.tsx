import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { EmailSignUpAgreementCard } from "../components/authScreen/EmailSignUpAgreementCard";
import { EmailSignUpFormCard } from "../components/authScreen/EmailSignUpFormCard";
import { EmailSignUpOtpCard } from "../components/authScreen/EmailSignUpOtpCard";
import {
  SignUpCaptchaChallenge,
  type SignUpCaptchaChallengeHandle,
} from "../components/authScreen/SignUpCaptchaChallenge";
import { type SignUpStep, SignUpStepIndicator } from "../components/authScreen/SignUpStepIndicator";
import { AppColors } from "../constants/colors";
import { EmailAuthCopy } from "../constants/emailAuth";
import { EmailOtpTiming } from "../constants/emailOtp";
import { KeyboardLayout } from "../constants/keyboard";
import { AppLayout } from "../constants/layout";
import { LegalLinks } from "../constants/legal";
import { AppMessages } from "../constants/messages";
import {
  calculateEmailOtpResendAvailableAt,
  calculateRemainingEmailOtpCooldownSeconds,
  createEmailOtpCooldownKey,
  formatEmailOtpCooldownLabel,
} from "../lib/auth/emailOtpCooldown";
import {
  resendEmailSignUpOtp,
  signUpWithEmailPassword,
  verifyEmailSignUpOtp,
} from "../lib/auth/emailPasswordAuth";
import { showNativeToast } from "../lib/nativeToast";

type SignUpScreenProps = {
  onBackToSignIn: () => void;
};

export function SignUpScreen({ onBackToSignIn }: SignUpScreenProps) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [hasAgreedToPrivacy, setHasAgreedToPrivacy] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [password, setPassword] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendAvailableAtByEmail, setResendAvailableAtByEmail] = useState<Record<string, number>>(
    {},
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [step, setStep] = useState<SignUpStep>("agreement");
  const [token, setToken] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const captchaChallengeRef = useRef<SignUpCaptchaChallengeHandle>(null);
  const otpEmailCooldownKey = useMemo(() => createEmailOtpCooldownKey(email), [email]);
  const resendAvailableAt = resendAvailableAtByEmail[otpEmailCooldownKey] ?? null;
  const remainingResendSeconds = calculateRemainingEmailOtpCooldownSeconds(resendAvailableAt, now);
  const resendDisabled = remainingResendSeconds > 0;
  const requestOtpDisabled = step === "credentials" && resendDisabled;
  const resendLabel = resendDisabled
    ? `${EmailAuthCopy.signUp.resendOtpAction} (${formatEmailOtpCooldownLabel(remainingResendSeconds)})`
    : EmailAuthCopy.signUp.resendOtpAction;
  const requestOtpLabel = requestOtpDisabled
    ? `${EmailAuthCopy.signUp.requestOtpAction} (${formatEmailOtpCooldownLabel(remainingResendSeconds)})`
    : EmailAuthCopy.signUp.requestOtpAction;

  useEffect(() => {
    if (!resendDisabled) {
      return;
    }

    const timerId = setInterval(() => {
      setNow(Date.now());
    }, EmailOtpTiming.resendTimerIntervalMs);

    return () => {
      clearInterval(timerId);
    };
  }, [resendDisabled]);

  const startEmailResendCooldown = () => {
    const nextNow = Date.now();
    setNow(nextNow);
    setResendAvailableAtByEmail((currentValue) => ({
      ...currentValue,
      [otpEmailCooldownKey]: calculateEmailOtpResendAvailableAt(nextNow),
    }));
  };

  const handleRequestOtp = async () => {
    if (isRequestingOtp || requestOtpDisabled) {
      return;
    }

    setIsRequestingOtp(true);
    try {
      const captchaToken = await captchaChallengeRef.current?.requestToken();
      if (!captchaToken) {
        return;
      }

      const result = await signUpWithEmailPassword(email, password, captchaToken);
      if (result === "signed-in") {
        return;
      }

      setStep("otp");
      setToken("");
      startEmailResendCooldown();
      setStatusMessage(EmailAuthCopy.signUp.otpRequestedStatus);
    } catch (error) {
      console.error("[SignUpScreen] Sign-up failed", error);
      setStatusMessage(
        error instanceof Error ? error.message : EmailAuthCopy.signUp.requestOtpError,
      );
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleOpenLegalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showNativeToast(EmailAuthCopy.legalLinkError);
    }
  };

  const handleToggleAllAgreements = () => {
    const shouldAgree = !(hasAgreedToTerms && hasAgreedToPrivacy);
    setHasAgreedToTerms(shouldAgree);
    setHasAgreedToPrivacy(shouldAgree);
  };

  const handleVerifyOtp = async () => {
    if (isVerifyingOtp) {
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await verifyEmailSignUpOtp(email, token);
    } catch (error) {
      console.error("[SignUpScreen] Sign-up OTP verification failed", error);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResendingOtp || isVerifyingOtp) {
      return;
    }

    setIsResendingOtp(true);
    try {
      if (resendDisabled) {
        setStatusMessage(EmailAuthCopy.signUp.otpResendCooldownStatus);
        return;
      }

      await resendEmailSignUpOtp(email);
      startEmailResendCooldown();
      setStatusMessage(EmailAuthCopy.signUp.otpResentStatus);
    } catch (error) {
      console.error("[SignUpScreen] Sign-up OTP resend failed", error);
      setStatusMessage(
        error instanceof Error ? error.message : EmailAuthCopy.signUp.requestOtpError,
      );
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.content}
      extraScrollHeight={KeyboardLayout.focusedInputExtraScrollHeightMin}
      style={styles.screen}
    >
      <View style={styles.heroSection}>
        <Text style={styles.brand}>{AppMessages.brand}</Text>
        <Text style={styles.title}>{EmailAuthCopy.signUp.title}</Text>
        <Text style={styles.subtitle}>{EmailAuthCopy.signUp.subtitle}</Text>
        <SignUpStepIndicator currentStep={step} />
      </View>

      {step === "agreement" ? (
        <EmailSignUpAgreementCard
          hasAgreedToPrivacy={hasAgreedToPrivacy}
          hasAgreedToTerms={hasAgreedToTerms}
          onBack={onBackToSignIn}
          onNext={() => {
            setStatusMessage(null);
            setStep("credentials");
          }}
          onOpenPrivacyPolicy={() => {
            void handleOpenLegalLink(LegalLinks.privacyPolicyUrl);
          }}
          onOpenTermsOfUse={() => {
            void handleOpenLegalLink(LegalLinks.termsOfUseUrl);
          }}
          onToggleAll={handleToggleAllAgreements}
          onTogglePrivacy={() => setHasAgreedToPrivacy((currentValue) => !currentValue)}
          onToggleTerms={() => setHasAgreedToTerms((currentValue) => !currentValue)}
        />
      ) : step === "credentials" ? (
        <EmailSignUpFormCard
          confirmPassword={confirmPassword}
          email={email}
          onBack={onBackToSignIn}
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
          onChangePassword={(value) => {
            setPassword(value);
            if (statusMessage) {
              setStatusMessage(null);
            }
          }}
          onSubmit={handleRequestOtp}
          password={password}
          statusMessage={statusMessage}
          submitDisabled={requestOtpDisabled}
          submitLabel={requestOtpLabel}
          submitting={isRequestingOtp}
        />
      ) : (
        <EmailSignUpOtpCard
          email={email}
          onChangeToken={(value) => {
            setToken(value);
            if (statusMessage) {
              setStatusMessage(null);
            }
          }}
          onEditCredentials={() => {
            setStep("credentials");
            setToken("");
            setStatusMessage(null);
          }}
          onResend={handleResendOtp}
          onSubmit={handleVerifyOtp}
          resendDisabled={resendDisabled}
          resendLabel={resendLabel}
          resending={isResendingOtp}
          statusMessage={statusMessage}
          submitting={isVerifyingOtp}
          token={token}
        />
      )}
      <SignUpCaptchaChallenge ref={captchaChallengeRef} />
    </KeyboardAwareScrollView>
  );
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
});
