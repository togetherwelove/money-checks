const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, currencyMock, hooks } = require("./annualReportHelpers.cjs");
const jsx = (type, props) => ({ type, props });
const nodes = (node) =>
  Array.isArray(node)
    ? node.flatMap(nodes)
    : node?.props
      ? [node, ...nodes(node.props.children)]
      : [];
const controls = Object.fromEntries(
  [
    "Host",
    "List",
    "Form",
    "Section",
    "Picker",
    "Toggle",
    "Text",
    "Button",
    "RNHostView",
    "VStack",
    "HStack",
    "Menu",
    "Spacer",
    "Chart",
  ].map((name) => [name, name]),
);
const chartState = hooks();
const load = modules({
  react: chartState.react,
  "src/components/monthlyInsights/TrendChartTooltip.tsx": { TrendChartTooltip: "Tooltip" },
  "src/components/monthlyInsights/ExpenseComparisonGraphic.tsx": {
    ExpenseComparisonGraphic: "ExpenseGraphic",
  },
  "@react-navigation/native": { useIsFocused: () => true },
  "src/components/AppIcons.tsx": { Feather: "Icon" },
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": {
    StyleSheet: { create: (value) => value },
    Text: "RNText",
    Pressable: "Pressable",
    Switch: "RNSwitch",
    View: "View",
    Platform: { Version: 26 },
    Keyboard: { dismiss() {} },
    Linking: {},
  },
  "@expo/ui/swift-ui": controls,
  "@react-navigation/bottom-tabs/unstable": {
    createNativeBottomTabNavigator: () => ({ Navigator: "Tabs", Screen: "Tab" }),
  },
  "src/app/SignedInStackNavigator.tsx": { SignedInStackNavigator: "Stack" },
  "react-native-svg": { __esModule: true, default: "Svg", Circle: "Circle", G: "G", Line: "Line" },
  "src/lib/currencyPreference.ts": currencyMock,
  "@expo/ui/swift-ui/modifiers": Object.fromEntries(
    [
      "accessibilityLabel",
      "accessibilityValue",
      "buttonStyle",
      "labelsHidden",
      "background",
      "listStyle",
      "listRowBackground",
      "scrollContentBackground",
      "listSectionSpacing",
      "fixedSize",
      "lineLimit",
      "multilineTextAlignment",
      "font",
      "foregroundStyle",
      "listRowInsets",
      "listRowSeparator",
      "padding",
      "cornerRadius",
      "frame",
      "pickerStyle",
      "tint",
      "disabled",
      "tag",
    ].map((name) => [name, (value) => ({ name, value })]),
  ),
  "src/components/appSettings/CalendarHeatmapSetting.tsx": { CalendarHeatmapSetting: "Heatmap" },
  "src/components/appSettings/SettingsMenuLinks.tsx": { SettingsMenuLinks: "SettingsLinks" },
  "src/components/accountScreen/NotificationThresholdField.tsx": {
    NotificationThresholdField: "Threshold",
  },
  "src/contexts/ExpenseTextColorContext.tsx": {
    useExpenseTextColor: () => ({ mode: "default", updateMode() {} }),
  },
});

test("system symbols cover every selectable category icon without changing stored icon identifiers", () => {
  const { CATEGORY_ICON_PICKER_OPTIONS } = load("src/constants/categories.ts");
  const { SystemIcons } = load("src/constants/systemIcons.ts");
  for (const icon of CATEGORY_ICON_PICKER_OPTIONS) assert.ok(SystemIcons[icon], icon);
  assert.equal(SystemIcons["refresh-cw"], "arrow.clockwise");
});

