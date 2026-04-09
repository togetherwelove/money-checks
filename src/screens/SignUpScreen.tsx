import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { EmailSignUpFormCard } from "../components/authScreen/EmailSignUpFormCard";
import { EmailSignUpOtpCard } from "../components/authScreen/EmailSignUpOtpCard";
import { AuthTiming } from "../constants/authTiming";
import { AppColors } from "../constants/colors";
import { EmailAuthCopy } from "../constants/emailAuth";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import {
  resendEmailSignUpOtp,
  signUpWithEmailPassword,
  verifyEmailSignUpOtp,
} from "../lib/auth/emailPasswordAuth";
import {
  formatSignUpOtpCooldownLabel,
  parseSignUpOtpRetrySeconds,
} from "../lib/auth/signUpOtpError";

type SignUpScreenProps = {
  onBackToSignIn: () => void;
};

export function SignUpScreen({ onBackToSignIn }: SignUpScreenProps) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [token, setToken] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!resendAvailableAt || resendAvailableAt <= now) {
      return;
    }

    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [now, resendAvailableAt]);

  const remainingResendSeconds = useMemo(() => {
    if (!resendAvailableAt || resendAvailableAt <= now) {
      return 0;
    }

    return Math.ceil((resendAvailableAt - now) / 1000);
  }, [now, resendAvailableAt]);

  const resendDisabled = remainingResendSeconds > 0;
  const resendLabel = resendDisabled
    ? `${EmailAuthCopy.signUp.resendOtpAction} (${formatSignUpOtpCooldownLabel(remainingResendSeconds)})`
    : EmailAuthCopy.signUp.resendOtpAction;

  const startResendCooldown = (durationMs = AuthTiming.signUpOtpResendCooldownMs) => {
    setNow(Date.now());
    setResendAvailableAt(Date.now() + durationMs);
  };

  const handleRequestOtp = async () => {
    try {
      const result = await signUpWithEmailPassword(email, password);
      if (result === "signed-in") {
        return;
      }

      setStep("otp");
      setToken("");
      startResendCooldown();
      setStatusMessage(EmailAuthCopy.signUp.otpRequestedStatus);
    } catch (error) {
      console.error("[SignUpScreen] Sign-up failed", error);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyEmailSignUpOtp(email, token);
    } catch (error) {
      console.error("[SignUpScreen] Sign-up OTP verification failed", error);
    }
  };

  const handleResendOtp = async () => {
    try {
      if (resendDisabled) {
        setStatusMessage(EmailAuthCopy.signUp.otpResendCooldownStatus);
        return;
      }

      await resendEmailSignUpOtp(email);
      startResendCooldown();
      setStatusMessage(EmailAuthCopy.signUp.otpResentStatus);
    } catch (error) {
      const retryAfterSeconds = parseSignUpOtpRetrySeconds(error);
      if (retryAfterSeconds !== null) {
        startResendCooldown(retryAfterSeconds * 1000);
        setStatusMessage(EmailAuthCopy.signUp.otpResendCooldownStatus);
        return;
      }

      console.error("[SignUpScreen] Sign-up OTP resend failed", error);
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
        <Text style={styles.title}>{EmailAuthCopy.signUp.title}</Text>
        <Text style={styles.subtitle}>{EmailAuthCopy.signUp.subtitle}</Text>
      </View>

      {step === "credentials" ? (
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
          statusMessage={statusMessage}
          token={token}
        />
      )}
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
