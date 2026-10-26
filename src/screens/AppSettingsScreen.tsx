import { CalendarSummaryBaseDayPickerModal } from "../components/appSettings/CalendarSummaryBaseDayPickerModal";
import { Feather } from "../components/AppIcons";
import { type ReactNode, useState } from "react";
import { Linking, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { NotificationSettingsCard } from "../components/accountScreen/NotificationSettingsCard";
import { SettingsValueSelector } from "../components/appSettings/SettingsValueSelector";
import { ExpenseTextColorSelector } from "../components/appSettings/ExpenseTextColorSelector";
import { CategoryAdditionSettings } from "../components/appSettings/CategoryAdditionSettings";
import { AppSettingsCopy, AppSettingsUi } from "../constants/appSettings";
import { AppSettingsRowStyles } from "../constants/appSettingsStyles";
import {
  type CalendarSummaryMode,
  CalendarSummaryModeOptions,
  CalendarSummaryModes,
} from "../constants/calendarSummary";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import {
  BrandPlusTextStyle,
  CardTitleTextStyle,
  GroupedSectionStyle,
  ListGroupStyle,
  ResponsivePageContentStyle,
  SettingValueActionStyle,
  SettingValueTextStyle,
  SupportingTextStyle,
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
  onToggleCalendarHeatmap: (isEnabled: boolean) => void;
  onToggleNotificationPreference: (
    eventTypes: NotificationEventType | readonly NotificationEventType[],
    enabled: boolean,
  ) => void;
  screenTitle: ReactNode;
  showNotificationSettings: boolean;
};

export function AppSettingsScreen({
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
  onToggleNotificationPreference,
  screenTitle,
  showNotificationSettings,
}: AppSettingsScreenProps) {
  const expenseTextColor = useExpenseTextColor();
  const isHeatmapSwitchEnabled = isPlusActive && isCalendarHeatmapEnabled;
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
            <View
              style={[
                styles.settingCard,
                styles.lastSettingCard,
                !isPlusActive ? styles.disabledSettingCard : null,
              ]}
            >
              <View style={styles.settingTextBlock}>
                <View style={styles.settingTitleRow}>
                  <Text style={styles.settingTitle}>{AppSettingsCopy.heatmapTitle}</Text>
                  <Text style={styles.plusLabel}>{AppSettingsCopy.plusBadge}</Text>
                </View>
                <Text style={styles.settingDescription}>{AppSettingsCopy.heatmapDescription}</Text>
              </View>
              <Switch
                disabled={!isPlusActive}
                onValueChange={onToggleCalendarHeatmap}
                thumbColor={isHeatmapSwitchEnabled ? AppColors.inverseText : AppColors.surface}
                trackColor={{ false: AppColors.border, true: AppColors.primary }}
                value={isHeatmapSwitchEnabled}
              />
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
    ...ResponsivePageContentStyle,
    paddingBottom: AppSettingsUi.contentBottomPadding,
    paddingHorizontal: AppSettingsUi.contentHorizontalPadding,
    paddingTop: AppLayout.screenTopPadding,
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  section: {
    gap: AppSettingsUi.sectionGap,
  },
  sectionTitle: CardTitleTextStyle,
  disabledSettingCard: AppSettingsRowStyles.disabled,
  plusLabel: {
    ...BrandPlusTextStyle,
    fontSize: 13,
  },
  pressedSettingCard: AppSettingsRowStyles.pressed,
  settingCard: AppSettingsRowStyles.row,
  settingListGroup: ListGroupStyle,
  lastSettingCard: AppSettingsRowStyles.lastRow,
  settingDescription: {
    ...SupportingTextStyle,
  },
  settingTextBlock: AppSettingsRowStyles.textBlock,
  settingTitle: AppSettingsRowStyles.title,
  settingTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minWidth: 0,
  },
  unsupportedCard: GroupedSectionStyle,
  unsupportedText: SupportingTextStyle,
});