test("native display settings preserve summary, base day and paid feature gating", () => {
  const { AppSettingsScreen } = load("src/screens/AppSettingsScreen.ios.tsx");
  const { AppSettingsCopy } = load("src/constants/appSettings.ts");
  const { CalendarSummaryModes } = load("src/constants/calendarSummary.ts");
  const calls = [];
  const events = ["member-added", "entry-added"];
  const props = {
    activeBookId: "book",
    activeBookName: "Book",
    calendarSummaryMode: CalendarSummaryModes.selectedMonth,
    calendarSummaryBaseDay: 15,
    isPlusActive: false,
    isCalendarHeatmapEnabled: true,
    notificationPermissionState: "granted",
    notificationPermissionLabel: "Granted",
    showNotificationSettings: true,
    notificationPreferenceGroups: [
      {
        id: "group",
        title: "Group",
        items: [{ type: "grouped", eventTypes: events, enabled: true, label: "Notify" }],
      },
    ],
    onChangeCalendarSummaryMode: (mode) => calls.push(["mode", mode]),
    onChangeCalendarSummaryBaseDay: (day) => calls.push(["day", day]),
    onToggleNotificationPreference: (types, enabled) => calls.push(["notify", types, enabled]),
  };
  const all = nodes(AppSettingsScreen(props));
  for (const node of all) {
    if (node.type === "Text" || node.type === "RNText") continue;
    const children = [node.props.children].flat(Infinity);
    assert.equal(
      children.some((child) => typeof child === "string" || typeof child === "number"),
      false,
      `Raw text under ${node.type} crashes the native renderer`,
    );
  }

  assert.equal(all[1].type, "List");
  assert.equal(
    all[1].props.modifiers.find((m) => m.name === "scrollContentBackground").value,
    "hidden",
  );
  all
    .find(
      (node) =>
        node.type === "Picker" &&
        node.props.label?.props?.children === AppSettingsCopy.summaryBaseDayTitle,
    )
    .props.onSelectionChange(31);
  const heatmap = all.find((node) => node.type === "Heatmap");
  assert.equal(heatmap.props.isPlusActive, false);
  assert.equal(heatmap.props.isEnabled, true);
  assert.equal(
    all.some((node) => node.type === "Toggle"),
    false,
  );
  assert.deepEqual(calls, [["day", 31]]);
});

test("native notification detail preserves grouped preference actions after leaving display settings", () => {
  const { NotificationSettingsScreen } = load("src/screens/NotificationSettingsScreen.ios.tsx");
  const events = ["member-added", "entry-added"],
    calls = [];
  const all = nodes(
    NotificationSettingsScreen({
      screenTitle: null,
      showNotificationSettings: true,
      notificationPermissionState: "granted",
      notificationPermissionLabel: "Granted",
      notificationPreferenceGroups: [
        {
          id: "group",
          title: "Group",
          items: [{ type: "grouped", eventTypes: events, enabled: true, label: "Notify" }],
        },
      ],
      onToggleNotificationPreference: (types, enabled) => calls.push([types, enabled]),
    }),
  );
  all.find((node) => node.type === "Toggle").props.onIsOnChange(false);
  assert.deepEqual(calls, [[events, false]]);
});

test("the report shows expense and income together and compares spending with the prior period", () => {
  const { MonthlyCashflowSummary, MonthlyCashflowTotals } = load(
    "src/components/monthlyInsights/MonthlyCashflowSummary.tsx",
  );
  const readText = (node) => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(readText).join("");
    return node?.props ? readText(node.props.children) : "";
  };
  const dailyComparison = { current: [], previous: [] };
  const render = (expense, previousPeriod) =>
    MonthlyCashflowSummary({
      expense,
      previousPeriod,
      dailyExpenseComparison: dailyComparison,
    });
  const decreased = {
    currentAmount: 100,
    previousAmount: 160,
    deltaAmount: 60,
    direction: "decrease",
  };
  const totals = MonthlyCashflowTotals({ expense: 100, income: 400 }).props.children;
  const comparison = render(decreased, "지난달").props.children;
  assert.equal(totals.props.style.flexDirection, "row");
  assert.deepEqual(Array.from(totals.props.children, readText), ["지출100원", "수입400원"]);
  assert.equal(readText(comparison), "지난달보다\n60원 덜 썼어요.");
  assert.equal(comparison.props.style.flexDirection, "row");
  const [copy, graph] = comparison.props.children;
  const [sentence, legend] = copy.props.children;
  assert.equal(sentence.props.style.textAlign, "left");
  assert.equal(legend.props.previousPeriod, "지난달");
  assert.equal(graph.props.comparison, dailyComparison);
  assert.match(
    readText(render({ ...decreased, currentAmount: 220, direction: "increase" }, "이전 기간")),
    /이전 기간보다\n60원 더 썼어요/,
  );
  assert.match(
    readText(
      render({ ...decreased, currentAmount: 160, deltaAmount: 0, direction: "same" }, "지난달"),
    ),
    /지난달과 같은 금액을 썼어요/,
  );
  assert.match(
    readText(render({ ...decreased, previousAmount: 0, direction: "increase" }, "지난달")),
    /지난달 지출 기록이 없어요/,
  );
  assert.equal(render(decreased).props.children, null);
});

