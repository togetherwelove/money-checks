import type { BusyTaskTracker } from "../hooks/ledgerScreenState/types";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { NotificationEvent } from "../notifications/domain/notificationEvents";
import type { NotificationThresholdKey } from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";
import { AccountScreen } from "../screens/AccountScreen";
import { ChartScreen } from "../screens/ChartScreen";
import { EntryScreen } from "../screens/EntryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { NotificationSettingsScreen } from "../screens/NotificationSettingsScreen";
import { ShareLedgerScreen } from "../screens/ShareLedgerScreen";
import { SupportContactScreen } from "../screens/SupportContactScreen";
import type { LedgerAppScreen } from "../types/app";
import type { LedgerEntry, LedgerEntryDraft } from "../types/ledger";

type AppScreenRouterProps = {
  activeScreen: LedgerAppScreen;
  accountProviderLabel: string;
  email: string;
  fallbackDisplayName: string;
  ledgerState: LedgerScreenState;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationPermissionLabel: string;
  notificationStatusMessage: string;
  onChangeNotificationThresholdEnabled: (key: NotificationThresholdKey, enabled: boolean) => void;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onDeleteSelectedEntry: (entry: LedgerEntry) => Promise<void>;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onOpenCharts: () => void;
  onOpenEntry: () => void;
  onSaveEntry: () => Promise<void>;
  onSaveEntryDrafts: (drafts: LedgerEntryDraft[]) => Promise<void>;
  onSettleInstallmentEntry: (entry: LedgerEntry) => Promise<void>;
  onSendPendingJoinRequestNotification: (requesterName: string) => Promise<void>;
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
  onToggleNotificationPreference: (
    eventType: NotificationPreferenceGroup["items"][number]["type"],
    enabled: boolean,
  ) => void;
  onSelectCalendarDate: (isoDate: string) => void;
  showNotificationSettings: boolean;
  trackBlockingTask: BusyTaskTracker;
  userId: string;
};

export function AppScreenRouter({
  activeScreen,
  accountProviderLabel,
  email,
  fallbackDisplayName,
  ledgerState,
  notificationPreferenceGroups,
  notificationPermissionLabel,
  notificationStatusMessage,
  onChangeNotificationThresholdEnabled,
  onChangeNotificationThreshold,
  onDeleteSelectedEntry,
  onEditSelectedEntry,
  onOpenCharts,
  onOpenEntry,
  onSaveEntry,
  onSaveEntryDrafts,
  onSettleInstallmentEntry,
  onSendPendingJoinRequestNotification,
  onSendPushNotificationToBookMembers,
  onSendPushNotificationToUsers,
  onToggleNotificationPreference,
  onSelectCalendarDate,
  showNotificationSettings,
  trackBlockingTask,
  userId,
}: AppScreenRouterProps) {
  if (activeScreen === "account") {
    return (
      <AccountScreen
        accountProviderLabel={accountProviderLabel}
        email={email}
        fallbackDisplayName={fallbackDisplayName}
        trackBlockingTask={trackBlockingTask}
        userId={userId}
      />
    );
  }

  if (activeScreen === "notification-settings") {
    if (!showNotificationSettings) {
      return (
        <AccountScreen
          accountProviderLabel={accountProviderLabel}
          email={email}
          fallbackDisplayName={fallbackDisplayName}
          trackBlockingTask={trackBlockingTask}
          userId={userId}
        />
      );
    }

    return (
      <NotificationSettingsScreen
        notificationPermissionLabel={notificationPermissionLabel}
        notificationPreferenceGroups={notificationPreferenceGroups}
        notificationStatusMessage={notificationStatusMessage}
        onChangeNotificationThresholdEnabled={onChangeNotificationThresholdEnabled}
        onChangeNotificationThreshold={onChangeNotificationThreshold}
        onToggleNotificationPreference={onToggleNotificationPreference}
      />
    );
  }

  if (activeScreen === "share") {
    return (
      <ShareLedgerScreen
        activeBook={ledgerState.activeBook}
        onApproveJoinRequest={ledgerState.approveLedgerJoinRequest}
        onJoinSharedLedgerBook={ledgerState.joinSharedLedgerBookByCode}
        onLeaveSharedLedgerBook={ledgerState.leaveSharedLedgerBook}
        onRemoveSharedLedgerMember={ledgerState.removeSharedLedgerMember}
        onRejectJoinRequest={ledgerState.rejectLedgerJoinRequest}
        onSendPendingJoinRequestNotification={onSendPendingJoinRequestNotification}
        onSendPushNotificationToBookMembers={onSendPushNotificationToBookMembers}
        onSendPushNotificationToUsers={onSendPushNotificationToUsers}
        pendingJoinRequests={ledgerState.pendingJoinRequests}
        userId={userId}
      />
    );
  }

  if (activeScreen === "charts") {
    return <ChartScreen state={ledgerState} />;
  }

  if (activeScreen === "contact-support") {
    return <SupportContactScreen email={email} />;
  }

  if (activeScreen === "entry") {
    return (
      <EntryScreen
        onSaveEntries={onSaveEntryDrafts}
        onSaveEntry={onSaveEntry}
        onSettleInstallmentEntry={onSettleInstallmentEntry}
        state={ledgerState}
      />
    );
  }

  return (
    <HomeScreen
      onDeleteSelectedEntry={onDeleteSelectedEntry}
      onEditSelectedEntry={onEditSelectedEntry}
      onOpenCharts={onOpenCharts}
      onOpenEntry={onOpenEntry}
      onSelectCalendarDate={onSelectCalendarDate}
      state={ledgerState}
    />
  );
}
