import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import {
  NavigationContainer,
  StackActions,
  createNavigationContainerRef,
} from "@react-navigation/native";
import type { Session } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import "./src/i18n";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, StatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { SignedInStackNavigator } from "./src/app/SignedInStackNavigator";
import { type SignedInStackParamList, isSignedInStackScreen } from "./src/app/signedInNavigation";
import { AppFooterTabBar } from "./src/components/AppFooterTabBar";
import { AppHeader } from "./src/components/AppHeader";
import { AppMenuDrawer } from "./src/components/AppMenuDrawer";
import { BlockingOverlay } from "./src/components/BlockingOverlay";
import { OnboardingTransitionScreen } from "./src/components/OnboardingTransitionScreen";
import { SessionLoadingScreen } from "./src/components/SessionLoadingScreen";
import { AnnualReportRangePickerModal } from "./src/components/annualReport/AnnualReportRangePickerModal";
import { NativeYearPickerModal } from "./src/components/calendarPicker/NativeYearPickerModal";
import { AdInterstitialPlacement } from "./src/constants/ads";
import { AppleAuthConfig } from "./src/constants/appleAuth";
import { AuthOnboardingTiming } from "./src/constants/authOnboarding";
import { CardSmsClipboardCopy } from "./src/constants/cardSmsClipboard";
import { AppColors } from "./src/constants/colors";
import { EntryRegistrationCopy } from "./src/constants/entryRegistration";
import { EXPENSE_CATEGORY_LABELS } from "./src/constants/expenseCategories";
import { INCOME_CATEGORY_LABELS } from "./src/constants/incomeCategories";
import { AppMessages } from "./src/constants/messages";
import { SubscriptionMessages, SubscriptionTiers } from "./src/constants/subscription";
import { SubscriptionManagementMessages } from "./src/constants/subscriptionManagement";
import { SupportMessages, type SupportPackageIdentifier } from "./src/constants/support";
import { useAnnualLedgerReportAction } from "./src/hooks/useAnnualLedgerReportAction";
import { useAuthOnboarding } from "./src/hooks/useAuthOnboarding";
import { useGoogleAuthRedirectCompletion } from "./src/hooks/useGoogleAuthRedirectCompletion";
import { useLedgerCategories } from "./src/hooks/useLedgerCategories";
import { useLedgerNotifications } from "./src/hooks/useLedgerNotifications";
import { useLedgerScreenState } from "./src/hooks/useLedgerScreenState";
import { useLedgerWidgetDeepLinks } from "./src/hooks/useLedgerWidgetDeepLinks";
import { useLedgerWidgetSync } from "./src/hooks/useLedgerWidgetSync";
import { usePasswordRecoveryRedirect } from "./src/hooks/usePasswordRecoveryRedirect";
import { useSubscriptionPlan } from "./src/hooks/useSubscriptionPlan";
import { useSupabaseSession } from "./src/hooks/useSupabaseSession";
import { useSupportPackages } from "./src/hooks/useSupportPackages";
import { applyAdTrackingPermissionToAdRequests } from "./src/lib/ads/adRequestOptions";
import { preloadInterstitialAd, showInterstitialAd } from "./src/lib/ads/interstitialAd";
import { ensureMobileAdsInitialized } from "./src/lib/ads/mobileAds";
import {
  type AdTrackingPermissionState,
  isAdTrackingPermissionSupported,
  openAdTrackingSettings,
  readAdTrackingPermissionState,
  requestAdTrackingPermission,
  requestAdTrackingPermissionIfNeeded,
} from "./src/lib/ads/trackingTransparency";
import { appPlatform } from "./src/lib/appPlatform";
import { getAppScreenLabel } from "./src/lib/appScreenLabels";
import { installAppTextDefaults } from "./src/lib/appTextDefaults";
import {
  resolveSessionAuthProvider,
  resolveSessionAuthProviderLabel,
} from "./src/lib/authProvider";
import {
  type CardSmsClipboardDraft,
  formatCardSmsClipboardDraftActionLabel,
  readCardSmsClipboardDraft,
} from "./src/lib/cardSmsClipboardImport";
import { type FooterTabScreen, buildFooterTabs, isFooterTabScreen } from "./src/lib/footerTabs";
import { scheduleIdleTask } from "./src/lib/idleScheduler";
import { logAppError } from "./src/lib/logAppError";
import { buildAppMenuSections } from "./src/lib/menuItems";
import { showNativeToast } from "./src/lib/nativeToast";
import { resolveNotificationActionRoute } from "./src/lib/notifications/notificationActions";
import {
  fetchOwnProfileDisplayName,
  syncOwnProfileDisplayNameIfMissing,
  syncOwnProfilePreferredLocale,
  updateOwnProfileDisplayName,
} from "./src/lib/profiles";
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
import { PasswordResetScreen } from "./src/screens/PasswordResetScreen";
import type { LedgerAppScreen } from "./src/types/app";
import type { CategoryDefinition } from "./src/types/category";
import type { LedgerEntry, LedgerEntryDraft } from "./src/types/ledger";
import { getMonthKey, parseIsoDate, toIsoDate } from "./src/utils/calendar";
import { createDraft } from "./src/utils/ledgerEntries";
import { resolveFallbackDisplayName } from "./src/utils/sessionDisplayName";

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
  const { i18n, t } = useTranslation();
  const navigationRef = useRef(createNavigationContainerRef<SignedInStackParamList>()).current;
  const clipboardImportBaseDate = useRef(new Date()).current;
  const lastSyncedScreenRef = useRef<LedgerAppScreen>("calendar");
  const hasScheduledInitialPermissionRequestRef = useRef(false);
  const hasStartedInitialPermissionRequestRef = useRef(false);
  const permissionRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentScreen, setCurrentScreen] = useState<LedgerAppScreen>("calendar");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNicknameScreenReady, setIsNicknameScreenReady] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [entryActionMenuDraft, setEntryActionMenuDraft] = useState<CardSmsClipboardDraft | null>(
    null,
  );
  const [badgedFooterScreens, setBadgedFooterScreens] = useState<FooterTabScreen[]>([]);
  const [blockingTaskCount, setBlockingTaskCount] = useState(0);
  const [adTrackingPermissionState, setAdTrackingPermissionState] =
    useState<AdTrackingPermissionState>("unavailable");
  const [isMobileAdsReady, setIsMobileAdsReady] = useState(false);
  const authProvider = resolveSessionAuthProvider(session);
  const metadataDisplayName = resolveFallbackDisplayName(
    session.user.user_metadata,
    session.user.email,
  );
  const fallbackDisplayName =
    metadataDisplayName || (authProvider === "apple" ? AppleAuthConfig.defaultDisplayName : "");
  const accountProviderLabel = resolveSessionAuthProviderLabel(session);
  const notifications = useLedgerNotifications(session.user.id);
  const subscription = useSubscriptionPlan(session.user.id);
  const shouldServeAdMobAds =
    !subscription.isLoading && subscription.currentTier === SubscriptionTiers.free;
  const showsAdMobAds = shouldServeAdMobAds && isMobileAdsReady;
  const showAdTrackingPermissionCard = shouldServeAdMobAds && isAdTrackingPermissionSupported();
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

  useEffect(() => {
    if (authProvider !== "apple" || metadataDisplayName) {
      return;
    }

    void syncOwnProfileDisplayNameIfMissing(
      session.user.id,
      AppleAuthConfig.defaultDisplayName,
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

  useEffect(() => {
    const currentLanguage = i18n.language.startsWith("en") ? "en" : "ko";
    void syncOwnProfilePreferredLocale(currentLanguage).catch((error) => {
      logAppError("App", error, {
        language: currentLanguage,
        step: "sync_profile_preferred_locale",
        userId: session.user.id,
      });
    });
  }, [i18n.language, session.user.id]);

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

  const updateFooterNotificationBadges = useCallback(
    (resolveNextScreens: (currentScreens: FooterTabScreen[]) => FooterTabScreen[]) => {
      setBadgedFooterScreens((currentScreens) => {
        const nextScreens = resolveNextScreens(currentScreens);
        void Notifications.setBadgeCountAsync(nextScreens.length).catch((error) => {
          logAppError("App", error, {
            step: "set_notification_badge_count",
          });
        });
        return nextScreens;
      });
    },
    [],
  );

  const markFooterNotificationBadge = useCallback(
    (targetScreen: LedgerAppScreen) => {
      const footerBadgeScreen = resolveFooterNotificationBadgeScreen(targetScreen);
      if (!footerBadgeScreen) {
        return;
      }

      updateFooterNotificationBadges((currentScreens) =>
        currentScreens.includes(footerBadgeScreen)
          ? currentScreens
          : [...currentScreens, footerBadgeScreen],
      );
    },
    [updateFooterNotificationBadges],
  );

  const clearFooterNotificationBadge = useCallback(
    (targetScreen: LedgerAppScreen) => {
      const footerBadgeScreen = resolveFooterNotificationBadgeScreen(targetScreen);
      if (!footerBadgeScreen) {
        return;
      }

      updateFooterNotificationBadges((currentScreens) =>
        currentScreens.filter((screen) => screen !== footerBadgeScreen),
      );
    },
    [updateFooterNotificationBadges],
  );

  const navigateToStackScreen = useCallback(
    (screen: Exclude<LedgerAppScreen, "calendar">) => {
      if (!navigationRef.isReady()) {
        return;
      }

      clearFooterNotificationBadge(screen);
      navigationRef.navigate(screen);
    },
    [clearFooterNotificationBadge, navigationRef],
  );

  const handleOpenCalendar = useCallback(() => {
    clearFooterNotificationBadge("calendar");
    returnToCalendarRoot();
  }, [clearFooterNotificationBadge, returnToCalendarRoot]);

  const navigateToEntryFromCalendar = useCallback(() => {
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

  const handleSaveCardSmsClipboardDraft = useCallback(
    async (clipboardDraft: CardSmsClipboardDraft) => {
      const currentEntries = ledgerState.entries;
      const draftToSave = buildCardSmsClipboardLedgerEntryDraft({
        clipboardDraft,
        fallbackDate: ledgerState.selectedDate,
        userId: session.user.id,
        visibleCategories,
      });
      let savedEntries: LedgerEntry[] = [];

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

      void runEntrySaveSideEffects(savedEntries, currentEntries, "create", draftToSave.date);
    },
    [ledgerState, session.user.id, visibleCategories],
  );

  const handleImportCardSmsClipboardDraft = useCallback(async () => {
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
    navigateToEntryFromCalendar,
    readAvailableCardSmsClipboardDraft,
  ]);

  const handleOpenEntryFromCalendar = useCallback(async () => {
    const clipboardDraft = await readAvailableCardSmsClipboardDraft();
    if (!clipboardDraft) {
      setEntryActionMenuDraft(null);
      navigateToEntryFromCalendar();
      return;
    }

    setEntryActionMenuDraft(clipboardDraft);
  }, [navigateToEntryFromCalendar, readAvailableCardSmsClipboardDraft]);

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

    setEntryActionMenuDraft(null);
    void handleSaveCardSmsClipboardDraft(entryActionMenuDraft);
  }, [entryActionMenuDraft, handleSaveCardSmsClipboardDraft]);

  const handleOpenClipboardImportFromWidget = useCallback(() => {
    void handleImportCardSmsClipboardDraft();
  }, [handleImportCardSmsClipboardDraft]);

  useLedgerWidgetDeepLinks({
    enabled: !authOnboarding.isLoading && authOnboarding.step === null,
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
  const menuSections = buildAppMenuSections(notifications.showNotificationSettings, t, {
    showAnnualReportDownload: Boolean(annualReport.bookName),
  });
  const footerTabs = buildFooterTabs(t);
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
  const showsFooterTabBar = currentScreen !== "entry";
  const activeFooterScreen =
    showsFooterTabBar && isFooterTabScreen(currentScreen) ? currentScreen : null;
  const handleSelectFooterTab = useCallback(
    (targetScreen: FooterTabScreen) => {
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

      if (targetScreen === "share" && ledgerState.activeBook?.ownerId === session.user.id) {
        void ledgerState.refreshSharedLedgerBook();
      }

      navigateToStackScreen(targetScreen);
    },
    [
      currentScreen,
      handleOpenAllEntries,
      handleOpenEntry,
      ledgerState,
      navigateToStackScreen,
      returnToCalendarRoot,
      session.user.id,
    ],
  );
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
      ledgerState.draft.date,
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
    const currentLanguage = i18n.language.startsWith("en") ? "en" : "ko";

    void notifications.registerActionCategories(currentLanguage).catch((error) => {
      logAppError("App", error, {
        language: currentLanguage,
        step: "register_notification_action_categories",
      });
    });
  }, [i18n.language, notifications.registerActionCategories]);

  useEffect(() => {
    const handleNotificationReceived = (notification: Notifications.Notification) => {
      const targetScreen = resolveNotificationActionRoute("", notification.request.content.data);
      markFooterNotificationBadge(targetScreen);
    };

    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const targetScreen = resolveNotificationActionRoute(
        response.actionIdentifier,
        response.notification.request.content.data,
      );

      clearFooterNotificationBadge(targetScreen);

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
  }, [
    clearFooterNotificationBadge,
    markFooterNotificationBadge,
    navigateToStackScreen,
    returnToCalendarRoot,
  ]);

  useEffect(() => {
    if (authOnboarding.step !== "nickname") {
      setIsNicknameScreenReady(false);
      return;
    }

    let timerId: ReturnType<typeof setTimeout> | null = null;
    const idleTask = scheduleIdleTask(() => {
      timerId = setTimeout(() => {
        setIsNicknameScreenReady(true);
      }, AuthOnboardingTiming.nicknameTransitionDelayMs);
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
      }, AuthOnboardingTiming.permissionRequestDelayMs);
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
          <NicknameSetupScreen onSubmit={handleCompleteNicknameOnboarding} />
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
            isMenuOpen={isMenuOpen}
            showsPlusBadge={
              currentScreen === "calendar" && subscription.currentTier === SubscriptionTiers.plus
            }
            titleLabel={
              currentScreen === "calendar"
                ? annualReport.bookName
                : getAppScreenLabel(currentScreen, t)
            }
            yearLabel={null}
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
                email={session.user.email ?? ""}
                fallbackDisplayName={fallbackDisplayName}
                hasAvailablePlusPackage={subscription.hasAvailablePlusPackage}
                isPlusActive={subscription.isPlusActive}
                ledgerState={ledgerState}
                notificationPreferenceGroups={notifications.preferenceGroups}
                notificationPermissionLabel={notifications.permissionLabel}
                notificationPermissionState={notifications.permissionState}
                notificationStatusMessage={notifications.statusMessage}
                onBeforeCopyShareCode={handleBeforeCopyShareCode}
                onChangeNotificationThreshold={notifications.updateThresholdValue}
                onChangeNotificationThresholdEnabled={notifications.updateThresholdEnabled}
                onDeleteSelectedEntry={handleDeleteEntryFromCalendar}
                onEditSelectedEntryFromAllEntries={handleEditEntryFromAllEntries}
                onEditSelectedEntryFromCalendar={handleEditEntryFromCalendar}
                onOpenMonthPicker={handleOpenYearPicker}
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
                badgedScreens={badgedFooterScreens}
                isPrimaryActionMenuOpen={entryActionMenuDraft !== null}
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
    targetDate: string,
  ) {
    try {
      const currentMonthEntries = savedEntries.filter((entry) => entry.date === targetDate);
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

  async function runEntryDeleteSideEffects(deletedEntry: LedgerEntry) {
    const activeBook = ledgerState.activeBook;
    if (!activeBook) {
      return;
    }

    try {
      const actorName = await resolveCurrentActorName();
      const widget = await resolveCurrentLedgerWidgetPushSummary(activeBook.id);
      await notifications.sendPushNotificationToBookMembers(
        activeBook.id,
        createOtherMemberDeletedEntryEvent(
          { actorName, bookName: activeBook.name },
          { ...deletedEntry, authorId: session.user.id, authorName: actorName },
        ),
        [session.user.id],
        widget,
      );
    } catch (error) {
      logAppError("App", error, {
        entryId: deletedEntry.id,
        step: "run_entry_delete_side_effects",
      });
    }
  }
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

function resolveFooterNotificationBadgeScreen(screen: LedgerAppScreen): FooterTabScreen | null {
  if (screen === "all-entries" || screen === "share") {
    return screen;
  }

  return null;
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