test("the spending legend below the comparison uses the same distinct colors as its graph", () => {
  const { ExpenseComparisonLegend } = load(
    "src/components/monthlyInsights/ExpenseComparisonLegend.tsx",
  );
  const { getExpenseComparisonColors } = load("src/constants/monthlyInsightCharts.ts");
  const colors = getExpenseComparisonColors();
  const monthly = ExpenseComparisonLegend({
    previousPeriod: "지난달",
    comparison: {
      previous: [{ date: "2026-10-01", amount: 0 }],
      current: [{ date: "2026-11-01", amount: 0 }],
    },
  });
  assert.deepEqual(
    Array.from(monthly.props.children, (item) => item.props.children[1].props.children),
    ["10월", "11월"],
  );
  for (const [previousPeriod, currentPeriod] of [
    ["지난달", "이번달"],
    ["이전 기간", "이번 기간"],
  ]) {
    const [previous, current] = ExpenseComparisonLegend({ previousPeriod }).props.children;
    assert.equal(previous.props.children[1].props.children, previousPeriod);
    assert.equal(current.props.children[1].props.children, currentPeriod);
    assert.equal(previous.props.children[0].props.style[1].backgroundColor, colors.previous);
    assert.equal(current.props.children[0].props.style[1].backgroundColor, colors.current);
  }
  assert.notEqual(colors.previous, colors.current);
});

test("the share bar shows five categories and opens the exact categories for each row", () => {
  const { MonthlyShareBreakdown } = load(
    "src/components/monthlyInsights/MonthlyShareBreakdown.tsx",
  );
  const categories = [
    { category: "의료", categoryId: "medical", amount: 15 },
    { category: "문화", categoryId: "culture", amount: 8 },
    { category: "식비", categoryId: "food", amount: 40 },
    { category: "선물", categoryId: "gift", amount: 5 },
    { category: "교통", categoryId: "transport", amount: 25 },
    { category: "쇼핑", categoryId: "shopping", amount: 4 },
    { category: "여행", categoryId: "travel", amount: 3 },
  ];
  const opened = [];
  const render = (categories, entryType = "expense") =>
    nodes(
      chartState.render(() =>
        MonthlyShareBreakdown({
          categories,
          members: [],
          entryType,
          onOpenCategories: (selected, type) =>
            opened.push([type, ...Array.from(selected, (item) => item.id)]),
        }),
      ),
    );
  const bars = (tree) =>
    tree.filter(
      (node) => node.props.accessibilityElementsHidden && node.props.style.flexDirection === "row",
    );
  const tree = render(categories);
  assert.equal(bars(tree).length, 1);
  assert.deepEqual(
    Array.from(bars(tree)[0].props.children, (segment) =>
      Math.round(segment.props.style.flex * 100),
    ),
    [40, 25, 15, 8, 5, 7],
  );
  assert.equal(
    new Set(
      Array.from(bars(tree)[0].props.children, (segment) => segment.props.style.backgroundColor),
    ).size,
    6,
  );
  const rows = tree.filter((node) => node.props.accessibilityRole === "button");
  assert.equal(rows.length, 6);
  assert.ok(rows.every((row) => nodes(row).some((child) => child.props.name === "chevron-right")));
  rows[0].props.onPress();
  rows[5].props.onPress();
  bars(tree)[0].props.children[1].props.onPress();
  const income = render([{ category: "월급", categoryId: "salary", amount: 100 }], "income");
  assert.equal(
    income.find((node) => node.props.accessibilityRole === "header").props.children,
    "수입 비중",
  );
  income.find((node) => node.props.accessibilityRole === "button").props.onPress();
  assert.deepEqual(opened, [
    ["expense", "food"],
    ["expense", "shopping", "travel"],
    ["expense", "transport"],
    ["income", "salary"],
  ]);
  assert.equal(bars(render(categories.slice(0, 3)))[0].props.children.length, 3);
  assert.equal(bars(render([])).length, 0);
});

