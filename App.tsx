import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import {
  NavigationContainer,
  type NavigationState,
  StackActions,
  createNavigationContainerRef,
} from "@react-navigation/native";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager, StatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { SignedInStackNavigator } from "./src/app/SignedInStackNavigator";
import { type SignedInStackParamList, isSignedInStackScreen } from "./src/app/signedInNavigation";
import { AllEntriesAction } from "./src/components/AllEntriesAction";
import { AnnualReportDownloadAction } from "./src/components/AnnualReportDownloadAction";
import { AppHeader } from "./src/components/AppHeader";
import { AppMenuDrawer } from "./src/components/AppMenuDrawer";
import { BackActionButton } from "./src/components/BackActionButton";
import { BlockingOverlay } from "./src/components/BlockingOverlay";
import { OnboardingTransitionScreen } from "./src/components/OnboardingTransitionScreen";
import { SessionLoadingScreen } from "./src/components/SessionLoadingScreen";
import { AnnualReportRangePickerModal } from "./src/components/annualReport/AnnualReportRangePickerModal";
import { NativeYearPickerModal } from "./src/components/calendarPicker/NativeYearPickerModal";
import { AdInterstitialPlacement } from "./src/constants/ads";
import { AppColors } from "./src/constants/colors";
import { EntryRegistrationCopy } from "./src/constants/entryRegistration";
import { AppMessages } from "./src/constants/messages";
import { SubscriptionMessages, SubscriptionTiers } from "./src/constants/subscription";
import { SubscriptionManagementMessages } from "./src/constants/subscriptionManagement";
import { SupportMessages, type SupportPackageIdentifier } from "./src/constants/support";
import { useAnnualLedgerReportAction } from "./src/hooks/useAnnualLedgerReportAction";
import { useAuthOnboarding } from "./src/hooks/useAuthOnboarding";
import { useCardSmsClipboardAutoPrompt } from "./src/hooks/useCardSmsClipboardAutoPrompt";
import { useGoogleAuthRedirectCompletion } from "./src/hooks/useGoogleAuthRedirectCompletion";
import { useLedgerCategoryLabels } from "./src/hooks/useLedgerCategoryLabels";
import { useLedgerNotifications } from "./src/hooks/useLedgerNotifications";
import { useLedgerScreenState } from "./src/hooks/useLedgerScreenState";
import { useLedgerWidgetDeepLinks } from "./src/hooks/useLedgerWidgetDeepLinks";
import { useLedgerWidgetSync } from "./src/hooks/useLedgerWidgetSync";
import { useSubscriptionPlan } from "./src/hooks/useSubscriptionPlan";
import { useSupabaseSession } from "./src/hooks/useSupabaseSession";
import { useSupportPackages } from "./src/hooks/useSupportPackages";
import { preloadInterstitialAd, showInterstitialAd } from "./src/lib/ads/interstitialAd";
import { ensureMobileAdsInitialized } from "./src/lib/ads/mobileAds";
import { showsBackNavigationAction } from "./src/lib/appHeaderTitle";
import { appPlatform } from "./src/lib/appPlatform";
import { getAppScreenLabel } from "./src/lib/appScreenLabels";
import { resolveSessionAuthProviderLabel } from "./src/lib/authProvider";
import {
  type CardSmsClipboardDraft,
  promptCardSmsClipboardImport,
} from "./src/lib/cardSmsClipboardImport";
import { logAppError } from "./src/lib/logAppError";
import { buildAppMenuSections } from "./src/lib/menuItems";
import { showNativeToast } from "./src/lib/nativeToast";
import { fetchOwnProfileDisplayName, updateOwnProfileDisplayName } from "./src/lib/profiles";
import { openSubscriptionManagement } from "./src/lib/subscription/openSubscriptionManagement";
import { isSubscriptionPurchaseCancelled } from "./src/lib/subscription/subscriptionError";
import { registerLedgerWidgetNotificationSync } from "./src/lib/widgetNotificationSync";
import { fetchLedgerWidgetSummary } from "./src/lib/widgetSummary";
import {
  createOtherMemberCreatedEntryEvent,
  createOtherMemberDeletedEntryEvent,
  createOtherMemberUpdatedEntryEvent,
} from "./src/notifications/domain/notificationEventFactories";
import { AuthScreen } from "./src/screens/AuthScreen";
import { NicknameSetupScreen } from "./src/screens/NicknameSetupScreen";
import { PermissionOnboardingScreen } from "./src/screens/PermissionOnboardingScreen";
import type { LedgerAppScreen } from "./src/types/app";
import type { LedgerEntry } from "./src/types/ledger";
import { getMonthKey, parseIsoDate, toIsoDate } from "./src/utils/calendar";
import { resolveFallbackDisplayName } from "./src/utils/sessionDisplayName";

