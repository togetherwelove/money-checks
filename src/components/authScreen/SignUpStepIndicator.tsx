import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { EmailAuthCopy, EmailSignUpStepUi } from "../../constants/emailAuth";

export type SignUpStep = "agreement" | "credentials" | "otp";

type SignUpStepIndicatorProps = {
  currentStep: SignUpStep;
};

const SIGN_UP_STEPS: SignUpStep[] = ["agreement", "credentials", "otp"];

export function SignUpStepIndicator({ currentStep }: SignUpStepIndicatorProps) {
  const currentStepIndex = SIGN_UP_STEPS.indexOf(currentStep);

  return (
    <View style={styles.container}>
      {SIGN_UP_STEPS.map((step, stepIndex) => {
        const isActive = stepIndex === currentStepIndex;
        const isComplete = stepIndex < currentStepIndex;

        return (
          <View key={step} style={styles.stepGroup}>
            {stepIndex > 0 ? (
              <View style={[styles.connector, isComplete ? styles.activeConnector : null]} />
            ) : null}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.dot,
                  isActive ? styles.activeDot : null,
                  isComplete ? styles.completeDot : null,
                ]}
              />
              <Text style={[styles.label, isActive ? styles.activeLabel : null]}>
                {getSignUpStepLabel(step)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function getSignUpStepLabel(step: SignUpStep): string {
  if (step === "agreement") {
    return EmailAuthCopy.signUp.stepAgreementLabel;
  }

  if (step === "credentials") {
    return EmailAuthCopy.signUp.stepCredentialsLabel;
  }

  return EmailAuthCopy.signUp.stepOtpLabel;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: EmailSignUpStepUi.rowGap,
  },
  stepGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: EmailSignUpStepUi.rowGap,
  },
  connector: {
    width: EmailSignUpStepUi.dotSize,
    height: EmailSignUpStepUi.connectorHeight,
    backgroundColor: AppColors.border,
  },
  activeConnector: {
    backgroundColor: AppColors.primary,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: EmailSignUpStepUi.stepGap,
  },
  dot: {
    width: EmailSignUpStepUi.dotSize,
    height: EmailSignUpStepUi.dotSize,
    borderRadius: EmailSignUpStepUi.dotSize,
    borderWidth: EmailSignUpStepUi.dotBorderWidth,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  activeDot: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary,
  },
  completeDot: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary,
  },
  label: {
    color: AppColors.mutedText,
    fontSize: EmailSignUpStepUi.labelFontSize,
    fontWeight: "700",
    lineHeight: EmailSignUpStepUi.labelLineHeight,
  },
  activeLabel: {
    color: AppColors.primary,
  },
});
