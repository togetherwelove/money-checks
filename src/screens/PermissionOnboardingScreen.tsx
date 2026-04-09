import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { ScreenHeaderBlock } from "../components/ScreenHeaderBlock";
import { AuthOnboardingMessages } from "../constants/authOnboarding";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";

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
          onPress={() => {
            void onAllow();
          }}
          variant="primary"
        />
        <ActionButton
          label={AuthOnboardingMessages.permissionSecondaryAction}
          onPress={onSkip}
          variant="secondary"
        />
        <Text style={styles.note}>
          허용 여부는 기기 팝업에서 선택할 수 있고, 이후 알림설정에서 다시 확인할 수 있습니다.
        </Text>
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
    gap: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 24,
    backgroundColor: AppColors.surface,
    padding: 16,
  },
  note: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
