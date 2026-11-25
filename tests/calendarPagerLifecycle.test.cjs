const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { test } = require("node:test");
const { modules, currencyMock } = require("./annualReportHelpers.cjs");
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    {
      exports,
      require: (name) => {
        if (name in dependencies) return dependencies[name];
        throw new Error(name);
      },
    },
  );
  return exports;
}
function hookHost() {
  const hooks = [];
  let index = 0,
    effects = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useRef(value) {
      return (hooks[index++] ??= { current: value });
    },
    useState(initial) {
      const key = index++;
      if (!(key in hooks)) hooks[key] = typeof initial === "function" ? initial() : initial;
      return [
        hooks[key],
        (value) => {
          hooks[key] = typeof value === "function" ? value(hooks[key]) : value;
        },
      ];
    },
    useMemo(fn, deps) {
      const key = index++;
      if (!same(hooks[key]?.deps, deps)) hooks[key] = { deps, value: fn() };
      return hooks[key].value;
    },
    useLayoutEffect(fn, deps) {
      return react.useEffect(fn, deps);
    },
    useCallback(fn, deps) {
      return react.useMemo(() => fn, deps);
    },
    useEffect(fn, deps) {
      const key = index++;
      if (!same(hooks[key]?.deps, deps)) {
        const old = hooks[key];
        hooks[key] = { deps };
        effects.push(() => {
          old?.cleanup?.();
          hooks[key].cleanup = fn();
        });
      }
    },
  };
  return {
    react,
    render(fn) {
      index = 0;
      effects = [];
      const result = fn();
      effects.forEach((fn) => fn());
      return result;
    },
    dispose() {
      hooks.forEach((h) => h?.cleanup?.());
    },
  };
}
const jsx = (type, props, key) => ({ type, props, key });
function mount() {
  const host = hookHost(),
    moves = [],
    weekMoves = [],
    selected = [],
    resets = [];
  const { CalendarSwipeViewport } = load(
    "src/components/monthCalendarPager/CalendarSwipeViewport.tsx",
    {
      react: host.react,
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": { View: "View", StyleSheet: { create: (s) => s } },
      "react-native-pager-view": { __esModule: true, default: "Pager" },
      "../../constants/scroll": { AppPagerScrollBehavior: {} },
      "../../constants/uiStyles": { FullBleedHorizontalStyle: {} },
      "./MonthCalendarSection": { MonthCalendarSection: "Month" },
    },
  );
  const props = {
    active: true,
    geometryKey: "initial",
    resetRevision: 0,
    pages: [
      { key: "09", height: 100 },
      { key: "10", height: 140 },
      { key: "11", height: 120 },
    ],
    onMoveMonth: (value) => moves.push(value),
    onMoveWeekDate: (date) => weekMoves.push(date),
    onSelectDate: (date) => selected.push(date),
    onHeightChange() {},
    collapsedWeeks: Array.from({ length: 3 }, () => ({ index: 0, top: 0, height: 50 })),
    expanded: true,
    weekSwipeDates: ["2026-09-24", "2026-10-01", "2026-10-08"],
    expansionProgress: { interpolate: () => 0 },
    onWeekLayout() {},
  };
  const render = () => host.render(() => CalendarSwipeViewport(props));
  const tree = render();
  tree.props.ref.current = { setPageWithoutAnimation: (value) => resets.push(value) };
  return { props, moves, weekMoves, selected, resets, render, dispose: host.dispose };
}
const stateEvent = (pageScrollState) => ({ nativeEvent: { pageScrollState } });
const selectedEvent = (position) => ({ nativeEvent: { position } });
const scrollEvent = (position, offset = 0) => ({ nativeEvent: { position, offset } });

test("calendar uses native horizontal paging with the current grid height", () => {
  const tree = mount().render();
  assert.equal(tree.type, "Pager");
  assert.equal(tree.props.orientation, "horizontal");
  assert.equal(tree.props.initialPage, 1);
  assert.equal(tree.props.style[1].height, 140);
});

