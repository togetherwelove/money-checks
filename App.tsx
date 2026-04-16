import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { InteractionManager, StatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AppScreenRouter } from "./src/app/AppScreenRouter";
import { AllEntriesAction } from "./src/components/AllEntriesAction";
import { AppHeader } from "./src/components/AppHeader";
import { AppMenuDrawer } from "./src/components/AppMenuDrawer";
import { BackToCalendarAction } from "./src/components/BackToCalendarAction";
import { BlockingOverlay } from "./src/components/BlockingOverlay";
import { LedgerBookHeaderAction } from "./src/components/LedgerBookHeaderAction";
import { OnboardingTransitionScreen } from "./src/components/OnboardingTransitionScreen";
import { ScreenSlideTransition } from "./src/components/ScreenSlideTransition";
import { AnnualReportRangePickerModal } from "./src/components/annualReport/AnnualReportRangePickerModal";
import { NativeYearPickerModal } from "./src/components/calendarPicker/NativeYearPickerModal";
import { AllEntriesCopy } from "./src/constants/allEntries";
import { AppColors } from "./src/constants/colors";
import { EntryRegistrationCopy } from "./src/constants/entryRegistration";
import { AppMessages } from "./src/constants/messages";
import { useAnnualLedgerReportAction } from "./src/hooks/useAnnualLedgerReportAction";
import { useAuthOnboarding } from "./src/hooks/useAuthOnboarding";
import { useLedgerNotifications } from "./src/hooks/useLedgerNotifications";
import { useLedgerScreenState } from "./src/hooks/useLedgerScreenState";
import { useSupabaseSession } from "./src/hooks/useSupabaseSession";
import { getAppHeaderTitle, showsCalendarReturnAction } from "./src/lib/appHeaderTitle";
import { appPlatform } from "./src/lib/appPlatform";
import { resolveSessionAuthProviderLabel } from "./src/lib/authProvider";
import { logAppError } from "./src/lib/logAppError";
import { buildAppMenuItems } from "./src/lib/menuItems";
import { showNativeToast } from "./src/lib/nativeToast";
import { fetchOwnProfileDisplayName, updateOwnProfileDisplayName } from "./src/lib/profiles";
import {
  createOtherMemberCreatedEntryEvent,
  createOtherMemberDeletedEntryEvent,
  createOtherMemberUpdatedEntryEvent,
} from "./src/notifications/domain/notificationEventFactories";
import { AuthScreen } from "./src/screens/AuthScreen";
import { NicknameSetupScreen } from "./src/screens/NicknameSetupScreen";
import { PermissionOnboardingScreen } from "./src/screens/PermissionOnboardingScreen";
import type { LedgerAppScreen } from "./src/types/app";
import type { LedgerEntry, LedgerEntryDraft } from "./src/types/ledger";
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
  const [entryReturnScreen, setEntryReturnScreen] =
    useState<Exclude<LedgerAppScreen, "entry">>("calendar");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNicknameScreenReady, setIsNicknameScreenReady] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [blockingTaskCount, setBlockingTaskCount] = useState(0);
  const fallbackDisplayName = resolveFallbackDisplayName(
    session.user.user_metadata,
    session.user.email,
  );
  const accountProviderLabel = resolveSessionAuthProviderLabel(session);
  const notifications = useLedgerNotifications(session.user.id);
  const ledgerState = useLedgerScreenState(session);
  const annualReport = useAnnualLedgerReportAction({
    activeBook: ledgerState.activeBook,
    visibleMonth: ledgerState.visibleMonth,
  });
  const trackBlockingTask = useCallback(async function trackBlockingTask<T>(
    task: () => Promise<T>,
  ) {
    setBlockingTaskCount((currentCount) => currentCount + 1);
    try {
      return await task();
    } finally {
      setBlockingTaskCount((currentCount) => Math.max(0, currentCount - 1));
    }
  }, []);
  const authOnboarding = useAuthOnboarding({
    fallbackDisplayName,
    isNotificationSupported: notifications.isSupported,
    permissionState: notifications.permissionState,
    userId: session.user.id,
  });

  const handleOpenCalendar = () => setActiveScreen("calendar");
  const handleOpenEntryScreen = (nextReturnScreen: Exclude<LedgerAppScreen, "entry">) => {
    setEntryReturnScreen(nextReturnScreen);
    setActiveScreen("entry");
  };
  const handleBackToCalendar = () => {
    if (activeScreen === "entry") {
      ledgerState.resetEditor(ledgerState.selectedDate);
      setActiveScreen(entryReturnScreen);
      return;
    }

    setActiveScreen("calendar");
  };
  const handleToggleCharts = () =>
    setActiveScreen((currentScreen) => (currentScreen === "charts" ? "calendar" : "charts"));
  const handleOpenAllEntries = () => setActiveScreen("all-entries");
  const handleOpenEntry = () => handleOpenEntryScreen("calendar");
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
    const wasEditingEntry = Boolean(ledgerState.editingEntryId);
    let savedEntries: LedgerEntry[] = [];
    try {
      savedEntries = await ledgerState.handleSaveEntry();
    } catch (error) {
      logAppError("App", error, {
        step: "save_entry",
      });
      showNativeToast(resolveLedgerSaveErrorMessage(error));
      return;
    }
    if (savedEntries.length === 0) {
      return;
    }

    setActiveScreen(entryReturnScreen);
    void runEntrySaveSideEffects(
      savedEntries,
      currentEntries,
      wasEditingEntry ? "update" : "create",
    );
  };

  const handleSaveEntryDrafts = async (drafts: LedgerEntryDraft[]) => {
    const currentEntries = ledgerState.entries;
    let savedEntries: LedgerEntry[] = [];
    try {
      savedEntries = await ledgerState.handleSaveEntryDrafts(drafts);
    } catch (error) {
      logAppError("App", error, {
        entryCount: drafts.length,
        step: "save_entry_drafts",
      });
      showNativeToast(resolveLedgerSaveErrorMessage(error));
      return;
    }

    if (savedEntries.length === 0) {
      return;
    }

    setActiveScreen(entryReturnScreen);
    void runQueuedEntrySaveSideEffects(savedEntries, currentEntries);
  };

  const handleEditEntryFromCalendar = (entry: LedgerEntry) => {
    ledgerState.handleEditEntry(entry);
    handleOpenEntryScreen("calendar");
  };

  const handleEditEntryFromAllEntries = (entry: LedgerEntry) => {
    ledgerState.handleEditEntry(entry);
    handleOpenEntryScreen("all-entries");
  };

  const handleSettleInstallmentEntry = async (entry: LedgerEntry) => {
    try {
      const savedSettlementEntry = await ledgerState.handleSettleInstallmentEntry(entry);
      if (!savedSettlementEntry) {
        showNativeToast(EntryRegistrationCopy.installmentSettleUnavailable);
        return;
      }

      setActiveScreen(entryReturnScreen);
      showNativeToast(EntryRegistrationCopy.installmentSettleSuccess);
    } catch (error) {
      logAppError("App", error, {
        entryId: entry.id,
        installmentGroupId: entry.installmentGroupId,
        step: "settle_installment_entry",
      });
      showNativeToast(resolveLedgerSaveErrorMessage(error));
    }
  };

  const handleDeleteEntryFromCalendar = async (entry: LedgerEntry) => {
    await ledgerState.handleDeleteEntry(entry.id);

    if (!ledgerState.activeBook) {
      return;
    }

    const actorName = await resolveCurrentActorName();
    await notifications.sendPushNotificationToBookMembers(
      ledgerState.activeBook.id,
      createOtherMemberDeletedEntryEvent(
        { actorName, bookName: ledgerState.activeBook.name },
        { ...entry, authorId: session.user.id, authorName: actorName },
      ),
      [session.user.id],
    );
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
                <BackToCalendarAction
                  label={
                    activeScreen === "entry" && entryReturnScreen === "all-entries"
                      ? AllEntriesCopy.backActionLabel
                      : undefined
                  }
                  onPress={handleBackToCalendar}
                />
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
            trailingAction={
              activeScreen === "calendar" || activeScreen === "charts" ? (
                <AllEntriesAction onPress={handleOpenAllEntries} />
              ) : null
            }
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
              accountProviderLabel={accountProviderLabel}
              email={session.user.email ?? ""}
              fallbackDisplayName={fallbackDisplayName}
              ledgerState={ledgerState}
              notificationPreferenceGroups={notifications.preferenceGroups}
              notificationPermissionLabel={notifications.permissionLabel}
              notificationStatusMessage={notifications.statusMessage}
              onChangeNotificationThresholdEnabled={notifications.updateThresholdEnabled}
              onChangeNotificationThreshold={notifications.updateThresholdValue}
              onDeleteSelectedEntry={handleDeleteEntryFromCalendar}
              onEditSelectedEntry={
                activeScreen === "all-entries"
                  ? handleEditEntryFromAllEntries
                  : handleEditEntryFromCalendar
              }
              onOpenCharts={handleToggleCharts}
              onOpenEntry={handleOpenEntry}
              onSaveEntry={handleSaveEntry}
              onSaveEntryDrafts={handleSaveEntryDrafts}
              onSettleInstallmentEntry={handleSettleInstallmentEntry}
              onSendPendingJoinRequestNotification={
                notifications.sendPendingJoinRequestNotification
              }
              onSendPushNotificationToBookMembers={notifications.sendPushNotificationToBookMembers}
              onSendPushNotificationToUsers={notifications.sendPushNotificationToUsers}
              onToggleNotificationPreference={notifications.updatePreference}
              onSelectCalendarDate={(isoDate) => {
                ledgerState.handleSelectDate(isoDate);
                handleOpenCalendar();
              }}
              showNotificationSettings={notifications.showNotificationSettings}
              trackBlockingTask={trackBlockingTask}
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
        <AnnualReportRangePickerModal
          endDate={annualReport.customRangeDraft?.endDate ?? ledgerState.selectedDate}
          isOpen={annualReport.customRangeDraft?.isOpen ?? false}
          onClose={annualReport.handleCloseCustomRangePicker}
          onConfirm={annualReport.handleConfirmCustomRange}
          startDate={annualReport.customRangeDraft?.startDate ?? ledgerState.selectedDate}
        />
      </SafeAreaView>
      {blockingTaskCount > 0 ||
      ledgerState.isBusy ||
      ledgerState.isLoading ||
      annualReport.isDownloading ? (
        <BlockingOverlay />
      ) : null}
    </View>
  );

  async function notifySharedLedgerEntryChange(
    savedEntry: LedgerEntry,
    changeType: "create" | "update",
  ) {
    if (!ledgerState.activeBook) {
      return;
    }

    const actorName = await resolveCurrentActorName();
    const event =
      changeType === "create"
        ? createOtherMemberCreatedEntryEvent(
            { actorName, bookName: ledgerState.activeBook.name },
            { ...savedEntry, authorId: session.user.id, authorName: actorName },
          )
        : createOtherMemberUpdatedEntryEvent(
            { actorName, bookName: ledgerState.activeBook.name },
            { ...savedEntry, authorId: session.user.id, authorName: actorName },
          );

    await notifications.sendPushNotificationToBookMembers(ledgerState.activeBook.id, event, [
      session.user.id,
    ]);
  }

  async function resolveCurrentActorName() {
    try {
      const displayName = (await fetchOwnProfileDisplayName(session.user.id)).trim();
      return displayName || fallbackDisplayName;
    } catch {
      return fallbackDisplayName;
    }
  }

  async function runEntrySaveSideEffects(
    savedEntries: LedgerEntry[],
    currentEntries: LedgerEntry[],
    changeType: "create" | "update",
  ) {
    try {
      const currentMonthEntries = savedEntries.filter(
        (entry) => entry.date === ledgerState.selectedDate,
      );
      const lastCurrentMonthEntry = currentMonthEntries[currentMonthEntries.length - 1];

      if (lastCurrentMonthEntry) {
        await notifications.notifySavedEntry(lastCurrentMonthEntry, currentEntries);
      }

      for (const savedEntry of currentMonthEntries) {
        await notifySharedLedgerEntryChange(savedEntry, changeType);
      }
    } catch (error) {
      logAppError("App", error, {
        changeType,
        entryCount: savedEntries.length,
        step: "run_entry_save_side_effects",
      });
    }
  }

  async function runQueuedEntrySaveSideEffects(
    savedEntries: LedgerEntry[],
    currentEntries: LedgerEntry[],
  ) {
    try {
      const visibleSavedEntries = savedEntries.filter(
        (entry) => !entry.installmentOrder || entry.installmentOrder === 1,
      );
      const lastSavedEntry = visibleSavedEntries[visibleSavedEntries.length - 1];
      if (lastSavedEntry) {
        await notifications.notifySavedEntry(lastSavedEntry, currentEntries);
      }

      for (const savedEntry of visibleSavedEntries) {
        await notifySharedLedgerEntryChange(savedEntry, "create");
      }
    } catch (error) {
      logAppError("App", error, {
        entryCount: savedEntries.length,
        step: "run_queued_entry_save_side_effects",
      });
    }
  }
}

function resolveLedgerSaveErrorMessage(error: unknown): string {
  const errorText = extractLedgerSaveErrorText(error);

  if (
    errorText.includes("column") &&
    (errorText.includes("content") ||
      errorText.includes("installment_group_id") ||
      errorText.includes("installment_months") ||
      errorText.includes("installment_order")) &&
    errorText.includes("does not exist")
  ) {
    return EntryRegistrationCopy.saveMigrationError;
  }

  return EntryRegistrationCopy.saveError;
}

function extractLedgerSaveErrorText(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as {
    details?: string | null;
    hint?: string | null;
    message?: string | null;
  };

  return [candidate.message, candidate.details, candidate.hint].filter(Boolean).join(" ");
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
