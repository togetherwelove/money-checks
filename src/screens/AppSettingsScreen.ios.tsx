import { Button, Form, Host, Picker, RNHostView, Section, Text, Toggle, VStack } from "@expo/ui/swift-ui";
import { disabled, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { Linking, StyleSheet, View } from "react-native";

import { CategoryAdditionSettings } from "../components/appSettings/CategoryAdditionSettings";
import { NotificationThresholdField } from "../components/accountScreen/NotificationThresholdField";
import { AppSettingsCopy } from "../constants/appSettings";
import { AppColors } from "../constants/colors";
import { CalendarSummaryBaseDay, CalendarSummaryBaseDayOptions, CalendarSummaryModeOptions, CalendarSummaryModes } from "../constants/calendarSummary";
import { ExpenseTextColorOptions } from "../constants/expenseTextColor";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import { PushNotificationCopy } from "../notifications/config/pushNotificationCopy";
import type { AppSettingsScreenProps } from "./AppSettingsScreen";

const menuPicker = [pickerStyle("menu")];

export function AppSettingsScreen(props: AppSettingsScreenProps) {
  const expenseTextColor = useExpenseTextColor();
  const openNotificationPermission = () => {
    if (props.notificationPermissionState === "default") void props.onRequestNotificationPermission();
    else void Linking.openSettings();
  };
  return <Host style={styles.screen} useViewportSizeMeasurement colorScheme="light" seedColor={AppColors.primary}>
    <Form>
      {props.screenTitle ? <RNHostView matchContents><View>{props.screenTitle}</View></RNHostView> : null}
      <Section>
        <RNHostView matchContents={{ vertical: true }}>
          <CategoryAdditionSettings key={props.activeBookId} bookId={props.activeBookId}
            bookName={props.activeBookName} canAdd={props.canAddCategory} />
        </RNHostView>
      </Section>
      <Section title={AppSettingsCopy.featureSectionTitle} footer={<VStack>
        <Text>{AppSettingsCopy.summaryModeDescription}</Text>
        <Text>{AppSettingsCopy.expenseTextColorDescription}</Text>
        <Text>{AppSettingsCopy.heatmapDescription}</Text>
      </VStack>}>
        <Picker label={AppSettingsCopy.summaryModeTitle} selection={props.calendarSummaryMode}
          onSelectionChange={props.onChangeCalendarSummaryMode} modifiers={menuPicker}>
          {CalendarSummaryModeOptions.map(option => <Text key={option.value} modifiers={[tag(option.value)]}>{option.label}</Text>)}
        </Picker>
        {props.calendarSummaryMode === CalendarSummaryModes.selectedMonth ? <Picker
          label={AppSettingsCopy.summaryBaseDayTitle} selection={props.calendarSummaryBaseDay ?? CalendarSummaryBaseDay.unselected}
          onSelectionChange={day => { if (day >= CalendarSummaryBaseDay.min) props.onChangeCalendarSummaryBaseDay(day); }} modifiers={menuPicker}>
          <Text modifiers={[tag(CalendarSummaryBaseDay.unselected)]}>{AppSettingsCopy.summaryBaseDayPlaceholder}</Text>
          {CalendarSummaryBaseDayOptions.map(option => <Text key={option.value} modifiers={[tag(option.value)]}>{option.label}</Text>)}
        </Picker> : null}
        <Picker label={AppSettingsCopy.expenseTextColorTitle} selection={expenseTextColor.mode}
          onSelectionChange={expenseTextColor.updateMode} modifiers={menuPicker}>
          {ExpenseTextColorOptions.map(option => <Text key={option.value} modifiers={[tag(option.value)]}>{option.label}</Text>)}
        </Picker>
        <Toggle label={`${AppSettingsCopy.heatmapTitle} ${AppSettingsCopy.plusBadge}`}
          isOn={props.isPlusActive && props.isCalendarHeatmapEnabled}
          onIsOnChange={props.onToggleCalendarHeatmap} modifiers={[disabled(!props.isPlusActive)]} />
      </Section>
      <Section title={AppSettingsCopy.pushNotificationSectionTitle}>
        {!props.showNotificationSettings ? <Text>{PushNotificationCopy.permissionUnsupported}</Text>
          : props.notificationPermissionState === "granted" ? <Text>{props.notificationPermissionLabel}</Text>
          : <Button label={props.notificationPermissionLabel} onPress={openNotificationPermission} />}
        {props.notificationStatusMessage ? <Text>{props.notificationStatusMessage}</Text> : null}
      </Section>
      {props.showNotificationSettings ? props.notificationPreferenceGroups.map(group => <Section key={group.id} title={group.title}>
        {group.thresholdSettings ? <RNHostView matchContents={{ vertical: true }}>
          <NotificationThresholdField settings={group.thresholdSettings}
            onChangePeriod={props.onChangeNotificationThresholdPeriod}
            onChangeValue={value => props.onChangeNotificationThreshold(group.thresholdSettings!.selectedKey, value)}
            onToggleEnabled={props.onChangeNotificationThresholdEnabled} />
        </RNHostView> : null}
        {group.items.map(item => <Toggle key={item.type} isOn={item.enabled}
          onIsOnChange={enabled => props.onToggleNotificationPreference(item.eventTypes ?? item.type, enabled)}>
          <Text>{item.label}</Text>
          {item.helpMessage ? <Text>{item.helpMessage}</Text> : null}
        </Toggle>)}
      </Section>) : null}
    </Form>
  </Host>;
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
