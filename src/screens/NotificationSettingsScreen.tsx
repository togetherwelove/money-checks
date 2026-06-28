import { Linking, StyleSheet } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { NotificationSettingsCard } from "../components/accountScreen/NotificationSettingsCard";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import type { NotificationPermissionState } from "../lib/notifications/pushNotifications";
import type {
  NotificationEventType,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";

type NotificationSettingsScreenProps = {
  notificationPermissionLabel: string;
  notificationPermissionState: NotificationPermissionState;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationStatusMessage: string | null;
  onChangeNotificationThresholdCopy: (field: "body" | "title", value: string) => void;
  onChangeNotificationThresholdEnabled: (enabled: boolean) => void;
  onChangeNotificationThresholdPeriod: (period: NotificationThresholdPeriod) => void;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onRequestNotificationPermission: () => Promise<boolean>;
  onToggleNotificationPreference: (
    eventTypes: NotificationEventType | readonly NotificationEventType[],
    enabled: boolean,
  ) => void;
};

export function NotificationSettingsScreen({
  notificationPermissionLabel,
  notificationPermissionState,
  notificationPreferenceGroups,
  notificationStatusMessage,
  onChangeNotificationThresholdCopy,
  onChangeNotificationThresholdEnabled,
  onChangeNotificationThresholdPeriod,
  onChangeNotificationThreshold,
  onRequestNotificationPermission,
  onToggleNotificationPreference,
}: NotificationSettingsScreenProps) {
  const handleOpenNotificationPermission = () => {
    if (notificationPermissionState === "default") {
      void onRequestNotificationPermission();
      return;
    }

    void Linking.openSettings();
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <NotificationSettingsCard
        onChangeThresholdCopy={onChangeNotificationThresholdCopy}
        onChangeThresholdEnabled={onChangeNotificationThresholdEnabled}
        onChangeThresholdPeriod={onChangeNotificationThresholdPeriod}
        onChangeThresholdValue={onChangeNotificationThreshold}
        onOpenDeviceNotificationSettings={handleOpenNotificationPermission}
        onTogglePreference={onToggleNotificationPreference}
        permissionLabel={notificationPermissionLabel}
        permissionState={notificationPermissionState}
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
    paddingTop: AppLayout.screenTopPadding,
  },
});
