import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { InsetPanelStyle } from "../../constants/uiStyles";
import type { NotificationThresholdKey } from "../../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup as NotificationPreferenceGroupState } from "../../notifications/preferences/notificationPreferences";
import { NotificationPreferenceRow } from "./NotificationPreferenceRow";
import { NotificationThresholdField } from "./NotificationThresholdField";

type NotificationPreferenceGroupProps = {
  group: NotificationPreferenceGroupState;
  onChangeThresholdEnabled: (key: NotificationThresholdKey, enabled: boolean) => void;
  onChangeThresholdValue: (key: NotificationThresholdKey, value: string) => void;
  onToggle: (
    eventType: NotificationPreferenceGroupState["items"][number]["type"],
    enabled: boolean,
  ) => void;
};

export function NotificationPreferenceGroup({
  group,
  onChangeThresholdEnabled,
  onChangeThresholdValue,
  onToggle,
}: NotificationPreferenceGroupProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.title}>{group.title}</Text>
      {group.thresholdFields?.length ? (
        <View style={styles.thresholdBlock}>
          {group.thresholdFields.map((field, index) => (
            <NotificationThresholdField
              field={field}
              isFirst={index === 0}
              key={field.key}
              onChangeEnabled={(enabled) => onChangeThresholdEnabled(field.key, enabled)}
              onChangeValue={(value) => onChangeThresholdValue(field.key, value)}
            />
          ))}
        </View>
      ) : null}
      {group.items.length ? (
        <View style={styles.list}>
          {group.items.map((item, index) => (
            <NotificationPreferenceRow
              isFirst={index === 0}
              item={item}
              key={item.type}
              onToggle={(enabled) => onToggle(item.type, enabled)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
    paddingTop: 6,
  },
  title: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  thresholdBlock: {
    ...InsetPanelStyle,
    paddingHorizontal: 12,
  },
  list: {
    ...InsetPanelStyle,
    paddingHorizontal: 12,
  },
});
