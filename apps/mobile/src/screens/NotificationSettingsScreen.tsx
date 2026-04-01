import { ScrollView, StyleSheet } from "react-native";

import { ScreenHeaderBlock } from "../components/ScreenHeaderBlock";
import { NotificationSettingsCard } from "../components/accountScreen/NotificationSettingsCard";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { NotificationUiCopy } from "../notifications/config/notificationCopy";
import type {
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";

type NotificationSettingsScreenProps = {
  notificationPermissionLabel: string;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationStatusMessage: string;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onChangeNotificationThresholdPeriod: (
    key: NotificationThresholdKey,
    period: NotificationThresholdPeriod,
  ) => void;
  onToggleNotificationPreference: (
    eventType: NotificationPreferenceGroup["items"][number]["type"],
    enabled: boolean,
  ) => void;
};

export function NotificationSettingsScreen({
  notificationPermissionLabel,
  notificationPreferenceGroups,
  notificationStatusMessage,
  onChangeNotificationThreshold,
  onChangeNotificationThresholdPeriod,
  onToggleNotificationPreference,
}: NotificationSettingsScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <ScreenHeaderBlock
        eyebrow={NotificationUiCopy.headerEyebrow}
        title={NotificationUiCopy.screenTitle}
      />
      <NotificationSettingsCard
        onChangeThresholdPeriod={onChangeNotificationThresholdPeriod}
        onChangeThresholdValue={onChangeNotificationThreshold}
        onTogglePreference={onToggleNotificationPreference}
        permissionLabel={notificationPermissionLabel}
        preferenceGroups={notificationPreferenceGroups}
        statusMessage={notificationStatusMessage}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
    paddingBottom: 24,
  },
});
