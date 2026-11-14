import { ThemeSettings, ThemeModeOptions } from "../constants/theme";
import { getThemeMode, setThemeMode } from "../lib/appTheme";
import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "../components/AppIcons";
import { CalendarSummaryBaseDayPickerModal } from "../components/appSettings/CalendarSummaryBaseDayPickerModal";
import { getMenuStyles } from "../constants/menuStyles";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { CalendarHeatmapSetting } from "../components/appSettings/CalendarHeatmapSetting";
import { ExpenseTextColorSelector } from "../components/appSettings/ExpenseTextColorSelector";
import { SettingsValueSelector } from "../components/appSettings/SettingsValueSelector";
import { AppSettingsCopy, AppSettingsUi } from "../constants/appSettings";
import { getAppSettingsRowStyles } from "../constants/appSettingsStyles";
import {
  type CalendarSummaryMode,
  CalendarSummaryModeOptions,
  CalendarSummaryModes,
} from "../constants/calendarSummary";
import { getAppColors } from "../constants/colors";
import { SettingValueActionStyle, getSettingValueTextStyle } from "../constants/uiStyles";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";

export type AppSettingsScreenProps = {
  calendarSummaryBaseDay: number | null;
  calendarSummaryMode: CalendarSummaryMode;
  isCalendarHeatmapEnabled: boolean;
  isPlusActive: boolean;
  onChangeCalendarSummaryBaseDay: (day: number) => void;
  onChangeCalendarSummaryMode: (mode: CalendarSummaryMode) => void;
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
  onChangeCalendarSummaryMode,
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{AppSettingsCopy.featureSectionTitle}</Text>
          <View style={styles.settingListGroup}>
            <View style={styles.settingCard}>
              <View style={styles.settingTextBlock}>
                <Text style={styles.settingTitle}>{ThemeSettings.title}</Text>
              </View>
              <SettingsValueSelector
                value={getThemeMode()}
                options={ThemeModeOptions}
                onChange={setThemeMode}
              />
            </View>
            <View style={styles.settingCard}>
              <View style={styles.settingTextBlock}>
                <Text style={styles.settingTitle}>{AppSettingsCopy.summaryModeTitle}</Text>
                <Text style={styles.settingDescription}>
                  {AppSettingsCopy.summaryModeDescription}
                </Text>
              </View>
              <SettingsValueSelector
                value={calendarSummaryMode}
                options={CalendarSummaryModeOptions}
                onChange={onChangeCalendarSummaryMode}
              />
            </View>
            {isSelectedMonthSummaryMode ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsSummaryBaseDayPickerOpen(true)}
                style={({ pressed }) => [
                  styles.settingCard,
                  pressed ? styles.pressedSettingCard : null,
                ]}
              >
                <View style={styles.settingTextBlock}>
                  <Text style={styles.settingTitle}>{AppSettingsCopy.summaryBaseDayTitle}</Text>
                </View>
                <View style={SettingValueActionStyle}>
                  <Text style={getSettingValueTextStyle()}>
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
              </Pressable>
            ) : null}
            <View style={styles.settingCard}>
              <View style={styles.settingTextBlock}>
                <Text style={styles.settingTitle}>{AppSettingsCopy.expenseTextColorTitle}</Text>
                <Text style={styles.settingDescription}>
                  {AppSettingsCopy.expenseTextColorDescription}
                </Text>
              </View>
              <ExpenseTextColorSelector
                mode={expenseTextColor.mode}
                onChange={expenseTextColor.updateMode}
              />
            </View>
            <View style={[styles.settingCard, styles.lastSettingCard]}>
              <View style={styles.settingTextBlock}>
                <CalendarHeatmapSetting
                  isPlusActive={isPlusActive}
                  isEnabled={isCalendarHeatmapEnabled}
                  onToggle={onToggleCalendarHeatmap}
                  onOpenSubscription={onOpenSubscription}
                />
              </View>
            </View>
          </View>
        </View>
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
    sections: {
      gap: AppSettingsUi.sectionSpacing,
    },
    content: {
      ...getMenuStyles().content,
      paddingBottom: AppSettingsUi.contentBottomPadding,
    },
    screen: {
      flex: 1,
      backgroundColor: getAppColors().screenBackground,
    },
    section: {
      gap: AppSettingsUi.sectionGap,
    },
    sectionTitle: getMenuStyles().sectionTitle,
    pressedSettingCard: getAppSettingsRowStyles().pressed,
    settingCard: getAppSettingsRowStyles().row,
    settingListGroup: getMenuStyles().group,
    lastSettingCard: getAppSettingsRowStyles().lastRow,
    settingDescription: getAppSettingsRowStyles().description,
    settingTextBlock: getAppSettingsRowStyles().textBlock,
    settingTitle: getAppSettingsRowStyles().title,
  }),
);
