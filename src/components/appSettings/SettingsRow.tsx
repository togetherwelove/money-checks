import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { getSettingsGroupStyles } from "../../constants/settingsGroupStyles";
import { useAppTheme } from "../../hooks/useAppTheme";

type SettingsRowProps = {
  label: string;
  labelAlign?: "left" | "right";
  leading?: ReactNode;
  labelAccessory?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

export function SettingsRow({
  label,
  labelAlign = "left",
  leading,
  labelAccessory,
  trailing,
  onPress,
  disabled,
  destructive,
}: SettingsRowProps) {
  useAppTheme();
  const styles = getSettingsGroupStyles();
  const content = (
    <>
      {leading}
      <View style={styles.content}>
        {labelAccessory ? (
          <View style={styles.labelRow}>
            <Text
              style={[
                styles.label,
                styles.accessoryLabel,
                labelAlign === "right" && styles.rightAlignedLabel,
                destructive && styles.destructive,
              ]}
            >
              {label}
            </Text>
            {labelAccessory}
          </View>
        ) : (
          <Text
            style={[
              styles.label,
              labelAlign === "right" && styles.rightAlignedLabel,
              destructive && styles.destructive,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
      {trailing ? (
        <View style={styles.trailing}>
          {typeof trailing === "string" ? <Text style={styles.value}>{trailing}</Text> : trailing}
        </View>
      ) : null}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}
