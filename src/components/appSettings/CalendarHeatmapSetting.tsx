import { Pressable,StyleSheet,Switch,Text,View } from "react-native";
import { AppSettingsUi,AppSettingsCopy as Copy } from "../../constants/appSettings";
import { AppSettingsRowStyles as Row } from "../../constants/appSettingsStyles";
import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { CompactTextProps,OneLineTextFitProps } from "../../constants/textLayout";
import { BrandPlusTextStyle } from "../../constants/uiStyles";
import { Feather } from "../AppIcons";

export function CalendarHeatmapSetting({ isPlusActive, isEnabled, onToggle, onOpenSubscription }: {
  isPlusActive: boolean;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onOpenSubscription: () => void;
}) {
  return (
    <Pressable
      accessible={!isPlusActive}
      accessibilityLabel={!isPlusActive ? Copy.heatmapSubscriptionAction : undefined}
      accessibilityRole={!isPlusActive ? "button" : undefined}
      disabled={isPlusActive}
      onPress={onOpenSubscription}
      style={({ pressed }) => [styles.content, pressed && Row.pressed]}
    >
      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <Text {...CompactTextProps} style={styles.title}>{Copy.heatmapTitle}</Text>
          <View style={styles.badge}>
            {!isPlusActive ? <Feather name="lock" color={AppColors.accent} size={AppSettingsUi.plusLockIconSize} /> : null}
            <Text {...CompactTextProps} style={BrandPlusTextStyle}>{Copy.plusBadge}</Text>
          </View>
        </View>
        <Text {...OneLineTextFitProps} style={Row.description}>{Copy.heatmapDescription}</Text>
      </View>
      <View pointerEvents={isPlusActive ? "auto" : "none"}>
        <Switch
          accessibilityLabel={Copy.heatmapTitle}
          disabled={!isPlusActive}
          onValueChange={onToggle}
          trackColor={trackColor}
          value={isPlusActive && isEnabled}
        />
      </View>
    </Pressable>
  );
}

const trackColor = { false: AppColors.border, true: AppColors.primary };
const styles = StyleSheet.create({
  content: { flexDirection: "row", alignItems: "center", gap: AppSettingsUi.sectionGap },
  textBlock: Row.textBlock,
  titleRow: { minWidth: 0, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: AppLayout.compactGap },
  title: { ...Row.title, flexShrink: 1 },
  badge: { flexDirection: "row", alignItems: "center", gap: AppLayout.compactGap },
});
