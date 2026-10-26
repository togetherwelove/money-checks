const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];
const controls = Object.fromEntries(['Host', 'Form', 'Section', 'Picker', 'Toggle', 'Text', 'Button', 'RNHostView', 'VStack', 'HStack', 'Menu', 'Spacer', 'Chart'].map(name => [name, name]));
const load = modules({
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { StyleSheet: { create: value => value }, Text: 'RNText', View: 'View', Platform: { Version: 26 }, Linking: {} },
  '@expo/ui/swift-ui': controls,
  '@react-navigation/bottom-tabs/unstable': { createNativeBottomTabNavigator: () => ({ Navigator: 'Tabs', Screen: 'Tab' }) },
  'src/app/SignedInStackNavigator.tsx': { SignedInStackNavigator: 'Stack' },
  'src/app/NativeTabScene.tsx': { NativeTabScene: 'Scene' },
  'src/components/monthlyInsights/BreakdownDonutGraphic.fallback.tsx': { BreakdownDonutGraphic: 'FallbackDonut' },
  '@expo/ui/swift-ui/modifiers': Object.fromEntries(['frame', 'pickerStyle', 'disabled', 'tag'].map(name => [name, value => ({ name, value })])),
  'src/components/appSettings/CategoryAdditionSettings.tsx': { CategoryAdditionSettings: 'Categories' },
  'src/components/accountScreen/NotificationThresholdField.tsx': { NotificationThresholdField: 'Threshold' },
  'src/contexts/ExpenseTextColorContext.tsx': { useExpenseTextColor: () => ({ mode: 'default', updateMode() {} }) },
});

test('system symbols cover every selectable category icon without changing stored icon identifiers', () => {
  const { CATEGORY_ICON_PICKER_OPTIONS } = load('src/constants/categories.ts');
  const { SystemIcons } = load('src/constants/systemIcons.ts');
  for (const icon of CATEGORY_ICON_PICKER_OPTIONS) assert.ok(SystemIcons[icon], icon);
});

test('native settings preserve summary, base day, paid feature gating and notification group actions', () => {
  const { AppSettingsScreen } = load('src/screens/AppSettingsScreen.ios.tsx');
  const { AppSettingsCopy } = load('src/constants/appSettings.ts');
  const { CalendarSummaryModes } = load('src/constants/calendarSummary.ts');
  const calls = [];
  const events = ['member-added', 'entry-added'];
  const props = { activeBookId: 'book', activeBookName: 'Book', calendarSummaryMode: CalendarSummaryModes.selectedMonth,
    calendarSummaryBaseDay: 15, isPlusActive: false, isCalendarHeatmapEnabled: true,
    notificationPermissionState: 'granted', notificationPermissionLabel: 'Granted', showNotificationSettings: true,
    notificationPreferenceGroups: [{ id: 'group', title: 'Group', items: [{ type: 'grouped', eventTypes: events, enabled: true, label: 'Notify' }] }],
    onChangeCalendarSummaryMode: mode => calls.push(['mode', mode]), onChangeCalendarSummaryBaseDay: day => calls.push(['day', day]),
    onToggleNotificationPreference: (types, enabled) => calls.push(['notify', types, enabled]),
  };
  const all = nodes(AppSettingsScreen(props));
  assert.equal(all[1].type, 'Form');
  all.find(node => node.type === 'Picker' && node.props.label === AppSettingsCopy.summaryBaseDayTitle).props.onSelectionChange(31);
  const heatmap = all.find(node => node.type === 'Toggle' && node.props.label);
  assert.equal(heatmap.props.isOn, false);
  assert.equal(heatmap.props.modifiers[0].value, true);
  all.find(node => node.type === 'Toggle' && node.props.children).props.onIsOnChange(false);
  assert.deepEqual(calls, [['day', 31], ['notify', events, false]]);
});

test('native donut preserves labels, amounts and legend-assigned colors while omitting zero slices', () => {
  const { BreakdownDonutGraphic } = load('src/components/monthlyInsights/BreakdownDonutGraphic.ios.tsx');
  const tree = BreakdownDonutGraphic({ items: [
    { key: 'food', label: 'Food', amount: 30, share: 1, color: '#123456' },
    { key: 'empty', label: 'Empty', amount: 0, share: 0, color: '#ffffff' },
  ] });
  const chart = nodes(tree).find(node => node.type === 'Chart');
  assert.equal(chart.props.type, 'pie');
  assert.equal(chart.props.data.length, 1);
  assert.equal(chart.props.data[0].x, 'Food');
  assert.equal(chart.props.data[0].y, 30);
  assert.equal(chart.props.data[0].color, '#123456');
});

test('native trend preserves both series and every monthly amount', () => {
  const { MonthlyTrendBarChart } = load('src/components/monthlyInsights/MonthlyTrendBarChart.ios.tsx');
  const tree = MonthlyTrendBarChart({ trendMonths: [{ monthLabel: 'Jan', incomeAmount: 100, expenseAmount: 30 }, { monthLabel: 'Feb', incomeAmount: 200, expenseAmount: 50 }] });
  const chart = nodes(tree).find(node => node.type === 'Chart');
  assert.deepEqual(Array.from(chart.props.data, point => point.y), [100, 30, 200, 50]);
  assert.equal(new Set(chart.props.data.map(point => point.x)).size, 4);
});

test('member selection remains keyed by identity and ignores unknown choices', () => {
  const { EntryTargetMemberSelector } = load('src/components/EntryTargetMemberSelector.ios.tsx');
  const members = [{ userId: 'a', displayName: 'Same' }, { userId: 'b', displayName: 'Same' }];
  const selected = [];
  const tree = EntryTargetMemberSelector({ members, selectedMemberId: 'a', onSelectMember: member => selected.push(member) });
  const picker = nodes(tree).find(node => node.type === 'Picker');
  picker.props.onSelectionChange('missing'); picker.props.onSelectionChange('b');
  assert.deepEqual(selected, [members[1]]);
});

test('iOS tabs use system symbols immediately without loading font images', () => {
  const { SignedInTabNavigator } = load('src/app/SignedInTabNavigator.ios.tsx');
  const tree = SignedInTabNavigator({ disabled: false, badges: [], onFooterHeightChange() {} });
  const tabs = nodes(tree).filter(node => node.type === 'Tab');
  assert.equal(tabs.length, 3);
  for (const tab of tabs) {
    assert.equal(tab.props.options.tabBarIcon({ focused: true }).type, 'sfSymbol');
    assert.equal(tab.props.options.tabBarSelectionEnabled, true);
  }
});