test("income defaults to member breakdown and share switches remain independent", () => {
  chartState.unmount();
  const { MonthlyShareBreakdown } = load(
    "src/components/monthlyInsights/MonthlyShareBreakdown.tsx",
  );
  const categories = [{ category: "식비", categoryId: "food", amount: 100 }];
  const members = [
    { memberKey: "one", memberName: "가족", amount: 70 },
    { memberKey: "two", memberName: "다른 구성원", amount: 30 },
  ];
  const render = () =>
    chartState
      .render(() => [
        MonthlyShareBreakdown({
          categories,
          members,
          entryType: "expense",
          onOpenCategories: () => assert.fail("member rows should not use a category filter"),
        }),
        MonthlyShareBreakdown({ categories, members, entryType: "income" }),
      ])
      .map(nodes);
  const hasText = (tree, value) =>
    tree.some((node) => node.type === "RNText" && node.props.children === value);
  const switchProps = (tree) => tree.find((node) => node.type === "RNSwitch").props;
  let [expense, income] = render();
  assert.equal(switchProps(expense).value, false);
  assert.equal(switchProps(income).value, true);
  assert.ok(hasText(income, "가족"));
  switchProps(income).onValueChange(false);
  switchProps(expense).onValueChange(true);
  [expense, income] = render();
  assert.equal(switchProps(expense).value, true);
  assert.equal(switchProps(income).value, false);
  assert.ok(hasText(expense, "가족"));
  assert.ok(hasText(expense, "70원 · 70%"));
  assert.ok(hasText(income, "식비"));
  assert.ok(expense.every((node) => node.props.accessibilityRole !== "button"));
  switchProps(income).onValueChange(true);
  switchProps(expense).onValueChange(false);
  [expense, income] = render();
  assert.ok(hasText(expense, "식비"));
  assert.ok(hasText(income, "가족"));
  switchProps(income).onValueChange(false);
  render();
});

test("iOS trend preserves both series, monthly labels and proportional line positions", () => {
  const { MonthlyTrendLineChart } = load(
    "src/components/monthlyInsights/MonthlyTrendLineChart.ios.tsx",
  );
  const props = {
    trendMonths: [
      { key: "jan", monthLabel: "Jan", incomeAmount: 100, expenseAmount: 30 },
      { key: "feb", monthLabel: "Feb", incomeAmount: 200, expenseAmount: 50 },
    ],
  };
  const render = () => chartState.render(() => MonthlyTrendLineChart(props));
  const tree = render();
  const series = nodes(tree).filter(
    (node) => typeof node.type === "function" && "amountKey" in node.props,
  );
  assert.deepEqual(
    series.map((node) => node.props.amountKey),
    ["incomeAmount", "expenseAmount"],
  );
  assert.notEqual(series[0].props.color, series[1].props.color);
  const points = series.map((node) =>
    nodes(node.type(node.props)).filter((item) => item.type === "Circle"),
  );
  const lines = series.map((node) =>
    nodes(node.type(node.props)).filter((item) => item.type === "Line"),
  );
  assert.equal(points[0].length, 2);
  assert.equal(lines[0].length, 1);
  assert.equal(points[0][0].props.cx, "25%");
  assert.equal(points[0][1].props.cx, "75%");
  const height = load("src/constants/monthlyInsightCharts.ts").MonthlyInsightChartLayout
    .trendLineHeight;
  assert.equal((height - points[0][1].props.cy) / (height - points[0][0].props.cy), 2);
  assert.equal(lines[0][0].props.y1, points[0][0].props.cy);
  assert.equal(lines[0][0].props.y2, points[0][1].props.cy);
  assert.ok(nodes(tree).some((node) => node.props.children === "Jan"));
  assert.ok(nodes(tree).some((node) => node.props.children === "Feb"));
  const touchColumns = nodes(tree).filter((node) => node.type === "Pressable");
  assert.equal(touchColumns.length, 2);
  touchColumns[1].props.onPress();
  let selected = render();
  const tooltip = nodes(selected).find((node) => node.type === "Tooltip");
  assert.equal(tooltip.props.point.incomeAmount, 200);
  assert.equal(tooltip.props.point.expenseAmount, 50);
  assert.equal(
    nodes(selected).find(
      (node) => node.type === "Pressable" && node.props.accessibilityLabel === "Feb",
    ).props.accessibilityState.selected,
    true,
  );
  touchColumns[1].props.onPress();
  assert.equal(
    nodes(render()).some((node) => node.type === "Tooltip"),
    false,
  );
  chartState.unmount();
});

