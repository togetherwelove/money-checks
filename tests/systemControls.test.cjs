const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];
const controls = Object.fromEntries(['Host', 'List', 'Form', 'Section', 'Picker', 'Toggle', 'Text', 'Button', 'RNHostView', 'VStack', 'HStack', 'Menu', 'Spacer', 'Chart'].map(name => [name, name]));
const load = modules({
  'src/components/AppIcons.tsx': { Feather: 'Icon' },
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { StyleSheet: { create: value => value }, Text: 'RNText', View: 'View', Platform: { Version: 26 }, Keyboard: { dismiss() {} }, Linking: {} },
  '@expo/ui/swift-ui': controls,
  '@react-navigation/bottom-tabs/unstable': { createNativeBottomTabNavigator: () => ({ Navigator: 'Tabs', Screen: 'Tab' }) },
  'src/app/SignedInStackNavigator.tsx': { SignedInStackNavigator: 'Stack' },
  'src/app/NativeTabScene.tsx': { NativeTabScene: 'Scene' },
  'src/components/monthlyInsights/BreakdownDonutGraphic.fallback.tsx': { BreakdownDonutGraphic: 'FallbackDonut' },
  '@expo/ui/swift-ui/modifiers': Object.fromEntries(['accessibilityLabel', 'accessibilityValue', 'buttonStyle', 'labelsHidden', 'background', 'listStyle', 'listRowBackground', 'scrollContentBackground', 'listSectionSpacing', 'fixedSize', 'font', 'foregroundStyle', 'listRowInsets', 'frame', 'pickerStyle', 'disabled', 'tag'].map(name => [name, value => ({ name, value })])),
  'src/components/appSettings/CalendarHeatmapSetting.tsx': { CalendarHeatmapSetting: 'Heatmap' },
  'src/components/appSettings/SettingsMenuLinks.tsx': { SettingsMenuLinks: 'SettingsLinks' },
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
  assert.equal(all[1].type, 'List');
  assert.equal(all[1].props.modifiers.find(m => m.name === 'scrollContentBackground').value, 'hidden');
  all.find(node => node.type === 'Picker' && node.props.label?.props?.children === AppSettingsCopy.summaryBaseDayTitle).props.onSelectionChange(31);
  const heatmap = all.find(node => node.type === 'Heatmap');
  assert.equal(heatmap.props.isPlusActive, false);
  assert.equal(heatmap.props.isEnabled, true);
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

test('member menu keeps identity with duplicate names and does not replace a missing selection', () => {
  const { EntryTargetMemberSelector } = load('src/components/EntryTargetMemberSelector.ios.tsx');
  const members = [{ userId: 'a', displayName: 'Same' }, { userId: 'b', displayName: 'Same' }];
  const selected = [];
  const tree = EntryTargetMemberSelector({ members, selectedMemberId: 'a', onSelectMember: member => selected.push(member) });
  const buttons = nodes(tree).filter(node => node.type === 'Button');
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].props.systemImage, 'checkmark');
  assert.equal(buttons[1].props.systemImage, undefined);
  buttons[1].props.onPress();
  assert.deepEqual(selected, [members[1]]);
  const { EntryRegistrationCopy } = load('src/constants/entryRegistration.ts');
  const missing = EntryTargetMemberSelector({ members, selectedMemberId: 'missing', onSelectMember: member => selected.push(member) });
  assert.equal(missing.props.value, EntryRegistrationCopy.targetMemberPlaceholder);
  assert.equal(EntryTargetMemberSelector({ members: [], selectedMemberId: 'missing', onSelectMember() {} }), null);
  assert.deepEqual(selected, [members[1]]);
});

test('iOS tabs use system symbols immediately without loading font images', () => {
  const { SignedInTabNavigator } = load('src/app/SignedInTabNavigator.ios.tsx');
  const tree = SignedInTabNavigator({ disabled: false, badges: [], onFooterHeightChange() {} });
  const tabs = nodes(tree).filter(node => node.type === 'Tab');
  assert.equal(tabs.length, 5);
  for (const tab of tabs) {
    assert.equal(tab.props.options.tabBarIcon({ focused: true }).type, 'sfSymbol');
    assert.equal(tab.props.options.tabBarSelectionEnabled, true);
  }
});

test('additional info menu trigger contains only the selected value and leaves its label outside', () => {
  const { NativeEntryDetailMenu } = load('src/components/entryComposer/NativeEntryDetailMenu.tsx');
  const option = { type: 'Button', props: { label: 'Option' } };
  const tree = NativeEntryDetailMenu({ label: 'Payment', value: 'Selected', children: option });
  assert.equal(tree.props.children[0].type, 'RNText');
  assert.equal(tree.props.children[0].props.children, 'Payment');
  const host = tree.props.children[1];
  assert.equal(host.props.matchContents.horizontal, true);
  const menu = nodes(host).find(node => node.type === 'Menu');
  const triggerText = nodes(menu.props.label).filter(node => node.type === 'RNText').map(node => node.props.children);
  assert.deepEqual(triggerText, ['Selected']);
  assert.equal(menu.props.children, option);
});
