import { NativeSettingsStyles } from "../constants/nativeSettingsStyles";
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
import { AppColors } from "../constants/colors";
import { ExpenseTextColorOptions } from "../constants/expenseTextColor";
import { AppLayout } from "../constants/layout";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import type { AppSettingsScreenProps } from "./AppSettingsScreen";

const rowModifiers = NativeSettingsStyles.row;
const menuPicker = [...rowModifiers, pickerStyle("menu")];
const sectionTitleModifiers = NativeSettingsStyles.sectionTitle;
const titleModifiers = NativeSettingsStyles.title;
const descriptionModifiers = NativeSettingsStyles.description;

export function AppSettingsScreen(props: AppSettingsScreenProps) {
  const expenseTextColor = useExpenseTextColor();
  return (
    <Host
      style={styles.screen}
      useViewportSizeMeasurement
      colorScheme="light"
      seedColor={AppColors.primary}
    >
      <List modifiers={NativeSettingsStyles.list}>
        {props.screenTitle ? (
          <RNHostView matchContents>
            <View>{props.screenTitle}</View>
          </RNHostView>
        ) : null}
        <Section
          header={
            <Text modifiers={sectionTitleModifiers}>{AppSettingsCopy.featureSectionTitle}</Text>
          }
        >
          <Picker
            label={
              <VStack alignment="leading" spacing={AppLayout.compactGap}>
                <Text modifiers={titleModifiers}>{AppSettingsCopy.summaryModeTitle}</Text>
                <Text modifiers={descriptionModifiers}>
                  {AppSettingsCopy.summaryModeDescription}
                </Text>
              </VStack>
            }
            selection={props.calendarSummaryMode}
            onSelectionChange={props.onChangeCalendarSummaryMode}
            modifiers={menuPicker}
          >
            {CalendarSummaryModeOptions.map((option) => (
              <Text key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </Text>
            ))}
          </Picker>
          {props.calendarSummaryMode === CalendarSummaryModes.selectedMonth ? (
            <Picker
              label={<Text modifiers={titleModifiers}>{AppSettingsCopy.summaryBaseDayTitle}</Text>}
              selection={props.calendarSummaryBaseDay ?? CalendarSummaryBaseDay.unselected}
              onSelectionChange={(day) => {
                if (day >= CalendarSummaryBaseDay.min) props.onChangeCalendarSummaryBaseDay(day);
              }}
              modifiers={menuPicker}
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
                <Text modifiers={titleModifiers}>{AppSettingsCopy.expenseTextColorTitle}</Text>
                <Text modifiers={descriptionModifiers}>
                  {AppSettingsCopy.expenseTextColorDescription}
                </Text>
              </VStack>
            }
            selection={expenseTextColor.mode}
            onSelectionChange={expenseTextColor.updateMode}
            modifiers={menuPicker}
          >
            {ExpenseTextColorOptions.map((option) => (
              <Text key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </Text>
            ))}
          </Picker>
          <VStack alignment="leading" modifiers={rowModifiers}>
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
