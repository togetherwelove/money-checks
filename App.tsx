import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { InteractionManager, StatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AppScreenRouter } from "./src/app/AppScreenRouter";
import { AppHeader } from "./src/components/AppHeader";
import { AppMenuDrawer } from "./src/components/AppMenuDrawer";
import { BackToCalendarAction } from "./src/components/BackToCalendarAction";
import { BlockingOverlay } from "./src/components/BlockingOverlay";
import { LedgerBookHeaderAction } from "./src/components/LedgerBookHeaderAction";
import { OnboardingTransitionScreen } from "./src/components/OnboardingTransitionScreen";
import { ScreenSlideTransition } from "./src/components/ScreenSlideTransition";
import { NativeYearPickerModal } from "./src/components/calendarPicker/NativeYearPickerModal";
import { AppColors } from "./src/constants/colors";
import { AppMessages } from "./src/constants/messages";
import { useAnnualLedgerReportAction } from "./src/hooks/useAnnualLedgerReportAction";
import { useAuthOnboarding } from "./src/hooks/useAuthOnboarding";
import { useLedgerNotifications } from "./src/hooks/useLedgerNotifications";
import { useLedgerScreenState } from "./src/hooks/useLedgerScreenState";
import { useSharedLedgerRealtimeNotifications } from "./src/hooks/useSharedLedgerRealtimeNotifications";
import { useSupabaseSession } from "./src/hooks/useSupabaseSession";
import { getAppHeaderTitle, showsCalendarReturnAction } from "./src/lib/appHeaderTitle";
import { appPlatform } from "./src/lib/appPlatform";
import { buildAppMenuItems } from "./src/lib/menuItems";
import { updateOwnProfileDisplayName } from "./src/lib/profiles";
import { AuthScreen } from "./src/screens/AuthScreen";
import { NicknameSetupScreen } from "./src/screens/NicknameSetupScreen";
import { PermissionOnboardingScreen } from "./src/screens/PermissionOnboardingScreen";
import type { LedgerAppScreen } from "./src/types/app";
import type { LedgerEntry } from "./src/types/ledger";
import { parseIsoDate, toIsoDate } from "./src/utils/calendar";
import { resolveFallbackDisplayName } from "./src/utils/sessionDisplayName";

