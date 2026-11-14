import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { AppSettingsUi, AppSettingsCopy as Copy } from "../../constants/appSettings";
import { getAppSettingsRowStyles } from "../../constants/appSettingsStyles";
import { getAppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { CompactTextProps, OneLineTextFitProps } from "../../constants/textLayout";
import { getBrandPlusTextStyle } from "../../constants/uiStyles";
import { Feather } from "../AppIcons";

export function CalendarHeatmapSetting({
  isPlusActive,
  isEnabled,
  onToggle,
  onOpenSubscription,
}: {
  isPlusActive: boolean;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onOpenSubscription: () => void;
}) {
  const styles = getStyles();
  useAppTheme();
  return (
    <Pressable
      accessible={!isPlusActive}
      accessibilityLabel={!isPlusActive ? Copy.heatmapSubscriptionAction : undefined}
      accessibilityRole={!isPlusActive ? "button" : undefined}
      disabled={isPlusActive}
      onPress={onOpenSubscription}
      style={({ pressed }) => [styles.content, pressed && getAppSettingsRowStyles().pressed]}
    >
      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <Text {...CompactTextProps} style={styles.title}>
            {Copy.heatmapTitle}
          </Text>
          <View style={styles.badge}>
            {!isPlusActive ? (
              <Feather
                name="lock"
                color={getAppColors().accent}
                size={AppSettingsUi.plusLockIconSize}
              />
            ) : null}
            <Text {...CompactTextProps} style={getBrandPlusTextStyle()}>
              {Copy.plusBadge}
            </Text>
          </View>
        </View>
        <Text {...OneLineTextFitProps} style={getAppSettingsRowStyles().description}>
          {Copy.heatmapDescription}
        </Text>
      </View>
      <View pointerEvents={isPlusActive ? "auto" : "none"}>
        <Switch
          accessibilityLabel={Copy.heatmapTitle}
          disabled={!isPlusActive}
          onValueChange={onToggle}
          trackColor={getTrackColor()}
          value={isPlusActive && isEnabled}
        />
      </View>
    </Pressable>
  );
}

const getTrackColor = createThemeValue(() => ({
  false: getAppColors().border,
  true: getAppColors().primary,
}));
const getStyles = createThemeValue(() =>
  StyleSheet.create({
    content: { flexDirection: "row", alignItems: "center", gap: AppSettingsUi.sectionGap },
    textBlock: getAppSettingsRowStyles().textBlock,
    titleRow: {
      minWidth: 0,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: AppLayout.compactGap,
    },
    title: { ...getAppSettingsRowStyles().title, flexShrink: 1 },
    badge: { flexDirection: "row", alignItems: "center", gap: AppLayout.compactGap },
  }),
);
