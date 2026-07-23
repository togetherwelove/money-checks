import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { ActionButton } from "../components/ActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { NotificationSettingsCard } from "../components/accountScreen/NotificationSettingsCard";
import { CalendarExpenseColorSelector } from "../components/appSettings/CalendarExpenseColorSelector";
import { AppSettingsCopy } from "../constants/appSettings";
import type { CalendarExpenseColorMode } from "../constants/calendarExpenseColor";
import {
  CalendarSummaryBaseDay,
  CalendarSummaryBaseDayOptions,
  type CalendarSummaryMode,
  CalendarSummaryModeOptions,
  CalendarSummaryModes,
} from "../constants/calendarSummary";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import {
  BrandPlusTextStyle,
  CardTitleTextStyle,
  SupportingTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import type { NotificationPermissionState } from "../lib/notifications/pushNotifications";
import { PushNotificationCopy } from "../notifications/config/pushNotificationCopy";
import type {
  NotificationEventType,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";

type AppSettingsScreenProps = {
  notificationPermissionLabel: string;
  notificationPermissionState: NotificationPermissionState;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationStatusMessage: string | null;
  calendarSummaryBaseDay: number | null;
  calendarSummaryMode: CalendarSummaryMode;
  calendarExpenseColorMode: CalendarExpenseColorMode;
  isCalendarHeatmapEnabled: boolean;
  isPlusActive: boolean;
  onChangeCalendarSummaryBaseDay: (day: number) => void;
  onChangeCalendarExpenseColorMode: (mode: CalendarExpenseColorMode) => void;
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
  showNotificationSettings: boolean;
};

export function AppSettingsScreen({
  notificationPermissionLabel,
  notificationPermissionState,
  notificationPreferenceGroups,
  notificationStatusMessage,
  calendarSummaryBaseDay,
  calendarSummaryMode,
  calendarExpenseColorMode,
  isCalendarHeatmapEnabled,
  isPlusActive,
  onChangeCalendarSummaryBaseDay,
  onChangeCalendarExpenseColorMode,
  onChangeNotificationThresholdEnabled,
  onChangeNotificationThresholdPeriod,
  onChangeNotificationThreshold,
  onChangeCalendarSummaryMode,
  onRequestNotificationPermission,
  onToggleCalendarHeatmap,
  onToggleNotificationPreference,
  showNotificationSettings,
}: AppSettingsScreenProps) {
  const isHeatmapSwitchEnabled = isPlusActive && isCalendarHeatmapEnabled;
  const [isSummaryBaseDayPickerOpen, setIsSummaryBaseDayPickerOpen] = useState(false);
  const [isSummaryModePickerOpen, setIsSummaryModePickerOpen] = useState(false);
  const isSelectedMonthSummaryMode = calendarSummaryMode === CalendarSummaryModes.selectedMonth;
  const selectedSummaryModeOption =
    CalendarSummaryModeOptions.find((option) => option.value === calendarSummaryMode) ??
    CalendarSummaryModeOptions[0];
  const handleOpenNotificationPermission = () => {
    if (notificationPermissionState === "default") {
      void onRequestNotificationPermission();
      return;
    }

    void Linking.openSettings();
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{AppSettingsCopy.featureSectionTitle}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsSummaryModePickerOpen(true)}
          style={({ pressed }) => [styles.settingCard, pressed ? styles.pressedSettingCard : null]}
        >
          <View style={styles.settingTextBlock}>
            <Text style={styles.settingTitle}>{AppSettingsCopy.summaryModeTitle}</Text>
            <Text style={styles.settingDescription}>{AppSettingsCopy.summaryModeDescription}</Text>
          </View>
          <View style={styles.settingValueAction}>
            <Text style={styles.settingValueText}>{selectedSummaryModeOption.label}</Text>
            <Feather color={AppColors.mutedStrongText} name="chevron-down" size={16} />
          </View>
        </Pressable>
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
            <View style={styles.settingValueAction}>
              <Text style={styles.settingValueText}>
                {calendarSummaryBaseDay
                  ? `${calendarSummaryBaseDay}일`
                  : AppSettingsCopy.summaryBaseDayPlaceholder}
              </Text>
              <Feather color={AppColors.mutedStrongText} name="chevron-down" size={16} />
            </View>
          </Pressable>
        ) : null}
        <View style={[styles.settingCard, styles.colorSettingCard]}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.settingTitle}>{AppSettingsCopy.calendarExpenseColorTitle}</Text>
            <Text style={styles.settingDescription}>
              {AppSettingsCopy.calendarExpenseColorDescription}
            </Text>
          </View>
          <CalendarExpenseColorSelector
            mode={calendarExpenseColorMode}
            onChange={onChangeCalendarExpenseColorMode}
          />
        </View>
        <View style={[styles.settingCard, !isPlusActive ? styles.disabledSettingCard : null]}>
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
      <CalendarSummaryModePickerModal
        isOpen={isSummaryModePickerOpen}
        mode={calendarSummaryMode}
        onClose={() => setIsSummaryModePickerOpen(false)}
        onSelect={(nextMode) => {
          onChangeCalendarSummaryMode(nextMode);
          setIsSummaryModePickerOpen(false);
        }}
      />
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

