import { SettingsGroup } from "../appSettings/SettingsGroup";
import { getSettingsGroupStyles } from "../../constants/settingsGroupStyles";
import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "../AppIcons";

import { getAppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { AppTextBreakProps } from "../../constants/textLayout";
import type { NotificationPermissionState } from "../../lib/notifications/pushNotifications";
import {
  NotificationSettingsUi,
  NotificationUiCopy,
} from "../../notifications/config/notificationCopy";
import type {
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup as NotificationPreferenceGroupState } from "../../notifications/preferences/notificationPreferences";
import { NotificationPreferenceGroup } from "./NotificationPreferenceGroup";

type NotificationSettingsCardProps = {
  onChangeThresholdEnabled: (enabled: boolean) => void;
  onChangeThresholdPeriod: (period: NotificationThresholdPeriod) => void;
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
  onChangeThresholdPeriod,
  onChangeThresholdValue,
  onOpenDeviceNotificationSettings,
  permissionLabel,
  permissionState,
  preferenceGroups,
  statusMessage,
  onTogglePreference,
}: NotificationSettingsCardProps) {
  const styles = getStyles();
  useAppTheme();
  const isPermissionGranted = permissionState === "granted";

  return (
    <View style={styles.card}>
      <SettingsGroup description={statusMessage ?? undefined}>
        {isPermissionGranted ? (
          <View style={styles.permissionRow}>
            <NotificationPermissionContent
              permissionLabel={permissionLabel}
              shouldShowChevron={false}
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenDeviceNotificationSettings}
            style={({ pressed }) => [styles.permissionRow, pressed ? styles.pressedRow : null]}
          >
            <NotificationPermissionContent permissionLabel={permissionLabel} shouldShowChevron />
          </Pressable>
        )}
      </SettingsGroup>
      <View style={styles.preferenceBlock}>
        {preferenceGroups.map((group) => (
          <NotificationPreferenceGroup
            group={group}
            key={group.id}
            onChangeThresholdEnabled={onChangeThresholdEnabled}
            onChangeThresholdPeriod={onChangeThresholdPeriod}
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
}: {
  permissionLabel: string;
  shouldShowChevron: boolean;
}) {
  const styles = getStyles();
  useAppTheme();
  return (
    <>
      <View style={styles.textBlock}>
        <Text {...AppTextBreakProps} style={styles.label}>
          {NotificationUiCopy.permissionSectionTitle}
        </Text>
      </View>
      <View style={styles.permissionAction}>
        <Text {...AppTextBreakProps} numberOfLines={1} style={styles.value}>
          {permissionLabel}
        </Text>
        {shouldShowChevron ? (
          <Feather
            color={getAppColors().mutedStrongText}
            name="chevron-right"
            size={NotificationSettingsUi.permissionChevronIconSize}
          />
        ) : null}
      </View>
    </>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    card: {
      gap: getSettingsGroupStyles().sections.gap,
    },
    permissionRow: getSettingsGroupStyles().row,
    pressedRow: {
      backgroundColor: getAppColors().surfaceMuted,
    },
    textBlock: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    label: getSettingsGroupStyles().label,
    value: { ...getSettingsGroupStyles().value, flexShrink: 1 },
    permissionAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: AppLayout.compactGap,
      flexShrink: 0,
    },
    preferenceBlock: {
      gap: getSettingsGroupStyles().sections.gap,
    },
  }),
);
