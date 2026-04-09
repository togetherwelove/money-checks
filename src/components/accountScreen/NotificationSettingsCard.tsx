import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { NotificationUiCopy } from "../../notifications/config/notificationCopy";
import type {
  NotificationPreferenceGroup as NotificationPreferenceGroupState,
  NotificationThresholdField as NotificationThresholdFieldState,
} from "../../notifications/preferences/notificationPreferences";
import { NotificationPreferenceGroup } from "./NotificationPreferenceGroup";

type NotificationSettingsCardProps = {
  onChangeThresholdPeriod: (
    key: NotificationThresholdFieldState["key"],
    period: NotificationThresholdFieldState["selectedPeriod"],
  ) => void;
  onChangeThresholdValue: (key: NotificationThresholdFieldState["key"], value: string) => void;
  permissionLabel: string;
  preferenceGroups: NotificationPreferenceGroupState[];
  statusMessage: string;
  onTogglePreference: (
    eventType: NotificationPreferenceGroupState["items"][number]["type"],
    enabled: boolean,
  ) => void;
};

export function NotificationSettingsCard({
  onChangeThresholdPeriod,
  onChangeThresholdValue,
  permissionLabel,
  preferenceGroups,
  statusMessage,
  onTogglePreference,
}: NotificationSettingsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.permissionList}>
        <View style={styles.permissionRow}>
          <View style={styles.textBlock}>
            <Text style={styles.label}>{NotificationUiCopy.permissionSectionTitle}</Text>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
          <Text style={styles.value}>{permissionLabel}</Text>
        </View>
      </View>
      <View style={styles.preferenceBlock}>
        {preferenceGroups.map((group) => (
          <NotificationPreferenceGroup
            group={group}
            key={group.id}
            onChangeThresholdPeriod={onChangeThresholdPeriod}
            onChangeThresholdValue={onChangeThresholdValue}
            onToggle={onTogglePreference}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.surface,
  },
  permissionList: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    paddingHorizontal: 12,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  statusText: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },
  preferenceBlock: {
    gap: 10,
    paddingTop: 2,
  },
});
