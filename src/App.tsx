import { useTrackedTask } from "./hooks/useTrackedTask";
import {
  resolveLedgerSaveErrorMessage,
  isMissingInstallmentTransactionMigration,
} from "./lib/ledgerEntryErrors";
import { createEntrySaveSideEffects } from "./lib/notifications/entrySaveSideEffects";
import { useInitialNotificationPermission } from "./hooks/useInitialNotificationPermission";
import { useAppNotificationRouting } from "./hooks/useAppNotificationRouting";
import { useAppAds } from "./hooks/useAppAds";
import { useEntryClipboard } from "./hooks/useEntryClipboard";
import { FloatingEntryButton } from "./components/FloatingEntryButton";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import type { Session } from "@supabase/supabase-js";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Keyboard, StatusBar, StyleSheet, View } from "react-native";
import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { navigateToSingleInstanceStackScreen } from "./app/navigateToStackScreen";
import { useSheetTransition } from "./hooks/useSheetTransition";
import { LedgerBooksScreen } from "./screens/LedgerBooksScreen";

import { SignedInTabNavigator } from "./app/SignedInTabNavigator";
import {
  type SignedInStackScreen,
  type SignedInTabParamList,
  isSignedInStackScreen,
} from "./app/signedInNavigation";
import { AppNativeHeaderTitle } from "./components/AppNativeHeaderTitle";
import { BlockingOverlay } from "./components/BlockingOverlay";
import { ClipboardSuggestionBanner } from "./components/ClipboardSuggestionBanner";
import { LedgerBookManagementSheet } from "./components/LedgerBookManagementSheet";
import { OnboardingTransitionScreen } from "./components/OnboardingTransitionScreen";
import { SessionLoadingScreen } from "./components/SessionLoadingScreen";
import { StartupErrorScreen } from "./components/StartupErrorScreen";
import { NativeYearPickerModal } from "./components/calendarPicker/NativeYearPickerModal";
import { AnnualReportRangePickerModal } from "./components/annualReport/AnnualReportRangePickerModal";
import { EntryComposer, type EntryComposerHandle } from "./components/entryComposer/EntryComposer";
import { confirmInstallmentPrepayment } from "./components/installmentPrepaymentAlert";
import { AdInterstitialPlacement } from "./constants/ads";
import { AppColors } from "./constants/colors";
import { EntryRegistrationCopy } from "./constants/entryRegistration";
import { formatMonthLabel, formatYearLabel } from "./constants/ledgerDisplay";
import { FooterTabBarUi, FloatingEntryButtonUi } from "./constants/menu";
import { AppMessages } from "./constants/messages";
import { SubscriptionMessages, SubscriptionTiers } from "./constants/subscription";
import { SupportMessages, type SupportPackageIdentifier } from "./constants/support";
import { BottomContentInsetContext } from "./contexts/BottomContentInsetContext";
import { ExpenseTextColorProvider } from "./contexts/ExpenseTextColorContext";
import { useAnnualLedgerReportAction } from "./hooks/useAnnualLedgerReportAction";
import { useAuthOnboarding } from "./hooks/useAuthOnboarding";
import { useCalendarHeatmapSetting } from "./hooks/useCalendarHeatmapSetting";
import { useCalendarSummaryModeSetting } from "./hooks/useCalendarSummaryModeSetting";
import { useDailyFirstEntryAd } from "./hooks/useDailyFirstEntryAd";
import { useDismissStartupSplash } from "./hooks/useDismissStartupSplash";
import { useEntryNotificationReads } from "./hooks/useEntryNotificationReads";
import { useGoogleAuthRedirectCompletion } from "./hooks/useGoogleAuthRedirectCompletion";
import { useLedgerNotifications } from "./hooks/useLedgerNotifications";
import { useLedgerScreenState } from "./hooks/useLedgerScreenState";
import { useLedgerWidgetDeepLinks } from "./hooks/useLedgerWidgetDeepLinks";
import { useLedgerWidgetSync } from "./hooks/useLedgerWidgetSync";
import { useNotificationBadges } from "./hooks/useNotificationBadges";
import { usePasswordRecoveryRedirect } from "./hooks/usePasswordRecoveryRedirect";
import { useSubscriptionPlan } from "./hooks/useSubscriptionPlan";
import { useSupabaseSession } from "./hooks/useSupabaseSession";
import { useSupportPackages } from "./hooks/useSupportPackages";
import { showInterstitialAd } from "./lib/ads/interstitialAd";
import { appPlatform } from "./lib/appPlatform";
import { getAppScreenLabel } from "./lib/appScreenLabels";
import { installAppTextDefaults } from "./lib/appTextDefaults";
import { signOutFromApp } from "./lib/auth/signOut";
import { resolveSessionAuthProvider, resolveSessionAuthProviderLabel } from "./lib/authProvider";
import { type FooterTabScreen } from "./lib/footerTabs";
import { scheduleIdleTask } from "./lib/idleScheduler";
import { logAppError } from "./lib/logAppError";
import { buildSettingsMenuSections } from "./lib/menuItems";
import { showNativeToast } from "./lib/nativeToast";
import {
  resolveBadgedBookIds,
  resolveFooterBadgeScreens,
} from "./lib/notifications/notificationBadges";
import { syncOwnProfileDisplayNameIfMissing, updateOwnProfileDisplayName } from "./lib/profiles";
import { openSubscriptionManagement } from "./lib/subscription/openSubscriptionManagement";
import { isSubscriptionPurchaseCancelled } from "./lib/subscription/subscriptionError";
import { registerLedgerWidgetNotificationSync } from "./lib/widgetNotificationSync";
import { AuthScreen } from "./screens/AuthScreen";
import { NicknameSetupScreen } from "./screens/NicknameSetupScreen";
import { PasswordResetScreen } from "./screens/PasswordResetScreen";
import type { LedgerAppScreen } from "./types/app";
import type { LedgerEntry, LedgerEntryDraft } from "./types/ledger";
import type { LedgerEntryDeleteScope } from "./types/ledgerEntryDeletion";
import { toIsoDate } from "./utils/calendar";
import { canSubmitDraft } from "./utils/ledgerEntries";
import { resolveFallbackDisplayName } from "./utils/sessionDisplayName";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore errors */
});

