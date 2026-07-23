import {
  CommonActions,
  NavigationContainer,
  StackActions,
  createNavigationContainerRef,
} from "@react-navigation/native";
import type { Session } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, AppState, StatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { SignedInStackNavigator } from "./app/SignedInStackNavigator";
import { type SignedInStackParamList, isSignedInStackScreen } from "./app/signedInNavigation";
import { AppFooterTabBar } from "./components/AppFooterTabBar";
import { AppHeader } from "./components/AppHeader";
import { AppMenuDrawer } from "./components/AppMenuDrawer";
import { BlockingOverlay } from "./components/BlockingOverlay";
import { DailyFirstEntryAdNoticeOverlay } from "./components/DailyFirstEntryAdNoticeOverlay";
import { LedgerBookSwitcherModal } from "./components/LedgerBookSwitcherModal";
import { OnboardingTransitionScreen } from "./components/OnboardingTransitionScreen";
import { SessionLoadingScreen } from "./components/SessionLoadingScreen";
import { AnnualReportRangePickerModal } from "./components/annualReport/AnnualReportRangePickerModal";
import { NativeYearPickerModal } from "./components/calendarPicker/NativeYearPickerModal";
import { AdInterstitialPlacement, RewardedInterstitialNoticeConfig } from "./constants/ads";
import { CardSmsClipboardCopy } from "./constants/cardSmsClipboard";
import { AppColors } from "./constants/colors";
import { EntryRegistrationCopy } from "./constants/entryRegistration";
import { EXPENSE_CATEGORY_LABELS } from "./constants/expenseCategories";
import { INCOME_CATEGORY_LABELS } from "./constants/incomeCategories";
import { formatYearMonthLabel } from "./constants/ledgerDisplay";
import { LedgerBookManagementCopy } from "./constants/ledgerBookManagement";
import { AppMessages } from "./constants/messages";
import { NotificationBadgeScopes } from "./constants/notificationBadges";
import { SubscriptionMessages, SubscriptionTiers } from "./constants/subscription";
import { SupportMessages, type SupportPackageIdentifier } from "./constants/support";
import { useAnnualLedgerReportAction } from "./hooks/useAnnualLedgerReportAction";
import { useAuthOnboarding } from "./hooks/useAuthOnboarding";
import { useCalendarExpenseColorSetting } from "./hooks/useCalendarExpenseColorSetting";
import { useCalendarHeatmapSetting } from "./hooks/useCalendarHeatmapSetting";
import { useCalendarSummaryModeSetting } from "./hooks/useCalendarSummaryModeSetting";
import { useGoogleAuthRedirectCompletion } from "./hooks/useGoogleAuthRedirectCompletion";
import { useLedgerCategories } from "./hooks/useLedgerCategories";
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
import {
  hasSeenDailyFirstEntrySaveInterstitialNotice,
  hasShownDailyFirstEntrySaveInterstitial,
  markDailyFirstEntrySaveInterstitialNoticeSeen,
  markDailyFirstEntrySaveInterstitialShown,
} from "./lib/ads/dailyFirstEntryInterstitial";
import { preloadInterstitialAd, showInterstitialAd } from "./lib/ads/interstitialAd";
import { ensureMobileAdsInitialized } from "./lib/ads/mobileAds";
import {
  isRewardedInterstitialAdReady,
  preloadRewardedInterstitialAd,
  showRewardedInterstitialAd,
} from "./lib/ads/rewardedInterstitialAd";
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
  formatCardSmsClipboardDraftActionLabel,
  readCardSmsClipboardDraft,
} from "./lib/cardSmsClipboardImport";
import { type FooterTabScreen, buildFooterTabs, isFooterTabScreen } from "./lib/footerTabs";
import { scheduleIdleTask } from "./lib/idleScheduler";
import { logAppError } from "./lib/logAppError";
import { buildAppMenuSections } from "./lib/menuItems";
import { showNativeToast } from "./lib/nativeToast";
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
import { openSubscriptionManagement } from "./lib/subscription/openSubscriptionManagement";
import { isSubscriptionPurchaseCancelled } from "./lib/subscription/subscriptionError";
import { registerLedgerWidgetNotificationSync } from "./lib/widgetNotificationSync";
import { fetchLedgerWidgetSummary } from "./lib/widgetSummary";
import { createOtherMemberCreatedEntryEvent } from "./notifications/domain/notificationEventFactories";
import { AuthScreen } from "./screens/AuthScreen";
import { NicknameSetupScreen } from "./screens/NicknameSetupScreen";
import { PasswordResetScreen } from "./screens/PasswordResetScreen";
import type { LedgerAppScreen } from "./types/app";
import type { CategoryDefinition } from "./types/category";
import type { LedgerEntry, LedgerEntryDraft } from "./types/ledger";
import { getMonthKey, toIsoDate } from "./utils/calendar";
import { createDraft } from "./utils/ledgerEntries";
import { resolveFallbackDisplayName } from "./utils/sessionDisplayName";

