import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { InsetPanelStyle, SupportingTextStyle, SurfaceCardStyle } from "../../constants/uiStyles";
import { NotificationUiCopy } from "../../notifications/config/notificationCopy";
import type { NotificationThresholdKey } from "../../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup as NotificationPreferenceGroupState } from "../../notifications/preferences/notificationPreferences";
import { NotificationPreferenceGroup } from "./NotificationPreferenceGroup";

type NotificationSettingsCardProps = {
  onChangeThresholdEnabled: (key: NotificationThresholdKey, enabled: boolean) => void;
  onChangeThresholdValue: (key: NotificationThresholdKey, value: string) => void;
  permissionLabel: string;
  preferenceGroups: NotificationPreferenceGroupState[];
  statusMessage: string;
  onTogglePreference: (
    eventType: NotificationPreferenceGroupState["items"][number]["type"],
    enabled: boolean,
  ) => void;
};

export function NotificationSettingsCard({
  onChangeThresholdEnabled,
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
            onChangeThresholdEnabled={onChangeThresholdEnabled}
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
    ...SurfaceCardStyle,
    gap: 8,
  },
  permissionList: {
    ...InsetPanelStyle,
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
  statusText: SupportingTextStyle,
  preferenceBlock: {
    gap: 10,
    paddingTop: 2,
  },
});
