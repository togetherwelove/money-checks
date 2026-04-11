import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type {
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../notifications/domain/notificationEvents";
import type { NotificationPreferenceGroup } from "../notifications/preferences/notificationPreferences";
import { AccountScreen } from "../screens/AccountScreen";
import { ChartScreen } from "../screens/ChartScreen";
import { EntryScreen } from "../screens/EntryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { NotificationSettingsScreen } from "../screens/NotificationSettingsScreen";
import { ShareLedgerScreen } from "../screens/ShareLedgerScreen";
import { SupportContactScreen } from "../screens/SupportContactScreen";
import type { LedgerAppScreen } from "../types/app";
import type { LedgerEntry } from "../types/ledger";

type AppScreenRouterProps = {
  activeScreen: LedgerAppScreen;
  email: string;
  fallbackDisplayName: string;
  ledgerState: LedgerScreenState;
  notificationPreferenceGroups: NotificationPreferenceGroup[];
  notificationPermissionLabel: string;
  notificationStatusMessage: string;
  onChangeNotificationThreshold: (key: NotificationThresholdKey, value: string) => void;
  onChangeNotificationThresholdPeriod: (
    key: NotificationThresholdKey,
    period: NotificationThresholdPeriod,
  ) => void;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onOpenCharts: () => void;
  onOpenEntry: () => void;
  onSaveEntry: () => Promise<void>;
  onToggleNotificationPreference: (
    eventType: NotificationPreferenceGroup["items"][number]["type"],
    enabled: boolean,
  ) => void;
  onSelectCalendarDate: (isoDate: string) => void;
  showNotificationSettings: boolean;
  userId: string;
};

export function AppScreenRouter({
  activeScreen,
  email,
  fallbackDisplayName,
  ledgerState,
  notificationPreferenceGroups,
  notificationPermissionLabel,
  notificationStatusMessage,
  onChangeNotificationThreshold,
  onChangeNotificationThresholdPeriod,
  onEditSelectedEntry,
  onOpenCharts,
  onOpenEntry,
  onSaveEntry,
  onToggleNotificationPreference,
  onSelectCalendarDate,
  showNotificationSettings,
  userId,
}: AppScreenRouterProps) {
  if (activeScreen === "account") {
    return (
      <AccountScreen email={email} fallbackDisplayName={fallbackDisplayName} userId={userId} />
    );
  }

  if (activeScreen === "notification-settings") {
    if (!showNotificationSettings) {
      return (
        <AccountScreen email={email} fallbackDisplayName={fallbackDisplayName} userId={userId} />
      );
    }

    return (
      <NotificationSettingsScreen
        notificationPermissionLabel={notificationPermissionLabel}
        notificationPreferenceGroups={notificationPreferenceGroups}
        notificationStatusMessage={notificationStatusMessage}
        onChangeNotificationThreshold={onChangeNotificationThreshold}
        onChangeNotificationThresholdPeriod={onChangeNotificationThresholdPeriod}
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
    return <EntryScreen onSaveEntry={onSaveEntry} state={ledgerState} />;
  }

  return (
    <HomeScreen
      onEditSelectedEntry={onEditSelectedEntry}
      onOpenCharts={onOpenCharts}
      onOpenEntry={onOpenEntry}
      onSelectCalendarDate={onSelectCalendarDate}
      state={ledgerState}
    />
  );
}
