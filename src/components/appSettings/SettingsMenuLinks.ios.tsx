import { useAppTheme } from "../../hooks/useAppTheme";
import { SettingsGroup } from "./SettingsGroup";
import { getAppMenuItemId, groupAppMenuItems } from "../../lib/menuItems";
import { SettingsActionRow } from "./SettingsActionRow";
import { RNHostView, VStack } from "@expo/ui/swift-ui";
import { getNativeSettingsStyles } from "../../constants/nativeSettingsStyles";
import type { SettingsMenuLinksProps } from "./SettingsMenuLinks";

export function SettingsMenuLinks({ sections, onSelect }: SettingsMenuLinksProps) {
  useAppTheme();
  return (
    <>
      {sections.flatMap((section) =>
        groupAppMenuItems(section.items, section.keepTogether).map((group) => (
          <VStack key={group.key} modifiers={getNativeSettingsStyles().menuGroup}>
            <RNHostView matchContents={{ vertical: true }}>
              <SettingsGroup description={group.description} hasLeadingIcons>
                {group.items.map((item, index) => (
                  <SettingsActionRow
                    key={getAppMenuItemId(item)}
                    label={item.label}
                    leadingIcon={item.icon}
                    trailingIcon={"targetScreen" in item ? undefined : null}
                    disabled={item.disabled}
                    hasBadge={item.hasBadge}
                    grouped
                    isLast={index === group.items.length - 1}
                    onPress={() => {
                      if (!item.disabled) onSelect(item);
                    }}
                  />
                ))}
              </SettingsGroup>
            </RNHostView>
          </VStack>
        )),
      )}
    </>
  );
}