test("opening and closing keeps the three native pages mounted on a full-height viewport", () => {
  const ui = mount();
  const monthly = ui.render();
  const monthPages = ui.props.pages;
  const pageKeys = (tree) => tree.props.children.map((page) => page.key);
  for (let cycle = 0; cycle < 3; cycle++) {
    ui.props.expanded = false;
    ui.props.geometryKey = "week";
    ui.props.pages = [monthPages[1], monthPages[1], monthPages[1]];
    const weekly = ui.render();
    assert.equal(weekly.key, monthly.key);
    assert.deepEqual(pageKeys(weekly), pageKeys(monthly));
    assert.equal(weekly.props.style[0].position, "absolute");
    assert.equal(weekly.props.style[1].height, monthly.props.style[1].height);

    ui.props.expanded = true;
    ui.props.geometryKey = "month";
    ui.props.pages = monthPages;
    assert.deepEqual(pageKeys(ui.render()), pageKeys(monthly));
  }
  assert.deepEqual(ui.resets, []);
});
for (const [page, direction] of [
  [0, -1],
  [2, 1],
]) {
  test(`a swipe commits month direction ${direction} only once after native scrolling ends`, () => {
    const ui = mount(),
      tree = ui.render();
    tree.props.onPageSelected(selectedEvent(page));
    assert.deepEqual(ui.moves, []);
    tree.props.onPageScrollStateChanged(stateEvent("dragging"));
    tree.props.onPageSelected(selectedEvent(page));
    assert.deepEqual(ui.moves, []);
    tree.props.onPageScrollStateChanged(stateEvent("idle"));
    tree.props.onPageScrollStateChanged(stateEvent("idle"));
    tree.props.onPageSelected(selectedEvent(page));
    assert.deepEqual(ui.moves, [direction]);
  });
}
test("idle before page-selected still commits the final native scroll position", () => {
  const ui = mount(),
    tree = ui.render();
  tree.props.onPageScrollStateChanged(stateEvent("dragging"));
  tree.props.onPageScroll(scrollEvent(2));
  tree.props.onPageScrollStateChanged(stateEvent("idle"));
  tree.props.onPageSelected(selectedEvent(2));
  assert.deepEqual(ui.moves, [1]);
});

test("collapsed swipes select the previewed week without dispatching a month move", () => {
  const ui = mount();
  ui.props.expanded = false;
  ui.props.geometryKey = "week";
  const weekly = ui.render();
  weekly.props.onPageScrollStateChanged(stateEvent("dragging"));
  weekly.props.onPageScroll(scrollEvent(0));
  weekly.props.onPageScrollStateChanged(stateEvent("idle"));
  weekly.props.onPageScrollStateChanged(stateEvent("idle"));
  assert.deepEqual(ui.weekMoves, ["2026-09-24"]);
  assert.deepEqual(ui.moves, []);

  ui.props.weekSwipeDates = ["2026-09-17", "2026-09-24", "2026-10-01"];
  ui.props.geometryKey = "previous-week";
  const previous = ui.render();
  assert.equal(ui.resets.at(-1), 1);
  previous.props.onPageScrollStateChanged(stateEvent("dragging"));
  previous.props.onPageScroll(scrollEvent(2));
  ui.props.expanded = true;
  ui.props.geometryKey = "month";
  const expanded = ui.render();
  previous.props.onPageScrollStateChanged(stateEvent("idle"));
  assert.deepEqual(ui.weekMoves, ["2026-09-24"]);
  expanded.props.onPageScrollStateChanged(stateEvent("dragging"));
  expanded.props.onPageScroll(scrollEvent(2));
  expanded.props.onPageScrollStateChanged(stateEvent("idle"));
  assert.deepEqual(ui.moves, [1]);
});
test("a cancelled swipe keeps the month and does not select a date while dragging", () => {
  const ui = mount(),
    tree = ui.render();
  tree.props.onPageScrollStateChanged(stateEvent("dragging"));
  tree.props.children[1].props.children.props.onSelectDate("2026-10-02");
  tree.props.onPageScroll(scrollEvent(1));
  tree.props.onPageScrollStateChanged(stateEvent("idle"));
  assert.deepEqual(ui.moves, []);
  assert.deepEqual(ui.selected, []);
  tree.props.children[1].props.children.props.onSelectDate("2026-10-02");
  tree.props.children[0].props.children.props.onSelectDate("2026-09-02");
  assert.deepEqual(ui.selected, ["2026-10-02"]);
});
for (const change of ["blur", "foreground", "geometry"]) {
  test(`${change} cancels stale page events and recenters without changing the month`, () => {
    const ui = mount(),
      tree = ui.render();
    tree.props.onPageScrollStateChanged(stateEvent("dragging"));
    tree.props.onPageSelected(selectedEvent(2));
    if (change === "blur") ui.props.active = false;
    if (change === "foreground") ui.props.resetRevision++;
    if (change === "geometry") {
      ui.props.geometryKey = "new";
      ui.props.pages = [
        { key: "10", height: 120 },
        { key: "11", height: 220 },
        { key: "12", height: 100 },
      ];
    }
    const next = ui.render();
    tree.props.onPageScrollStateChanged(stateEvent("idle"));
    assert.deepEqual(ui.moves, []);
    assert.equal(ui.resets.at(-1), 1);
    if (change === "geometry") assert.equal(next.props.style[1].height, 220);
    ui.dispose();
  });
}

