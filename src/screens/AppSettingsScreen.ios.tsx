import { NativeSettingsStyles } from "../constants/nativeSettingsStyles";
import { Button, Host, List, Picker, RNHostView, Section, Text, Toggle, VStack } from "@expo/ui/swift-ui";
import { background, fixedSize, font, foregroundStyle, frame, listSectionSpacing, listStyle, pickerStyle, scrollContentBackground, tag } from "@expo/ui/swift-ui/modifiers";
import { Linking, StyleSheet, View } from "react-native";
import { SettingsMenuLinks } from "../components/appSettings/SettingsMenuLinks";

import { NotificationThresholdField } from "../components/accountScreen/NotificationThresholdField";
import { CalendarHeatmapSetting } from "../components/appSettings/CalendarHeatmapSetting";
import { CategoryAdditionSettings } from "../components/appSettings/CategoryAdditionSettings";
import { AppSettingsCopy, AppSettingsUi } from "../constants/appSettings";
import { AppSettingsRowStyles } from "../constants/appSettingsStyles";
import { CalendarSummaryBaseDay, CalendarSummaryBaseDayOptions, CalendarSummaryModeOptions, CalendarSummaryModes } from "../constants/calendarSummary";
import { AppColors } from "../constants/colors";
import { ExpenseTextColorOptions } from "../constants/expenseTextColor";
import { AppLayout } from "../constants/layout";
import { MenuDesign } from "../constants/menuDesign";
import { useExpenseTextColor } from "../contexts/ExpenseTextColorContext";
import { NotificationUiCopy } from "../notifications/config/notificationCopy";
import { PushNotificationCopy } from "../notifications/config/pushNotificationCopy";
import type { AppSettingsScreenProps } from "./AppSettingsScreen";

const listModifiers = [listStyle("plain"), scrollContentBackground("hidden"), background(AppColors.screenBackground), listSectionSpacing("compact")];
const rowModifiers = NativeSettingsStyles.row;
const menuPicker = [...rowModifiers, pickerStyle("menu")];
const sectionTitleModifiers = NativeSettingsStyles.sectionTitle;
const titleModifiers = [font({ size: AppSettingsUi.rowTitleFontSize, weight: "bold" }), foregroundStyle(AppColors.text), frame({ minHeight: MenuDesign.titleLineHeight, alignment: "leading" })];
const descriptionModifiers = [font({ size: AppSettingsRowStyles.description.fontSize }), foregroundStyle(AppColors.mutedText), fixedSize({ horizontal: false, vertical: true }), frame({ minHeight: MenuDesign.descriptionLineHeight, alignment: "leading" })];

