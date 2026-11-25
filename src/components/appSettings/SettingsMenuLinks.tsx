import { useAppTheme } from "../../hooks/useAppTheme";
import { SettingsGroup } from "./SettingsGroup";
import { getAppMenuItemId, groupAppMenuItems } from "../../lib/menuItems";
import { SettingsActionRow } from "./SettingsActionRow";
import { View } from "react-native";
import { getSettingsGroupStyles } from "../../constants/settingsGroupStyles";
import type { AppMenuItem, AppMenuSection } from "../../lib/menuItems";

export type SettingsMenuLinksProps = {
  sections: AppMenuSection[];
  onSelect: (item: AppMenuItem) => void;
};

export function SettingsMenuLinks({ sections, onSelect }: SettingsMenuLinksProps) {
  useAppTheme();
  return (
    <View style={getSettingsGroupStyles().sections}>
      {sections.flatMap((section) =>
        groupAppMenuItems(section.items, section.keepTogether).map((group) => (
          <SettingsGroup key={group.key} description={group.description} hasLeadingIcons>
            {group.items.map((item, index) => (
              <SettingsActionRow
                key={getAppMenuItemId(item)}
                grouped
                label={item.label}
                leadingIcon={item.icon}
                trailingIcon={"targetScreen" in item ? undefined : null}
                disabled={item.disabled}
                hasBadge={item.hasBadge}
                isLast={index === group.items.length - 1}
                onPress={() => {
                  if (!item.disabled) onSelect(item);
                }}
              />
            ))}
          </SettingsGroup>
        )),
      )}
    </View>
  );
}
