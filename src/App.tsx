import { FloatingEntryButton } from "./components/FloatingEntryButton";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import type { Session } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, AppState, Keyboard, StatusBar, StyleSheet, View } from "react-native";
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
import { CardSmsClipboardCopy } from "./constants/cardSmsClipboard";
import { AppColors } from "./constants/colors";
import { EntryRegistrationCopy } from "./constants/entryRegistration";
import { InitialPermissionTiming } from "./constants/initialPermissions";
import { AppLayout } from "./constants/layout";
import { formatMonthLabel, formatYearLabel } from "./constants/ledgerDisplay";
import { FooterTabBarUi, FloatingEntryButtonUi } from "./constants/menu";
import { AppMessages } from "./constants/messages";
import { NotificationBadgeScopes } from "./constants/notificationBadges";
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
import { applyAdTrackingPermissionToAdRequests } from "./lib/ads/adRequestOptions";
import { preloadInterstitialAd, showInterstitialAd } from "./lib/ads/interstitialAd";
import { ensureMobileAdsInitialized } from "./lib/ads/mobileAds";
import { preloadRewardedInterstitialAd } from "./lib/ads/rewardedInterstitialAd";
import {
  type AdTrackingPermissionState,
  isAdTrackingPermissionSupported,
  openAdTrackingSettings,
  readAdTrackingPermissionState,
  requestAdTrackingPermission,
  requestAdTrackingPermissionIfNeeded,
} from "./lib/ads/trackingTransparency";
import { appPlatform } from "./lib/appPlatform";
import { getAppScreenLabel } from "./lib/appScreenLabels";
import { installAppTextDefaults } from "./lib/appTextDefaults";
import { signOutFromApp } from "./lib/auth/signOut";
import { resolveSessionAuthProvider, resolveSessionAuthProviderLabel } from "./lib/authProvider";
import {
  type CardSmsClipboardDraft,
  readCardSmsClipboardDraft,
} from "./lib/cardSmsClipboardImport";
import { type FooterTabScreen } from "./lib/footerTabs";
import { scheduleIdleTask } from "./lib/idleScheduler";
import { logAppError } from "./lib/logAppError";
import { buildSettingsMenuSections } from "./lib/menuItems";
import { showNativeToast } from "./lib/nativeToast";
import { resolveEntryNotificationReadTarget } from "./lib/notifications/entryNotificationReads";
import { sendEntrySaveNotifications } from "./lib/notifications/entrySaveNotifications";
import { resolveNotificationActionRoute } from "./lib/notifications/notificationActions";
import {
  canMarkNotificationBadgeScopeRead,
  resolveBadgedBookIds,
  resolveBookNotificationBadgeCount,
  resolveFooterBadgeScreens,
} from "./lib/notifications/notificationBadges";
import {
  fetchOwnProfileDisplayName,
  syncOwnProfileDisplayNameIfMissing,
  updateOwnProfileDisplayName,
} from "./lib/profiles";
import { createScopedClipboardReader } from "./lib/scopedClipboardReader";
import { openSubscriptionManagement } from "./lib/subscription/openSubscriptionManagement";
import { isSubscriptionPurchaseCancelled } from "./lib/subscription/subscriptionError";
import { registerLedgerWidgetNotificationSync } from "./lib/widgetNotificationSync";
import { fetchLedgerWidgetSummary } from "./lib/widgetSummary";
import { createOtherMemberCreatedEntryEvent } from "./notifications/domain/notificationEventFactories";
import { AuthScreen } from "./screens/AuthScreen";
import { NicknameSetupScreen } from "./screens/NicknameSetupScreen";
import { PasswordResetScreen } from "./screens/PasswordResetScreen";
import type { LedgerAppScreen } from "./types/app";
import type { LedgerEntry, LedgerEntryDraft } from "./types/ledger";
import type { LedgerEntryDeleteScope } from "./types/ledgerEntryDeletion";
import { getMonthKey, toIsoDate } from "./utils/calendar";
import { canSubmitDraft, createDraft } from "./utils/ledgerEntries";
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

