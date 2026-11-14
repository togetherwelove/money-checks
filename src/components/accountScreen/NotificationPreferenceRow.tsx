import { FixedColors } from "../../constants/fixedColors";
import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { AppSettingsUi } from "../../constants/appSettings";
import { getAppSettingsRowStyles } from "../../constants/appSettingsStyles";
import { getAppColors } from "../../constants/colors";
import { AppTextBreakProps } from "../../constants/textLayout";
import { NotificationUiCopy } from "../../notifications/config/notificationCopy";
import type { NotificationPreferenceItem } from "../../notifications/preferences/notificationPreferences";

const HELP_ICON_SIZE = 18;

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
  const handlePressHelp = () => {
    if (!item.helpMessage) {
      return;
    }

    Alert.alert(item.label, item.helpMessage);
  };

  return (
    <View style={[styles.row, isLast ? styles.lastRow : null]}>
      <View style={styles.textBlock}>
        <View style={styles.labelRow}>
          <Text {...AppTextBreakProps} style={styles.label}>
            {item.label}
          </Text>
          {item.helpMessage ? (
            <Pressable
              accessibilityLabel={`${item.label} ${NotificationUiCopy.helpAccessibilitySuffix}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={handlePressHelp}
              style={styles.helpButton}
            >
              <Text style={styles.helpText}>?</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.switchWrap}>
        <Switch
          onValueChange={onToggle}
          thumbColor={item.enabled ? FixedColors.white : getAppColors().surface}
          trackColor={{ false: getAppColors().border, true: getAppColors().primary }}
          value={item.enabled}
        />
      </View>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    row: {
      ...getAppSettingsRowStyles().row,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      minHeight: AppSettingsUi.rowMinHeight,
    },
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
      ...getAppSettingsRowStyles().title,
      flex: 1,
      minWidth: 0,
    },
    helpButton: {
      alignItems: "center",
      borderColor: getAppColors().mutedStrongText,
      borderRadius: HELP_ICON_SIZE / 2,
      borderWidth: 1,
      height: HELP_ICON_SIZE,
      justifyContent: "center",
      flexShrink: 0,
      width: HELP_ICON_SIZE,
    },
    helpText: {
      color: getAppColors().mutedStrongText,
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 14,
    },
    switchWrap: {
      alignItems: "flex-end",
      flexShrink: 0,
    },
  }),
);
