import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { OneLineTextFitProps } from "../../constants/textLayout";
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
    eventTypes:
      | NotificationPreferenceGroupState["items"][number]["type"]
      | NonNullable<NotificationPreferenceGroupState["items"][number]["eventTypes"]>,
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
      <View style={styles.headingBlock}>
        <Text {...OneLineTextFitProps} style={styles.title}>
          {group.title}
        </Text>
      </View>
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
              onToggle={(enabled) => onToggle(item.eventTypes ?? item.type, enabled)}
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
  headingBlock: {
    minWidth: 0,
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
