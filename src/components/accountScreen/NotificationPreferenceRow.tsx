import { StyleSheet, Switch, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import type { NotificationPreferenceItem } from "../../notifications/preferences/notificationPreferences";

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
  return (
    <View style={[styles.row, isFirst && styles.firstRow]}>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{item.label}</Text>
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
  label: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
});
