import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { StyleSheet, Text, View } from "react-native";
import { getMenuStyles } from "../../constants/menuStyles";

import { AppSettingsUi } from "../../constants/appSettings";
import { OneLineTextFitProps } from "../../constants/textLayout";
import type {
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup as NotificationPreferenceGroupState } from "../../notifications/preferences/notificationPreferences";
import { NotificationPreferenceRow } from "./NotificationPreferenceRow";
import { NotificationThresholdField } from "./NotificationThresholdField";

type NotificationPreferenceGroupProps = {
  group: NotificationPreferenceGroupState;
  onChangeThresholdEnabled: (enabled: boolean) => void;
  onChangeThresholdPeriod: (period: NotificationThresholdPeriod) => void;
  onChangeThresholdValue: (key: NotificationThresholdKey, value: string) => void;
  onToggle: (
    eventTypes:
      | NotificationPreferenceGroupState["items"][number]["type"]
      | NonNullable<NotificationPreferenceGroupState["items"][number]["eventTypes"]>,
    enabled: boolean,
  ) => void;
};

export function NotificationPreferenceGroup({
  group,
  onChangeThresholdEnabled,
  onChangeThresholdPeriod,
  onChangeThresholdValue,
  onToggle,
}: NotificationPreferenceGroupProps) {
  const styles = getStyles();
  useAppTheme();
  const thresholdSettings = group.thresholdSettings;

  return (
    <View style={styles.group}>
      <View style={styles.headingBlock}>
        <Text {...OneLineTextFitProps} style={styles.title}>
          {group.title}
        </Text>
      </View>
      {thresholdSettings ? (
        <View style={styles.thresholdBlock}>
          <NotificationThresholdField
            settings={thresholdSettings}
            onChangePeriod={onChangeThresholdPeriod}
            onChangeValue={(value) => onChangeThresholdValue(thresholdSettings.selectedKey, value)}
            onToggleEnabled={onChangeThresholdEnabled}
          />
        </View>
      ) : null}
      {group.items.length ? (
        <View style={styles.list}>
          {group.items.map((item, index) => (
            <NotificationPreferenceRow
              isLast={index === group.items.length - 1}
              item={item}
              key={item.type}
              onToggle={(enabled) => onToggle(item.eventTypes ?? item.type, enabled)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    group: {
      gap: AppSettingsUi.sectionGap,
    },
    headingBlock: {
      minWidth: 0,
    },
    title: getMenuStyles().sectionTitle,
    thresholdBlock: {
      ...getMenuStyles().group,
      paddingHorizontal: getMenuStyles().row.paddingHorizontal,
    },
    list: getMenuStyles().group,
  }),
);