installAppTextDefaults();

export default function App() {
  useGoogleAuthRedirectCompletion();
  const [isPasswordRecoverySession, setIsPasswordRecoverySession] = useState(false);
  usePasswordRecoveryRedirect({
    onRecoverySession: useCallback(() => {
      setIsPasswordRecoverySession(true);
    }, []),
  });
  const { errorMessage, isLoading, session, retry } = useSupabaseSession();

  const onSignedOutLayout = useDismissStartupSplash(
    !isLoading && (!session || isPasswordRecoverySession),
  );

  return (
    <SafeAreaProvider>
      <View style={styles.gestureRoot}>
        <RootSiblingParent>
          {isLoading ? (
            <SignedOutAppShell>
              <SessionLoadingScreen />
            </SignedOutAppShell>
          ) : errorMessage ? (
            <SignedOutAppShell key="session-error" onLayout={onSignedOutLayout}>
              <StartupErrorScreen message={errorMessage} onRetry={retry} />
            </SignedOutAppShell>
          ) : isPasswordRecoverySession && session ? (
            <SignedOutAppShell key="password-recovery" onLayout={onSignedOutLayout}>
              <PasswordResetScreen onComplete={() => setIsPasswordRecoverySession(false)} />
            </SignedOutAppShell>
          ) : !session ? (
            <SignedOutAppShell key="authentication" onLayout={onSignedOutLayout}>
              <AuthScreen initialErrorMessage={errorMessage} />
            </SignedOutAppShell>
          ) : (
            <SignedInApp session={session} />
          )}
        </RootSiblingParent>
      </View>
    </SafeAreaProvider>
  );
}

