const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Exercise the actual screen/pager callbacks without requiring an iOS runtime.
function loadComponent(file, dependencies) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const common = {
    react: {
      useEffect: () => {},
      useLayoutEffect: () => {},
      useRef: (current) => ({ current }),
      useState: (value) => [value, () => {}],
      useMemo: (factory) => factory(),
      useCallback: (callback) => callback,
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { StyleSheet: { create: (styles) => styles }, View: "View" },
  };
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (name.endsWith("/constants/scroll")) return loadComponent("src/constants/scroll.ts", {});
      const dependency = dependencies[name] ?? common[name];
      if (!dependency) throw new Error(`Unexpected dependency: ${name}`);
      return dependency;
    },
  });
  return exports;
}

function createPager(isFocused = true) {
  const moves = [];
  const { ChartMonthPager } = loadComponent("src/components/chartScreen/ChartMonthPager.native.tsx", {
    "@react-navigation/native": { useIsFocused: () => isFocused },
    "react-native-pager-view": "PagerView",
    "./ChartMonthPageContent": { ChartMonthPageContent: "Page" },
  });
  const pager = ChartMonthPager({
    currentMonth: { key: "2026-10" }, previousMonth: {}, nextMonth: {},
    onMoveMonth: (offset) => moves.push(offset), renderScreenTitle: () => null,
  });
  return {
    moves,
    select: (position) => pager.props.onPageSelected({ nativeEvent: { position } }),
    scroll: (pageScrollState) => pager.props.onPageScrollStateChanged({ nativeEvent: { pageScrollState } }),
  };
}

test("mount/restore page selection events do not advance the month", () => {
  const pager = createPager();
  for (const page of [0, 1, 2, 1]) pager.select(page);
  assert.deepEqual(pager.moves, []);
});

test("a real swipe changes the month only once", () => {
  const pager = createPager();
  pager.scroll("dragging");
  pager.scroll("settling");
  pager.select(2);
  pager.select(2);
  pager.scroll("idle");
  assert.deepEqual(pager.moves, [1]);
});

test("inactive screens and cancelled gestures cannot advance the month", () => {
  const inactive = createPager(false);
  inactive.scroll("dragging");
  inactive.select(2);
  assert.deepEqual(inactive.moves, []);
  const cancelled = createPager();
  cancelled.scroll("dragging");
  cancelled.select(1);
  cancelled.scroll("idle");
  cancelled.select(2);
  assert.deepEqual(cancelled.moves, []);
});

test("chart navigation updates its own month, leaving the calendar untouched", () => {
  let calendarWrites = 0;
  let chartMonth;
  const { ChartScreen } = loadComponent("src/screens/ChartScreen.tsx", {
    "@react-navigation/native": { useIsFocused: () => true },
    "../components/ScreenLoadingOverlay": { ScreenLoadingOverlay: "LocalLoading" },
    "../components/chartScreen/ChartMonthPager": { ChartMonthPager: "Pager" },
    "../components/chartScreen/ChartMonthPageContent": { ChartMonthPageContent: "Page" },
    "../components/AppBannerAd": { AppBannerAd: "Ad" },
    "../constants/colors": { AppColors: {} },
    "../constants/monthlyInsightCharts": { MonthlyInsightChartCopy: {} },
  });
  const screen = ChartScreen({ state: {
    currentChartMonth: { scope: "periodic" }, visibleMonth: new Date(2026, 9, 1),
    visibleChartMonth: new Date(2026, 11, 1),
    setVisibleMonth: () => { calendarWrites++; },
    setVisibleChartMonth: (date) => { chartMonth = date; },
  } });
  screen.props.children[1].props.children[1].props.onMoveMonth(1);
  assert.equal(calendarWrites, 0);
  assert.equal(chartMonth.getFullYear(), 2027);
  assert.equal(chartMonth.getMonth(), 0);
});

test("calendar delegates to the native scroll viewport", () => {
  const { MonthCalendarPager } = loadComponent("src/components/MonthCalendarPager.native.tsx", {
    "@react-navigation/native": { useIsFocused: () => true },
    "react-native": { AppState: { currentState: "active" } },
    "./monthCalendarPager/CalendarScrollViewport": { CalendarScrollViewport: "GestureViewport" },
  });
  const view = MonthCalendarPager({
    currentPage: { key: "2026-10", height: 100 },
    previousPage: { key: "2026-09", height: 100 },
    nextPage: { key: "2026-11", height: 100 },
  });
  assert.equal(view.type, "GestureViewport");
  assert.equal(view.props.active, true);
  assert.equal(view.props.pages.length, 3);
});