function CalendarSummaryBaseDayPickerModal({
  baseDay,
  isOpen,
  onClose,
  onSelect,
}: {
  baseDay: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (day: number) => void;
}) {
  const [draftDay, setDraftDay] = useState(baseDay ?? CalendarSummaryBaseDay.min);

  useEffect(() => {
    if (isOpen) {
      setDraftDay(baseDay ?? CalendarSummaryBaseDay.min);
    }
  }, [baseDay, isOpen]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <View style={styles.modalOverlay}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{AppSettingsCopy.summaryBaseDayPickerTitle}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.modalCloseText}>
                {AppSettingsCopy.summaryModePickerCloseLabel}
              </Text>
            </Pressable>
          </View>
          <Picker
            itemStyle={styles.pickerItem}
            selectedValue={draftDay}
            onValueChange={(value) => setDraftDay(value as number)}
          >
            {CalendarSummaryBaseDayOptions.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
          <View style={styles.actionRow}>
            <ActionButton
              label={AppSettingsCopy.summaryModePickerConfirmLabel}
              onPress={() => onSelect(draftDay)}
              size="inline"
              variant="primary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CalendarSummaryModePickerModal({
  isOpen,
  mode,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  mode: CalendarSummaryMode;
  onClose: () => void;
  onSelect: (mode: CalendarSummaryMode) => void;
}) {
  const [draftMode, setDraftMode] = useState(mode);

  useEffect(() => {
    if (isOpen) {
      setDraftMode(mode);
    }
  }, [isOpen, mode]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{AppSettingsCopy.summaryModePickerTitle}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.modalCloseText}>
                {AppSettingsCopy.summaryModePickerCloseLabel}
              </Text>
            </Pressable>
          </View>
          <Picker
            itemStyle={styles.pickerItem}
            selectedValue={draftMode}
            onValueChange={(value) => setDraftMode(value as CalendarSummaryMode)}
          >
            {CalendarSummaryModeOptions.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
          <View style={styles.actionRow}>
            <ActionButton
              label={AppSettingsCopy.summaryModePickerConfirmLabel}
              onPress={() => onSelect(draftMode)}
              size="inline"
              variant="primary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: AppLayout.cardGap,
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
  },
  colorSettingCard: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  section: {
    gap: 8,
  },
  sectionTitle: CardTitleTextStyle,
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  disabledSettingCard: {
    opacity: 0.64,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCloseText: {
    color: AppColors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  modalOverlay: {
    backgroundColor: AppColors.overlay,
    flex: 1,
    justifyContent: "center",
  },
  modalSheet: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    gap: 12,
    marginHorizontal: 16,
    padding: 16,
  },
  modalTitle: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  pickerItem: {
    color: AppColors.text,
    fontSize: 18,
  },
  plusLabel: {
    ...BrandPlusTextStyle,
    fontSize: 13,
  },
  pressedSettingCard: {
    backgroundColor: AppColors.surfaceMuted,
  },
  settingCard: {
    ...SurfaceCardStyle,
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  settingDescription: {
    ...SupportingTextStyle,
    fontSize: 11,
  },
  settingTextBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  settingTitle: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  settingTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minWidth: 0,
  },
  settingValueAction: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 4,
  },
  settingValueText: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  unsupportedCard: SurfaceCardStyle,
  unsupportedText: SupportingTextStyle,
});
