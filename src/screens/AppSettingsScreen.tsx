import { SettingsGroup } from "../components/appSettings/SettingsGroup";
import { SettingsRow } from "../components/appSettings/SettingsRow";
import { getSettingsGroupStyles, SettingsGroupDesign } from "../constants/settingsGroupStyles";
import { ThemeSettings, ThemeModeOptions } from "../constants/theme";
import { getThemeMode, setThemeMode } from "../lib/appTheme";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { type ReactNode, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "../components/AppIcons";
import { CalendarSummaryBaseDayPickerModal } from "../components/appSettings/CalendarSummaryBaseDayPickerModal";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { CalendarHeatmapSetting } from "../components/appSettings/CalendarHeatmapSetting";
import { ExpenseTextColorSelector } from "../components/appSettings/ExpenseTextColorSelector";
import { SettingsValueSelector } from "../components/appSettings/SettingsValueSelector";
import { AppSettingsCopy, AppSettingsUi } from "../constants/appSettings";
import { type CalendarSummaryMode, CalendarSummaryModes } from "../constants/calendarSummary";
import { getAppColors } from "../constants/colors";
import { SettingValueActionStyle } from "../constants/uiStyles";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";

export type AppSettingsScreenProps = {
  calendarSummaryBaseDay: number | null;
  calendarSummaryMode: CalendarSummaryMode;
  isCalendarHeatmapEnabled: boolean;
  isPlusActive: boolean;
  onChangeCalendarSummaryBaseDay: (day: number) => void;
  onOpenSubscription: () => void;
  onToggleCalendarHeatmap: (enabled: boolean) => void;
  screenTitle: ReactNode;
};

export function AppSettingsScreen({
  calendarSummaryBaseDay,
  calendarSummaryMode,
  isCalendarHeatmapEnabled,
  isPlusActive,
  onChangeCalendarSummaryBaseDay,
  onOpenSubscription,
  onToggleCalendarHeatmap,
  screenTitle,
}: AppSettingsScreenProps) {
  const styles = getStyles();
  useAppTheme();
  const expenseTextColor = useExpenseTextColor();
  const [isSummaryBaseDayPickerOpen, setIsSummaryBaseDayPickerOpen] = useState(false);
  const isSelectedMonthSummaryMode = calendarSummaryMode === CalendarSummaryModes.selectedMonth;
  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      {screenTitle}
      <View style={styles.sections}>
        <SettingsGroup>
          <SettingsRow
            label={ThemeSettings.title}
            trailing={
              <SettingsValueSelector
                value={getThemeMode()}
                options={ThemeModeOptions}
                onChange={setThemeMode}
              />
            }
          />
        </SettingsGroup>
        {isSelectedMonthSummaryMode ? (
          <SettingsGroup>
            <SettingsRow
              label={AppSettingsCopy.summaryBaseDayTitle}
              onPress={() => setIsSummaryBaseDayPickerOpen(true)}
              trailing={
                <View style={SettingValueActionStyle}>
                  <Text style={getSettingsGroupStyles().value}>
                    {calendarSummaryBaseDay
                      ? `${calendarSummaryBaseDay}일`
                      : AppSettingsCopy.summaryBaseDayPlaceholder}
                  </Text>
                  <Feather
                    color={getAppColors().mutedStrongText}
                    name="chevron-down"
                    size={AppSettingsUi.selectionChevronIconSize}
                  />
                </View>
              }
            />
          </SettingsGroup>
        ) : null}
        <SettingsGroup description={AppSettingsCopy.expenseTextColorDescription}>
          <SettingsRow
            label={AppSettingsCopy.expenseTextColorTitle}
            trailing={
              <ExpenseTextColorSelector
                mode={expenseTextColor.mode}
                onChange={expenseTextColor.updateMode}
              />
            }
          />
        </SettingsGroup>
        <SettingsGroup description={AppSettingsCopy.heatmapDescription}>
          <View style={getSettingsGroupStyles().singleLineField}>
            <CalendarHeatmapSetting
              isPlusActive={isPlusActive}
              isEnabled={isCalendarHeatmapEnabled}
              onToggle={onToggleCalendarHeatmap}
              onOpenSubscription={onOpenSubscription}
            />
          </View>
        </SettingsGroup>
        <AppFooterContentInset />
      </View>
      <CalendarSummaryBaseDayPickerModal
        baseDay={calendarSummaryBaseDay}
        isOpen={isSummaryBaseDayPickerOpen}
        onClose={() => setIsSummaryBaseDayPickerOpen(false)}
        onSelect={(day) => {
          onChangeCalendarSummaryBaseDay(day);
          setIsSummaryBaseDayPickerOpen(false);
        }}
      />
    </KeyboardAwareScrollView>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    sections: getSettingsGroupStyles().sections,
    content: {
      ...getSettingsGroupStyles().page,
      paddingTop: SettingsGroupDesign.pageTopPadding,
      paddingBottom: AppSettingsUi.contentBottomPadding,
    },
    screen: { flex: 1, backgroundColor: getAppColors().screenBackground },
  }),
);
