import { Linking, StyleSheet, Switch, Text, View } from "react-native";

import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { NotificationSettingsCard } from "../components/accountScreen/NotificationSettingsCard";
import { AppSettingsCopy } from "../constants/appSettings";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import {
  CardTitleTextStyle,
  SupportingTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import type { NotificationPermissionState } from "../lib/notifications/pushNotifications";
import { PushNotificationCopy } from "../notifications/config/pushNotificationCopy";
import type {
  NotificationEventType,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";

type AppSettingsScreenProps = {
  notificationPermissionLabel: string;
  notificationPermissionState: NotificationPermissionState;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationStatusMessage: string | null;
  isCalendarHeatmapEnabled: boolean;
  onChangeNotificationThresholdCopy: (field: "body" | "title", value: string) => void;
  onChangeNotificationThresholdEnabled: (enabled: boolean) => void;
  onChangeNotificationThresholdPeriod: (period: NotificationThresholdPeriod) => void;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onRequestNotificationPermission: () => Promise<boolean>;
  onToggleCalendarHeatmap: (isEnabled: boolean) => void;
  onToggleNotificationPreference: (
    eventTypes: NotificationEventType | readonly NotificationEventType[],
    enabled: boolean,
  ) => void;
  showNotificationSettings: boolean;
};

export function AppSettingsScreen({
  notificationPermissionLabel,
  notificationPermissionState,
  notificationPreferenceGroups,
  notificationStatusMessage,
  isCalendarHeatmapEnabled,
  onChangeNotificationThresholdCopy,
  onChangeNotificationThresholdEnabled,
  onChangeNotificationThresholdPeriod,
  onChangeNotificationThreshold,
  onRequestNotificationPermission,
  onToggleCalendarHeatmap,
  onToggleNotificationPreference,
  showNotificationSettings,
}: AppSettingsScreenProps) {
  const handleOpenNotificationPermission = () => {
    if (notificationPermissionState === "default") {
      void onRequestNotificationPermission();
      return;
    }

    void Linking.openSettings();
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{AppSettingsCopy.displayEffectsSectionTitle}</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.settingTitle}>{AppSettingsCopy.heatmapTitle}</Text>
            <Text style={styles.settingDescription}>{AppSettingsCopy.heatmapDescription}</Text>
          </View>
          <Switch
            onValueChange={onToggleCalendarHeatmap}
            thumbColor={isCalendarHeatmapEnabled ? AppColors.inverseText : AppColors.surface}
            trackColor={{ false: AppColors.border, true: AppColors.primary }}
            value={isCalendarHeatmapEnabled}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{AppSettingsCopy.pushNotificationSectionTitle}</Text>
        {showNotificationSettings ? (
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
        ) : (
          <View style={styles.unsupportedCard}>
            <Text style={styles.unsupportedText}>
              {PushNotificationCopy.permissionUnsupported}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: AppLayout.cardGap,
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  section: {
    gap: 8,
  },
  sectionTitle: CardTitleTextStyle,
  settingCard: {
    ...SurfaceCardStyle,
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  settingDescription: {
    ...SupportingTextStyle,
    fontSize: 11,
  },
  settingTextBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  settingTitle: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  unsupportedCard: SurfaceCardStyle,
  unsupportedText: SupportingTextStyle,
});
