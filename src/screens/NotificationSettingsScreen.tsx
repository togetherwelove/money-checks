import { StyleSheet } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { ScreenContentContainer } from "../components/ScreenContentContainer";
import { NotificationSettingsCard } from "../components/accountScreen/NotificationSettingsCard";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import type { NotificationThresholdKey } from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";

type NotificationSettingsScreenProps = {
  notificationPermissionLabel: string;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationStatusMessage: string;
  onChangeNotificationThresholdEnabled: (key: NotificationThresholdKey, enabled: boolean) => void;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onToggleNotificationPreference: (
    eventType: NotificationPreferenceGroup["items"][number]["type"],
    enabled: boolean,
  ) => void;
};

export function NotificationSettingsScreen({
  notificationPermissionLabel,
  notificationPreferenceGroups,
  notificationStatusMessage,
  onChangeNotificationThresholdEnabled,
  onChangeNotificationThreshold,
  onToggleNotificationPreference,
}: NotificationSettingsScreenProps) {
  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <ScreenContentContainer>
        <NotificationSettingsCard
          onChangeThresholdEnabled={onChangeNotificationThresholdEnabled}
          onChangeThresholdValue={onChangeNotificationThreshold}
          onTogglePreference={onToggleNotificationPreference}
          permissionLabel={notificationPermissionLabel}
          preferenceGroups={notificationPreferenceGroups}
          statusMessage={notificationStatusMessage}
        />
      </ScreenContentContainer>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenPadding,
    paddingBottom: 24,
  },
});