test("geometry, focus, foreground, menu and data renders retain the viewport", () => {
  const host = hookHost();
  let focused = true,
    listener,
    removed = false;
  const { MonthCalendarPager } = load("src/components/MonthCalendarPager.native.tsx", {
    react: host.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@react-navigation/native": { useIsFocused: () => focused },
    "react-native": {
      Animated: { View: "AnimatedView" },
      Pressable: "Pressable",
      View: "View",
      StyleSheet: { create: (styles) => styles },
      AppState: {
        currentState: "active",
        addEventListener(_, fn) {
          listener = fn;
          return {
            remove() {
              removed = true;
            },
          };
        },
      },
    },
    "../constants/authControls": { AuthControls: {} },
    "../constants/colors": { getAppColors: () => ({}) },
    "../constants/home": {
      HomeScreenCopy: {},
      HomeScreenUi: { calendarExpansionIconWidth: 18, calendarExpansionIconHeight: 7 },
    },
    "../constants/uiStyles": { FullBleedHorizontalStyle: {} },
    "../hooks/useAppTheme": { useAppTheme() {} },
    "../hooks/useCalendarExpansion": {
      useCalendarExpansion() {
        const [expanded, setExpanded] = host.react.useState(false);
        return {
          expanded,
          progress: { interpolate: ({ outputRange }) => outputRange[expanded ? 1 : 0] },
          toggle: () => setExpanded((value) => !value),
        };
      },
    },
    "./monthCalendarPager/calendarWeekCount": {
      buildCalendarWeekNavigation: (pages) => ({ pages, dates: [] }),
      resolveCollapsedCalendarWeek: (_days, height, _date, frames) => ({
        index: 0,
        top: 0,
        height: frames?.[0]?.height ?? height / 5,
      }),
    },
    "./monthCalendarPager/CalendarSwipeViewport": { CalendarSwipeViewport: "Viewport" },
  });
  const props = {
    previousPage: { key: "09", height: 100, summary: { days: [] } },
    currentPage: { key: "10", height: 100, summary: { days: [] } },
    nextPage: { key: "11", height: 100, summary: { days: [] } },
  };
  const renderPanel = () => host.render(() => MonthCalendarPager(props));
  const render = () => renderPanel().props.children[0].props.children;
  let tree = render(),
    key = tree.key,
    geometry = tree.props.geometryKey;
  const collapsed = renderPanel();
  assert.equal(collapsed.props.children[0].props.style[1].height, 20);
  assert.equal(collapsed.props.children[1].props.accessibilityState.expanded, false);
  tree.props.onWeekLayout("10", 0, { top: 0, height: 25 });
  assert.equal(renderPanel().props.children[0].props.style[1].height, 25);
  collapsed.props.children[1].props.onPress();
  const expanded = renderPanel();
  assert.equal(expanded.props.children[0].props.style[1].height, 100);
  assert.notEqual(render().props.geometryKey, geometry);
  expanded.props.children[1].props.onPress();
  assert.equal(renderPanel().props.children[0].props.style[1].height, 25);
  assert.equal(render().props.geometryKey, geometry);
  assert.equal(render().key, key);
  props.currentPage = { ...props.currentPage };
  assert.equal(render().key, key);
  tree.props.onHeightChange("09", 120);
  tree = render();
  assert.equal(tree.key, key);
  assert.notEqual(tree.props.geometryKey, geometry);
  geometry = tree.props.geometryKey;
  assert.equal(tree.props.pages[0].height, 120);
  props.nextPage = props.currentPage;
  props.currentPage = props.previousPage;
  props.previousPage = { key: "08", height: 100, summary: { days: [] } };
  tree = render();
  assert.equal(tree.key, key);
  assert.notEqual(tree.props.geometryKey, geometry);
  const revision = tree.props.resetRevision;
  listener("inactive");
  listener("active");
  tree = render();
  assert.equal(tree.key, key);
  assert.notEqual(tree.props.resetRevision, revision);
  focused = false;
  tree = render();
  assert.equal(tree.props.active, false);
  assert.equal(tree.key, key);
  focused = true;
  assert.equal(render().props.active, true);
  host.dispose();
  assert.equal(removed, true);
});