function SignedOutAppShell({
  children,
  onLayout,
}: {
  children: React.ReactNode;
  onLayout?: () => void;
}) {
  return (
    <View onLayout={onLayout} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={styles.signedOutSafeArea} />
      <SafeAreaView edges={["left", "right"]} style={styles.signedOutBodySafeArea}>
        <View style={styles.signedOutBody}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

function SignedInApp({ session }: { session: Session }) {
  const navigationRef = useRef(createNavigationContainerRef<SignedInTabParamList>()).current;
  const entryComposerRef = useRef<EntryComposerHandle>(null);
  const composerSheet = useSheetTransition();
  const isComposerVisible = composerSheet.isOpen;
  const setIsComposerVisible = composerSheet.setOpen;
  const composerVisibleRef = useRef(isComposerVisible);
  composerVisibleRef.current = composerSheet.isPresented;
  const closeComposer = useCallback(() => {
    if (entryComposerRef.current?.isSaving()) return;
    Keyboard.dismiss();
    setIsComposerVisible(false);
  }, [setIsComposerVisible]);
  const [currentScreen, setCurrentScreen] = useState<LedgerAppScreen>("calendar");
  const [isEntrySheetOpen, setIsEntrySheetOpen] = useState(false);
  const ledgerManagementSheet = useSheetTransition();
  const isLedgerManagementOpen = ledgerManagementSheet.isOpen;
  const setIsLedgerManagementOpen = ledgerManagementSheet.setOpen;
  const [footerHeight, setFooterHeight] = useState(0);
  const [clipboardBannerHeight, setClipboardBannerHeight] = useState(0);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [isNicknameScreenReady, setIsNicknameScreenReady] = useState(false);
  const { taskCount: blockingTaskCount, trackTask: trackBlockingTask } = useTrackedTask();
  const authProvider = resolveSessionAuthProvider(session);
  const metadataDisplayName = resolveFallbackDisplayName(
    session.user.user_metadata,
    session.user.email,
  );
  const fallbackDisplayName = metadataDisplayName || (authProvider === "apple" ? "사용자" : "");
  const accountProviderLabel = resolveSessionAuthProviderLabel(session);
  const notifications = useLedgerNotifications(session.user.id);
  const calendarHeatmapSetting = useCalendarHeatmapSetting();
  const calendarSummaryModeSetting = useCalendarSummaryModeSetting();
  const subscription = useSubscriptionPlan(session.user.id);
  const isCalendarHeatmapEnabled =
    subscription.isPlusActive && calendarHeatmapSetting.isCalendarHeatmapEnabled;
  const shouldServeAdMobAds =
    !subscription.isLoading && subscription.currentTier === SubscriptionTiers.free;
  const {
    adTrackingPermissionState,
    hasSettledInitialAdTrackingPermission,
    isMobileAdsReady,
    showsAdMobAds,
    showAdTrackingPermissionCard,
    handleRequestAdTrackingPermission,
    handleOpenAdTrackingSettings,
  } = useAppAds(shouldServeAdMobAds, subscription.isLoading);
  const supportPackages = useSupportPackages(session.user.id);
  const handleReadOnlyEditBlocked = useCallback(() => {
    showNativeToast(
      "현재 플랜 한도를 초과해 조회만 가능해요. 가계부를 줄이거나 알뜰 Plus를 다시 구독해 주세요.",
    );
  }, []);
  const ledgerState = useLedgerScreenState(session, {
    calendarSummaryBaseDay: calendarSummaryModeSetting.calendarSummaryBaseDay,
    calendarSummaryMode: calendarSummaryModeSetting.calendarSummaryMode,
    onReadOnlyEditBlocked: handleReadOnlyEditBlocked,
    subscriptionTier: subscription.currentTier,
  });
  const discardEntryDraft = useCallback(() => {
    ledgerState.resetEditor(ledgerState.selectedDate);
  }, [ledgerState]);
  const notificationBadges = useNotificationBadges(session.user.id);
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
  const annualReport = useAnnualLedgerReportAction({
    activeBook: ledgerState.activeBook,
    onBeforeDownloadReport: async () => {
      if (!showsAdMobAds) {
        return;
      }

      await showInterstitialAd(AdInterstitialPlacement.annualReportDownload);
    },
    visibleMonth: ledgerState.visibleMonth,
  });
  const authOnboarding = useAuthOnboarding({
    fallbackDisplayName,
    userId: session.user.id,
  });
  const onSignedInLayout = useDismissStartupSplash(
    !authOnboarding.isLoading && (authOnboarding.step !== "nickname" || isNicknameScreenReady),
  );
  const isSignedInNavigationReady =
    !authOnboarding.isLoading &&
    !authOnboarding.errorMessage &&
    authOnboarding.step === null &&
    !subscription.isLoading &&
    !ledgerState.isBusy;
  const isSignedInInteractionReady = isSignedInNavigationReady && !ledgerState.isLoading;
  const markEntryNotificationsRead = useEntryNotificationReads(
    isSignedInInteractionReady &&
      currentScreen === "calendar" &&
      !isEntrySheetOpen &&
      !isLedgerManagementOpen,
    ledgerState,
    notificationBadges.refresh,
  );

  useEffect(() => {
    if (authProvider !== "apple" || metadataDisplayName) {
      return;
    }

    void syncOwnProfileDisplayNameIfMissing(session.user.id, "사용자").catch((error) => {
      logAppError("App", error, {
        step: "sync_apple_default_display_name",
        userId: session.user.id,
      });
    });
  }, [authProvider, metadataDisplayName, session.user.id]);

  const syncCurrentRouteState = useCallback(() => {
    if (!navigationRef.isReady()) {
      return;
    }

    const activeRoute = navigationRef.getCurrentRoute();
    setIsEntrySheetOpen(activeRoute?.name === "entry-sheet");
    if (activeRoute?.name === "entry-sheet") {
      return;
    }

    const activeRouteName = isSignedInStackScreen(activeRoute?.name)
      ? activeRoute.name
      : "calendar";
    setCurrentScreen(activeRouteName);
  }, [navigationRef]);

  const returnToCalendarRoot = useCallback(() => {
    if (!navigationRef.isReady()) {
      return;
    }

    navigateToSingleInstanceStackScreen(navigationRef, "calendar");
  }, [navigationRef]);

  const navigateToStackScreen = useCallback(
    (screen: Exclude<LedgerAppScreen, "calendar" | "entry">) => {
      if (!navigationRef.isReady()) {
        return;
      }

      navigateToSingleInstanceStackScreen(navigationRef, screen);
    },
    [navigationRef],
  );

  const handleOpenCalendar = useCallback(() => {
    returnToCalendarRoot();
  }, [returnToCalendarRoot]);

  const navigateToEntryFromCalendar = useCallback(() => {
    setIsComposerVisible(true);
  }, []);

  const entrySaveInProgress = useRef(false);
  const { ensureAdBeforeSave } = useDailyFirstEntryAd({
    userId: session.user.id,
    bookId: ledgerState.activeBook?.id ?? null,
    isReady: isMobileAdsReady && isSignedInInteractionReady && !isLedgerManagementOpen,
    isSubscriptionLoading: subscription.isLoading,
    isFree: subscription.currentTier === SubscriptionTiers.free,
  });

  const {
    clipboardSuggestionDraft,
    handleOpenEntryFromCalendar,
    handlePasteClipboardDraft,
    handleDismissClipboardSuggestion,
    handleApplyClipboardSuggestion,
    handleOpenClipboardImportFromWidget,
  } = useEntryClipboard({
    ledgerState,
    userId: session.user.id,
    isSignedInInteractionReady,
    isEntrySheetOpen,
    isComposerPresented: composerSheet.isPresented,
    composerVisibleRef,
    entryComposerRef,
    navigationRef,
    navigateToEntryFromCalendar,
    handleReadOnlyEditBlocked,
    setIsComposerVisible,
  });

  const isClipboardBannerVisible = Boolean(
    clipboardSuggestionDraft &&
      isSignedInInteractionReady &&
      !composerSheet.isPresented &&
      !isEntrySheetOpen &&
      !ledgerManagementSheet.isPresented,
  );
  const showsFloatingEntryButton =
    (currentScreen === "calendar" ||
      currentScreen === "all-entries" ||
      currentScreen === "charts" ||
      isClipboardBannerVisible) &&
    !isEntrySheetOpen &&
    !composerSheet.isPresented &&
    !ledgerManagementSheet.isPresented;
  useLedgerWidgetDeepLinks({
    enabled: isSignedInInteractionReady,
    onOpenClipboardImport: handleOpenClipboardImportFromWidget,
    onOpenEntry: navigateToEntryFromCalendar,
  });

  const handleOpenEntry = handleOpenEntryFromCalendar;
  const handleOpenSubscription = useCallback(() => {
    navigateToStackScreen("subscription");
  }, [navigateToStackScreen]);
  const menuSections = useMemo(
    () =>
      buildSettingsMenuSections({
        showAnnualReportDownload: Boolean(annualReport.bookName),
      }),
    [annualReport.bookName],
  );
  const footerBadgedScreens = useMemo<FooterTabScreen[]>(() => {
    return resolveFooterBadgeScreens(notificationBadges.snapshot);
  }, [notificationBadges.snapshot]);
  const badgedLedgerBookIds = useMemo(
    () => resolveBadgedBookIds(notificationBadges.snapshot),
    [notificationBadges.snapshot],
  );

  useAppNotificationRouting({
    currentScreen,
    isLedgerManagementOpen,
    ledgerState,
    notificationBadges,
    notifications,
    markEntryNotificationsRead,
    userId: session.user.id,
    navigateToStackScreen,
    returnToCalendarRoot,
  });

  const handleOpenYearPicker = () => {
    if (currentScreen === "calendar") setIsYearPickerOpen(true);
  };

  const handleCompleteNicknameOnboarding = async (displayName: string) => {
    try {
      const savedDisplayName = await updateOwnProfileDisplayName(session.user.id, displayName);
      authOnboarding.completeNicknameOnboarding(savedDisplayName || displayName);
      return true;
    } catch (error) {
      logAppError("App", error, {
        step: "complete_nickname_onboarding",
        userId: session.user.id,
      });
      return false;
    }
  };

  const handleSwitchAccountFromNickname = () => {
    Alert.alert("다른 계정으로 로그인할까요?", "로그아웃 후 로그인 화면으로 이동합니다.", [
      {
        style: "cancel",
        text: "취소",
      },
      {
        onPress: () => {
          void signOutFromApp().catch((error) => {
            logAppError("App", error, {
              step: "switch_account_from_nickname_onboarding",
              userId: session.user.id,
            });
            showNativeToast("로그아웃하지 못했어요. 다시 시도해 주세요.");
          });
        },
        style: "destructive",
        text: "다른 계정으로 로그인",
      },
    ]);
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
      showNativeToast("구독 관리 화면을 열지 못했어요.");
    }
  };

  const handleBeforeCopyShareCode = async () => {
    if (!showsAdMobAds) {
      return;
    }

    await showInterstitialAd(AdInterstitialPlacement.shareCodeCopy, { waitForLoad: true });
  };

  const handleBeforeSendJoinRequest = async () => {
    if (!showsAdMobAds) {
      return;
    }

    await showInterstitialAd(AdInterstitialPlacement.joinRequestSend);
  };

  const runEntrySaveSideEffects = createEntrySaveSideEffects({
    activeBook: ledgerState.activeBook,
    userId: session.user.id,
    fallbackDisplayName,
    notifications,
  });

  const handleSaveEntry = async (newDraft?: LedgerEntryDraft, sourceEntry?: LedgerEntry) => {
    if (
      entrySaveInProgress.current ||
      !ledgerState.activeBook ||
      ledgerState.isReadOnlyDueToPlanLimit ||
      !canSubmitDraft(newDraft ?? ledgerState.draft)
    )
      return false;
    entrySaveInProgress.current = true;
    const currentEntries = ledgerState.entries;
    const wasEditingEntry =
      Boolean(sourceEntry) || (!newDraft && Boolean(ledgerState.editingEntryId));
    try {
      if (!wasEditingEntry && !(await ensureAdBeforeSave())) return false;
      const savedEntries = await ledgerState.handleSaveEntry(newDraft, sourceEntry);
      if (savedEntries.length === 0) return false;
      void runEntrySaveSideEffects(
        savedEntries,
        currentEntries,
        wasEditingEntry ? "update" : "create",
        (newDraft ?? ledgerState.draft).date,
      );
      return true;
    } catch (error) {
      logAppError("App", error, {
        step: "save_entry",
      });
      showNativeToast(resolveLedgerSaveErrorMessage(error));
      return false;
    } finally {
      entrySaveInProgress.current = false;
    }
  };

  const handleEditEntryFromCalendar = (entry: LedgerEntry) => {
    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return;
    }

    setIsComposerVisible(true);
    entryComposerRef.current?.editEntry(entry);
  };

  const handleDuplicateEntry = (entry: LedgerEntry) => {
    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return;
    }
    setIsComposerVisible(true);
    entryComposerRef.current?.duplicateEntry(entry);
  };

  const handleEditEntryFromAllEntries = (entry: LedgerEntry) => {
    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return;
    }

    setIsComposerVisible(true);
    entryComposerRef.current?.editEntry(entry);
  };

  const handlePrepayInstallmentEntry = async (entry: LedgerEntry) => {
    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return false;
    }

    try {
      const prepaymentDate = toIsoDate(new Date());
      const preview = await ledgerState.previewInstallmentPrepayment(entry, prepaymentDate);
      if (!preview) {
        showNativeToast(EntryRegistrationCopy.installmentPrepaymentUnavailable);
        return false;
      }

      if (!(await confirmInstallmentPrepayment(preview))) {
        return false;
      }

      const result = await ledgerState.prepayInstallmentEntry(entry, prepaymentDate);
      if (!result) {
        showNativeToast(EntryRegistrationCopy.installmentPrepaymentUnavailable);
        return false;
      }

      showNativeToast(EntryRegistrationCopy.installmentPrepaymentSuccess);
      return true;
    } catch (error) {
      logAppError("App", error, {
        entryId: entry.id,
        installmentGroupId: entry.installmentGroupId,
        step: "prepay_installment_entry",
      });
      showNativeToast(
        isMissingInstallmentTransactionMigration(error)
          ? EntryRegistrationCopy.saveMigrationError
          : EntryRegistrationCopy.installmentPrepaymentError,
      );
      return false;
    }
  };

  const handleDeleteEntryFromCalendar = async (
    entry: LedgerEntry,
    scope: LedgerEntryDeleteScope,
  ) => {
    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return false;
    }

    try {
      const deletedEntries = await ledgerState.handleDeleteEntry(entry, scope);
      entryComposerRef.current?.discardDeletedEntry(deletedEntries);
      if (deletedEntries.length === 0) {
        showNativeToast(AppMessages.editorDeleteError);
        return false;
      }
    } catch (error) {
      logAppError("App", error, {
        entryId: entry.id,
        installmentGroupId: entry.installmentGroupId,
        scope,
        step: "delete_entry",
      });
      showNativeToast(
        isMissingInstallmentTransactionMigration(error)
          ? EntryRegistrationCopy.saveMigrationError
          : AppMessages.editorDeleteError,
      );
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (authOnboarding.step !== "nickname") {
      setIsNicknameScreenReady(false);
      return;
    }

    let timerId: ReturnType<typeof setTimeout> | null = null;
    const idleTask = scheduleIdleTask(() => {
      timerId = setTimeout(() => {
        setIsNicknameScreenReady(true);
      }, 220);
    });

    return () => {
      idleTask.cancel();
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [authOnboarding.step]);

  useInitialNotificationPermission({
    authOnboarding,
    notifications,
    isLedgerLoading: ledgerState.isLoading,
    hasSettledInitialAdTrackingPermission,
  });

  const renderScreenTitle = (screen: SignedInStackScreen, titleLabel?: string) => (
    <AppNativeHeaderTitle
      onPress={screen === "calendar" ? handleOpenYearPicker : undefined}
      title={
        titleLabel ??
        (screen === "calendar"
          ? `${formatYearLabel(ledgerState.visibleMonth)} ${formatMonthLabel(ledgerState.visibleMonth)}`
          : screen === "charts"
            ? ledgerState.currentChartMonth.title
            : getAppScreenLabel(screen))
      }
    />
  );

  if (authOnboarding.isLoading) {
    return (
      <SignedOutAppShell>
        <SessionLoadingScreen />
      </SignedOutAppShell>
    );
  }

  if (authOnboarding.errorMessage) {
    return (
      <SignedOutAppShell key="profile-error" onLayout={onSignedInLayout}>
        <StartupErrorScreen message={authOnboarding.errorMessage} onRetry={authOnboarding.retry} />
      </SignedOutAppShell>
    );
  }

  if (authOnboarding.step === "nickname") {
    return (
      <SignedOutAppShell key="nickname" onLayout={onSignedInLayout}>
        {isNicknameScreenReady ? (
          <NicknameSetupScreen
            accountEmail={session.user.email ?? null}
            onSubmit={handleCompleteNicknameOnboarding}
            onSwitchAccount={handleSwitchAccountFromNickname}
          />
        ) : (
          <OnboardingTransitionScreen />
        )}
      </SignedOutAppShell>
    );
  }

  return (
    <ExpenseTextColorProvider>
      <BottomContentInsetContext.Provider
        value={
          FooterTabBarUi.contentBottomGap +
          (appPlatform.os === "web" ? 0 : footerHeight) +
          (isClipboardBannerVisible
            ? clipboardBannerHeight + FloatingEntryButtonUi.footerGap
            : showsFloatingEntryButton
              ? FloatingEntryButtonUi.size + FloatingEntryButtonUi.footerGap
              : 0)
        }
      >
        <View onLayout={onSignedInLayout} style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <SafeAreaView edges={["left", "right"]} style={styles.bodySafeArea}>
            <View
              style={styles.body}
              accessibilityElementsHidden={
                composerSheet.isPresented || ledgerManagementSheet.isPresented
              }
              importantForAccessibility={
                composerSheet.isPresented || ledgerManagementSheet.isPresented
                  ? "no-hide-descendants"
                  : "auto"
              }
            >
              <View style={styles.navigationShell}>
                <NavigationContainer
                  onReady={syncCurrentRouteState}
                  onStateChange={syncCurrentRouteState}
                  ref={navigationRef}
                >
                  <SignedInTabNavigator
                    disabled={
                      !isSignedInNavigationReady ||
                      isEntrySheetOpen ||
                      composerSheet.isPresented ||
                      ledgerManagementSheet.isPresented
                    }
                    badges={footerBadgedScreens}
                    onFooterHeightChange={setFooterHeight}
                    accountProviderLabel={accountProviderLabel}
                    adTrackingPermissionState={adTrackingPermissionState}
                    calendarSummaryBaseDay={calendarSummaryModeSetting.calendarSummaryBaseDay}
                    calendarSummaryMode={calendarSummaryModeSetting.calendarSummaryMode}
                    email={session.user.email ?? ""}
                    fallbackDisplayName={fallbackDisplayName}
                    hasAvailablePlusPackage={subscription.hasAvailablePlusPackage}
                    isCalendarHeatmapEnabled={isCalendarHeatmapEnabled}
                    isPlusActive={subscription.isPlusActive}
                    ledgerState={ledgerState}
                    notificationPreferenceGroups={notifications.preferenceGroups}
                    notificationPermissionLabel={notifications.permissionLabel}
                    notificationPermissionState={notifications.permissionState}
                    notificationStatusMessage={notifications.statusMessage}
                    onChangeCalendarSummaryMode={
                      calendarSummaryModeSetting.updateCalendarSummaryMode
                    }
                    onChangeCalendarSummaryBaseDay={
                      calendarSummaryModeSetting.updateCalendarSummaryBaseDay
                    }
                    onChangeNotificationThreshold={notifications.updateThresholdValue}
                    onChangeNotificationThresholdEnabled={notifications.updateThresholdEnabled}
                    onChangeNotificationThresholdPeriod={notifications.updateThresholdPeriod}
                    onDeleteSelectedEntry={handleDeleteEntryFromCalendar}
                    onDiscardEntryDraft={discardEntryDraft}
                    onEditSelectedEntryFromAllEntries={handleEditEntryFromAllEntries}
                    onEditSelectedEntryFromCalendar={handleEditEntryFromCalendar}
                    onDuplicateEntry={handleDuplicateEntry}
                    onOpenAdTrackingSettings={handleOpenAdTrackingSettings}
                    onOpenSubscription={handleOpenSubscription}
                    onOpenSubscriptionManagement={handleOpenSubscriptionManagement}
                    onPurchasePlus={handlePurchasePlus}
                    onPurchaseSupportPackage={handlePurchaseSupportPackage}
                    onRequestAdTrackingPermission={handleRequestAdTrackingPermission}
                    onRequestNotificationPermission={notifications.requestNotifications}
                    onRestorePurchases={handleRestorePurchases}
                    onSaveEntry={handleSaveEntry}
                    onSelectCalendarDate={(isoDate) => {
                      ledgerState.handleSelectDate(isoDate);
                      handleOpenCalendar();
                    }}
                    onPrepayInstallmentEntry={handlePrepayInstallmentEntry}
                    onToggleCalendarHeatmap={calendarHeatmapSetting.updateCalendarHeatmapEnabled}
                    onToggleNotificationPreference={notifications.updatePreference}
                    plusPriceLabel={subscription.plusPriceLabel}
                    renderScreenTitle={renderScreenTitle}
                    menuSections={menuSections}
                    onSelectMenuItem={(item) => {
                      Keyboard.dismiss();
                      if ("action" in item) void annualReport.handleDownloadReport();
                      else navigateToStackScreen(item.targetScreen);
                    }}
                    renderLedgerBooks={() => (
                      <LedgerBooksScreen
                        state={ledgerState}
                        badgedBookIds={badgedLedgerBookIds}
                        onOpenSubscription={handleOpenSubscription}
                        onBeforeCopyShareCode={handleBeforeCopyShareCode}
                        onBeforeSendJoinRequest={handleBeforeSendJoinRequest}
                        onSendPendingJoinRequestNotification={
                          notifications.sendPendingJoinRequestNotification
                        }
                        onSendPushNotificationToBookMembers={
                          notifications.sendPushNotificationToBookMembers
                        }
                        onSendPushNotificationToUsers={notifications.sendPushNotificationToUsers}
                        subscriptionTier={subscription.currentTier}
                        userId={session.user.id}
                      />
                    )}
                    showAdTrackingPermissionCard={showAdTrackingPermissionCard}
                    showNotificationSettings={notifications.showNotificationSettings}
                    showsBannerAd={showsAdMobAds}
                    subscriptionTier={subscription.currentTier}
                    supportPackages={supportPackages.packages}
                    supportPackagesLoading={supportPackages.isLoading}
                    trackBlockingTask={trackBlockingTask}
                    userId={session.user.id}
                  />
                </NavigationContainer>
                {showsFloatingEntryButton ? (
                  <FloatingEntryButton
                    bottomInset={footerHeight}
                    expanded={isClipboardBannerVisible}
                    disabled={!isSignedInNavigationReady}
                    onPress={() => {
                      void handleOpenEntry();
                    }}
                  />
                ) : null}
              </View>
            </View>
            {isClipboardBannerVisible && clipboardSuggestionDraft ? (
              <ClipboardSuggestionBanner
                draft={clipboardSuggestionDraft}
                bottomInset={footerHeight}
                onLayout={(event) => setClipboardBannerHeight(event.nativeEvent.layout.height)}
                onApply={handleApplyClipboardSuggestion}
                onDismiss={handleDismissClipboardSuggestion}
              />
            ) : null}
            <EntryComposer
              ref={entryComposerRef}
              key={ledgerState.activeBook?.id ?? "no-book"}
              sheet={{
                visible: isComposerVisible,
                onClose: closeComposer,
                onDismiss: composerSheet.onDismiss,
              }}
              onDismissClipboard={handleDismissClipboardSuggestion}
              onReadClipboard={handlePasteClipboardDraft}
              bookId={ledgerState.activeBook?.id ?? null}
              selectedDate={ledgerState.selectedDate}
              userId={session.user.id}
              disabled={
                ledgerState.isReadOnlyDueToPlanLimit ||
                !isSignedInInteractionReady ||
                !ledgerState.activeBook
              }
              unavailableReason={
                ledgerState.isLoading || ledgerState.isBusy
                  ? undefined
                  : !ledgerState.activeBook
                    ? "no-book"
                    : ledgerState.isReadOnlyDueToPlanLimit
                      ? "read-only"
                      : undefined
              }
              onSelectBook={() => {
                if (entryComposerRef.current?.isSaving()) return;
                Keyboard.dismiss();
                composerSheet.closeAfterDismiss(() => setIsLedgerManagementOpen(true));
              }}
              onSave={handleSaveEntry}
              onComplete={() => setIsComposerVisible(false)}
              onConverted={() => {
                void ledgerState.refreshLedger(true);
              }}
            />
            <LedgerBookManagementSheet
              badgedBookIds={badgedLedgerBookIds}
              state={ledgerState}
              isOpen={isLedgerManagementOpen}
              onClose={() => setIsLedgerManagementOpen(false)}
              onDismiss={ledgerManagementSheet.onDismiss}
              onOpenSubscription={() =>
                ledgerManagementSheet.closeAfterDismiss(handleOpenSubscription)
              }
              onBeforeCopyShareCode={handleBeforeCopyShareCode}
              onBeforeSendJoinRequest={handleBeforeSendJoinRequest}
              onSendPendingJoinRequestNotification={
                notifications.sendPendingJoinRequestNotification
              }
              onSendPushNotificationToBookMembers={notifications.sendPushNotificationToBookMembers}
              onSendPushNotificationToUsers={notifications.sendPushNotificationToUsers}
              subscriptionTier={subscription.currentTier}
              userId={session.user.id}
            />
            <NativeYearPickerModal
              isOpen={currentScreen === "calendar" && appPlatform.isIOS && isYearPickerOpen}
              onClose={() => setIsYearPickerOpen(false)}
              onSelectDate={ledgerState.handleSelectDate}
              selectedDate={ledgerState.selectedDate}
            />
            <AnnualReportRangePickerModal
              selectedYear={annualReport.periodSelection?.selectedYear ?? null}
              onSelectPeriod={annualReport.handleSelectPeriod}
              disabled={annualReport.isDownloading}
              endDate={annualReport.customRangeDraft?.endDate ?? ledgerState.selectedDate}
              isOpen={Boolean(
                annualReport.periodSelection || annualReport.customRangeDraft?.isOpen,
              )}
              onClose={
                annualReport.periodSelection
                  ? annualReport.handleClosePeriodPicker
                  : annualReport.handleCloseCustomRangePicker
              }
              onConfirm={annualReport.handleConfirmCustomRange}
              startDate={annualReport.customRangeDraft?.startDate ?? ledgerState.selectedDate}
            />
          </SafeAreaView>
          {blockingTaskCount > 0 || ledgerState.isBusy || annualReport.isDownloading ? (
            <BlockingOverlay />
          ) : null}
        </View>
      </BottomContentInsetContext.Provider>
    </ExpenseTextColorProvider>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  topSafeArea: {
    backgroundColor: AppColors.screenBackground,
  },
  bodySafeArea: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  body: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  navigationShell: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  signedOutSafeArea: {
    backgroundColor: AppColors.screenBackground,
  },
  signedOutBodySafeArea: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  signedOutBody: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
});
