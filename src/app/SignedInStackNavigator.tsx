import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { CalendarExpenseColorMode } from "../constants/calendarExpenseColor";
import type { CalendarSummaryMode } from "../constants/calendarSummary";
import type { SubscriptionTier } from "../constants/subscription";
import type { SupportPackageIdentifier } from "../constants/support";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { AdTrackingPermissionState } from "../lib/ads/trackingTransparency";
import type { NotificationPermissionState } from "../lib/notifications/pushNotifications";
import type { SupportPackageSnapshot } from "../lib/subscription/supportClient";
import type {
  NotificationEvent,
  NotificationEventType,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";
import { AccountScreen } from "../screens/AccountScreen";
import { AllEntriesScreen } from "../screens/AllEntriesScreen";
import { AppSettingsScreen } from "../screens/AppSettingsScreen";
import { ChartScreen } from "../screens/ChartScreen";
import { EntryScreen } from "../screens/EntryScreen";
import { HelpScreen } from "../screens/HelpScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { NotificationSettingsScreen } from "../screens/NotificationSettingsScreen";
import { ShareLedgerScreen } from "../screens/ShareLedgerScreen";
import { SubscriptionScreen } from "../screens/SubscriptionScreen";
import { SupportContactScreen } from "../screens/SupportContactScreen";
import { SupportScreen } from "../screens/SupportScreen";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerWidgetSummary } from "../types/widget";
import type { SignedInStackParamList } from "./signedInNavigation";

const Stack = createNativeStackNavigator<SignedInStackParamList>();

