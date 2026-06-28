import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { OneLineTextFitProps } from "../../constants/textLayout";
import { InsetPanelStyle } from "../../constants/uiStyles";
import type { NotificationThresholdKey, NotificationThresholdPeriod } from "../../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup as NotificationPreferenceGroupState } from "../../notifications/preferences/notificationPreferences";
import { NotificationPreferenceRow } from "./NotificationPreferenceRow";
import { NotificationThresholdField } from "./NotificationThresholdField";

type NotificationPreferenceGroupProps = {
  group: NotificationPreferenceGroupState;
  onChangeThresholdCopy: (field: "body" | "title", value: string) => void;
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
  onChangeThresholdCopy,
  onChangeThresholdEnabled,
  onChangeThresholdPeriod,
  onChangeThresholdValue,
  onToggle,
}: NotificationPreferenceGroupProps) {
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
            onChangeCopy={onChangeThresholdCopy}
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
