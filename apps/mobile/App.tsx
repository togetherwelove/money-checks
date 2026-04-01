import type { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";

import { AppScreenRouter } from "./src/app/AppScreenRouter";
import { AppHeader } from "./src/components/AppHeader";
import { BlockingOverlay } from "./src/components/BlockingOverlay";
import { AppColors } from "./src/constants/colors";
import { AppMessages } from "./src/constants/messages";
import { useLedgerNotifications } from "./src/hooks/useLedgerNotifications";
import { useLedgerScreenState } from "./src/hooks/useLedgerScreenState";
import { useNotificationPermissionAutoRequest } from "./src/hooks/useNotificationPermissionAutoRequest";
import { useSharedLedgerRealtimeNotifications } from "./src/hooks/useSharedLedgerRealtimeNotifications";
import { useSupabaseSession } from "./src/hooks/useSupabaseSession";
import { AuthScreen } from "./src/screens/AuthScreen";
import type { LedgerAppScreen } from "./src/types/app";
import type { LedgerEntry } from "./src/types/ledger";
import { resolveFallbackDisplayName } from "./src/utils/sessionDisplayName";

export default function App() {
  const { isLoading, session } = useSupabaseSession();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
        <Text style={styles.loadingText}>{AppMessages.authLoading}</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
        <AuthScreen />
      </SafeAreaView>
    );
  }

  return <SignedInApp session={session} />;
}

function SignedInApp({ session }: { session: Session }) {
  const [activeScreen, setActiveScreen] = useState<LedgerAppScreen>("calendar");
  const hasTriggeredNotificationAutoRequest = useRef(false);
  const notifications = useLedgerNotifications(session.user.id);
  const ledgerState = useLedgerScreenState(session);
  const notificationPermissionAutoRequest = useNotificationPermissionAutoRequest(
    session.user.id,
    notifications.permissionState,
    notifications.isSupported,
  );

  useSharedLedgerRealtimeNotifications({
    activeBook: ledgerState.activeBook,
    currentUserId: session.user.id,
    entries: ledgerState.entries,
    notifyLedgerEvent: notifications.notifyLedgerEvent,
  });

  const handleOpenCalendar = () => setActiveScreen("calendar");
  const handleOpenEntry = () => setActiveScreen("entry");

  const handleSaveEntry = async () => {
    const currentEntries = ledgerState.entries;
    const savedEntry = await ledgerState.handleSaveEntry();
    if (!savedEntry) {
      return;
    }

    await notifications.notifySavedEntry(savedEntry, currentEntries);
    handleOpenCalendar();
  };

  const handleEditEntryFromCalendar = (entry: LedgerEntry) => {
    ledgerState.handleEditEntry(entry);
    handleOpenEntry();
  };

  useEffect(() => {
    if (
      activeScreen !== "calendar" ||
      !notificationPermissionAutoRequest.shouldAutoRequest ||
      hasTriggeredNotificationAutoRequest.current
    ) {
      return;
    }

    hasTriggeredNotificationAutoRequest.current = true;
    notificationPermissionAutoRequest.completeAutoRequest();
    void notifications.requestNotifications();
  }, [
    activeScreen,
    notificationPermissionAutoRequest.completeAutoRequest,
    notificationPermissionAutoRequest.shouldAutoRequest,
    notifications.requestNotifications,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
      <View style={styles.headerShell}>
        <AppHeader
          activeScreen={activeScreen}
          onOpenMenu={() =>
            setActiveScreen((currentScreen) => (currentScreen === "menu" ? "calendar" : "menu"))
          }
        />
      </View>
      <View style={styles.body}>
        <AppScreenRouter
          activeScreen={activeScreen}
          email={session.user.email ?? ""}
          fallbackDisplayName={resolveFallbackDisplayName(
            session.user.user_metadata,
            session.user.email,
          )}
          ledgerState={ledgerState}
          notificationPreferenceGroups={notifications.preferenceGroups}
          notificationPermissionLabel={notifications.permissionLabel}
          notificationStatusMessage={notifications.statusMessage}
          onCancelEntry={() => {
            ledgerState.resetEditor(ledgerState.selectedDate);
            handleOpenCalendar();
          }}
          onChangeNotificationThresholdPeriod={notifications.updateThresholdPeriod}
          onChangeNotificationThreshold={notifications.updateThresholdValue}
          onEditSelectedEntry={handleEditEntryFromCalendar}
          onOpenAccount={() => setActiveScreen("account")}
          onOpenNotificationSettings={() => setActiveScreen("notification-settings")}
          onOpenEntry={handleOpenEntry}
          onOpenShare={() => {
            setActiveScreen("share");
            if (ledgerState.activeBook?.ownerId === session.user.id) {
              void ledgerState.refreshSharedLedgerBook();
            }
          }}
          onSaveEntry={handleSaveEntry}
          onToggleNotificationPreference={notifications.updatePreference}
          onSelectCalendarDate={(isoDate) => {
            ledgerState.handleSelectDate(isoDate);
            handleOpenCalendar();
          }}
          showNotificationSettings={notifications.showNotificationSettings}
          userId={session.user.id}
        />
      </View>
      {ledgerState.isBusy ? <BlockingOverlay /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  headerShell: {
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  body: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingText: {
    margin: 16,
    color: AppColors.text,
    fontSize: 14,
  },
});
