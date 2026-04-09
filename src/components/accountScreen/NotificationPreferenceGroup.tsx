import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { InsetPanelStyle } from "../../constants/uiStyles";
import type {
  NotificationPreferenceGroup as NotificationPreferenceGroupState,
  NotificationThresholdField as NotificationThresholdFieldState,
} from "../../notifications/preferences/notificationPreferences";
import { NotificationPreferenceRow } from "./NotificationPreferenceRow";
import { NotificationThresholdField } from "./NotificationThresholdField";

type NotificationPreferenceGroupProps = {
  group: NotificationPreferenceGroupState;
  onChangeThresholdPeriod: (
    key: NotificationThresholdFieldState["key"],
    period: NotificationThresholdFieldState["selectedPeriod"],
  ) => void;
  onChangeThresholdValue: (key: NotificationThresholdFieldState["key"], value: string) => void;
  onToggle: (
    eventType: NotificationPreferenceGroupState["items"][number]["type"],
    enabled: boolean,
  ) => void;
};

export function NotificationPreferenceGroup({
  group,
  onChangeThresholdPeriod,
  onChangeThresholdValue,
  onToggle,
}: NotificationPreferenceGroupProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.title}>{group.title}</Text>
      {group.thresholdFields?.length ? (
        <View style={styles.thresholdBlock}>
          {group.thresholdFields.map((field) => (
            <NotificationThresholdField
              field={field}
              key={field.key}
              onChangePeriod={(period) => onChangeThresholdPeriod(field.key, period)}
              onChangeValue={(value) => onChangeThresholdValue(field.key, value)}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.list}>
        {group.items.map((item) => (
          <NotificationPreferenceRow
            item={item}
            key={item.type}
            onToggle={(enabled) => onToggle(item.type, enabled)}
          />
        ))}
      </View>
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
    gap: 10,
  },
  list: {
    ...InsetPanelStyle,
    paddingHorizontal: 12,
  },
});
