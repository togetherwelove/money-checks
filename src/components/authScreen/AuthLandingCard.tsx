import { StyleSheet, Text, View } from "react-native";

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
          label="이메일로 로그인"
          onPress={onEmailSignIn}
          size="large"
          variant="primary"
        />
        <ActionButton
          fullWidth
          label="이메일로 가입하기"
          onPress={onEmailSignUp}
          size="large"
          variant="secondary"
        />
        {hasSocialSignIn ? (
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>혹은</Text>
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
    gap: 10,
    paddingVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.border,
  },
  dividerLabel: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
});