installAppTextDefaults();

export default function App() {
  useGoogleAuthRedirectCompletion();
  const [isPasswordRecoverySession, setIsPasswordRecoverySession] = useState(false);
  usePasswordRecoveryRedirect({
    onRecoverySession: useCallback(() => {
      setIsPasswordRecoverySession(true);
    }, []),
  });
  const { errorMessage, isLoading, session } = useSupabaseSession();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <RootSiblingParent>
          {isLoading ? (
            <SignedOutAppShell>
              <SessionLoadingScreen />
            </SignedOutAppShell>
          ) : isPasswordRecoverySession && session ? (
            <SignedOutAppShell>
              <PasswordResetScreen onComplete={() => setIsPasswordRecoverySession(false)} />
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
      <SafeAreaView edges={["left", "right"]} style={styles.signedOutBodySafeArea}>
        <View style={styles.signedOutBody}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

function SignedInApp({ session }: { session: Session }) {
  const navigationRef = useRef(createNavigationContainerRef<SignedInStackParamList>()).current;
  const clipboardImportBaseDate = useRef(new Date()).current;
  const lastSyncedScreenRef = useRef<LedgerAppScreen>("calendar");
  const hasScheduledInitialPermissionRequestRef = useRef(false);
  const hasStartedInitialPermissionRequestRef = useRef(false);
  const permissionRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCheckedInitialClipboardImportRef = useRef(false);
  const previousClipboardImportAppStateRef = useRef(AppState.currentState);
  const lastReadNotificationBadgeScreenKeyRef = useRef<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<LedgerAppScreen>("calendar");
  const [isLedgerSwitcherOpen, setIsLedgerSwitcherOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNicknameScreenReady, setIsNicknameScreenReady] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [entryActionMenuDraft, setEntryActionMenuDraft] = useState<CardSmsClipboardDraft | null>(
    null,
  );
  const [blockingTaskCount, setBlockingTaskCount] = useState(0);
  const [isDailyFirstEntryAdNoticeVisible, setIsDailyFirstEntryAdNoticeVisible] = useState(false);
  const [adTrackingPermissionState, setAdTrackingPermissionState] =
    useState<AdTrackingPermissionState>("unavailable");
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
  const calendarExpenseColorSetting = useCalendarExpenseColorSetting();
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
  const notificationBadges = useNotificationBadges(session.user.id);
  const canSwitchHeaderLedgerBook =
    currentScreen === "calendar" && ledgerState.accessibleBooks.length > 1;
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
  const visibleCategories = useLedgerCategories();
  const visibleCategoryLabels = useMemo(
    () => visibleCategories.map((category) => category.label),
    [visibleCategories],
  );
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
  const isSignedInInteractionReady =
    !authOnboarding.isLoading &&
    authOnboarding.step === null &&
    !subscription.isLoading &&
    !ledgerState.isBusy &&
    !ledgerState.isLoading;

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

    if (!shouldServeAdMobAds) {
      setIsMobileAdsReady(false);
      return () => {
        isMounted = false;
      };
    }

    setIsMobileAdsReady(false);

    void requestAdTrackingPermissionIfNeeded()
      .then(async (nextPermissionState) => {
        applyAdTrackingPermissionToAdRequests(nextPermissionState);
        if (isMounted) {
          setAdTrackingPermissionState(nextPermissionState);
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
      });

    return () => {
      isMounted = false;
    };
  }, [shouldServeAdMobAds]);

  const syncCurrentRouteState = useCallback(() => {
    if (!navigationRef.isReady()) {
      return;
    }

    const rootState = navigationRef.getRootState();
    const activeRoute = rootState.routes[rootState.index];
    const activeRouteName = isSignedInStackScreen(activeRoute?.name)
      ? activeRoute.name
      : "calendar";
    const previousActiveScreen = lastSyncedScreenRef.current;

    if (previousActiveScreen === "entry" && activeRouteName !== "entry") {
      ledgerState.resetEditor(ledgerState.selectedDate);
    }

    lastSyncedScreenRef.current = activeRouteName;
    setCurrentScreen(activeRouteName);
  }, [ledgerState, navigationRef]);

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

      navigateToSingleInstanceStackScreen(navigationRef, screen);
    },
    [navigationRef],
  );

  const handleOpenCalendar = useCallback(() => {
    returnToCalendarRoot();
  }, [returnToCalendarRoot]);

  const handleSelectHeaderLedgerBook = useCallback(
    async (bookId: string) => {
      const didSwitch = await ledgerState.switchLedgerBook(bookId);
      showNativeToast(
        didSwitch ? LedgerBookManagementCopy.switchSuccess : LedgerBookManagementCopy.switchError,
      );
    },
    [ledgerState.switchLedgerBook],
  );

  const navigateToEntryFromCalendar = useCallback(() => {
    navigateToStackScreen("entry");
  }, [navigateToStackScreen]);

  const navigateToEntryForEdit = useCallback(() => {
    setEntryActionMenuDraft(null);
    navigateToStackScreen("entry");
  }, [navigateToStackScreen]);

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

  const readAvailableCardSmsClipboardDraft = useCallback(
    () =>
      readCardSmsClipboardDraft({
        baseDate: clipboardImportBaseDate,
        shouldIgnoreDraft: shouldIgnoreCardSmsClipboardDraft,
      }),
    [clipboardImportBaseDate, shouldIgnoreCardSmsClipboardDraft],
  );

  const handleDailyFirstEntrySaveInterstitial = useCallback(async () => {
    if (subscription.isLoading) {
      return;
    }

    if (subscription.currentTier !== SubscriptionTiers.free) {
      return;
    }

    const todayKey = toIsoDate(new Date());
    if (hasShownDailyFirstEntrySaveInterstitial(session.user.id, todayKey)) {
      return;
    }

    markDailyFirstEntrySaveInterstitialShown(session.user.id, todayKey);

    if (!isMobileAdsReady || !isRewardedInterstitialAdReady()) {
      preloadRewardedInterstitialAd();
      return;
    }

    await showDailyFirstEntryAdNoticeIfNeeded(session.user.id, setIsDailyFirstEntryAdNoticeVisible);

    await showRewardedInterstitialAd();
  }, [isMobileAdsReady, session.user.id, subscription.currentTier, subscription.isLoading]);

  const handleSaveCardSmsClipboardDraft = useCallback(
    async (clipboardDraft: CardSmsClipboardDraft) => {
      if (ledgerState.isReadOnlyDueToPlanLimit) {
        handleReadOnlyEditBlocked();
        return;
      }

      const currentEntries = ledgerState.entries;
      const draftToSave = buildCardSmsClipboardLedgerEntryDraft({
        clipboardDraft,
        fallbackDate: ledgerState.selectedDate,
        userId: session.user.id,
        visibleCategories,
      });
      let savedEntries: LedgerEntry[] = [];

      await handleDailyFirstEntrySaveInterstitial();

      try {
        savedEntries = await ledgerState.handleSaveDraftEntry(draftToSave);
      } catch (error) {
        logAppError("App", error, {
          step: "save_card_sms_clipboard_entry",
        });
        showNativeToast(resolveLedgerSaveErrorMessage(error));
        return;
      }

      if (savedEntries.length === 0) {
        return;
      }

      showNativeToast(EntryRegistrationCopy.saveCreateSuccess);
      void runEntrySaveSideEffects(savedEntries, currentEntries, "create", draftToSave.date);
    },
    [
      handleDailyFirstEntrySaveInterstitial,
      handleReadOnlyEditBlocked,
      ledgerState,
      session.user.id,
      visibleCategories,
    ],
  );

  const handleImportCardSmsClipboardDraft = useCallback(async () => {
    if (!isSignedInInteractionReady) {
      return;
    }

    const clipboardDraft = await readAvailableCardSmsClipboardDraft();
    if (!clipboardDraft) {
      setEntryActionMenuDraft(null);
      navigateToEntryFromCalendar();
      return;
    }

    setEntryActionMenuDraft(null);
    void handleSaveCardSmsClipboardDraft(clipboardDraft);
  }, [
    handleSaveCardSmsClipboardDraft,
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

    const clipboardDraft = await readAvailableCardSmsClipboardDraft();
    if (!clipboardDraft) {
      setEntryActionMenuDraft(null);
      navigateToEntryFromCalendar();
      return;
    }

    setEntryActionMenuDraft(clipboardDraft);
  }, [
    handleReadOnlyEditBlocked,
    isSignedInInteractionReady,
    ledgerState.isReadOnlyDueToPlanLimit,
    navigateToEntryFromCalendar,
    readAvailableCardSmsClipboardDraft,
  ]);

  const handleOpenDetectedCardSmsClipboardMenu = useCallback(async () => {
    if (
      !isSignedInInteractionReady ||
      ledgerState.isReadOnlyDueToPlanLimit ||
      currentScreen === "entry" ||
      entryActionMenuDraft
    ) {
      return;
    }

    const clipboardDraft = await readAvailableCardSmsClipboardDraft();
    if (!clipboardDraft) {
      return;
    }

    setEntryActionMenuDraft(clipboardDraft);
  }, [
    currentScreen,
    entryActionMenuDraft,
    isSignedInInteractionReady,
    ledgerState.isReadOnlyDueToPlanLimit,
    readAvailableCardSmsClipboardDraft,
  ]);

  useEffect(() => {
    if (hasCheckedInitialClipboardImportRef.current || !isSignedInInteractionReady) {
      return;
    }

    hasCheckedInitialClipboardImportRef.current = true;
    void handleOpenDetectedCardSmsClipboardMenu();
  }, [handleOpenDetectedCardSmsClipboardMenu, isSignedInInteractionReady]);

  useEffect(() => {
    if (isSignedInInteractionReady) {
      return;
    }

    setEntryActionMenuDraft(null);
  }, [isSignedInInteractionReady]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      const previousState = previousClipboardImportAppStateRef.current;
      previousClipboardImportAppStateRef.current = nextState;

      if (previousState === "active" || nextState !== "active") {
        return;
      }

      void handleOpenDetectedCardSmsClipboardMenu();
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [handleOpenDetectedCardSmsClipboardMenu]);

  const handleDismissEntryActionMenu = useCallback(() => {
    setEntryActionMenuDraft(null);
  }, []);

  const handleOpenManualEntryFromActionMenu = useCallback(() => {
    setEntryActionMenuDraft(null);
    navigateToEntryFromCalendar();
  }, [navigateToEntryFromCalendar]);

  const handleApplyEntryActionMenuDraft = useCallback(() => {
    if (!entryActionMenuDraft) {
      return;
    }

    const draftToSave = entryActionMenuDraft;
    setEntryActionMenuDraft(null);
    setTimeout(() => {
      void handleSaveCardSmsClipboardDraft(draftToSave);
    }, CardSmsClipboardCopy.modalDismissBeforeSaveDelayMs);
  }, [entryActionMenuDraft, handleSaveCardSmsClipboardDraft]);

  const handleOpenClipboardImportFromWidget = useCallback(() => {
    void handleImportCardSmsClipboardDraft();
  }, [handleImportCardSmsClipboardDraft]);

  useLedgerWidgetDeepLinks({
    enabled: isSignedInInteractionReady,
    onOpenClipboardImport: handleOpenClipboardImportFromWidget,
    onOpenEntry: navigateToEntryFromCalendar,
  });

  const handleOpenAllEntries = useCallback(() => {
    navigateToStackScreen("all-entries");
  }, [navigateToStackScreen]);
  const handleOpenEntry = handleOpenEntryFromCalendar;
  const handleOpenSubscription = useCallback(() => {
    navigateToStackScreen("subscription");
  }, [navigateToStackScreen]);
  const menuSections = buildAppMenuSections({
    showAnnualReportDownload: Boolean(annualReport.bookName),
  });
  const footerTabs = buildFooterTabs();
  const entryActionMenuActions = useMemo(() => {
    if (!entryActionMenuDraft) {
      return [];
    }

    return [
      {
        label: CardSmsClipboardCopy.directEntryAction,
        onPress: handleOpenManualEntryFromActionMenu,
      },
      {
        label: formatCardSmsClipboardDraftActionLabel(entryActionMenuDraft),
        onPress: handleApplyEntryActionMenuDraft,
      },
    ];
  }, [entryActionMenuDraft, handleApplyEntryActionMenuDraft, handleOpenManualEntryFromActionMenu]);
  const showsFooterTabBar = true;
  const activeFooterScreen =
    showsFooterTabBar && isFooterTabScreen(currentScreen) ? currentScreen : null;
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
      currentScreen === "all-entries"
        ? NotificationBadgeScopes.ledgerEntries
        : currentScreen === "share"
          ? NotificationBadgeScopes.joinRequests
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
    ledgerState.activeBook?.id,
    ledgerState.activeBook?.ownerId,
    notificationBadges.markRead,
    notificationBadges.snapshot,
    session.user.id,
  ]);

  const handleSelectFooterTab = useCallback(
    (targetScreen: FooterTabScreen) => {
      if (!isSignedInInteractionReady && targetScreen !== currentScreen) {
        return;
      }

      if (targetScreen !== "entry") {
        setEntryActionMenuDraft(null);
      }

      if (targetScreen === currentScreen) {
        return;
      }

      if (targetScreen === "calendar") {
        ledgerState.resetEditor(ledgerState.selectedDate);
        returnToCalendarRoot();
        return;
      }

      if (targetScreen === "entry") {
        void handleOpenEntry();
        return;
      }

      if (targetScreen === "all-entries") {
        handleOpenAllEntries();
        return;
      }

      navigateToStackScreen(targetScreen);
    },
    [
      currentScreen,
      handleOpenAllEntries,
      handleOpenEntry,
      isSignedInInteractionReady,
      ledgerState,
      navigateToStackScreen,
      returnToCalendarRoot,
    ],
  );
  const handleOpenYearPicker = () => {
    if (currentScreen !== "calendar") {
      return;
    }

    setIsYearPickerOpen(true);
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

    await showInterstitialAd(AdInterstitialPlacement.shareCodeCopy);
  };

  const handleBeforeSendJoinRequest = async () => {
    if (!showsAdMobAds) {
      return;
    }

    await showInterstitialAd(AdInterstitialPlacement.joinRequestSend);
  };

  const handleSaveEntry = async () => {
    const currentEntries = ledgerState.entries;
    const wasEditingEntry = Boolean(ledgerState.editingEntryId);
    let savedEntries: LedgerEntry[] = [];
    if (!wasEditingEntry) {
      await handleDailyFirstEntrySaveInterstitial();
    }

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
    showNativeToast(
      wasEditingEntry
        ? EntryRegistrationCopy.saveUpdateSuccess
        : EntryRegistrationCopy.saveCreateSuccess,
    );
    void runEntrySaveSideEffects(
      savedEntries,
      currentEntries,
      wasEditingEntry ? "update" : "create",
      ledgerState.draft.date,
    );
  };

  const handleEditEntryFromCalendar = (entry: LedgerEntry) => {
    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return;
    }

    ledgerState.handleEditEntry(entry);
    navigateToEntryForEdit();
  };

  const handleEditEntryFromAllEntries = (entry: LedgerEntry) => {
    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return;
    }

    ledgerState.handleEditEntry(entry);
    navigateToEntryForEdit();
  };

  const handleSettleInstallmentEntry = async (entry: LedgerEntry) => {
    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return;
    }

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
    if (ledgerState.isReadOnlyDueToPlanLimit) {
      handleReadOnlyEditBlocked();
      return false;
    }

    try {
      await ledgerState.handleDeleteEntry(entry.id);
    } catch (error) {
      logAppError("App", error, {
        entryId: entry.id,
        step: "delete_entry",
      });
      showNativeToast(AppMessages.editorDeleteError);
      return false;
    }

    void runEntryDeleteSideEffects(entry);
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
      void notificationBadges.refresh();
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
  }, [navigateToStackScreen, notificationBadges.refresh, returnToCalendarRoot]);

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
      authOnboarding.step !== null ||
      authOnboarding.hasCompletedPermissionOnboarding ||
      !notifications.isSupported ||
      notifications.permissionState !== "default" ||
      ledgerState.isLoading ||
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
      }, 700);
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
    authOnboarding.step,
    ledgerState.isLoading,
    notifications.isSupported,
    notifications.permissionState,
    notifications.requestNotifications,
  ]);

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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.surface} />
      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.headerShell}>
          <AppHeader
            canSwitchTitle={currentScreen === "calendar"}
            isMenuOpen={isMenuOpen}
            isReadOnlyTitle={currentScreen === "calendar" && ledgerState.isReadOnlyDueToPlanLimit}
            onPressTitle={currentScreen === "calendar" ? handleOpenYearPicker : undefined}
            titleLabel={
              currentScreen === "calendar"
                ? formatYearMonthLabel(ledgerState.visibleMonth)
                : currentScreen === "charts"
                ? ledgerState.currentChartMonth.title
                : getAppScreenLabel(currentScreen)
            }
            onOpenMenu={() => setIsMenuOpen((currentValue) => !currentValue)}
          />
        </View>
      </SafeAreaView>
      <SafeAreaView edges={["left", "right"]} style={styles.bodySafeArea}>
        <View style={styles.body}>
          <View style={styles.navigationShell}>
            <NavigationContainer
              onReady={syncCurrentRouteState}
              onStateChange={syncCurrentRouteState}
              ref={navigationRef}
            >
              <SignedInStackNavigator
                accountProviderLabel={accountProviderLabel}
                adTrackingPermissionState={adTrackingPermissionState}
                calendarExpenseColorMode={calendarExpenseColorSetting.calendarExpenseColorMode}
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
                onChangeCalendarExpenseColorMode={
                  calendarExpenseColorSetting.updateCalendarExpenseColorMode
                }
                onBeforeCopyShareCode={handleBeforeCopyShareCode}
                onBeforeSendJoinRequest={handleBeforeSendJoinRequest}
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
                onEditSelectedEntryFromAllEntries={handleEditEntryFromAllEntries}
                onEditSelectedEntryFromCalendar={handleEditEntryFromCalendar}
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
                onSendPendingJoinRequestNotification={
                  notifications.sendPendingJoinRequestNotification
                }
                onSendPushNotificationToBookMembers={
                  notifications.sendPushNotificationToBookMembers
                }
                onSendPushNotificationToUsers={notifications.sendPushNotificationToUsers}
                onSettleInstallmentEntry={handleSettleInstallmentEntry}
                onToggleCalendarHeatmap={calendarHeatmapSetting.updateCalendarHeatmapEnabled}
                onToggleNotificationPreference={notifications.updatePreference}
                plusPriceLabel={subscription.plusPriceLabel}
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
          </View>
          {showsFooterTabBar ? (
            <SafeAreaView edges={["bottom"]} style={styles.footerSafeArea}>
              <AppFooterTabBar
                activeScreen={activeFooterScreen}
                badgedScreens={footerBadgedScreens}
                isPrimaryActionMenuOpen={entryActionMenuDraft !== null}
                isPrimaryActionDisabled={
                  ledgerState.isReadOnlyDueToPlanLimit || !isSignedInInteractionReady
                }
                onDismissPrimaryActionMenu={handleDismissEntryActionMenu}
                onSelectTab={handleSelectFooterTab}
                primaryActionMenuActions={entryActionMenuActions}
                tabs={footerTabs}
              />
            </SafeAreaView>
          ) : null}
        </View>
        <AppMenuDrawer
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onOpen={() => setIsMenuOpen(true)}
          onSelectAction={(action) => {
            setIsMenuOpen(false);
            if (action === "annual-report-download") {
              void annualReport.handleDownloadReport();
            }
          }}
          onSelectItem={(targetScreen) => {
            setIsMenuOpen(false);
            navigateToStackScreen(targetScreen);
          }}
          sections={menuSections}
        />
        <LedgerBookSwitcherModal
          activeBookId={ledgerState.activeBook?.id ?? null}
          badgedBookIds={badgedLedgerBookIds}
          books={ledgerState.accessibleBooks}
          isOpen={canSwitchHeaderLedgerBook && isLedgerSwitcherOpen}
          onClose={() => setIsLedgerSwitcherOpen(false)}
          onSelectBook={(bookId) => {
            void handleSelectHeaderLedgerBook(bookId);
          }}
          subscriptionTier={subscription.currentTier}
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
      <DailyFirstEntryAdNoticeOverlay isVisible={isDailyFirstEntryAdNoticeVisible} />
    </View>
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
    try {
      const currentMonthEntries = savedEntries.filter((entry) => entry.date === targetDate);
      const lastCurrentMonthEntry = currentMonthEntries[currentMonthEntries.length - 1];

      if (lastCurrentMonthEntry) {
        await notifications.notifySavedEntry(lastCurrentMonthEntry, currentEntries);
      }

      if (changeType === "create") {
        const widget = ledgerState.activeBook
          ? await resolveCurrentLedgerWidgetPushSummary(ledgerState.activeBook.id)
          : undefined;

        for (const savedEntry of currentMonthEntries) {
          await notifySharedLedgerEntryChange(savedEntry, widget);
        }
      }
    } catch (error) {
      logAppError("App", error, {
        changeType,
        entryCount: savedEntries.length,
        step: "run_entry_save_side_effects",
      });
    }
  }

  async function runEntryDeleteSideEffects(_deletedEntry: LedgerEntry) {}
}

