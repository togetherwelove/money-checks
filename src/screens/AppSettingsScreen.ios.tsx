import { ThemeSettings, ThemeModeOptions } from "../constants/theme";
import { getThemeMode, setThemeMode } from "../lib/appTheme";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { getNativeSettingsStyles } from "../constants/nativeSettingsStyles";
import { Host, List, Picker, RNHostView, Section, Text, VStack } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { StyleSheet, View } from "react-native";
import { CalendarHeatmapSetting } from "../components/appSettings/CalendarHeatmapSetting";
import { AppSettingsCopy } from "../constants/appSettings";
import {
  CalendarSummaryBaseDay,
  CalendarSummaryBaseDayOptions,
  CalendarSummaryModeOptions,
  CalendarSummaryModes,
} from "../constants/calendarSummary";
import { getAppColors } from "../constants/colors";
import { ExpenseTextColorOptions } from "../constants/expenseTextColor";
import { AppLayout } from "../constants/layout";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import type { AppSettingsScreenProps } from "./AppSettingsScreen";

const getRowModifiers = createThemeValue(() => getNativeSettingsStyles().row);
const getMenuPicker = createThemeValue(() => [...getRowModifiers(), pickerStyle("menu")]);
const getSectionTitleModifiers = createThemeValue(() => getNativeSettingsStyles().sectionTitle);
const getTitleModifiers = createThemeValue(() => getNativeSettingsStyles().title);
const getDescriptionModifiers = createThemeValue(() => getNativeSettingsStyles().description);

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
        <Section
          header={
            <Text modifiers={getSectionTitleModifiers()}>
              {AppSettingsCopy.featureSectionTitle}
            </Text>
          }
        >
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
          <Picker
            label={
              <VStack alignment="leading" spacing={AppLayout.compactGap}>
                <Text modifiers={getTitleModifiers()}>{AppSettingsCopy.summaryModeTitle}</Text>
                <Text modifiers={getDescriptionModifiers()}>
                  {AppSettingsCopy.summaryModeDescription}
                </Text>
              </VStack>
            }
            selection={props.calendarSummaryMode}
            onSelectionChange={props.onChangeCalendarSummaryMode}
            modifiers={getMenuPicker()}
          >
            {CalendarSummaryModeOptions.map((option) => (
              <Text key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </Text>
            ))}
          </Picker>
          {props.calendarSummaryMode === CalendarSummaryModes.selectedMonth ? (
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
          ) : null}
          <Picker
            label={
              <VStack alignment="leading" spacing={AppLayout.compactGap}>
                <Text modifiers={getTitleModifiers()}>{AppSettingsCopy.expenseTextColorTitle}</Text>
                <Text modifiers={getDescriptionModifiers()}>
                  {AppSettingsCopy.expenseTextColorDescription}
                </Text>
              </VStack>
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
        </Section>
      </List>
    </Host>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
