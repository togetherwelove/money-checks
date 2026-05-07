import { StyleSheet, Text, View } from "react-native";

import { AuthLandingCopy, AuthLandingUi } from "../../constants/authLanding";
import { AppColors } from "../../constants/colors";
import { SurfaceCardStyle } from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";
import { AppleSignInButton } from "./AppleSignInButton";
import { GoogleSignInButton } from "./GoogleSignInButton";

type AuthLandingCardProps = {
  onAppleSignIn?: (() => void | Promise<void>) | null;
  onEmailSignIn: () => void;
  onEmailSignUp: () => void;
  onGoogleSignIn?: (() => void | Promise<void>) | null;
};

export function AuthLandingCard({
  onAppleSignIn = null,
  onEmailSignIn,
  onEmailSignUp,
  onGoogleSignIn = null,
}: AuthLandingCardProps) {
  const hasSocialSignIn = Boolean(onGoogleSignIn || onAppleSignIn);

  return (
    <View style={styles.card}>
      <View style={styles.actionGroup}>
        <ActionButton
          fullWidth
          label={AuthLandingCopy.emailSignInAction}
          onPress={onEmailSignIn}
          size="large"
          variant="primary"
        />
        <ActionButton
          fullWidth
          label={AuthLandingCopy.emailSignUpAction}
          onPress={onEmailSignUp}
          size="large"
          variant="secondary"
        />
        {hasSocialSignIn ? (
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>{AuthLandingCopy.methodDividerLabel}</Text>
            <View style={styles.dividerLine} />
          </View>
        ) : null}
        {onGoogleSignIn ? <GoogleSignInButton onPress={onGoogleSignIn} /> : null}
        {onAppleSignIn ? <AppleSignInButton onPress={onAppleSignIn} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...SurfaceCardStyle,
    gap: 16,
  },
  actionGroup: {
    gap: 10,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: AuthLandingUi.methodDividerGap,
    paddingVertical: AuthLandingUi.methodDividerPaddingVertical,
  },
  dividerLine: {
    flex: 1,
    height: AuthLandingUi.methodDividerLineHeight,
    backgroundColor: AppColors.border,
  },
  dividerLabel: {
    color: AppColors.mutedText,
    fontSize: AuthLandingUi.methodDividerTextFontSize,
    fontWeight: "700",
  },
});
