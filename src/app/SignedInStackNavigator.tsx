import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { SubscriptionTier } from "../constants/subscription";
import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { NotificationEvent } from "../notifications/domain/notificationEvents";
import type { NotificationThresholdKey } from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";
import { AccountScreen } from "../screens/AccountScreen";
import { AllEntriesScreen } from "../screens/AllEntriesScreen";
import { ChartScreen } from "../screens/ChartScreen";
import { EntryScreen } from "../screens/EntryScreen";
import { HelpScreen } from "../screens/HelpScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { NotificationSettingsScreen } from "../screens/NotificationSettingsScreen";
import { ShareLedgerScreen } from "../screens/ShareLedgerScreen";
import { SubscriptionScreen } from "../screens/SubscriptionScreen";
import { SupportContactScreen } from "../screens/SupportContactScreen";
import { SupportScreen } from "../screens/SupportScreen";
import type { SupportPackageIdentifier } from "../constants/support";
import type { SupportPackageSnapshot } from "../lib/subscription/supportClient";
import type { LedgerEntry, LedgerEntryDraft } from "../types/ledger";
import type { SignedInStackParamList } from "./signedInNavigation";

const Stack = createNativeStackNavigator<SignedInStackParamList>();

type SignedInStackNavigatorProps = {
  accountProviderLabel: string;
  email: string;
  fallbackDisplayName: string;
  hasAvailablePlusPackage: boolean;
  isPlusActive: boolean;
  ledgerState: LedgerScreenState;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationPermissionLabel: string;
  notificationStatusMessage: string;
  onChangeNotificationThresholdEnabled: (key: NotificationThresholdKey, enabled: boolean) => void;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onBeforeCopyShareCode: () => Promise<boolean>;
  onDeleteSelectedEntry: (entry: LedgerEntry) => Promise<void>;
  onEditSelectedEntryFromAllEntries: (entry: LedgerEntry) => void;
  onEditSelectedEntryFromCalendar: (entry: LedgerEntry) => void;
  onOpenCharts: () => void;
  onOpenEntry: () => void;
  onOpenMonthPicker: () => void;
  onOpenSubscription: () => void;
  onOpenSubscriptionManagement: () => Promise<void>;
  onPurchaseSupportPackage: (identifier: SupportPackageIdentifier) => Promise<void>;
  onPurchasePlus: () => Promise<void>;
  onRestorePurchases: () => Promise<void>;
  onSaveEntry: () => Promise<void>;
  onSaveEntryDrafts: (drafts: LedgerEntryDraft[]) => Promise<void>;
  onSelectCalendarDate: (isoDate: string) => void;
  onSendPendingJoinRequestNotification: () => Promise<void>;
  onSendPushNotificationToBookMembers: (
    bookId: string,
    event: NotificationEvent,
    excludeUserIds: string[],
  ) => Promise<void>;
  onSendPushNotificationToUsers: (
    event: NotificationEvent,
    targetUserIds: string[],
    bookId?: string,
  ) => Promise<void>;
  onSettleInstallmentEntry: (entry: LedgerEntry) => Promise<void>;
  onToggleNotificationPreference: (
    eventType: NotificationPreferenceGroup["items"][number]["type"],
    enabled: boolean,
  ) => void;
  plusPriceLabel: string | null;
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
  email,
  fallbackDisplayName,
  hasAvailablePlusPackage,
  isPlusActive,
  ledgerState,
  notificationPreferenceGroups,
  notificationPermissionLabel,
  notificationStatusMessage,
  onChangeNotificationThresholdEnabled,
  onChangeNotificationThreshold,
  onBeforeCopyShareCode,
  onDeleteSelectedEntry,
  onEditSelectedEntryFromAllEntries,
  onEditSelectedEntryFromCalendar,
  onOpenCharts,
  onOpenEntry,
  onOpenMonthPicker,
  onOpenSubscription,
  onOpenSubscriptionManagement,
  onPurchaseSupportPackage,
  onPurchasePlus,
  onRestorePurchases,
  onSaveEntry,
  onSaveEntryDrafts,
  onSelectCalendarDate,
  onSendPendingJoinRequestNotification,
  onSendPushNotificationToBookMembers,
  onSendPushNotificationToUsers,
  onSettleInstallmentEntry,
  onToggleNotificationPreference,
  plusPriceLabel,
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
            onDeleteSelectedEntry={onDeleteSelectedEntry}
            onEditSelectedEntry={onEditSelectedEntryFromCalendar}
            onOpenCharts={onOpenCharts}
            onOpenEntry={onOpenEntry}
            onOpenMonthPicker={onOpenMonthPicker}
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
            onSaveEntries={onSaveEntryDrafts}
            onSaveEntry={onSaveEntry}
            onSettleInstallmentEntry={onSettleInstallmentEntry}
            showsBannerAd={showsBannerAd}
            state={ledgerState}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="charts">
        {() => <ChartScreen showsBannerAd={showsBannerAd} state={ledgerState} />}
      </Stack.Screen>
      <Stack.Screen name="share">
        {() => (
          <ShareLedgerScreen
            activeBook={ledgerState.activeBook}
            onApproveJoinRequest={ledgerState.approveLedgerJoinRequest}
            onBeforeCopyShareCode={onBeforeCopyShareCode}
            onJoinSharedLedgerBook={ledgerState.joinSharedLedgerBookByCode}
            onLeaveSharedLedgerBook={ledgerState.leaveSharedLedgerBook}
            onOpenSubscription={onOpenSubscription}
            onRejectJoinRequest={ledgerState.rejectLedgerJoinRequest}
            onRemoveSharedLedgerMember={ledgerState.removeSharedLedgerMember}
            onRenameActiveLedgerBook={ledgerState.renameActiveLedgerBook}
            onSendPendingJoinRequestNotification={onSendPendingJoinRequestNotification}
            onSendPushNotificationToBookMembers={onSendPushNotificationToBookMembers}
            onSendPushNotificationToUsers={onSendPushNotificationToUsers}
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
            email={email}
            fallbackDisplayName={fallbackDisplayName}
            onOpenSubscriptionManagement={onOpenSubscriptionManagement}
            onRestorePurchases={onRestorePurchases}
            subscriptionTier={subscriptionTier}
            trackBlockingTask={trackBlockingTask}
            userId={userId}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="notification-settings">
        {() =>
          showNotificationSettings ? (
            <NotificationSettingsScreen
              notificationPermissionLabel={notificationPermissionLabel}
              notificationPreferenceGroups={notificationPreferenceGroups}
              notificationStatusMessage={notificationStatusMessage}
              onChangeNotificationThresholdEnabled={onChangeNotificationThresholdEnabled}
              onChangeNotificationThreshold={onChangeNotificationThreshold}
              onToggleNotificationPreference={onToggleNotificationPreference}
            />
          ) : (
            <AccountScreen
              accountProviderLabel={accountProviderLabel}
              email={email}
              fallbackDisplayName={fallbackDisplayName}
              onOpenSubscriptionManagement={onOpenSubscriptionManagement}
              onRestorePurchases={onRestorePurchases}
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