test("member menu keeps identity with duplicate names and does not replace a missing selection", () => {
  const { EntryTargetMemberSelector } = load("src/components/EntryTargetMemberSelector.ios.tsx");
  const members = [
    { userId: "a", displayName: "Same" },
    { userId: "b", displayName: "Same" },
  ];
  const selected = [];
  const tree = EntryTargetMemberSelector({
    members,
    selectedMemberId: "a",
    onSelectMember: (member) => selected.push(member),
  });
  const buttons = nodes(tree).filter((node) => node.type === "Button");
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].props.systemImage, "checkmark");
  assert.equal(buttons[1].props.systemImage, undefined);
  buttons[1].props.onPress();
  assert.deepEqual(selected, [members[1]]);
  const { EntryRegistrationCopy } = load("src/constants/entryRegistration.ts");
  const missing = EntryTargetMemberSelector({
    members,
    selectedMemberId: "missing",
    onSelectMember: (member) => selected.push(member),
  });
  assert.equal(missing.props.value, EntryRegistrationCopy.targetMemberPlaceholder);
  assert.equal(
    EntryTargetMemberSelector({ members: [], selectedMemberId: "missing", onSelectMember() {} }),
    null,
  );
  assert.deepEqual(selected, [members[1]]);
});

test("all footer destination icons have native symbol equivalents", () => {
  const { buildFooterTabs } = load("src/lib/footerTabs.ts");
  const { SystemIcons } = load("src/constants/systemIcons.ts");
  for (const tab of buildFooterTabs()) {
    assert.ok(SystemIcons[tab.activeIcon]);
    assert.ok(SystemIcons[tab.inactiveIcon]);
  }
});

test("additional info menu trigger contains only the selected value and leaves its label outside", () => {
  const { NativeEntryDetailMenu } = load("src/components/entryComposer/NativeEntryDetailMenu.tsx");
  const option = { type: "Button", props: { label: "Option" } };
  const tree = NativeEntryDetailMenu({ label: "Payment", value: "Selected", children: option });
  assert.equal(tree.props.children[0].type, "RNText");
  assert.equal(tree.props.children[0].props.children, "Payment");
  const host = tree.props.children[1];
  assert.equal(host.props.matchContents.horizontal, true);
  const menu = nodes(host).find((node) => node.type === "Menu");
  const triggerText = nodes(menu.props.label)
    .filter((node) => node.type === "RNText")
    .map((node) => node.props.children);
  assert.deepEqual(triggerText, ["Selected"]);
  assert.equal(menu.props.children, option);
});

test("single-line menu rows and inputs share a capsule height of twice the group radius", () => {
  const { getSettingsGroupStyles, SettingsGroupDesign: design } = load(
    "src/constants/settingsGroupStyles.ts",
  );
  const styles = getSettingsGroupStyles();
  const borderHeight = styles.card.borderWidth * 2;
  assert.equal(styles.row.minHeight + borderHeight, styles.card.borderRadius * 2);
  assert.equal(styles.singleLineField.minHeight + borderHeight, design.singleLineHeight);
  assert.equal(
    styles.singleLineInput.minHeight + styles.singleLineField.paddingVertical * 2 + borderHeight,
    design.singleLineHeight,
  );
  const { getNativeSettingsGroupStyles } = load("src/constants/nativeSettingsGroupStyles.ios.ts");
  const nativeRowFrame = getNativeSettingsGroupStyles().row.find(
    (modifier) => modifier.name === "frame",
  );
  assert.equal(nativeRowFrame.value.minHeight + borderHeight, design.singleLineHeight);
});