export function AppSettingsScreen(props: AppSettingsScreenProps) {
  const expenseTextColor = useExpenseTextColor();
  const openNotificationPermission = () => {
    if (props.notificationPermissionState === "default") void props.onRequestNotificationPermission();
    else void Linking.openSettings();
  };
  const notificationPermissionContent = (
    <VStack alignment="leading" spacing={AppLayout.compactGap}>
      <Text modifiers={titleModifiers}>{NotificationUiCopy.permissionSectionTitle}</Text>
      <Text modifiers={descriptionModifiers}>{props.notificationPermissionLabel}</Text>
    </VStack>
  );
  return <Host style={styles.screen} useViewportSizeMeasurement colorScheme="light" seedColor={AppColors.primary}>
    <List modifiers={listModifiers}>
      {props.screenTitle ? <RNHostView matchContents><View>{props.screenTitle}</View></RNHostView> : null}
      <Section header={<Text modifiers={sectionTitleModifiers}>{AppSettingsCopy.categorySectionTitle}</Text>}>
        <VStack alignment="leading" modifiers={rowModifiers}>
        <RNHostView matchContents={{ vertical: true }}>
          <CategoryAdditionSettings key={props.activeBookId} bookId={props.activeBookId}
            bookName={props.activeBookName} canAdd={props.canAddCategory} showsSectionTitle={false} embeddedInNativeRow />
        </RNHostView>
        </VStack>
      </Section>
      <Section header={<Text modifiers={sectionTitleModifiers}>{AppSettingsCopy.featureSectionTitle}</Text>}>
        <Picker label={
          <VStack alignment="leading" spacing={AppLayout.compactGap}>
            <Text modifiers={titleModifiers}>{AppSettingsCopy.summaryModeTitle}</Text>
            <Text modifiers={descriptionModifiers}>{AppSettingsCopy.summaryModeDescription}</Text>
          </VStack>
        } selection={props.calendarSummaryMode}
          onSelectionChange={props.onChangeCalendarSummaryMode} modifiers={menuPicker}>
          {CalendarSummaryModeOptions.map(option => <Text key={option.value} modifiers={[tag(option.value)]}>{option.label}</Text>)}
        </Picker>
        {props.calendarSummaryMode === CalendarSummaryModes.selectedMonth ? <Picker
          label={<Text modifiers={titleModifiers}>{AppSettingsCopy.summaryBaseDayTitle}</Text>} selection={props.calendarSummaryBaseDay ?? CalendarSummaryBaseDay.unselected}
          onSelectionChange={day => { if (day >= CalendarSummaryBaseDay.min) props.onChangeCalendarSummaryBaseDay(day); }} modifiers={menuPicker}>
          <Text modifiers={[tag(CalendarSummaryBaseDay.unselected)]}>{AppSettingsCopy.summaryBaseDayPlaceholder}</Text>
          {CalendarSummaryBaseDayOptions.map(option => <Text key={option.value} modifiers={[tag(option.value)]}>{option.label}</Text>)}
        </Picker> : null}
        <Picker label={
          <VStack alignment="leading" spacing={AppLayout.compactGap}>
            <Text modifiers={titleModifiers}>{AppSettingsCopy.expenseTextColorTitle}</Text>
            <Text modifiers={descriptionModifiers}>{AppSettingsCopy.expenseTextColorDescription}</Text>
          </VStack>
        } selection={expenseTextColor.mode}
          onSelectionChange={expenseTextColor.updateMode} modifiers={menuPicker}>
          {ExpenseTextColorOptions.map(option => <Text key={option.value} modifiers={[tag(option.value)]}>{option.label}</Text>)}
        </Picker>
        <VStack alignment="leading" modifiers={rowModifiers}>
        <RNHostView matchContents={{ vertical: true }}>
          <CalendarHeatmapSetting isPlusActive={props.isPlusActive}
            isEnabled={props.isCalendarHeatmapEnabled} onToggle={props.onToggleCalendarHeatmap}
            onOpenSubscription={props.onOpenSubscription} />
        </RNHostView>
        </VStack>
      </Section>
      <Section header={<Text modifiers={sectionTitleModifiers}>{AppSettingsCopy.pushNotificationSectionTitle}</Text>}>
        {!props.showNotificationSettings ? <Text modifiers={descriptionModifiers}>{PushNotificationCopy.permissionUnsupported}</Text>
          : props.notificationPermissionState === "granted"
            ? <VStack alignment="leading" modifiers={rowModifiers}>{notificationPermissionContent}</VStack>
            : <Button onPress={openNotificationPermission} modifiers={rowModifiers}>{notificationPermissionContent}</Button>}
        {props.notificationStatusMessage ? <Text modifiers={descriptionModifiers}>{props.notificationStatusMessage}</Text> : null}
      </Section>
      {props.showNotificationSettings ? props.notificationPreferenceGroups.map(group => <Section key={group.id} header={<Text modifiers={sectionTitleModifiers}>{group.title}</Text>}>
        {group.thresholdSettings ? <VStack alignment="leading" modifiers={rowModifiers}><RNHostView matchContents={{ vertical: true }}>
          <NotificationThresholdField embeddedInNativeRow settings={group.thresholdSettings}
            onChangePeriod={props.onChangeNotificationThresholdPeriod}
            onChangeValue={value => props.onChangeNotificationThreshold(group.thresholdSettings!.selectedKey, value)}
            onToggleEnabled={props.onChangeNotificationThresholdEnabled} />
        </RNHostView>
        </VStack> : null}
        {group.items.map(item => <Toggle key={item.type} isOn={item.enabled} modifiers={rowModifiers}
          onIsOnChange={enabled => props.onToggleNotificationPreference(item.eventTypes ?? item.type, enabled)}>
          <VStack alignment="leading" spacing={AppLayout.compactGap}>
            <Text modifiers={titleModifiers}>{item.label}</Text>
            {item.helpMessage ? <Text modifiers={descriptionModifiers}>{item.helpMessage}</Text> : null}
          </VStack>
        </Toggle>)}
      </Section>) : null}
      <SettingsMenuLinks sections={props.menuSections} onSelect={props.onSelectMenuItem} />
    </List>
  </Host>;
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