async function showDailyFirstEntryAdNoticeIfNeeded(
  userId: string,
  setIsVisible: Dispatch<SetStateAction<boolean>>,
) {
  if (hasSeenDailyFirstEntrySaveInterstitialNotice(userId)) {
    return;
  }

  markDailyFirstEntrySaveInterstitialNoticeSeen(userId);
  setIsVisible(true);
  try {
    await wait(RewardedInterstitialNoticeConfig.previewDurationMs);
  } finally {
    setIsVisible(false);
  }
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function buildCardSmsClipboardLedgerEntryDraft({
  clipboardDraft,
  fallbackDate,
  userId,
  visibleCategories,
}: {
  clipboardDraft: CardSmsClipboardDraft;
  fallbackDate: string;
  userId: string;
  visibleCategories: readonly CategoryDefinition[];
}): LedgerEntryDraft {
  const draftDate = clipboardDraft.date ?? fallbackDate;
  const draftCategory =
    resolveCardSmsClipboardCategory(clipboardDraft, visibleCategories) ??
    resolveCardSmsClipboardFallbackCategory(clipboardDraft.type, visibleCategories);

  return {
    ...createDraft(draftDate, userId),
    amount: clipboardDraft.amount,
    category: draftCategory.label,
    categoryId: draftCategory.id,
    content: clipboardDraft.content,
    type: clipboardDraft.type,
  };
}

function resolveCardSmsClipboardCategory(
  clipboardDraft: CardSmsClipboardDraft,
  visibleCategories: readonly CategoryDefinition[],
): CategoryDefinition | null {
  if (!clipboardDraft.category) {
    return null;
  }

  return (
    visibleCategories.find(
      (category) =>
        category.type === clipboardDraft.type && category.label === clipboardDraft.category,
    ) ?? null
  );
}

function resolveCardSmsClipboardFallbackCategory(
  entryType: CardSmsClipboardDraft["type"],
  visibleCategories: readonly CategoryDefinition[],
): CategoryDefinition {
  const fallbackLabel =
    entryType === "income" ? INCOME_CATEGORY_LABELS.other : EXPENSE_CATEGORY_LABELS.other;
  const typedCategories = visibleCategories.filter((category) => category.type === entryType);
  const fallbackCategory =
    typedCategories.find((category) => category.label === fallbackLabel) ?? typedCategories[0];

  if (!fallbackCategory) {
    throw new Error("Missing card SMS fallback category.");
  }

  return fallbackCategory;
}

function navigateToSingleInstanceStackScreen(
  navigationRef: ReturnType<typeof createNavigationContainerRef<SignedInStackParamList>>,
  screen: Exclude<LedgerAppScreen, "calendar">,
) {
  const rootState = navigationRef.getRootState();
  const targetRouteIndex = rootState.routes.findIndex((route) => route.name === screen);

  if (targetRouteIndex < 0) {
    navigationRef.navigate(screen);
    return;
  }

  if (rootState.index === targetRouteIndex) {
    return;
  }

  const routes = rootState.routes.slice(0, targetRouteIndex + 1).map((route) => ({
    name: route.name as keyof SignedInStackParamList,
  }));

  navigationRef.dispatch(
    CommonActions.reset({
      index: routes.length - 1,
      routes,
    }),
  );
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
  navigationShell: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  footerSafeArea: {
    backgroundColor: AppColors.surface,
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
