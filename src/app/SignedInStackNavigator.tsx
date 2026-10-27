import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import type { ReactNode } from "react";
import { Keyboard } from "react-native";
import type { SettingsMenuLinksProps } from "../components/appSettings/SettingsMenuLinks";

import type { CalendarSummaryMode } from "../constants/calendarSummary";
import { AppColors } from "../constants/colors";
import type { SubscriptionTier } from "../constants/subscription";
import type { SupportPackageIdentifier } from "../constants/support";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { AdTrackingPermissionState } from "../lib/ads/trackingTransparency";
import { getAppScreenLabel } from "../lib/appScreenLabels";
import type { NotificationPermissionState } from "../lib/notifications/pushNotifications";
import type { SupportPackageSnapshot } from "../lib/subscription/supportClient";
import type {
  NotificationEventType,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";
import { AccountScreen } from "../screens/AccountScreen";
import { AllEntriesScreen } from "../screens/AllEntriesScreen";
import { AppSettingsScreen } from "../screens/AppSettingsScreen";
import { ChartScreen } from "../screens/ChartScreen";
import { EntryNativeSheetScreen } from "../screens/EntryNativeSheetScreen";
import { HelpFaqScreen } from "../screens/HelpFaqScreen";
import { HelpScreen } from "../screens/HelpScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { NotificationSettingsScreen } from "../screens/NotificationSettingsScreen";
import { SubscriptionScreen } from "../screens/SubscriptionScreen";
import { SupportContactScreen } from "../screens/SupportContactScreen";
import { SupportScreen } from "../screens/SupportScreen";
import type { InstallmentPrepaymentHandler } from "../types/installmentTransactions";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerEntryDeleteHandler } from "../types/ledgerEntryDeletion";
import type { PrimaryStackScreen, SignedInStackParamList, SignedInStackScreen } from "./signedInNavigation";

const Stack = createNativeStackNavigator<SignedInStackParamList>();
const signedInStackScreenOptions: NativeStackNavigationOptions = {
  animation: "slide_from_right",
  contentStyle: { backgroundColor: AppColors.screenBackground },
  fullScreenGestureEnabled: false,
  freezeOnBlur: false,
  gestureEnabled: true,
  headerShown: true,
  headerShadowVisible: false,
  headerTitleAlign: "center",
  headerBackButtonDisplayMode: "minimal",
  headerTintColor: AppColors.text,
  headerStyle: { backgroundColor: AppColors.screenBackground },
};
const entryNativeSheetOptions: NativeStackNavigationOptions = {
  animation: "slide_from_bottom",
  contentStyle: { backgroundColor: AppColors.transparent },
  gestureEnabled: false,
  headerShown: false,
  presentation: "transparentModal",
};

export type SignedInStackNavigatorProps = {
  menuSections: SettingsMenuLinksProps["sections"];
  onSelectMenuItem: SettingsMenuLinksProps["onSelect"];
  renderLedgerBooks: () => ReactNode;
  initialScreen?: PrimaryStackScreen;
  accountProviderLabel: string;
  adTrackingPermissionState: AdTrackingPermissionState;
  email: string;
  fallbackDisplayName: string;
  calendarSummaryBaseDay: number | null;
  calendarSummaryMode: CalendarSummaryMode;
  hasAvailablePlusPackage: boolean;
  isCalendarHeatmapEnabled: boolean;
  isPlusActive: boolean;
  ledgerState: LedgerScreenState;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationPermissionLabel: string;
  notificationPermissionState: NotificationPermissionState;
  notificationStatusMessage: string | null;
  onChangeCalendarSummaryBaseDay: (day: number) => void;
  onChangeCalendarSummaryMode: (mode: CalendarSummaryMode) => void;
  onChangeNotificationThresholdEnabled: (enabled: boolean) => void;
  onChangeNotificationThresholdPeriod: (period: NotificationThresholdPeriod) => void;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onDeleteSelectedEntry: LedgerEntryDeleteHandler;
  onDiscardEntryDraft: () => void;
  onEditSelectedEntryFromAllEntries: (entry: LedgerEntry) => void;
  onDuplicateEntry: (entry: LedgerEntry) => void;
  onEditSelectedEntryFromCalendar: (entry: LedgerEntry) => void;
  onOpenSubscription: () => void;
  onOpenAdTrackingSettings: () => void;
  onOpenSubscriptionManagement: () => Promise<void>;
  onPurchaseSupportPackage: (identifier: SupportPackageIdentifier) => Promise<void>;
  onPurchasePlus: () => Promise<void>;
  onRequestNotificationPermission: () => Promise<boolean>;
  onRequestAdTrackingPermission: () => void;
  onRestorePurchases: () => Promise<void>;
  onSaveEntry: () => Promise<boolean>;
  onSelectCalendarDate: (isoDate: string) => void;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  onToggleCalendarHeatmap: (isEnabled: boolean) => void;
  onToggleNotificationPreference: (
    eventTypes: NotificationEventType | readonly NotificationEventType[],
    enabled: boolean,
  ) => void;
  plusPriceLabel: string | null;
  renderScreenTitle: (screen: SignedInStackScreen, titleLabel?: string) => ReactNode;
  showAdTrackingPermissionCard: boolean;
  showNotificationSettings: boolean;
  showsBannerAd: boolean;
  supportPackages: SupportPackageSnapshot[];
  supportPackagesLoading: boolean;
  subscriptionTier: SubscriptionTier;
  trackBlockingTask: BusyTaskTracker;
  userId: string;
};

