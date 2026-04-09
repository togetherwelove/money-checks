import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { ScreenHeaderBlock } from "../components/ScreenHeaderBlock";
import { AuthOnboardingMessages } from "../constants/authOnboarding";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { NoteTextStyle, SurfaceCardStyle } from "../constants/uiStyles";

type PermissionOnboardingScreenProps = {
  onAllow: () => Promise<void>;
  onSkip: () => void;
};

export function PermissionOnboardingScreen({ onAllow, onSkip }: PermissionOnboardingScreenProps) {
  return (
    <View style={styles.screen}>
      <ScreenHeaderBlock
        eyebrow="알림"
        subtitle={AuthOnboardingMessages.permissionSubtitle}
        title={AuthOnboardingMessages.permissionTitle}
      />
      <View style={styles.card}>
        <ActionButton
          label={AuthOnboardingMessages.permissionPrimaryAction}
          onPress={onAllow}
          variant="primary"
        />
        <ActionButton
          label={AuthOnboardingMessages.permissionSecondaryAction}
          onPress={onSkip}
          variant="secondary"
        />
        <Text style={styles.note}>{AuthOnboardingMessages.permissionNote}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: AppColors.background,
    padding: AppLayout.screenPadding,
    gap: 12,
  },
  card: {
    ...SurfaceCardStyle,
    gap: 10,
  },
  note: {
    ...NoteTextStyle,
    textAlign: "center",
  },
});
