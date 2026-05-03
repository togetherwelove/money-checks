import { StyleSheet } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { NotificationSettingsCard } from "../components/accountScreen/NotificationSettingsCard";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import type {
  NotificationEventType,
  NotificationThresholdKey,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";

type NotificationSettingsScreenProps = {
  notificationPermissionLabel: string;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationStatusMessage: string;
  onChangeNotificationThresholdEnabled: (key: NotificationThresholdKey, enabled: boolean) => void;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onToggleNotificationPreference: (
    eventTypes: NotificationEventType | readonly NotificationEventType[],
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
      <NotificationSettingsCard
        onChangeThresholdEnabled={onChangeNotificationThresholdEnabled}
        onChangeThresholdValue={onChangeNotificationThreshold}
        onTogglePreference={onToggleNotificationPreference}
        permissionLabel={notificationPermissionLabel}
        preferenceGroups={notificationPreferenceGroups}
        statusMessage={notificationStatusMessage}
      />
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
  },
});
