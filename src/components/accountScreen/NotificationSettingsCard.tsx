import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { AppTextBreakProps } from "../../constants/textLayout";
import { InsetPanelStyle, SupportingTextStyle, SurfaceCardStyle } from "../../constants/uiStyles";
import type { NotificationPermissionState } from "../../lib/notifications/pushNotifications";
import {
  NotificationSettingsUi,
  NotificationUiCopy,
} from "../../notifications/config/notificationCopy";
import type { NotificationThresholdKey } from "../../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup as NotificationPreferenceGroupState } from "../../notifications/preferences/notificationPreferences";
import { NotificationPreferenceGroup } from "./NotificationPreferenceGroup";

type NotificationSettingsCardProps = {
  onChangeThresholdEnabled: (key: NotificationThresholdKey, enabled: boolean) => void;
  onChangeThresholdValue: (key: NotificationThresholdKey, value: string) => void;
  onOpenDeviceNotificationSettings: () => void;
  permissionLabel: string;
  permissionState: NotificationPermissionState;
  preferenceGroups: NotificationPreferenceGroupState[];
  statusMessage: string | null;
  onTogglePreference: (
    eventTypes:
      | NotificationPreferenceGroupState["items"][number]["type"]
      | NonNullable<NotificationPreferenceGroupState["items"][number]["eventTypes"]>,
    enabled: boolean,
  ) => void;
};

export function NotificationSettingsCard({
  onChangeThresholdEnabled,
  onChangeThresholdValue,
  onOpenDeviceNotificationSettings,
  permissionLabel,
  permissionState,
  preferenceGroups,
  statusMessage,
  onTogglePreference,
}: NotificationSettingsCardProps) {
  const isPermissionGranted = permissionState === "granted";

  return (
    <View style={styles.card}>
      <View style={styles.permissionList}>
        {isPermissionGranted ? (
          <View style={styles.permissionRow}>
            <NotificationPermissionContent
              permissionLabel={permissionLabel}
              shouldShowChevron={false}
              statusMessage={statusMessage}
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenDeviceNotificationSettings}
            style={({ pressed }) => [styles.permissionRow, pressed ? styles.pressedRow : null]}
          >
            <NotificationPermissionContent
              permissionLabel={permissionLabel}
              shouldShowChevron
              statusMessage={statusMessage}
            />
          </Pressable>
        )}
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

function NotificationPermissionContent({
  permissionLabel,
  shouldShowChevron,
  statusMessage,
}: {
  permissionLabel: string;
  shouldShowChevron: boolean;
  statusMessage: string | null;
}) {
  return (
    <>
      <View style={styles.textBlock}>
        <Text {...AppTextBreakProps} style={styles.label}>
          {NotificationUiCopy.permissionSectionTitle}
        </Text>
        {statusMessage ? (
          <Text {...AppTextBreakProps} style={styles.statusText}>
            {statusMessage}
          </Text>
        ) : null}
      </View>
      <View style={styles.permissionAction}>
        <Text {...AppTextBreakProps} numberOfLines={1} style={styles.value}>
          {permissionLabel}
        </Text>
        {shouldShowChevron ? (
          <Feather
            color={AppColors.mutedStrongText}
            name="chevron-right"
            size={NotificationSettingsUi.permissionChevronIconSize}
          />
        ) : null}
      </View>
    </>
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
  pressedRow: {
    backgroundColor: AppColors.surfaceMuted,
  },
  textBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  label: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: AppColors.text,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  permissionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: AppLayout.compactGap,
    flexShrink: 0,
  },
  statusText: SupportingTextStyle,
  preferenceBlock: {
    gap: 10,
    paddingTop: 2,
  },
});