export default function App() {
  const { errorMessage, isLoading, session } = useSupabaseSession();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <RootSiblingParent>
          {isLoading ? (
            <SafeAreaView style={styles.container}>
              <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
              <Text style={styles.loadingText}>{AppMessages.authLoading}</Text>
            </SafeAreaView>
          ) : !session ? (
            <SafeAreaView style={styles.container}>
              <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
              <AuthScreen initialErrorMessage={errorMessage} />
            </SafeAreaView>
          ) : (
            <SignedInApp session={session} />
          )}
        </RootSiblingParent>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function SignedInApp({ session }: { session: Session }) {
  const [activeScreen, setActiveScreen] = useState<LedgerAppScreen>("calendar");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNicknameScreenReady, setIsNicknameScreenReady] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const fallbackDisplayName = resolveFallbackDisplayName(
    session.user.user_metadata,
    session.user.email,
  );
  const notifications = useLedgerNotifications(session.user.id);
  const ledgerState = useLedgerScreenState(session);
  const annualReport = useAnnualLedgerReportAction({
    activeBook: ledgerState.activeBook,
    currentUserId: session.user.id,
    visibleMonth: ledgerState.visibleMonth,
  });
  const authOnboarding = useAuthOnboarding({
    fallbackDisplayName,
    isNotificationSupported: notifications.isSupported,
    permissionState: notifications.permissionState,
    userId: session.user.id,
  });

  useSharedLedgerRealtimeNotifications({
    activeBook: ledgerState.activeBook,
    currentUserId: session.user.id,
    entries: ledgerState.entries,
    notifyLedgerEvent: notifications.notifyLedgerEvent,
  });

  const handleOpenCalendar = () => setActiveScreen("calendar");
  const handleBackToCalendar = () => {
    if (activeScreen === "entry") {
      ledgerState.resetEditor(ledgerState.selectedDate);
    }
    setActiveScreen("calendar");
  };
  const handleToggleCharts = () =>
    setActiveScreen((currentScreen) => (currentScreen === "charts" ? "calendar" : "charts"));
  const handleOpenEntry = () => setActiveScreen("entry");
  const menuItems = buildAppMenuItems(notifications.showNotificationSettings);
  const handleOpenYearPicker = () => {
    if (activeScreen !== "calendar") {
      return;
    }

    if (appPlatform.usesAndroidDatePickerDialog) {
      DateTimePickerAndroid.open({
        display: "spinner",
        mode: "date",
        value: parseIsoDate(ledgerState.selectedDate),
        onChange: (_event, nextDate) => {
          if (!nextDate) {
            return;
          }

          ledgerState.handleSelectDate(toIsoDate(nextDate));
        },
      });
      return;
    }

    setIsYearPickerOpen(true);
  };

  const handleCompleteNicknameOnboarding = async (displayName: string) => {
    try {
      const savedDisplayName = await updateOwnProfileDisplayName(session.user.id, displayName);
      authOnboarding.completeNicknameOnboarding(savedDisplayName || displayName);
      return true;
    } catch {
      return false;
    }
  };

  const handleCompletePermissionOnboarding = async () => {
    await notifications.requestNotifications();
    authOnboarding.completePermissionOnboarding();
  };

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
    if (authOnboarding.step !== "nickname") {
      setIsNicknameScreenReady(false);
      return;
    }

    let timerId: ReturnType<typeof setTimeout> | null = null;
    const interactionTask = InteractionManager.runAfterInteractions(() => {
      timerId = setTimeout(() => {
        setIsNicknameScreenReady(true);
      }, 220);
    });

    return () => {
      interactionTask.cancel();
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [authOnboarding.step]);

  if (authOnboarding.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
        <Text style={styles.loadingText}>{AppMessages.authLoading}</Text>
      </SafeAreaView>
    );
  }

  if (authOnboarding.step === "nickname") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
        {isNicknameScreenReady ? (
          <NicknameSetupScreen onSubmit={handleCompleteNicknameOnboarding} />
        ) : (
          <OnboardingTransitionScreen />
        )}
      </SafeAreaView>
    );
  }

  if (authOnboarding.step === "notification-permission") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
        <PermissionOnboardingScreen
          onAllow={handleCompletePermissionOnboarding}
          onSkip={authOnboarding.completePermissionOnboarding}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.surface} />
      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.headerShell}>
          <AppHeader
            isMenuOpen={isMenuOpen}
            leadingAction={
              showsCalendarReturnAction(activeScreen) ? (
                <BackToCalendarAction onPress={handleBackToCalendar} />
              ) : annualReport.bookName ? (
                <LedgerBookHeaderAction
                  label={annualReport.bookName}
                  onPress={() => {
                    void annualReport.handleDownloadReport();
                  }}
                />
              ) : null
            }
            onPressCenterLabel={activeScreen === "calendar" ? handleOpenYearPicker : null}
            showsCenterLabelIndicator={activeScreen === "calendar"}
            titleLabel={getAppHeaderTitle(activeScreen)}
            yearLabel={
              activeScreen === "calendar" ? String(ledgerState.visibleMonth.getFullYear()) : null
            }
            onOpenMenu={() => setIsMenuOpen((currentValue) => !currentValue)}
          />
        </View>
      </SafeAreaView>
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.bodySafeArea}>
        <View style={styles.body}>
          <ScreenSlideTransition screenKey={activeScreen}>
            <AppScreenRouter
              activeScreen={activeScreen}
              email={session.user.email ?? ""}
              fallbackDisplayName={fallbackDisplayName}
              ledgerState={ledgerState}
              notificationPreferenceGroups={notifications.preferenceGroups}
              notificationPermissionLabel={notifications.permissionLabel}
              notificationStatusMessage={notifications.statusMessage}
              onChangeNotificationThresholdPeriod={notifications.updateThresholdPeriod}
              onChangeNotificationThreshold={notifications.updateThresholdValue}
              onEditSelectedEntry={handleEditEntryFromCalendar}
              onOpenCharts={handleToggleCharts}
              onOpenEntry={handleOpenEntry}
              onSaveEntry={handleSaveEntry}
              onToggleNotificationPreference={notifications.updatePreference}
              onSelectCalendarDate={(isoDate) => {
                ledgerState.handleSelectDate(isoDate);
                handleOpenCalendar();
              }}
              showNotificationSettings={notifications.showNotificationSettings}
              userId={session.user.id}
            />
          </ScreenSlideTransition>
        </View>
        <AppMenuDrawer
          isOpen={isMenuOpen}
          items={menuItems}
          onClose={() => setIsMenuOpen(false)}
          onSelectItem={(targetScreen) => {
            setIsMenuOpen(false);
            if (targetScreen === "calendar") {
              ledgerState.resetEditor(ledgerState.selectedDate);
            }
            if (targetScreen === "share" && ledgerState.activeBook?.ownerId === session.user.id) {
              void ledgerState.refreshSharedLedgerBook();
            }
            setActiveScreen(targetScreen);
          }}
        />
        <NativeYearPickerModal
          isOpen={activeScreen === "calendar" && appPlatform.isIOS && isYearPickerOpen}
          onClose={() => setIsYearPickerOpen(false)}
          onSelectDate={ledgerState.handleSelectDate}
          selectedDate={ledgerState.selectedDate}
        />
      </SafeAreaView>
      {ledgerState.isBusy || annualReport.isDownloading ? <BlockingOverlay /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  headerSafeArea: {
    backgroundColor: AppColors.surface,
  },
  headerShell: {
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  bodySafeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
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
