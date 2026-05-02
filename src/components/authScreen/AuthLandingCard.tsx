import { StyleSheet, Text, View } from "react-native";

import { AuthLandingCopy } from "../../constants/authLanding";
import { AppColors } from "../../constants/colors";
import { SurfaceCardStyle } from "../../constants/uiStyles";
import { ActionButton } from "../ActionButton";
import { TextLinkButton } from "../TextLinkButton";
import { AppleSignInButton } from "./AppleSignInButton";
import { GoogleSignInButton } from "./GoogleSignInButton";

type AuthLandingCardProps = {
  onAppleSignIn?: (() => void | Promise<void>) | null;
  onEmailSignIn: () => void;
  onEmailSignUp: () => void;
  onGoogleSignIn?: (() => void | Promise<void>) | null;
  onOpenPrivacyPolicy: () => void;
  onOpenTermsOfUse: () => void;
};

export function AuthLandingCard({
  onAppleSignIn = null,
  onEmailSignIn,
  onEmailSignUp,
  onGoogleSignIn = null,
  onOpenPrivacyPolicy,
  onOpenTermsOfUse,
}: AuthLandingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.actionGroup}>
        {onAppleSignIn ? <AppleSignInButton onPress={onAppleSignIn} /> : null}
        {onGoogleSignIn ? <GoogleSignInButton onPress={onGoogleSignIn} /> : null}
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
      </View>
      <View style={styles.legalNotice}>
        <Text style={styles.legalText}>{AuthLandingCopy.legalPrefix}</Text>
        <TextLinkButton label={AuthLandingCopy.termsOfUseAction} onPress={onOpenTermsOfUse} />
        <Text style={styles.legalText}>{AuthLandingCopy.legalMiddle}</Text>
        <TextLinkButton label={AuthLandingCopy.privacyPolicyAction} onPress={onOpenPrivacyPolicy} />
        <Text style={styles.legalText}>{AuthLandingCopy.legalSuffix}</Text>
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
  legalNotice: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  legalText: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
