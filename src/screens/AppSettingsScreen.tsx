import { type ReactNode, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "../components/AppIcons";
import { CalendarSummaryBaseDayPickerModal } from "../components/appSettings/CalendarSummaryBaseDayPickerModal";
import { SettingsMenuLinks, type SettingsMenuLinksProps } from "../components/appSettings/SettingsMenuLinks";
import { MenuStyles } from "../constants/menuStyles";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { NotificationSettingsCard } from "../components/accountScreen/NotificationSettingsCard";
import { CalendarHeatmapSetting } from "../components/appSettings/CalendarHeatmapSetting";
import { CategoryAdditionSettings } from "../components/appSettings/CategoryAdditionSettings";
import { ExpenseTextColorSelector } from "../components/appSettings/ExpenseTextColorSelector";
import { SettingsValueSelector } from "../components/appSettings/SettingsValueSelector";
import { AppSettingsCopy, AppSettingsUi } from "../constants/appSettings";
import { AppSettingsRowStyles } from "../constants/appSettingsStyles";
import {
  type CalendarSummaryMode,
  CalendarSummaryModeOptions,
  CalendarSummaryModes,
} from "../constants/calendarSummary";
import { AppColors } from "../constants/colors";
import {
  GroupedSectionStyle,
  SettingValueActionStyle,
  SettingValueTextStyle,
  SupportingTextStyle
} from "../constants/uiStyles";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import type { NotificationPermissionState } from "../lib/notifications/pushNotifications";
import { PushNotificationCopy } from "../notifications/config/pushNotificationCopy";
import type {
  NotificationEventType,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";

export type AppSettingsScreenProps = {
  menuSections: SettingsMenuLinksProps["sections"];
  onSelectMenuItem: SettingsMenuLinksProps["onSelect"];
  activeBookId: string | null;
  activeBookName: string;
  canAddCategory: boolean;
  notificationPermissionLabel: string;
  notificationPermissionState: NotificationPermissionState;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationStatusMessage: string | null;
  calendarSummaryBaseDay: number | null;
  calendarSummaryMode: CalendarSummaryMode;
  isCalendarHeatmapEnabled: boolean;
  isPlusActive: boolean;
  onChangeCalendarSummaryBaseDay: (day: number) => void;
  onChangeNotificationThresholdEnabled: (enabled: boolean) => void;
  onChangeNotificationThresholdPeriod: (period: NotificationThresholdPeriod) => void;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onChangeCalendarSummaryMode: (mode: CalendarSummaryMode) => void;
  onRequestNotificationPermission: () => Promise<boolean>;
  onOpenSubscription: () => void;
  onToggleCalendarHeatmap: (isEnabled: boolean) => void;
  onToggleNotificationPreference: (
    eventTypes: NotificationEventType | readonly NotificationEventType[],
    enabled: boolean,
  ) => void;
  screenTitle: ReactNode;
  showNotificationSettings: boolean;
};

export function AppSettingsScreen({
  menuSections,
  onSelectMenuItem,
  activeBookId,
  activeBookName,
  canAddCategory,
  notificationPermissionLabel,
  notificationPermissionState,
  notificationPreferenceGroups,
  notificationStatusMessage,
  calendarSummaryBaseDay,
  calendarSummaryMode,
  isCalendarHeatmapEnabled,
  isPlusActive,
  onChangeCalendarSummaryBaseDay,
  onChangeNotificationThresholdEnabled,
  onChangeNotificationThresholdPeriod,
  onChangeNotificationThreshold,
  onChangeCalendarSummaryMode,
  onRequestNotificationPermission,
  onToggleCalendarHeatmap,
  onOpenSubscription,
  onToggleNotificationPreference,
  screenTitle,
  showNotificationSettings,
}: AppSettingsScreenProps) {
  const expenseTextColor = useExpenseTextColor();
  const [isSummaryBaseDayPickerOpen, setIsSummaryBaseDayPickerOpen] = useState(false);
  const isSelectedMonthSummaryMode = calendarSummaryMode === CalendarSummaryModes.selectedMonth;
  const handleOpenNotificationPermission = () => {
    if (notificationPermissionState === "default") {
      void onRequestNotificationPermission();
      return;
    }

    void Linking.openSettings();
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      {screenTitle}
      <View style={styles.sections}>
        <CategoryAdditionSettings key={activeBookId} bookId={activeBookId} bookName={activeBookName} canAdd={canAddCategory} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{AppSettingsCopy.featureSectionTitle}</Text>
          <View style={styles.settingListGroup}>
            <View style={styles.settingCard}>
              <View style={styles.settingTextBlock}>
                <Text style={styles.settingTitle}>{AppSettingsCopy.summaryModeTitle}</Text>
                <Text style={styles.settingDescription}>{AppSettingsCopy.summaryModeDescription}</Text>
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
                  <Text style={SettingValueTextStyle}>
                    {calendarSummaryBaseDay
                      ? `${calendarSummaryBaseDay}일`
                      : AppSettingsCopy.summaryBaseDayPlaceholder}
                  </Text>
                  <Feather
                    color={AppColors.mutedStrongText}
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
                <CalendarHeatmapSetting isPlusActive={isPlusActive}
                  isEnabled={isCalendarHeatmapEnabled} onToggle={onToggleCalendarHeatmap}
                  onOpenSubscription={onOpenSubscription} />
              </View>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{AppSettingsCopy.pushNotificationSectionTitle}</Text>
          {showNotificationSettings ? (
            <NotificationSettingsCard
              onChangeThresholdEnabled={onChangeNotificationThresholdEnabled}
              onChangeThresholdPeriod={onChangeNotificationThresholdPeriod}
              onChangeThresholdValue={onChangeNotificationThreshold}
              onOpenDeviceNotificationSettings={handleOpenNotificationPermission}
              onTogglePreference={onToggleNotificationPreference}
              permissionLabel={notificationPermissionLabel}
              permissionState={notificationPermissionState}
              preferenceGroups={notificationPreferenceGroups}
              statusMessage={notificationStatusMessage}
            />
          ) : (
            <View style={styles.unsupportedCard}>
              <Text style={styles.unsupportedText}>
                {PushNotificationCopy.permissionUnsupported}
              </Text>
            </View>
          )}
        </View>
        <SettingsMenuLinks sections={menuSections} onSelect={onSelectMenuItem} />
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

const styles = StyleSheet.create({
  sections: {
    gap: AppSettingsUi.sectionSpacing,
  },
  content: {
    ...MenuStyles.content,
    paddingBottom: AppSettingsUi.contentBottomPadding,
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  section: {
    gap: AppSettingsUi.sectionGap,
  },
  sectionTitle: MenuStyles.sectionTitle,
  pressedSettingCard: AppSettingsRowStyles.pressed,
  settingCard: AppSettingsRowStyles.row,
  settingListGroup: MenuStyles.group,
  lastSettingCard: AppSettingsRowStyles.lastRow,
  settingDescription: AppSettingsRowStyles.description,
  settingTextBlock: AppSettingsRowStyles.textBlock,
  settingTitle: AppSettingsRowStyles.title,
  unsupportedCard: GroupedSectionStyle,
  unsupportedText: SupportingTextStyle,
});
