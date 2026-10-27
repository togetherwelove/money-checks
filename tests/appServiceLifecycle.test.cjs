const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");
const flush = () => new Promise(setImmediate);

function ads() {
  const h = hooks(),
    listeners = new Set(),
    errors = [],
    preloads = [];
  let resolvePermission, rejectPermission;
  const permission = new Promise((resolve, reject) => {
    resolvePermission = resolve;
    rejectPermission = reject;
  });
  const load = modules({
    react: h.react,
    "react-native": {
      AppState: {
        addEventListener: (_event, callback) => {
          listeners.add(callback);
          return { remove: () => listeners.delete(callback) };
        },
      },
    },
    "../lib/ads/trackingTransparency": {
      isAdTrackingPermissionSupported: () => true,
      readAdTrackingPermissionState: async () => "denied",
      requestAdTrackingPermissionIfNeeded: () => permission,
    },
    "../lib/ads/adRequestOptions": { applyAdTrackingPermissionToAdRequests() {} },
    "../lib/ads/mobileAds": { ensureMobileAdsInitialized: async () => {} },
    "../lib/ads/interstitialAd": { preloadInterstitialAd: () => preloads.push("interstitial") },
    "../lib/ads/rewardedInterstitialAd": {
      preloadRewardedInterstitialAd: () => preloads.push("rewarded"),
    },
    "../lib/logAppError": { logAppError: (...args) => errors.push(args) },
  });
  const { useAppAds } = load("src/hooks/useAppAds.ts");
  return {
    h,
    listeners,
    errors,
    preloads,
    resolvePermission,
    rejectPermission,
    render: (free = true, loading = false) => h.render(() => useAppAds(free, loading)),
  };
}

test("ads wait for permission and initialization, then preload both formats and release foreground listener", async () => {
  const ui = ads();
  assert.equal(ui.render().isMobileAdsReady, false);
  assert.equal(ui.preloads.length, 0);
  ui.resolvePermission("denied");
  await flush();
  const state = ui.render();
  assert.equal(state.showsAdMobAds, true);
  assert.equal(state.showAdTrackingPermissionCard, true);
  assert.equal(state.hasSettledInitialAdTrackingPermission, true);
  assert.deepEqual(ui.preloads, ["interstitial", "rewarded"]);
  ui.h.unmount();
  assert.equal(ui.listeners.size, 0);
});

test("pending ad initialization cannot mark a Plus session or an unmounted app ready", async () => {
  for (const unmount of [false, true]) {
    const ui = ads();
    ui.render();
    if (unmount) ui.h.unmount();
    else assert.equal(ui.render(false).showsAdMobAds, false);
    ui.resolvePermission("denied");
    await flush();
    assert.equal(ui.preloads.length, 0);
    if (!unmount) {
      assert.equal(ui.render(false).isMobileAdsReady, false);
      ui.h.unmount();
    }
  }
});

test("ad initialization failures settle permission readiness while keeping ads unavailable", async () => {
  const ui = ads();
  ui.render();
  ui.rejectPermission(new Error("SDK unavailable"));
  await flush();
  const state = ui.render();
  assert.equal(state.hasSettledInitialAdTrackingPermission, true);
  assert.equal(state.isMobileAdsReady, false);
  assert.equal(ui.errors.length, 1);
  ui.h.unmount();
});

function permissionPrompt() {
  const h = hooks(),
    idle = [];
  let requests = 0,
    completed = 0;
  const load = modules({
    react: h.react,
    "../constants/initialPermissions": {
      InitialPermissionTiming: { notificationRequestDelayMs: 0 },
    },
    "../lib/idleScheduler": {
      scheduleIdleTask: (callback) => {
        const task = {
          cancelled: false,
          run() {
            if (!task.cancelled) callback();
          },
          cancel() {
            task.cancelled = true;
          },
        };
        idle.push(task);
        return task;
      },
    },
  });
  const { useInitialNotificationPermission } = load(
    "src/hooks/useInitialNotificationPermission.ts",
  );
  const options = {
    authOnboarding: {
      isLoading: false,
      errorMessage: null,
      step: null,
      hasCompletedPermissionOnboarding: false,
      completePermissionOnboarding: () => {
        completed++;
      },
    },
    notifications: {
      isSupported: true,
      permissionState: "default",
      requestNotifications: async () => {
        requests++;
        return false;
      },
    },
    isLedgerLoading: false,
    hasSettledInitialAdTrackingPermission: false,
  };
  return {
    h,
    idle,
    options,
    requests: () => requests,
    completed: () => completed,
    render: () => h.render(() => useInitialNotificationPermission(options)),
  };
}

