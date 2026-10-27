import type { ReactNode } from "react";
import { Linking, StyleSheet, Text } from "react-native";
import { MenuStyles } from "../constants/menuStyles";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { NotificationSettingsCard } from "../components/accountScreen/NotificationSettingsCard";
import { AppColors } from "../constants/colors";
import { PushNotificationCopy } from "../notifications/config/pushNotificationCopy";
import type { NotificationPermissionState } from "../lib/notifications/pushNotifications";
import type {
  NotificationEventType,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";

export type NotificationSettingsScreenProps = {
  showNotificationSettings: boolean;
  notificationPermissionLabel: string;
  notificationPermissionState: NotificationPermissionState;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationStatusMessage: string | null;
  onChangeNotificationThresholdEnabled: (enabled: boolean) => void;
  onChangeNotificationThresholdPeriod: (period: NotificationThresholdPeriod) => void;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onRequestNotificationPermission: () => Promise<boolean>;
  onToggleNotificationPreference: (
    eventTypes: NotificationEventType | readonly NotificationEventType[],
    enabled: boolean,
  ) => void;
  screenTitle: ReactNode;
};

export function NotificationSettingsScreen({
  showNotificationSettings,
  notificationPermissionLabel,
  notificationPermissionState,
  notificationPreferenceGroups,
  notificationStatusMessage,
  onChangeNotificationThresholdEnabled,
  onChangeNotificationThresholdPeriod,
  onChangeNotificationThreshold,
  onRequestNotificationPermission,
  onToggleNotificationPreference,
  screenTitle,
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
      {screenTitle}
      {showNotificationSettings ? (
        <NotificationSettingsCard
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
      ) : (
        <Text style={MenuStyles.description}>{PushNotificationCopy.permissionUnsupported}</Text>
      )}
      <AppFooterContentInset />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  content: {
    ...MenuStyles.content,
  },
});
