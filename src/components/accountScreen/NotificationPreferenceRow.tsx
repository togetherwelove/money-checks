import { getSwitchAppearance } from "../../constants/switchAppearance";
import { getSettingsGroupStyles } from "../../constants/settingsGroupStyles";
import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { StyleSheet, Switch, Text, View } from "react-native";

import { AppTextBreakProps } from "../../constants/textLayout";
import type { NotificationPreferenceItem } from "../../notifications/preferences/notificationPreferences";

type NotificationPreferenceRowProps = {
  isLast?: boolean;
  item: NotificationPreferenceItem;
  onToggle: (enabled: boolean) => void;
};

export function NotificationPreferenceRow({
  isLast = false,
  item,
  onToggle,
}: NotificationPreferenceRowProps) {
  const styles = getStyles();
  useAppTheme();
  return (
    <View style={[styles.row, isLast ? styles.lastRow : null]}>
      <View style={styles.textBlock}>
        <View style={styles.labelRow}>
          <Text {...AppTextBreakProps} style={styles.label}>
            {item.label}
          </Text>
        </View>
      </View>
      <View style={styles.switchWrap}>
        <Switch
          accessibilityLabel={item.label}
          onValueChange={onToggle}
          {...getSwitchAppearance()}
          value={item.enabled}
        />
      </View>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    row: getSettingsGroupStyles().row,
    lastRow: {
      borderBottomWidth: 0,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
    },
    labelRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      minWidth: 0,
    },
    label: {
      ...getSettingsGroupStyles().label,
      flex: 1,
      minWidth: 0,
    },
    switchWrap: {
      alignItems: "flex-end",
      flexShrink: 0,
    },
  }),
);
