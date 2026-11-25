import { NativeSettingsGroup } from "../components/appSettings/NativeSettingsGroup.ios";
import { getNativeSettingsGroupStyles } from "../constants/nativeSettingsGroupStyles.ios";
import { ThemeSettings, ThemeModeOptions } from "../constants/theme";
import { getThemeMode, setThemeMode } from "../lib/appTheme";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { getNativeSettingsStyles } from "../constants/nativeSettingsStyles";
import { Host, List, Picker, RNHostView, Text, VStack } from "@expo/ui/swift-ui";
import { pickerStyle, tag, tint } from "@expo/ui/swift-ui/modifiers";
import { StyleSheet, View } from "react-native";
import { CalendarHeatmapSetting } from "../components/appSettings/CalendarHeatmapSetting";
import { AppSettingsCopy } from "../constants/appSettings";
import {
  CalendarSummaryBaseDay,
  CalendarSummaryBaseDayOptions,
  CalendarSummaryModes,
} from "../constants/calendarSummary";
import { getAppColors } from "../constants/colors";
import { ExpenseTextColorOptions } from "../constants/expenseTextColor";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import type { AppSettingsScreenProps } from "./AppSettingsScreen";

const getRowModifiers = createThemeValue(() => getNativeSettingsGroupStyles().row);
const getMenuPicker = createThemeValue(() => [
  ...getRowModifiers(),
  pickerStyle("menu"),
  tint(getAppColors().mutedText),
]);
const getTitleModifiers = createThemeValue(() => getNativeSettingsGroupStyles().title);

export function AppSettingsScreen(props: AppSettingsScreenProps) {
  const colorScheme = useAppTheme();
  const expenseTextColor = useExpenseTextColor();
  return (
    <Host
      style={styles.screen}
      useViewportSizeMeasurement
      colorScheme={colorScheme}
      seedColor={getAppColors().primary}
    >
      <List modifiers={getNativeSettingsStyles().list}>
        {props.screenTitle ? (
          <RNHostView matchContents>
            <View>{props.screenTitle}</View>
          </RNHostView>
        ) : null}
        <VStack modifiers={getNativeSettingsStyles().menuGroup}>
          <NativeSettingsGroup>
            <Picker
              label={ThemeSettings.title}
              selection={getThemeMode()}
              onSelectionChange={setThemeMode}
              modifiers={getMenuPicker()}
            >
              {ThemeModeOptions.map((option) => (
                <Text key={option.value} modifiers={[tag(option.value)]}>
                  {option.label}
                </Text>
              ))}
            </Picker>
          </NativeSettingsGroup>
        </VStack>
        {props.calendarSummaryMode === CalendarSummaryModes.selectedMonth ? (
          <VStack modifiers={getNativeSettingsStyles().menuGroup}>
            <NativeSettingsGroup>
              <Picker
                label={
                  <Text modifiers={getTitleModifiers()}>{AppSettingsCopy.summaryBaseDayTitle}</Text>
                }
                selection={props.calendarSummaryBaseDay ?? CalendarSummaryBaseDay.unselected}
                onSelectionChange={(day) => {
                  if (day >= CalendarSummaryBaseDay.min) props.onChangeCalendarSummaryBaseDay(day);
                }}
                modifiers={getMenuPicker()}
              >
                <Text modifiers={[tag(CalendarSummaryBaseDay.unselected)]}>
                  {AppSettingsCopy.summaryBaseDayPlaceholder}
                </Text>
                {CalendarSummaryBaseDayOptions.map((option) => (
                  <Text key={option.value} modifiers={[tag(option.value)]}>
                    {option.label}
                  </Text>
                ))}
              </Picker>
            </NativeSettingsGroup>
          </VStack>
        ) : null}
        <VStack modifiers={getNativeSettingsStyles().menuGroup}>
          <NativeSettingsGroup description={AppSettingsCopy.expenseTextColorDescription}>
            <Picker
              label={
                <Text modifiers={getTitleModifiers()}>{AppSettingsCopy.expenseTextColorTitle}</Text>
              }
              selection={expenseTextColor.mode}
              onSelectionChange={expenseTextColor.updateMode}
              modifiers={getMenuPicker()}
            >
              {ExpenseTextColorOptions.map((option) => (
                <Text key={option.value} modifiers={[tag(option.value)]}>
                  {option.label}
                </Text>
              ))}
            </Picker>
          </NativeSettingsGroup>
        </VStack>
        <VStack modifiers={getNativeSettingsStyles().menuGroup}>
          <NativeSettingsGroup description={AppSettingsCopy.heatmapDescription}>
            <VStack alignment="leading" modifiers={getRowModifiers()}>
              <RNHostView matchContents={{ vertical: true }}>
                <CalendarHeatmapSetting
                  isPlusActive={props.isPlusActive}
                  isEnabled={props.isCalendarHeatmapEnabled}
                  onToggle={props.onToggleCalendarHeatmap}
                  onOpenSubscription={props.onOpenSubscription}
                />
              </RNHostView>
            </VStack>
          </NativeSettingsGroup>
        </VStack>
      </List>
    </Host>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
