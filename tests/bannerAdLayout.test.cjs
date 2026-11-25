const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");
const jsx = (type, props) => ({ type, props });

test("banner keeps its frame through delayed load, failure and retry", () => {
  const state = hooks();
  const load = modules({
    react: state.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      View: "View",
      Platform: { OS: "ios" },
      StyleSheet: { create: (value) => value },
    },
    "react-native-google-mobile-ads": {
      BannerAd: "Banner",
      BannerAdSize: { BANNER: "BANNER" },
      TestIds: { BANNER: "test-banner" },
    },
    "src/lib/ads/adUnitId.ts": { resolveAdMobAdUnitId: () => "test-banner" },
    "src/lib/ads/adMobLoadError.ts": { logAdMobLoadError() {} },
    "src/lib/ads/adRequestOptions.ts": { getAdRequestOptions: () => ({}) },
  });
  const { AppBannerAd } = load("src/components/AppBannerAd.native.tsx");
  const { BannerAdLayout } = load("src/constants/ads.ts");
  const renderFrame = () => state.render(() => AppBannerAd({})).props.children.props.children;
  const initial = renderFrame();
  assert.equal(initial.props.style[0].width, BannerAdLayout.width);
  assert.equal(initial.props.style[0].height, BannerAdLayout.height);
  assert.equal(initial.props.style[0].overflow, "hidden");
  assert.equal(initial.props.style[1].opacity, 0);
  initial.props.children.props.onAdLoaded();
  const loaded = renderFrame();
  assert.equal(loaded.props.style[1], false);
  assert.equal(loaded.props.style[0], initial.props.style[0]);
  loaded.props.children.props.onAdFailedToLoad(new Error("no fill"));
  const failed = renderFrame();
  assert.equal(failed.props.style[1].opacity, 0);
  assert.equal(failed.props.style[0], initial.props.style[0]);
  failed.props.children.props.onAdLoaded();
  assert.equal(renderFrame().props.style[1], false);
  state.unmount();
});

test("home reserves the banner height before SDK readiness without remounting it on date changes", () => {
  const state = hooks();
  const load = modules({
    react: state.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      View: "View",
      Text: "Text",
      Pressable: "Pressable",
      StyleSheet: { hairlineWidth: 1, create: (value) => value },
    },
    "../components/AppBannerAd": { AppBannerAd: "Banner" },
    "../components/MonthCalendarPager": { MonthCalendarPager: "Calendar" },
    "src/components/MonthlySummary.tsx": { MonthlySummary: "Summary" },
    "src/components/WeekdayHeader.tsx": { WeekdayHeader: "Weekdays" },
    "src/components/ScreenLoadingOverlay.tsx": { ScreenLoadingOverlay: "Loading" },
    "src/components/homeScreen/HomeAdaptiveLayout.tsx": { HomeAdaptiveLayout: "Layout" },
    "src/components/homeScreen/HomeTransactionList.tsx": { HomeTransactionList: "Transactions" },
    "src/utils/homeSummary.ts": {
      resolveDisplayedSummary: () => ({}),
      formatSummarySelectedDate: (value) => value,
    },
  });
  const { HomeScreen } = load("src/screens/HomeScreen.tsx");
  const props = {
    reservesBannerAdSpace: true,
    showsBannerAd: false,
    screenTitle: () => null,
    state: { visibleMonth: new Date(2026, 10, 1), selectedDate: "2026-11-25", selectedEntries: [] },
  };
  const renderSlot = () => state.render(() => HomeScreen(props)).props.children[0];
  const pending = renderSlot();
  assert.equal(pending.props.children, null);
  assert.ok(pending.props.style[1].height > 0);
  props.showsBannerAd = true;
  const ready = renderSlot();
  assert.equal(ready.props.children.type, "Banner");
  assert.equal(ready.props.style[1].height, pending.props.style[1].height);
  props.state.selectedDate = "2026-11-26";
  assert.equal(renderSlot().props.children, ready.props.children);
  props.reservesBannerAdSpace = false;
  props.showsBannerAd = false;
  const paid = renderSlot();
  assert.equal(paid.props.children, null);
  assert.equal(paid.props.style[1], false);
  state.unmount();
});
