import { useAppTheme } from "../../hooks/useAppTheme";
import { RNHostView, Section, Text, VStack } from "@expo/ui/swift-ui";
import { getNativeSettingsStyles } from "../../constants/nativeSettingsStyles";
import { getAppMenuItemId } from "../../lib/menuItems";
import { SettingsActionRow } from "./SettingsActionRow";
import type { SettingsMenuLinksProps } from "./SettingsMenuLinks";

export function SettingsMenuLinks({ sections, onSelect }: SettingsMenuLinksProps) {
  useAppTheme();
  return (
    <>
      {sections.map((section) => (
        <Section
          key={section.label}
          header={<Text modifiers={getNativeSettingsStyles().sectionTitle}>{section.label}</Text>}
        >
          {section.items.map((item) => (
            <VStack
              key={getAppMenuItemId(item)}
              alignment="leading"
              modifiers={getNativeSettingsStyles().row}
            >
              <RNHostView matchContents={{ vertical: true }}>
                <SettingsActionRow
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
                  embeddedInNativeRow
                  isLast
                  onPress={() => {
                    if (!item.disabled) onSelect(item);
                  }}
                />
              </RNHostView>
            </VStack>
          ))}
        </Section>
      ))}
    </>
  );
}
