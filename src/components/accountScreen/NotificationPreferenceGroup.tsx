import { useAppTheme } from "../../hooks/useAppTheme";
import { View } from "react-native";
import { getSettingsGroupStyles } from "../../constants/settingsGroupStyles";
import { SettingsGroup } from "../appSettings/SettingsGroup";

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
  useAppTheme();
  const thresholdSettings = group.thresholdSettings;

  return (
    <View style={getSettingsGroupStyles().sections}>
      {thresholdSettings ? (
        <SettingsGroup>
          <View style={getSettingsGroupStyles().singleLineField}>
            <NotificationThresholdField
              settings={thresholdSettings}
              onChangePeriod={onChangeThresholdPeriod}
              onChangeValue={(value) =>
                onChangeThresholdValue(thresholdSettings.selectedKey, value)
              }
              onToggleEnabled={onChangeThresholdEnabled}
            />
          </View>
        </SettingsGroup>
      ) : null}
      {group.items.map((item) => (
        <SettingsGroup key={item.type} description={item.helpMessage}>
          <NotificationPreferenceRow
            isLast
            item={item}
            onToggle={(enabled) => onToggle(item.eventTypes ?? item.type, enabled)}
          />
        </SettingsGroup>
      ))}
    </View>
  );
}