function SignedOutAppShell({ children, onLayout }: {
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
  const lastHandledClipboardRef = useRef<string | null>(null);
  const clipboardReadInFlightRef = useRef(false);
  const clipboardPasteInFlightRef = useRef(false);
  const hasScheduledInitialPermissionRequestRef = useRef(false);
  const hasStartedInitialPermissionRequestRef = useRef(false);
  const permissionRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingClipboardCheckRef = useRef(true);
  const [clipboardCheckRevision, setClipboardCheckRevision] = useState(0);
  const previousClipboardImportAppStateRef = useRef(AppState.currentState);
  const lastReadNotificationBadgeScreenKeyRef = useRef<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<LedgerAppScreen>("calendar");
  const [isEntrySheetOpen, setIsEntrySheetOpen] = useState(false);
  const ledgerManagementSheet = useSheetTransition();
  const isLedgerManagementOpen = ledgerManagementSheet.isOpen;
  const setIsLedgerManagementOpen = ledgerManagementSheet.setOpen;
  const [footerHeight, setFooterHeight] = useState(0);
  const [clipboardBannerHeight, setClipboardBannerHeight] = useState(0);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [isNicknameScreenReady, setIsNicknameScreenReady] = useState(false);
  const [clipboardSuggestionDraft, setClipboardSuggestionDraft] = useState<CardSmsClipboardDraft | null>(
    null,
  );
  const [blockingTaskCount, setBlockingTaskCount] = useState(0);
  const [adTrackingPermissionState, setAdTrackingPermissionState] =
    useState<AdTrackingPermissionState>("unavailable");
  const [hasSettledInitialAdTrackingPermission, setHasSettledInitialAdTrackingPermission] =
    useState(false);
  const [isMobileAdsReady, setIsMobileAdsReady] = useState(false);
  const authProvider = resolveSessionAuthProvider(session);
  const metadataDisplayName = resolveFallbackDisplayName(
    session.user.user_metadata,
    session.user.email,
  );
  const fallbackDisplayName =
    metadataDisplayName || (authProvider === "apple" ? "사용자" : "");
  const accountProviderLabel = resolveSessionAuthProviderLabel(session);
  const notifications = useLedgerNotifications(session.user.id);
  const calendarHeatmapSetting = useCalendarHeatmapSetting();
  const calendarSummaryModeSetting = useCalendarSummaryModeSetting();
  const subscription = useSubscriptionPlan(session.user.id);
  const isCalendarHeatmapEnabled =
    subscription.isPlusActive && calendarHeatmapSetting.isCalendarHeatmapEnabled;
  const shouldServeAdMobAds =
    !subscription.isLoading && subscription.currentTier === SubscriptionTiers.free;
  const showsAdMobAds = shouldServeAdMobAds && isMobileAdsReady;
  const showAdTrackingPermissionCard =
    shouldServeAdMobAds &&
    isAdTrackingPermissionSupported() &&
    (adTrackingPermissionState === "not-determined" || adTrackingPermissionState === "denied");
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
    userId: session.user.id,
  });
  const onSignedInLayout = useDismissStartupSplash(
    !authOnboarding.isLoading &&
      (authOnboarding.step !== "nickname" || isNicknameScreenReady),
  );
  const isSignedInNavigationReady =
    !authOnboarding.isLoading &&
    !authOnboarding.errorMessage &&
    authOnboarding.step === null &&
    !subscription.isLoading &&
    !ledgerState.isBusy;
  const isSignedInInteractionReady = isSignedInNavigationReady && !ledgerState.isLoading;
  const isClipboardBannerVisible = Boolean(clipboardSuggestionDraft && isSignedInInteractionReady &&
    !composerSheet.isPresented && !isEntrySheetOpen && !ledgerManagementSheet.isPresented);
  const showsFloatingEntryButton =
    (currentScreen === "calendar" || currentScreen === "all-entries" || currentScreen === "charts" || isClipboardBannerVisible) &&
    !isEntrySheetOpen && !composerSheet.isPresented && !ledgerManagementSheet.isPresented;
  const markEntryNotificationsRead = useEntryNotificationReads(
    isSignedInInteractionReady && currentScreen === "calendar" &&
      !isEntrySheetOpen && !isLedgerManagementOpen,
    ledgerState,
    notificationBadges.refresh,
  );

  useEffect(() => {
    if (authProvider !== "apple" || metadataDisplayName) {
      return;
    }

    void syncOwnProfileDisplayNameIfMissing(
      session.user.id,
      "사용자",
    ).catch((error) => {
      logAppError("App", error, {
        step: "sync_apple_default_display_name",
        userId: session.user.id,
      });
    });
  }, [authProvider, metadataDisplayName, session.user.id]);

  useEffect(() => {
    if (!isAdTrackingPermissionSupported()) {
      return;
    }

    const syncAdTrackingPermissionState = () => {
      void readAdTrackingPermissionState()
        .then((nextPermissionState) => {
          setAdTrackingPermissionState(nextPermissionState);
          applyAdTrackingPermissionToAdRequests(nextPermissionState);
        })
        .catch((error) => {
          logAppError("App", error, {
            step: "read_ad_tracking_permission_state",
          });
        });
    };

    syncAdTrackingPermissionState();

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncAdTrackingPermissionState();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (subscription.isLoading) {
      setIsMobileAdsReady(false);
      setHasSettledInitialAdTrackingPermission(false);
      return () => {
        isMounted = false;
      };
    }

    if (!shouldServeAdMobAds) {
      setIsMobileAdsReady(false);
      setHasSettledInitialAdTrackingPermission(true);
      return () => {
        isMounted = false;
      };
    }

    setIsMobileAdsReady(false);
    setHasSettledInitialAdTrackingPermission(false);

    void requestAdTrackingPermissionIfNeeded()
      .then(async (nextPermissionState) => {
        applyAdTrackingPermissionToAdRequests(nextPermissionState);
        if (isMounted) {
          setAdTrackingPermissionState(nextPermissionState);
          setHasSettledInitialAdTrackingPermission(true);
        }

        await ensureMobileAdsInitialized();

        if (isMounted) {
          setIsMobileAdsReady(true);
          preloadInterstitialAd();
          preloadRewardedInterstitialAd();
        }
      })
      .catch((error) => {
        logAppError("App", error, {
          step: "initialize_mobile_ads_with_tracking_permission",
        });
        if (isMounted) {
          setHasSettledInitialAdTrackingPermission(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shouldServeAdMobAds, subscription.isLoading]);

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

  const clipboardScopeRef = useRef<string | null>(null);
  const clipboardDetectionMountedRef = useRef(true);
  const clipboardScope = isSignedInInteractionReady && !ledgerState.isReadOnlyDueToPlanLimit
    ? ledgerState.activeBook?.id ?? null : null;
  clipboardScopeRef.current = clipboardScope;
  const clipboardReader = useMemo(() => createScopedClipboardReader<CardSmsClipboardDraft | null>(), []);
  const readAvailableCardSmsClipboardDraft = useCallback(
    () => {
      const scope = clipboardScopeRef.current;
      if (!scope) return Promise.resolve(null);
      return clipboardReader(scope, () => readCardSmsClipboardDraft({
        baseDate: new Date(),
        shouldIgnoreDraft: shouldIgnoreCardSmsClipboardDraft,
      }));
    },
    [clipboardReader, shouldIgnoreCardSmsClipboardDraft],
  );

  useEffect(() => {
    setClipboardSuggestionDraft(null);
    if (clipboardScope) pendingClipboardCheckRef.current = true;
  }, [clipboardScope]);
  useEffect(() => {
    clipboardDetectionMountedRef.current = true;
    return () => { clipboardDetectionMountedRef.current = false; };
  }, []);
  useEffect(() => {
    Keyboard.dismiss();
    setIsComposerVisible(false);
  }, [ledgerState.activeBook?.id]);

  const entrySaveInProgress = useRef(false);
  const { ensureAdBeforeSave } = useDailyFirstEntryAd({
    userId: session.user.id,
    bookId: ledgerState.activeBook?.id ?? null,
    isReady: isMobileAdsReady && isSignedInInteractionReady && !isLedgerManagementOpen,
    isSubscriptionLoading: subscription.isLoading,
    isFree: subscription.currentTier === SubscriptionTiers.free,
  });

  const handleOpenCardSmsClipboardDraft = useCallback(
    (clipboardDraft: CardSmsClipboardDraft) => {
      if (ledgerState.isReadOnlyDueToPlanLimit) {
        handleReadOnlyEditBlocked();
        return;
      }

      const draftToEdit = buildCardSmsClipboardLedgerEntryDraft({
        clipboardDraft,
        fallbackDate: ledgerState.selectedDate,
        userId: session.user.id,
      });
      lastHandledClipboardRef.current = JSON.stringify(clipboardDraft);
      setIsComposerVisible(true);
      entryComposerRef.current?.importDraft(draftToEdit);
    },
    [handleReadOnlyEditBlocked, ledgerState, returnToCalendarRoot, session.user.id],
  );

  const handleImportCardSmsClipboardDraft = useCallback(async () => {
    if (!isSignedInInteractionReady) {
      return;
    }

    const scope = clipboardScopeRef.current;
    if (!scope) return;
    const clipboardDraft = await readAvailableCardSmsClipboardDraft();
    if (scope !== clipboardScopeRef.current) return;
    if (!clipboardDraft) {
      setClipboardSuggestionDraft(null);
      navigateToEntryFromCalendar();
      return;
    }

    setClipboardSuggestionDraft(null);
    handleOpenCardSmsClipboardDraft(clipboardDraft);
  }, [
    handleOpenCardSmsClipboardDraft,
    isSignedInInteractionReady,
    navigateToEntryFromCalendar,
    readAvailableCardSmsClipboardDraft,
  ]);

  const handleOpenEntryFromCalendar = useCallback(async () => {
    if (!isSignedInInteractionReady) {
      return;
    }

    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return;
    }

    navigateToEntryFromCalendar();
    const scope = clipboardScopeRef.current;
    if (!scope) return;
    const clipboardDraft = await readAvailableCardSmsClipboardDraft();
    if (scope !== clipboardScopeRef.current) return;
    setClipboardSuggestionDraft(clipboardDraft);
  }, [
    handleReadOnlyEditBlocked,
    isSignedInInteractionReady,
    ledgerState.isReadOnlyDueToPlanLimit,
    navigateToEntryFromCalendar,
    readAvailableCardSmsClipboardDraft,
    returnToCalendarRoot,
  ]);

  const handlePasteClipboardDraft = useCallback(async () => {
    const scope = clipboardScopeRef.current;
    if (!scope || clipboardPasteInFlightRef.current) return;
    clipboardPasteInFlightRef.current = true;
    try {
      const draft = await readAvailableCardSmsClipboardDraft();
      if (scope !== clipboardScopeRef.current || !composerVisibleRef.current) return;
      setClipboardSuggestionDraft(null);
      if (draft) handleOpenCardSmsClipboardDraft(draft);
      else showNativeToast(CardSmsClipboardCopy.noAvailableEntry);
    } finally {
      clipboardPasteInFlightRef.current = false;
    }
  }, [handleOpenCardSmsClipboardDraft, readAvailableCardSmsClipboardDraft]);

  const handleDetectClipboardSuggestion = useCallback(async () => {
    const scope = clipboardScopeRef.current;
    if (
      !scope ||
      AppState.currentState !== "active" ||
      !isSignedInInteractionReady ||
      ledgerState.isReadOnlyDueToPlanLimit ||
      navigationRef.getCurrentRoute()?.name === "entry-sheet" ||
      composerVisibleRef.current ||
      clipboardSuggestionDraft ||
      entryComposerRef.current?.isBusy() ||
      clipboardReadInFlightRef.current
    ) {
      return;
    }

    pendingClipboardCheckRef.current = false;
    clipboardReadInFlightRef.current = true;
    try {
      const clipboardDraft = await readAvailableCardSmsClipboardDraft();
      if (!clipboardDetectionMountedRef.current) return;
      if (AppState.currentState !== "active") {
        pendingClipboardCheckRef.current = true;
        return;
      }
      if (scope !== clipboardScopeRef.current || !clipboardDraft || entryComposerRef.current?.isBusy() ||
        JSON.stringify(clipboardDraft) === lastHandledClipboardRef.current) return;
      setClipboardSuggestionDraft(clipboardDraft);
    } finally {
      clipboardReadInFlightRef.current = false;
      if (clipboardDetectionMountedRef.current && pendingClipboardCheckRef.current && clipboardScopeRef.current && AppState.currentState === "active") {
        setClipboardCheckRevision(revision => revision + 1);
      }
    }
  }, [
    clipboardSuggestionDraft,
    isSignedInInteractionReady,
    ledgerState.isReadOnlyDueToPlanLimit,
    navigationRef,
    readAvailableCardSmsClipboardDraft,
  ]);

  useEffect(() => {
    if (!pendingClipboardCheckRef.current || !clipboardScope || !isSignedInInteractionReady || AppState.currentState !== "active") {
      return;
    }

    void handleDetectClipboardSuggestion();
  }, [handleDetectClipboardSuggestion, isSignedInInteractionReady, clipboardScope, clipboardCheckRevision, composerSheet.isPresented, isEntrySheetOpen]);

  useEffect(() => {
    if (isSignedInInteractionReady) {
      return;
    }

    setClipboardSuggestionDraft(null);
  }, [isSignedInInteractionReady]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      const previousState = previousClipboardImportAppStateRef.current;
      previousClipboardImportAppStateRef.current = nextState;

      if (previousState === "active" || nextState !== "active") {
        return;
      }

      pendingClipboardCheckRef.current = true;
      if (!isSignedInInteractionReady) return;
      void handleDetectClipboardSuggestion();
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [handleDetectClipboardSuggestion, isSignedInInteractionReady]);

  const handleDismissClipboardSuggestion = useCallback(() => {
    if (clipboardSuggestionDraft) lastHandledClipboardRef.current = JSON.stringify(clipboardSuggestionDraft);
    setClipboardSuggestionDraft(null);
  }, [clipboardSuggestionDraft]);

  const handleApplyClipboardSuggestion = useCallback(() => {
    if (!clipboardSuggestionDraft) {
      return;
    }

    const clipboardDraft = clipboardSuggestionDraft;
    setClipboardSuggestionDraft(null);
    handleOpenCardSmsClipboardDraft(clipboardDraft);
  }, [clipboardSuggestionDraft, handleOpenCardSmsClipboardDraft]);

  const handleOpenClipboardImportFromWidget = useCallback(() => {
    void handleImportCardSmsClipboardDraft();
  }, [handleImportCardSmsClipboardDraft]);

  useLedgerWidgetDeepLinks({
    enabled: isSignedInInteractionReady,
    onOpenClipboardImport: handleOpenClipboardImportFromWidget,
    onOpenEntry: navigateToEntryFromCalendar,
  });

  const handleOpenEntry = handleOpenEntryFromCalendar;
  const handleOpenSubscription = useCallback(() => {
    navigateToStackScreen("subscription");
  }, [navigateToStackScreen]);
  const menuSections = useMemo(() => buildSettingsMenuSections({
    showAnnualReportDownload: Boolean(annualReport.bookName),
  }), [annualReport.bookName]);
  const footerBadgedScreens = useMemo<FooterTabScreen[]>(() => {
    return resolveFooterBadgeScreens(notificationBadges.snapshot);
  }, [notificationBadges.snapshot]);
  const badgedLedgerBookIds = useMemo(
    () => resolveBadgedBookIds(notificationBadges.snapshot),
    [notificationBadges.snapshot],
  );

  useEffect(() => {
    if (!notificationBadges.hasResolved) {
      return;
    }

    void Notifications.setBadgeCountAsync(notificationBadges.snapshot.totalUnreadCount).catch(
      (error) => {
        logAppError("App", error, {
          step: "set_notification_badge_count",
        });
      },
    );
  }, [
    notificationBadges.hasResolved,
    notificationBadges.snapshot.totalUnreadCount,
    notificationBadges.syncRevision,
  ]);

  useEffect(() => {
    const activeBook = ledgerState.activeBook;
    const targetScope =
      (isLedgerManagementOpen || currentScreen === "share")
        ? NotificationBadgeScopes.joinRequests
        : currentScreen === "all-entries"
          ? NotificationBadgeScopes.ledgerEntries
          : null;
    const canMarkRead =
      activeBook &&
      targetScope &&
      canMarkNotificationBadgeScopeRead(
        targetScope,
        activeBook.ownerId === session.user.id,
      );
    if (!activeBook || !targetScope || !canMarkRead) {
      lastReadNotificationBadgeScreenKeyRef.current = null;
      return;
    }

    const activeBookId = activeBook.id;
    const unreadCount = resolveBookNotificationBadgeCount(
      notificationBadges.snapshot,
      activeBookId,
      targetScope,
    );
    const screenKey = `${activeBookId}:${targetScope}`;
    if (lastReadNotificationBadgeScreenKeyRef.current === screenKey && unreadCount === 0) {
      return;
    }

    lastReadNotificationBadgeScreenKeyRef.current = screenKey;
    void notificationBadges.markRead(activeBookId, targetScope).then((didMarkRead) => {
      if (!didMarkRead && lastReadNotificationBadgeScreenKeyRef.current === screenKey) {
        lastReadNotificationBadgeScreenKeyRef.current = null;
      }
    });
  }, [
    currentScreen,
    isLedgerManagementOpen,
    ledgerState.activeBook?.id,
    ledgerState.activeBook?.ownerId,
    notificationBadges.markRead,
    notificationBadges.snapshot,
    session.user.id,
  ]);

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
    Alert.alert(
      "다른 계정으로 로그인할까요?",
      "로그아웃 후 로그인 화면으로 이동합니다.",
      [
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
      ],
    );
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

  const handleRequestAdTrackingPermission = useCallback(() => {
    void requestAdTrackingPermission()
      .then((nextPermissionState) => {
        setAdTrackingPermissionState(nextPermissionState);
        applyAdTrackingPermissionToAdRequests(nextPermissionState);
      })
      .catch((error) => {
        logAppError("App", error, {
          step: "request_ad_tracking_permission",
        });
      });
  }, []);

  const handleOpenAdTrackingSettings = useCallback(() => {
    void openAdTrackingSettings().catch((error) => {
      logAppError("App", error, {
        step: "open_ad_tracking_settings",
      });
    });
  }, []);

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

  const handleSaveEntry = async (newDraft?: LedgerEntryDraft, sourceEntry?: LedgerEntry) => {
    if (entrySaveInProgress.current || !ledgerState.activeBook || ledgerState.isReadOnlyDueToPlanLimit ||
        !canSubmitDraft(newDraft ?? ledgerState.draft)) return false;
    entrySaveInProgress.current = true;
    const currentEntries = ledgerState.entries;
    const wasEditingEntry = Boolean(sourceEntry) || (!newDraft && Boolean(ledgerState.editingEntryId));
    try {
      if (!wasEditingEntry && !await ensureAdBeforeSave()) return false;
      const savedEntries = await ledgerState.handleSaveEntry(newDraft, sourceEntry);
      if (savedEntries.length === 0) return false;
      void runEntrySaveSideEffects(
        savedEntries, currentEntries, wasEditingEntry ? "update" : "create",
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

      for (const deletedEntry of deletedEntries) {
        void runEntryDeleteSideEffects(deletedEntry);
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
    void notifications.registerActionCategories().catch((error) => {
      logAppError("App", error, {
        step: "register_notification_action_categories",
      });
    });
  }, [notifications.registerActionCategories]);

  useEffect(() => {
    const clearLastNotificationResponse = () => {
      try {
        Notifications.clearLastNotificationResponse();
      } catch (error) {
        logAppError("App", error, {
          step: "clear_last_notification_response",
        });
      }
    };

    const handleNotificationReceived = () => {
      void notificationBadges.refresh();
    };

    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      const readTarget = resolveEntryNotificationReadTarget(data);
      if (readTarget) {
        void markEntryNotificationsRead(readTarget.bookId, [readTarget.entryId]);
      } else {
        void notificationBadges.refresh();
      }
      clearLastNotificationResponse();
      const targetScreen = resolveNotificationActionRoute(
        response.actionIdentifier,
        response.notification.request.content.data,
      );

      if (targetScreen === "calendar") {
        returnToCalendarRoot();
        return;
      }

      navigateToStackScreen(targetScreen);
    };

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      handleNotificationReceived,
    );
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          handleNotificationResponse(response);
        }
      })
      .catch((error) => {
        logAppError("App", error, {
          step: "get_last_notification_response",
        });
      });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [markEntryNotificationsRead, navigateToStackScreen, notificationBadges.refresh, returnToCalendarRoot]);

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

  useEffect(
    () => () => {
      if (permissionRequestTimeoutRef.current) {
        clearTimeout(permissionRequestTimeoutRef.current);
        permissionRequestTimeoutRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (
      authOnboarding.hasCompletedPermissionOnboarding ||
      notifications.permissionState === "default" ||
      notifications.permissionState === "unsupported"
    ) {
      return;
    }

    authOnboarding.completePermissionOnboarding();
  }, [
    authOnboarding.completePermissionOnboarding,
    authOnboarding.hasCompletedPermissionOnboarding,
    notifications.permissionState,
  ]);

  useEffect(() => {
    if (
      authOnboarding.isLoading ||
      authOnboarding.errorMessage ||
      authOnboarding.step !== null ||
      authOnboarding.hasCompletedPermissionOnboarding ||
      !notifications.isSupported ||
      notifications.permissionState !== "default" ||
      ledgerState.isLoading ||
      !hasSettledInitialAdTrackingPermission ||
      hasScheduledInitialPermissionRequestRef.current
    ) {
      return;
    }

    hasScheduledInitialPermissionRequestRef.current = true;
    const idleTask = scheduleIdleTask(() => {
      permissionRequestTimeoutRef.current = setTimeout(() => {
        permissionRequestTimeoutRef.current = null;
        hasStartedInitialPermissionRequestRef.current = true;
        void notifications
          .requestNotifications()
          .finally(authOnboarding.completePermissionOnboarding);
      }, InitialPermissionTiming.notificationRequestDelayMs);
    });

    return () => {
      idleTask.cancel();
      if (permissionRequestTimeoutRef.current) {
        clearTimeout(permissionRequestTimeoutRef.current);
        permissionRequestTimeoutRef.current = null;
      }

      if (!hasStartedInitialPermissionRequestRef.current) {
        hasScheduledInitialPermissionRequestRef.current = false;
      }
    };
  }, [
    authOnboarding.completePermissionOnboarding,
    authOnboarding.hasCompletedPermissionOnboarding,
    authOnboarding.isLoading,
    authOnboarding.errorMessage,
    authOnboarding.step,
    hasSettledInitialAdTrackingPermission,
    ledgerState.isLoading,
    notifications.isSupported,
    notifications.permissionState,
    notifications.requestNotifications,
  ]);

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
      <BottomContentInsetContext.Provider value={FooterTabBarUi.contentBottomGap + (appPlatform.os === "web" ? 0 : footerHeight)
        + (isClipboardBannerVisible ? clipboardBannerHeight + FloatingEntryButtonUi.footerGap
          : showsFloatingEntryButton ? FloatingEntryButtonUi.size + FloatingEntryButtonUi.footerGap : 0)}>
      <View onLayout={onSignedInLayout} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["left", "right"]} style={styles.bodySafeArea}>

        <View style={styles.body} accessibilityElementsHidden={composerSheet.isPresented || ledgerManagementSheet.isPresented}
          importantForAccessibility={composerSheet.isPresented || ledgerManagementSheet.isPresented ? "no-hide-descendants" : "auto"}>
          <View style={styles.navigationShell}>
            <NavigationContainer
              onReady={syncCurrentRouteState}
              onStateChange={syncCurrentRouteState}
              ref={navigationRef}
            >
              <SignedInTabNavigator
                disabled={!isSignedInNavigationReady || isEntrySheetOpen || composerSheet.isPresented || ledgerManagementSheet.isPresented}
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
                renderLedgerBooks={() => <LedgerBooksScreen
                  state={ledgerState} badgedBookIds={badgedLedgerBookIds}
                  onOpenSubscription={handleOpenSubscription}
                  onBeforeCopyShareCode={handleBeforeCopyShareCode}
                  onBeforeSendJoinRequest={handleBeforeSendJoinRequest}
                  onSendPendingJoinRequestNotification={notifications.sendPendingJoinRequestNotification}
                  onSendPushNotificationToBookMembers={notifications.sendPushNotificationToBookMembers}
                  onSendPushNotificationToUsers={notifications.sendPushNotificationToUsers}
                  subscriptionTier={subscription.currentTier} userId={session.user.id} /> }
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
                onPress={() => { void handleOpenEntry(); }} />
            ) : null}
          </View>


        </View>
        {isClipboardBannerVisible && clipboardSuggestionDraft ? <ClipboardSuggestionBanner
          draft={clipboardSuggestionDraft} bottomInset={footerHeight}
          onLayout={event => setClipboardBannerHeight(event.nativeEvent.layout.height)}
          onApply={handleApplyClipboardSuggestion} onDismiss={handleDismissClipboardSuggestion} /> : null}
              <EntryComposer ref={entryComposerRef} key={ledgerState.activeBook?.id ?? "no-book"}
                sheet={{ visible: isComposerVisible, onClose: closeComposer, onDismiss: composerSheet.onDismiss }}
                onDismissClipboard={handleDismissClipboardSuggestion}
                onReadClipboard={handlePasteClipboardDraft}
                bookId={ledgerState.activeBook?.id ?? null} selectedDate={ledgerState.selectedDate}
                userId={session.user.id} disabled={ledgerState.isReadOnlyDueToPlanLimit || !isSignedInInteractionReady || !ledgerState.activeBook}
                unavailableReason={ledgerState.isLoading || ledgerState.isBusy ? undefined
                  : !ledgerState.activeBook ? "no-book"
                  : ledgerState.isReadOnlyDueToPlanLimit ? "read-only" : undefined}
                onSelectBook={() => {
                  if (entryComposerRef.current?.isSaving()) return;
                  Keyboard.dismiss();
                  composerSheet.closeAfterDismiss(() => setIsLedgerManagementOpen(true));
                }}
                onSave={handleSaveEntry} onComplete={() => setIsComposerVisible(false)}
                onConverted={() => { void ledgerState.refreshLedger(true); }} />
        <LedgerBookManagementSheet
          badgedBookIds={badgedLedgerBookIds}
          state={ledgerState}
          isOpen={isLedgerManagementOpen}
          onClose={() => setIsLedgerManagementOpen(false)}
          onDismiss={ledgerManagementSheet.onDismiss}
          onOpenSubscription={() => ledgerManagementSheet.closeAfterDismiss(handleOpenSubscription)}
          onBeforeCopyShareCode={handleBeforeCopyShareCode}
          onBeforeSendJoinRequest={handleBeforeSendJoinRequest}
          onSendPendingJoinRequestNotification={notifications.sendPendingJoinRequestNotification}
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
          isOpen={Boolean(annualReport.periodSelection || annualReport.customRangeDraft?.isOpen)}
          onClose={annualReport.periodSelection
            ? annualReport.handleClosePeriodPicker : annualReport.handleCloseCustomRangePicker}
          onConfirm={annualReport.handleConfirmCustomRange}
          startDate={annualReport.customRangeDraft?.startDate ?? ledgerState.selectedDate}
        />
      </SafeAreaView>
      {blockingTaskCount > 0 ||
      ledgerState.isBusy ||
      annualReport.isDownloading ? (
        <BlockingOverlay />
      ) : null}
      </View>
      </BottomContentInsetContext.Provider>
    </ExpenseTextColorProvider>
  );

  async function notifySharedLedgerEntryChange(
    savedEntry: LedgerEntry,
    widget?: Awaited<ReturnType<typeof resolveCurrentLedgerWidgetPushSummary>>,
  ) {
    if (!ledgerState.activeBook) {
      return;
    }

    const actorName = await resolveCurrentActorName();
    const event = createOtherMemberCreatedEntryEvent(
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
    targetDate: string,
  ) {
    const currentMonthEntries = savedEntries.filter((entry) => entry.date === targetDate);
    const lastEntry = currentMonthEntries[currentMonthEntries.length - 1];
    await sendEntrySaveNotifications({
      entries: changeType === "create" ? currentMonthEntries : [],
      notifyThreshold: async () => {
        if (lastEntry) {
          await notifications.notifySavedEntry(lastEntry, currentEntries);
        }
      },
      loadWidget: async () =>
        ledgerState.activeBook
          ? resolveCurrentLedgerWidgetPushSummary(ledgerState.activeBook.id)
          : undefined,
      notifyMember: notifySharedLedgerEntryChange,
      onError: (error, step) =>
        logAppError("App", error, {
          changeType,
          entryCount: savedEntries.length,
          step,
        }),
    });
  }

  async function runEntryDeleteSideEffects(_deletedEntry: LedgerEntry) {}
}

function buildCardSmsClipboardLedgerEntryDraft({
  clipboardDraft,
  fallbackDate,
  userId,
}: {
  clipboardDraft: CardSmsClipboardDraft;
  fallbackDate: string;
  userId: string;
}): LedgerEntryDraft {
  const draftDate = clipboardDraft.date ?? fallbackDate;

  return {
    ...createDraft(draftDate, userId),
    amount: clipboardDraft.amount,
    content: clipboardDraft.content,
    type: clipboardDraft.type,
  };
}

function resolveLedgerSaveErrorMessage(error: unknown): string {
  const errorText = extractLedgerSaveErrorText(error);

  if (isMissingInstallmentTransactionMigration(error)) {
    return EntryRegistrationCopy.saveMigrationError;
  }

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

function isMissingInstallmentTransactionMigration(error: unknown): boolean {
  const errorText = extractLedgerSaveErrorText(error);
  const referencesInstallmentTransaction =
    errorText.includes("delete_installment_group") ||
    errorText.includes("prepay_installment_group");
  return (
    referencesInstallmentTransaction &&
    (errorText.includes("could not find") || errorText.includes("does not exist"))
  );
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
