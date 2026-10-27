import { Text, View } from "react-native";
import { MenuStyles } from "../../constants/menuStyles";
import type { AppMenuItem, AppMenuSection } from "../../lib/menuItems";
import { getAppMenuItemId } from "../../lib/menuItems";
import { SettingsActionRow } from "./SettingsActionRow";

export type SettingsMenuLinksProps = {
  sections: AppMenuSection[];
  onSelect: (item: AppMenuItem) => void;
};

export function SettingsMenuLinks({ sections, onSelect }: SettingsMenuLinksProps) {
  return (
    <View style={MenuStyles.sections}>
      {sections.map((section) => (
        <View key={section.label} style={MenuStyles.section}>
          <Text accessibilityRole="header" style={MenuStyles.sectionTitle}>
            {section.label}
          </Text>
          <View style={MenuStyles.group}>
            {section.items.map((item, index) => (
              <SettingsActionRow
                key={getAppMenuItemId(item)}
                label={item.label}
                leadingIcon={item.icon}
                description={item.description}
                disabled={item.disabled}
                hasBadge={item.hasBadge}
                trailingIcon={
                  "action" in item && item.action === "annual-report-download"
                    ? "download"
                    : undefined
                }
                isLast={index === section.items.length - 1}
                onPress={() => {
                  if (!item.disabled) onSelect(item);
                }}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