test("collapsed calendar uses today's week, follows a selected date, and ignores filler days", () => {
  const { resolveCollapsedCalendarWeek } = modules({
    "src/lib/currencyPreference.ts": currencyMock,
  })("src/components/monthCalendarPager/calendarWeekCount.ts");
  const days = Array.from({ length: 21 }, (_, index) => ({
    isoDate: String(index + 1),
    isCurrentMonth: index > 0,
    isToday: index === 10,
  }));
  const measured = { 1: { top: 48, height: 52 } };
  const today = resolveCollapsedCalendarWeek(days, 150, "1", measured);
  assert.equal(today.index, 1);
  assert.equal(today.top, 48);
  assert.equal(today.height, 52);
  const selected = resolveCollapsedCalendarWeek(days, 150, "17", measured);
  assert.equal(selected.index, 2);
  assert.equal(selected.top, 100);
  assert.equal(selected.height, 50);
  const anotherMonth = days.map((day) => ({ ...day, isToday: false }));
  assert.equal(resolveCollapsedCalendarWeek(anotherMonth, 150, "other").index, 0);
});

test("weekly previews advance seven local days across weeks, months, and years", () => {
  const loadCalendar = modules({ "src/lib/currencyPreference.ts": currencyMock });
  const { buildCalendarWeekNavigation, resolveCollapsedCalendarWeek } = loadCalendar(
    "src/components/monthCalendarPager/calendarWeekCount.ts",
  );
  const { buildMonthlyLedger } = loadCalendar("src/utils/calendar.ts");
  const pages = ["2026-11", "2026-12", "2027-01"].map((key) => ({
    key,
    height: 250,
    summary: buildMonthlyLedger(key, [], "2026-12-31"),
  }));
  const navigation = buildCalendarWeekNavigation(pages, "2026-12-31");
  assert.deepEqual(Array.from(navigation.dates), ["2026-12-24", "2026-12-31", "2027-01-07"]);
  assert.deepEqual(
    Array.from(navigation.pages, (page) => page.key),
    ["2026-12", "2026-12", "2027-01"],
  );
  assert.equal(
    resolveCollapsedCalendarWeek(navigation.pages[2].summary.days, 250, navigation.dates[2]).index,
    1,
  );
  const first = buildCalendarWeekNavigation(pages, "2026-12-01");
  assert.equal(first.dates[0], "2026-11-24");
  assert.equal(first.pages[0].key, "2026-11");
});