type SignedInStackNavigatorProps = {
  accountProviderLabel: string;
  adTrackingPermissionState: AdTrackingPermissionState;
  email: string;
  fallbackDisplayName: string;
  calendarExpenseColorMode: CalendarExpenseColorMode;
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
  onChangeCalendarExpenseColorMode: (mode: CalendarExpenseColorMode) => void;
  onChangeCalendarSummaryBaseDay: (day: number) => void;
  onChangeCalendarSummaryMode: (mode: CalendarSummaryMode) => void;
  onChangeNotificationThresholdEnabled: (enabled: boolean) => void;
  onChangeNotificationThresholdPeriod: (period: NotificationThresholdPeriod) => void;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onBeforeCopyShareCode: () => Promise<void> | void;
  onBeforeSendJoinRequest: () => Promise<void> | void;
  onDeleteSelectedEntry: (entry: LedgerEntry) => Promise<boolean>;
  onEditSelectedEntryFromAllEntries: (entry: LedgerEntry) => void;
  onEditSelectedEntryFromCalendar: (entry: LedgerEntry) => void;
  onOpenSubscription: () => void;
  onOpenAdTrackingSettings: () => void;
  onOpenSubscriptionManagement: () => Promise<void>;
  onPurchaseSupportPackage: (identifier: SupportPackageIdentifier) => Promise<void>;
  onPurchasePlus: () => Promise<void>;
  onRequestNotificationPermission: () => Promise<boolean>;
  onRequestAdTrackingPermission: () => void;
  onRestorePurchases: () => Promise<void>;
  onSaveEntry: () => Promise<void>;
  onSelectCalendarDate: (isoDate: string) => void;
  onToggleCalendarHeatmap: (isEnabled: boolean) => void;
  onSendPendingJoinRequestNotification: () => Promise<void>;
  onSendPushNotificationToBookMembers: (
    bookId: string,
    event: NotificationEvent,
    excludeUserIds: string[],
    widget?: { monthKey: string; summary: LedgerWidgetSummary },
  ) => Promise<void>;
  onSendPushNotificationToUsers: (
    event: NotificationEvent,
    targetUserIds: string[],
    bookId?: string,
  ) => Promise<void>;
  onSettleInstallmentEntry: (entry: LedgerEntry) => Promise<void>;
  onToggleNotificationPreference: (
    eventTypes: NotificationEventType | readonly NotificationEventType[],
    enabled: boolean,
  ) => void;
  plusPriceLabel: string | null;
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
  accountProviderLabel,
  adTrackingPermissionState,
  email,
  fallbackDisplayName,
  calendarExpenseColorMode,
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
  onChangeCalendarExpenseColorMode,
  onChangeCalendarSummaryBaseDay,
  onChangeCalendarSummaryMode,
  onChangeNotificationThresholdEnabled,
  onChangeNotificationThresholdPeriod,
  onChangeNotificationThreshold,
  onBeforeCopyShareCode,
  onBeforeSendJoinRequest,
  onDeleteSelectedEntry,
  onEditSelectedEntryFromAllEntries,
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
  onToggleCalendarHeatmap,
  onSendPendingJoinRequestNotification,
  onSendPushNotificationToBookMembers,
  onSendPushNotificationToUsers,
  onSettleInstallmentEntry,
  onToggleNotificationPreference,
  plusPriceLabel,
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
      initialRouteName="calendar"
      screenOptions={{
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "transparent" },
        fullScreenGestureEnabled: true,
        gestureEnabled: true,
        headerShown: false,
      }}
    >
      <Stack.Screen name="calendar">
        {() => (
          <HomeScreen
            calendarExpenseColorMode={calendarExpenseColorMode}
            calendarSummaryMode={calendarSummaryMode}
            isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
            onDeleteSelectedEntry={onDeleteSelectedEntry}
            onEditSelectedEntry={onEditSelectedEntryFromCalendar}
            onSelectCalendarDate={onSelectCalendarDate}
            showsBannerAd={showsBannerAd}
            state={ledgerState}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="all-entries">
        {() => (
          <AllEntriesScreen
            activeBook={ledgerState.activeBook}
            onDeleteEntry={onDeleteSelectedEntry}
            onEditEntry={onEditSelectedEntryFromAllEntries}
            showsNativeAds={showsBannerAd}
            trackBlockingTask={trackBlockingTask}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="entry">
        {() => (
          <EntryScreen
            currentUserId={userId}
            onSaveEntry={onSaveEntry}
            onSettleInstallmentEntry={onSettleInstallmentEntry}
            showsBannerAd={showsBannerAd}
            state={ledgerState}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="charts">
        {() => <ChartScreen showsBannerAd={showsBannerAd} state={ledgerState} userId={userId} />}
      </Stack.Screen>
      <Stack.Screen name="share">
        {() => (
          <ShareLedgerScreen
            accessibleBooks={ledgerState.accessibleBooks}
            activeBook={ledgerState.activeBook}
            onApproveJoinRequest={ledgerState.approveLedgerJoinRequest}
            onBeforeCopyShareCode={onBeforeCopyShareCode}
            onBeforeSendJoinRequest={onBeforeSendJoinRequest}
            onCreateLedgerBook={ledgerState.createLedgerBook}
            onDeleteActiveLedgerBook={ledgerState.deleteActiveLedgerBook}
            onJoinSharedLedgerBook={ledgerState.joinSharedLedgerBookByCode}
            onLeaveSharedLedgerBook={ledgerState.leaveSharedLedgerBook}
            onOpenSubscription={onOpenSubscription}
            onPreviewJoinSharedLedgerBook={ledgerState.previewSharedLedgerBookJoinByCode}
            onRejectJoinRequest={ledgerState.rejectLedgerJoinRequest}
            onRemoveSharedLedgerMember={ledgerState.removeSharedLedgerMember}
            onRenameActiveLedgerBook={ledgerState.renameActiveLedgerBook}
            onSendPendingJoinRequestNotification={onSendPendingJoinRequestNotification}
            onSendPushNotificationToBookMembers={onSendPushNotificationToBookMembers}
            onSendPushNotificationToUsers={onSendPushNotificationToUsers}
            onSwitchLedgerBook={ledgerState.switchLedgerBook}
            onTransferSharedLedgerOwnership={ledgerState.transferSharedLedgerOwnership}
            pendingJoinRequestCountsByBookId={ledgerState.pendingJoinRequestCountsByBookId}
            pendingJoinRequests={ledgerState.pendingJoinRequests}
            subscriptionTier={subscriptionTier}
            userId={userId}
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
            calendarExpenseColorMode={calendarExpenseColorMode}
            notificationPermissionLabel={notificationPermissionLabel}
            notificationPermissionState={notificationPermissionState}
            notificationPreferenceGroups={notificationPreferenceGroups}
            notificationStatusMessage={notificationStatusMessage}
            calendarSummaryBaseDay={calendarSummaryBaseDay}
            calendarSummaryMode={calendarSummaryMode}
            isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
            onChangeCalendarExpenseColorMode={onChangeCalendarExpenseColorMode}
            onChangeCalendarSummaryMode={onChangeCalendarSummaryMode}
            onChangeCalendarSummaryBaseDay={onChangeCalendarSummaryBaseDay}
            isPlusActive={isPlusActive}
            onChangeNotificationThresholdEnabled={onChangeNotificationThresholdEnabled}
            onChangeNotificationThresholdPeriod={onChangeNotificationThresholdPeriod}
            onChangeNotificationThreshold={onChangeNotificationThreshold}
            onRequestNotificationPermission={onRequestNotificationPermission}
            onToggleCalendarHeatmap={onToggleCalendarHeatmap}
            onToggleNotificationPreference={onToggleNotificationPreference}
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
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="help" component={HelpScreen} />
      <Stack.Screen name="contact-support">
        {() => <SupportContactScreen email={email} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
