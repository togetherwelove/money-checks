import { SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { Children, type ReactNode } from "react";
import { Divider, Text, VStack } from "@expo/ui/swift-ui";
import { getNativeSettingsGroupStyles } from "../../constants/nativeSettingsGroupStyles.ios";
import { useAppTheme } from "../../hooks/useAppTheme";

export function NativeSettingsGroup({
  children,
  description,
}: {
  children: ReactNode;
  description?: string;
}) {
  useAppTheme();
  const styles = getNativeSettingsGroupStyles();
  return (
    <VStack spacing={SettingsGroupDesign.titleGap} alignment="leading" modifiers={styles.section}>
      <VStack spacing={0} modifiers={styles.outer}>
        <VStack spacing={0} modifiers={styles.inner}>
          {Children.toArray(children).map((row, index) => (
            <VStack key={(row as { key?: string }).key ?? index} spacing={0}>
              {index > 0 ? <Divider modifiers={styles.divider} /> : null}
              {row}
            </VStack>
          ))}
        </VStack>
      </VStack>
      {description ? <Text modifiers={styles.caption}>{description}</Text> : null}
    </VStack>
  );
}