export function SignedInStackNavigator({
  menuSections,
  onSelectMenuItem,
  renderLedgerBooks,
  initialScreen = "calendar",
  accountProviderLabel,
  adTrackingPermissionState,
  email,
  fallbackDisplayName,
  calendarSummaryBaseDay,
  calendarSummaryMode,
  hasAvailablePlusPackage,
  isCalendarHeatmapEnabled,
  isPlusActive,
  ledgerState,
  notificationPreferenceGroups,
  notificationPermissionLabel,
  notificationPermissionState,
  notificationStatusMessage,
  onChangeCalendarSummaryBaseDay,
  onChangeCalendarSummaryMode,
  onChangeNotificationThresholdEnabled,
  onChangeNotificationThresholdPeriod,
  onChangeNotificationThreshold,
  onDeleteSelectedEntry,
  onDiscardEntryDraft,
  onEditSelectedEntryFromAllEntries,
  onDuplicateEntry,
  onEditSelectedEntryFromCalendar,
  onOpenAdTrackingSettings,
  onOpenSubscription,
  onOpenSubscriptionManagement,
  onPurchaseSupportPackage,
  onPurchasePlus,
  onRequestNotificationPermission,
  onRequestAdTrackingPermission,
  onRestorePurchases,
  onSaveEntry,
  onSelectCalendarDate,
  onPrepayInstallmentEntry,
  onToggleCalendarHeatmap,
  onToggleNotificationPreference,
  plusPriceLabel,
  renderScreenTitle,
  showAdTrackingPermissionCard,
  showNotificationSettings,
  showsBannerAd,
  supportPackages,
  supportPackagesLoading,
  subscriptionTier,
  trackBlockingTask,
  userId,
}: SignedInStackNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialScreen}
      screenListeners={{ transitionStart: (event) => {
        if (event.data.closing) Keyboard.dismiss();
      } }}
      screenOptions={({ route }) => {
        const screen = route.name;
        if (screen === "entry-sheet") return entryNativeSheetOptions;
        const isPrimaryScreen = screen === "calendar" || screen === "all-entries" || screen === "charts" || screen === "share" || screen === "app-settings";
        return {
          ...signedInStackScreenOptions,
          animation: isPrimaryScreen ? "none" : signedInStackScreenOptions.animation,
          title: getAppScreenLabel(screen),
          headerTitle: () => renderScreenTitle(screen),

          headerBackVisible: !isPrimaryScreen,
          gestureEnabled: !isPrimaryScreen,
        };
      }}
    >
      <Stack.Screen name="share">{renderLedgerBooks}</Stack.Screen>
      <Stack.Screen name="calendar">
        {() => (
          <HomeScreen
            calendarSummaryMode={calendarSummaryMode}
            isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
            onDeleteSelectedEntry={onDeleteSelectedEntry}
            onDuplicateEntry={onDuplicateEntry}
            onEditSelectedEntry={onEditSelectedEntryFromCalendar}
            onPrepayInstallmentEntry={onPrepayInstallmentEntry}
            onSelectCalendarDate={onSelectCalendarDate}
            screenTitle={() => null}
            showsBannerAd={showsBannerAd}
            state={ledgerState}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="entry-sheet"
        options={entryNativeSheetOptions}
      >
        {({ route }) => (
          <EntryNativeSheetScreen
            autoFocusContent={route.params?.autoFocusContent ?? false}
            currentUserId={userId}
            onDiscard={onDiscardEntryDraft}
            onSaveEntry={onSaveEntry}
            onPrepayInstallmentEntry={onPrepayInstallmentEntry}
            state={ledgerState}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="all-entries">
        {() => (
          <AllEntriesScreen
            activeBook={ledgerState.activeBook}
            onDeleteEntry={onDeleteSelectedEntry}
            onDuplicateEntry={onDuplicateEntry}
            onEditEntry={onEditSelectedEntryFromAllEntries}
            onPrepayInstallmentEntry={onPrepayInstallmentEntry}
            screenTitle={null}
            showsNativeAds={showsBannerAd}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="charts">
        {() => (
          <ChartScreen
            renderScreenTitle={() => null}
            showsBannerAd={showsBannerAd}
            state={ledgerState}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="account">
        {() => (
          <AccountScreen
            accountProviderLabel={accountProviderLabel}
            adTrackingPermissionState={adTrackingPermissionState}
            email={email}
            fallbackDisplayName={fallbackDisplayName}
            onOpenAdTrackingSettings={onOpenAdTrackingSettings}
            onOpenSubscriptionManagement={onOpenSubscriptionManagement}
            onRequestAdTrackingPermission={onRequestAdTrackingPermission}
            onRestorePurchases={onRestorePurchases}
            screenTitle={null}
            showAdTrackingPermissionCard={showAdTrackingPermissionCard}
            subscriptionTier={subscriptionTier}
            trackBlockingTask={trackBlockingTask}
            userId={userId}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="app-settings">
        {() => (
          <AppSettingsScreen
            menuSections={menuSections}
            onSelectMenuItem={onSelectMenuItem}
            activeBookId={ledgerState.activeBook?.id ?? null}
            activeBookName={ledgerState.activeBook?.name ?? ""}
            canAddCategory={Boolean(ledgerState.activeBook) && !ledgerState.isReadOnlyDueToPlanLimit}
            notificationPermissionLabel={notificationPermissionLabel}
            notificationPermissionState={notificationPermissionState}
            notificationPreferenceGroups={notificationPreferenceGroups}
            notificationStatusMessage={notificationStatusMessage}
            calendarSummaryBaseDay={calendarSummaryBaseDay}
            calendarSummaryMode={calendarSummaryMode}
            isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
            onChangeCalendarSummaryMode={onChangeCalendarSummaryMode}
            onChangeCalendarSummaryBaseDay={onChangeCalendarSummaryBaseDay}
            isPlusActive={isPlusActive}
            onChangeNotificationThresholdEnabled={onChangeNotificationThresholdEnabled}
            onChangeNotificationThresholdPeriod={onChangeNotificationThresholdPeriod}
            onChangeNotificationThreshold={onChangeNotificationThreshold}
            onRequestNotificationPermission={onRequestNotificationPermission}
            onOpenSubscription={onOpenSubscription}
            onToggleCalendarHeatmap={onToggleCalendarHeatmap}
            onToggleNotificationPreference={onToggleNotificationPreference}
            screenTitle={null}
            showNotificationSettings={showNotificationSettings}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="notification-settings">
        {() =>
          showNotificationSettings ? (
            <NotificationSettingsScreen
              notificationPermissionLabel={notificationPermissionLabel}
              notificationPermissionState={notificationPermissionState}
              notificationPreferenceGroups={notificationPreferenceGroups}
              notificationStatusMessage={notificationStatusMessage}
              onChangeNotificationThresholdEnabled={onChangeNotificationThresholdEnabled}
              onChangeNotificationThresholdPeriod={onChangeNotificationThresholdPeriod}
              onChangeNotificationThreshold={onChangeNotificationThreshold}
              onRequestNotificationPermission={onRequestNotificationPermission}
              onToggleNotificationPreference={onToggleNotificationPreference}
              screenTitle={null}
            />
          ) : (
            <AccountScreen
              accountProviderLabel={accountProviderLabel}
              adTrackingPermissionState={adTrackingPermissionState}
              email={email}
              fallbackDisplayName={fallbackDisplayName}
              onOpenAdTrackingSettings={onOpenAdTrackingSettings}
              onOpenSubscriptionManagement={onOpenSubscriptionManagement}
              onRequestAdTrackingPermission={onRequestAdTrackingPermission}
              onRestorePurchases={onRestorePurchases}
              screenTitle={null}
              showAdTrackingPermissionCard={showAdTrackingPermissionCard}
              subscriptionTier={subscriptionTier}
              trackBlockingTask={trackBlockingTask}
              userId={userId}
            />
          )
        }
      </Stack.Screen>
      <Stack.Screen name="subscription">
        {() => (
          <SubscriptionScreen
            hasAvailablePlusPackage={hasAvailablePlusPackage}
            isPlusActive={isPlusActive}
            onPurchasePlus={onPurchasePlus}
            onRestorePurchases={onRestorePurchases}
            plusPriceLabel={plusPriceLabel}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="support">
        {() => (
          <SupportScreen
            isLoading={supportPackagesLoading}
            onPurchasePackage={onPurchaseSupportPackage}
            packages={supportPackages}
            screenTitle={null}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="help">
        {({ navigation }) => <HelpScreen screenTitle={null}
          onOpenFaq={() => navigation.navigate("help-faq")} />}
      </Stack.Screen>
      <Stack.Screen name="help-faq">
        {() => <HelpFaqScreen screenTitle={null} />}
      </Stack.Screen>
      <Stack.Screen name="contact-support">
        {() => (
          <SupportContactScreen
            email={email}
            screenTitle={null}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