export default function App() {
  useGoogleAuthRedirectCompletion();
  const { errorMessage, isLoading, session } = useSupabaseSession();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <RootSiblingParent>
          {isLoading ? (
            <SignedOutAppShell>
              <SessionLoadingScreen />
            </SignedOutAppShell>
          ) : !session ? (
            <SignedOutAppShell>
              <AuthScreen initialErrorMessage={errorMessage} />
            </SignedOutAppShell>
          ) : (
            <SignedInApp session={session} />
          )}
        </RootSiblingParent>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function SignedOutAppShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
      <SafeAreaView edges={["top"]} style={styles.signedOutSafeArea} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.signedOutBodySafeArea}>
        <View style={styles.signedOutBody}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

function SignedInApp({ session }: { session: Session }) {
  const navigationRef = useRef(createNavigationContainerRef<SignedInStackParamList>()).current;
  const clipboardImportBaseDate = useRef(new Date()).current;
  const [currentScreen, setCurrentScreen] = useState<LedgerAppScreen>("calendar");
  const [previousScreen, setPreviousScreen] = useState<LedgerAppScreen | null>(null);
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
  const subscription = useSubscriptionPlan(session.user.id);
  const supportPackages = useSupportPackages(session.user.id);
  const ledgerState = useLedgerScreenState(session);
  useLedgerWidgetSync(ledgerState.activeBook?.id ?? null, ledgerState.entries);
  useEffect(() => {
    let removeListener: (() => void) | null = null;

    void registerLedgerWidgetNotificationSync()
      .then((cleanup) => {
        removeListener = cleanup;
      })
      .catch((error) => {
        logAppError("App", error, {
          step: "register_ledger_widget_notification_sync",
        });
      });

    return () => {
      removeListener?.();
    };
  }, []);
  const visibleCategoryLabels = useLedgerCategoryLabels();
  const annualReport = useAnnualLedgerReportAction({
    activeBook: ledgerState.activeBook,
    onBeforeDownloadReport: async () => {
      await showInterstitialAd(AdInterstitialPlacement.annualReportDownload);
    },
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

  useEffect(() => {
    if (!appPlatform.isNative) {
      return;
    }

    void ensureMobileAdsInitialized().then(() => {
      preloadInterstitialAd();
    });
  }, []);

  const syncCurrentRouteState = useCallback(() => {
    if (!navigationRef.isReady()) {
      return;
    }

    const rootState = navigationRef.getRootState();
    const activeRoute = rootState.routes[rootState.index];
    const activeRouteName = isSignedInStackScreen(activeRoute?.name)
      ? activeRoute.name
      : "calendar";
    const resolvedPreviousRoute = resolvePreviousRouteName(rootState);

    setCurrentScreen(activeRouteName);
    setPreviousScreen(resolvedPreviousRoute);
  }, [navigationRef]);

  const returnToCalendarRoot = useCallback(() => {
    if (!navigationRef.isReady()) {
      return;
    }

    if (navigationRef.canGoBack()) {
      navigationRef.dispatch(StackActions.popToTop());
      return;
    }

    navigationRef.navigate("calendar");
  }, [navigationRef]);

  const navigateToStackScreen = useCallback(
    (screen: Exclude<LedgerAppScreen, "calendar">) => {
      if (!navigationRef.isReady()) {
        return;
      }

      navigationRef.navigate(screen);
    },
    [navigationRef],
  );

  const handleOpenCalendar = useCallback(() => {
    returnToCalendarRoot();
  }, [returnToCalendarRoot]);

  const navigateToEntryFromCalendar = useCallback(() => {
    navigateToStackScreen("entry");
  }, [navigateToStackScreen]);

  const handleApplyCardSmsClipboardDraft = useCallback(
    (clipboardDraft: CardSmsClipboardDraft) => {
      if (clipboardDraft.date) {
        ledgerState.handleSelectDate(clipboardDraft.date);
      }

      ledgerState.updateDraftType(clipboardDraft.type);
      ledgerState.updateDraftField("amount", clipboardDraft.amount);
      ledgerState.updateDraftField("content", clipboardDraft.content);
      if (clipboardDraft.category && visibleCategoryLabels.includes(clipboardDraft.category)) {
        ledgerState.updateDraftField("category", clipboardDraft.category);
      }

      navigateToEntryFromCalendar();
    },
    [ledgerState, navigateToEntryFromCalendar, visibleCategoryLabels],
  );

  const shouldIgnoreCardSmsClipboardDraft = useCallback(
    (clipboardDraft: CardSmsClipboardDraft) => {
      const targetDate = clipboardDraft.date ?? ledgerState.selectedDate;
      return ledgerState.entries.some(
        (entry) =>
          entry.date === targetDate &&
          entry.amount === Number(clipboardDraft.amount) &&
          entry.content.trim() === clipboardDraft.content.trim() &&
          entry.type === clipboardDraft.type,
      );
    },
    [ledgerState.entries, ledgerState.selectedDate],
  );

  const handleOpenEntryFromCalendar = useCallback(async () => {
    const didPromptCardSmsImport = await promptCardSmsClipboardImport({
      baseDate: clipboardImportBaseDate,
      onApply: handleApplyCardSmsClipboardDraft,
      onSkip: navigateToEntryFromCalendar,
      shouldIgnoreDraft: shouldIgnoreCardSmsClipboardDraft,
    });

    if (!didPromptCardSmsImport) {
      navigateToEntryFromCalendar();
    }
  }, [
    clipboardImportBaseDate,
    handleApplyCardSmsClipboardDraft,
    navigateToEntryFromCalendar,
    shouldIgnoreCardSmsClipboardDraft,
  ]);

  const handleOpenClipboardImportFromWidget = useCallback(() => {
    void handleOpenEntryFromCalendar();
  }, [handleOpenEntryFromCalendar]);

  useLedgerWidgetDeepLinks({
    enabled: !authOnboarding.isLoading && authOnboarding.step === null,
    onOpenClipboardImport: handleOpenClipboardImportFromWidget,
    onOpenEntry: navigateToEntryFromCalendar,
  });

  useCardSmsClipboardAutoPrompt({
    baseDate: clipboardImportBaseDate,
    enabled:
      !authOnboarding.isLoading && authOnboarding.step === null && currentScreen === "calendar",
    onApply: handleApplyCardSmsClipboardDraft,
    onSkip: navigateToEntryFromCalendar,
    shouldIgnoreDraft: shouldIgnoreCardSmsClipboardDraft,
  });

  const handleBackNavigation = useCallback(() => {
    if (currentScreen === "entry") {
      ledgerState.resetEditor(ledgerState.selectedDate);
    }

    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
      return;
    }

    returnToCalendarRoot();
  }, [currentScreen, ledgerState, navigationRef, returnToCalendarRoot]);
  const handleToggleCharts = useCallback(() => {
    if (currentScreen === "charts" && navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
      return;
    }

    navigateToStackScreen("charts");
  }, [currentScreen, navigationRef, navigateToStackScreen]);
  const handleOpenAllEntries = useCallback(() => {
    navigateToStackScreen("all-entries");
  }, [navigateToStackScreen]);
  const handleOpenEntry = handleOpenEntryFromCalendar;
  const handleOpenSubscription = useCallback(() => {
    navigateToStackScreen("subscription");
  }, [navigateToStackScreen]);
  const menuSections = buildAppMenuSections(notifications.showNotificationSettings);
  const handleOpenYearPicker = () => {
    if (currentScreen !== "calendar") {
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

  const handlePurchasePlus = async () => {
    try {
      const nextTier = await trackBlockingTask(() => subscription.purchasePlus());
      if (nextTier === SubscriptionTiers.plus) {
        showNativeToast(SubscriptionMessages.purchaseSuccess);
      }
    } catch (error) {
      if (isSubscriptionPurchaseCancelled(error)) {
        return;
      }

      logAppError("App", error, {
        step: "purchase_plus",
        userId: session.user.id,
      });
      showNativeToast(SubscriptionMessages.purchaseError);
    }
  };

  const handlePurchaseSupportPackage = async (identifier: SupportPackageIdentifier) => {
    try {
      await trackBlockingTask(() => supportPackages.purchasePackage(identifier));
      showNativeToast(SupportMessages.purchaseSuccess);
    } catch (error) {
      if (isSubscriptionPurchaseCancelled(error)) {
        return;
      }

      logAppError("App", error, {
        identifier,
        step: "purchase_support_package",
        userId: session.user.id,
      });
      showNativeToast(SupportMessages.purchaseError);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const nextTier = await trackBlockingTask(() => subscription.restorePurchases());
      showNativeToast(
        nextTier === SubscriptionTiers.plus
          ? SubscriptionMessages.restoreSuccess
          : SubscriptionMessages.inactiveRestoreMessage,
      );
    } catch (error) {
      logAppError("App", error, {
        step: "restore_plus_purchases",
        userId: session.user.id,
      });
      showNativeToast(SubscriptionMessages.restoreError);
    }
  };

  const handleOpenSubscriptionManagement = async () => {
    try {
      await openSubscriptionManagement();
    } catch (error) {
      logAppError("App", error, {
        step: "open_subscription_management",
        userId: session.user.id,
      });
      showNativeToast(SubscriptionManagementMessages.openError);
    }
  };

  const handleBeforeCopyShareCode = () =>
    appPlatform.isNative
      ? showInterstitialAd(AdInterstitialPlacement.shareCodeCopy)
      : Promise.resolve(true);

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

    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    } else {
      returnToCalendarRoot();
    }
    void runEntrySaveSideEffects(
      savedEntries,
      currentEntries,
      wasEditingEntry ? "update" : "create",
    );
  };

  const handleEditEntryFromCalendar = (entry: LedgerEntry) => {
    ledgerState.handleEditEntry(entry);
    handleOpenEntryFromCalendar();
  };

  const handleEditEntryFromAllEntries = (entry: LedgerEntry) => {
    ledgerState.handleEditEntry(entry);
    if (navigationRef.isReady()) {
      navigationRef.navigate("entry");
    }
  };

  const handleSettleInstallmentEntry = async (entry: LedgerEntry) => {
    try {
      const savedSettlementEntry = await ledgerState.handleSettleInstallmentEntry(entry);
      if (!savedSettlementEntry) {
        showNativeToast(EntryRegistrationCopy.installmentSettleUnavailable);
        return;
      }

      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
      } else {
        returnToCalendarRoot();
      }
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
    const widget = await resolveCurrentLedgerWidgetPushSummary(ledgerState.activeBook.id);
    await notifications.sendPushNotificationToBookMembers(
      ledgerState.activeBook.id,
      createOtherMemberDeletedEntryEvent(
        { actorName, bookName: ledgerState.activeBook.name },
        { ...entry, authorId: session.user.id, authorName: actorName },
      ),
      [session.user.id],
      widget,
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
      <SignedOutAppShell>
        <SessionLoadingScreen />
      </SignedOutAppShell>
    );
  }

  if (authOnboarding.step === "nickname") {
    return (
      <SignedOutAppShell>
        {isNicknameScreenReady ? (
          <NicknameSetupScreen onSubmit={handleCompleteNicknameOnboarding} />
        ) : (
          <OnboardingTransitionScreen />
        )}
      </SignedOutAppShell>
    );
  }

  if (authOnboarding.step === "notification-permission") {
    return (
      <SignedOutAppShell>
        <PermissionOnboardingScreen
          onAllow={handleCompletePermissionOnboarding}
          onSkip={authOnboarding.completePermissionOnboarding}
        />
      </SignedOutAppShell>
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
              showsBackNavigationAction(currentScreen) ? (
                <BackActionButton onPress={handleBackNavigation} />
              ) : annualReport.bookName ? (
                <AnnualReportDownloadAction
                  onPress={() => {
                    void annualReport.handleDownloadReport();
                  }}
                />
              ) : null
            }
            showsPlusBadge={
              currentScreen === "calendar" && subscription.currentTier === SubscriptionTiers.plus
            }
            titleLabel={
              currentScreen === "calendar"
                ? annualReport.bookName
                : getAppScreenLabel(currentScreen)
            }
            trailingAction={
              currentScreen === "calendar" || currentScreen === "charts" ? (
                <AllEntriesAction onPress={handleOpenAllEntries} />
              ) : null
            }
            yearLabel={null}
            onOpenMenu={() => setIsMenuOpen((currentValue) => !currentValue)}
          />
        </View>
      </SafeAreaView>
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.bodySafeArea}>
        <View style={styles.body}>
          <NavigationContainer
            onReady={syncCurrentRouteState}
            onStateChange={syncCurrentRouteState}
            ref={navigationRef}
          >
            <SignedInStackNavigator
              accountProviderLabel={accountProviderLabel}
              email={session.user.email ?? ""}
              fallbackDisplayName={fallbackDisplayName}
              hasAvailablePlusPackage={subscription.hasAvailablePlusPackage}
              isPlusActive={subscription.isPlusActive}
              ledgerState={ledgerState}
              notificationPreferenceGroups={notifications.preferenceGroups}
              notificationPermissionLabel={notifications.permissionLabel}
              notificationStatusMessage={notifications.statusMessage}
              onBeforeCopyShareCode={handleBeforeCopyShareCode}
              onChangeNotificationThreshold={notifications.updateThresholdValue}
              onChangeNotificationThresholdEnabled={notifications.updateThresholdEnabled}
              onDeleteSelectedEntry={handleDeleteEntryFromCalendar}
              onEditSelectedEntryFromAllEntries={handleEditEntryFromAllEntries}
              onEditSelectedEntryFromCalendar={handleEditEntryFromCalendar}
              onOpenCharts={handleToggleCharts}
              onOpenEntry={handleOpenEntry}
              onOpenMonthPicker={handleOpenYearPicker}
              onOpenSubscription={handleOpenSubscription}
              onOpenSubscriptionManagement={handleOpenSubscriptionManagement}
              onPurchasePlus={handlePurchasePlus}
              onPurchaseSupportPackage={handlePurchaseSupportPackage}
              onRestorePurchases={handleRestorePurchases}
              onSaveEntry={handleSaveEntry}
              onSelectCalendarDate={(isoDate) => {
                ledgerState.handleSelectDate(isoDate);
                handleOpenCalendar();
              }}
              onSendPendingJoinRequestNotification={
                notifications.sendPendingJoinRequestNotification
              }
              onSendPushNotificationToBookMembers={notifications.sendPushNotificationToBookMembers}
              onSendPushNotificationToUsers={notifications.sendPushNotificationToUsers}
              onSettleInstallmentEntry={handleSettleInstallmentEntry}
              onToggleNotificationPreference={notifications.updatePreference}
              plusPriceLabel={subscription.plusPriceLabel}
              showNotificationSettings={notifications.showNotificationSettings}
              showsBannerAd={subscription.currentTier === SubscriptionTiers.free}
              subscriptionTier={subscription.currentTier}
              supportPackages={supportPackages.packages}
              supportPackagesLoading={supportPackages.isLoading}
              trackBlockingTask={trackBlockingTask}
              userId={session.user.id}
            />
          </NavigationContainer>
        </View>
        <AppMenuDrawer
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onSelectItem={(targetScreen) => {
            setIsMenuOpen(false);
            if (targetScreen === "calendar") {
              ledgerState.resetEditor(ledgerState.selectedDate);
              returnToCalendarRoot();
              return;
            }
            if (targetScreen === "share" && ledgerState.activeBook?.ownerId === session.user.id) {
              void ledgerState.refreshSharedLedgerBook();
            }
            navigateToStackScreen(targetScreen);
          }}
          sections={menuSections}
        />
        <NativeYearPickerModal
          isOpen={currentScreen === "calendar" && appPlatform.isIOS && isYearPickerOpen}
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
    widget?: Awaited<ReturnType<typeof resolveCurrentLedgerWidgetPushSummary>>,
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

    await notifications.sendPushNotificationToBookMembers(
      ledgerState.activeBook.id,
      event,
      [session.user.id],
      widget,
    );
  }

  async function resolveCurrentLedgerWidgetPushSummary(bookId: string) {
    const today = new Date();
    const todayIsoDate = toIsoDate(today);

    return {
      monthKey: getMonthKey(today),
      summary: await fetchLedgerWidgetSummary(bookId, todayIsoDate),
    };
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

      const widget = ledgerState.activeBook
        ? await resolveCurrentLedgerWidgetPushSummary(ledgerState.activeBook.id)
        : undefined;

      for (const savedEntry of currentMonthEntries) {
        await notifySharedLedgerEntryChange(savedEntry, changeType, widget);
      }
    } catch (error) {
      logAppError("App", error, {
        changeType,
        entryCount: savedEntries.length,
        step: "run_entry_save_side_effects",
      });
    }
  }
}

function resolvePreviousRouteName(state: NavigationState | undefined): LedgerAppScreen | null {
  if (!state || state.routes.length < 2) {
    return null;
  }

  const previousRoute = state.routes[state.index - 1];
  return isSignedInStackScreen(previousRoute?.name) ? previousRoute.name : null;
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
  signedOutSafeArea: {
    backgroundColor: AppColors.background,
  },
  signedOutBodySafeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  signedOutBody: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
});
