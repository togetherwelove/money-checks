import { AppTextBreakProps } from "../../constants/textLayout";
import { Children, type ReactNode, useMemo } from "react";
import { Text, View } from "react-native";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { useAppTheme } from "../../hooks/useAppTheme";

type SettingsGroupProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  hasLeadingIcons?: boolean;
  leadingAccessoryWidth?: number;
};

export function SettingsGroup({
  title,
  description,
  children,
  hasLeadingIcons = false,
  leadingAccessoryWidth = SettingsGroupDesign.iconSize,
}: SettingsGroupProps) {
  useAppTheme();
  const styles = getSettingsGroupStyles();
  const rows = Children.toArray(children);
  const dividerInset = useMemo(
    () => ({
      marginStart:
        SettingsGroupDesign.horizontalPadding +
        (hasLeadingIcons ? leadingAccessoryWidth + SettingsGroupDesign.contentGap : 0),
    }),
    [hasLeadingIcons, leadingAccessoryWidth],
  );
  return (
    <View style={styles.section}>
      {title ? (
        <Text accessibilityRole="header" style={styles.heading}>
          {title}
        </Text>
      ) : null}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <View key={(row as { key?: string }).key ?? index}>
            {index > 0 ? <View accessible={false} style={[styles.divider, dividerInset]} /> : null}
            {row}
          </View>
        ))}
      </View>
      {description ? (
        <Text {...AppTextBreakProps} style={styles.caption}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}