test("initial notification prompt waits for readiness, schedules once and completes even after denial", async () => {
  const ui = permissionPrompt();
  ui.render();
  assert.equal(ui.idle.length, 0);
  ui.options.hasSettledInitialAdTrackingPermission = true;
  ui.render();
  ui.render();
  assert.equal(ui.idle.length, 1);
  ui.idle[0].run();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(ui.requests(), 1);
  assert.equal(ui.completed(), 1);
  ui.h.unmount();
});

test("losing readiness cancels the scheduled prompt and allows a fresh attempt; unmount clears its timer", async () => {
  const ui = permissionPrompt();
  ui.options.hasSettledInitialAdTrackingPermission = true;
  ui.render();
  ui.options.isLedgerLoading = true;
  ui.render();
  assert.equal(ui.idle[0].cancelled, true);
  ui.options.isLedgerLoading = false;
  ui.render();
  assert.equal(ui.idle.length, 2);
  ui.idle[1].run();
  ui.h.unmount();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(ui.requests(), 0);
});

test("notification routing preserves badge updates, cold start response, entry reads and listener cleanup", async () => {
  const h = hooks(),
    badges = [],
    reads = [],
    routes = [],
    scopeReads = [],
    removed = [];
  let received,
    response,
    refreshed = 0,
    cleared = 0;
  const coldResponse = {
    actionIdentifier: "default",
    notification: { request: { content: { data: { actionRoute: "charts" } } } },
  };
  const load = modules({
    react: h.react,
    "expo-notifications": {
      setBadgeCountAsync: async (count) => {
        badges.push(count);
      },
      addNotificationReceivedListener: (callback) => {
        received = callback;
        return { remove: () => removed.push("received") };
      },
      addNotificationResponseReceivedListener: (callback) => {
        response = callback;
        return { remove: () => removed.push("response") };
      },
      getLastNotificationResponseAsync: async () => coldResponse,
      clearLastNotificationResponse: () => {
        cleared++;
      },
    },
    "src/lib/appStorage.ts": {},
    "src/lib/supabase.ts": {},
    "src/lib/logAppError.ts": { logAppError() {} },
  });
  const { useAppNotificationRouting } = load("src/hooks/useAppNotificationRouting.ts");
  h.render(() =>
    useAppNotificationRouting({
      currentScreen: "all-entries",
      isLedgerManagementOpen: false,
      userId: "me",
      ledgerState: { activeBook: { id: "book", ownerId: "me" } },
      notificationBadges: {
        hasResolved: true,
        syncRevision: 0,
        snapshot: {
          totalUnreadCount: 2,
          byBookId: { book: { ledgerEntryUnreadCount: 2, joinRequestUnreadCount: 0 } },
        },
        refresh: async () => {
          refreshed++;
        },
        markRead: async (...args) => {
          scopeReads.push(args);
          return true;
        },
      },
      notifications: { registerActionCategories: async () => {} },
      markEntryNotificationsRead: async (...args) => {
        reads.push(args);
      },
      navigateToStackScreen: (screen) => routes.push(screen),
      returnToCalendarRoot: () => routes.push("calendar"),
    }),
  );
  await flush();
  assert.deepEqual(badges, [2]);
  assert.deepEqual(scopeReads, [["book", "ledger-entries"]]);
  assert.deepEqual(routes, ["charts"]);
  received();
  response({
    actionIdentifier: "open_entry",
    notification: {
      request: {
        content: {
          data: {
            badgeKind: "ledger-entry",
            badgeBookId: "other-book",
            badgeEntryId: "entry",
          },
        },
      },
    },
  });
  assert.equal(reads[0][0], "other-book");
  assert.deepEqual(Array.from(reads[0][1]), ["entry"]);
  assert.deepEqual(routes, ["charts", "all-entries"]);
  assert.equal(refreshed, 2);
  assert.equal(cleared, 2);
  h.unmount();
  assert.deepEqual(removed, ["received", "response"]);
});
