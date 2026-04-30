import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import type { NotificationPreferenceItem } from "../../notifications/preferences/notificationPreferences";

const HELP_ICON_SIZE = 18;

type NotificationPreferenceRowProps = {
  isFirst?: boolean;
  item: NotificationPreferenceItem;
  onToggle: (enabled: boolean) => void;
};

export function NotificationPreferenceRow({
  isFirst = false,
  item,
  onToggle,
}: NotificationPreferenceRowProps) {
  const handlePressHelp = () => {
    if (!item.helpMessage) {
      return;
    }

    Alert.alert(item.label, item.helpMessage);
  };

  return (
    <View style={[styles.row, isFirst && styles.firstRow]}>
      <View style={styles.textBlock}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{item.label}</Text>
          {item.helpMessage ? (
            <Pressable
              accessibilityLabel={`${item.label} 도움말`}
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
      <Switch
        onValueChange={onToggle}
        thumbColor={item.enabled ? AppColors.inverseText : AppColors.surface}
        trackColor={{ false: AppColors.border, true: AppColors.primary }}
        value={item.enabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  firstRow: {
    borderTopWidth: 0,
  },
  textBlock: {
    flex: 1,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  label: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  helpButton: {
    alignItems: "center",
    borderColor: AppColors.mutedStrongText,
    borderRadius: HELP_ICON_SIZE / 2,
    borderWidth: 1,
    height: HELP_ICON_SIZE,
    justifyContent: "center",
    width: HELP_ICON_SIZE,
  },
  helpText: {
    color: AppColors.mutedStrongText,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },
});
