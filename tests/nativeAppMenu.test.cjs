const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');

function loadMenu() {
  const jsx = (type, props) => ({ type, props });
  return modules({
    react: { useMemo: factory => factory() },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@expo/vector-icons': { Feather: 'Feather' },
    '@react-native-menu/menu': { MenuView: 'MenuView' },
    'react-native': { Pressable: 'Pressable', StyleSheet: { create: value => value } },
  });
}

for (const showAnnualReportDownload of [false, true]) {
  test(`native menu preserves sections, visibility and opaque icons (report=${showAnnualReportDownload})`, () => {
    const load = loadMenu();
    const { buildAppMenuSections } = load('src/lib/menuItems.ts');
    const { buildNativeAppMenuActions, getAppMenuItemId } = load('src/lib/nativeAppMenu.ts');
    const { AppColors } = load('src/constants/colors.ts');
    const sections = buildAppMenuSections({ showAnnualReportDownload });
    const actions = buildNativeAppMenuActions(sections);
    assert.equal(actions.length, showAnnualReportDownload ? 3 : 2);
    assert.equal(actions.flatMap(group => group.subactions).some(item => item.id === 'share'), false);
    actions.forEach((group, index) => {
      assert.equal(group.displayInline, true);
      assert.equal(group.title, sections[index].label);
      assert.deepEqual(group.subactions.map(item => item.title), sections[index].items.map(item => item.label));
      assert.deepEqual(group.subactions.map(item => item.id), sections[index].items.map(getAppMenuItemId));
      group.subactions.forEach(item => {
        assert.ok(item.image);
        assert.equal(item.imageColor, AppColors.text);
      });
    });
    assert.equal(actions.flatMap(group => group.subactions).length, showAnnualReportDownload ? 7 : 6);
  });
}

test('native menu reports opening and dismissal, and routes navigation and download once', () => {
  const load = loadMenu();
  const { AppFloatingMenuButton } = load('src/components/AppFloatingMenuButton.tsx');
  const { buildAppMenuSections } = load('src/lib/menuItems.ts');
  const events = [];
  const menu = AppFloatingMenuButton({
    sections: buildAppMenuSections({ showAnnualReportDownload: true }),
    onOpen: () => events.push('open'), onClose: () => events.push('close'),
    onSelectItem: screen => events.push(screen), onSelectAction: action => events.push(action),
  });
  assert.equal(menu.type, 'MenuView');
  assert.equal(menu.props.shouldOpenOnLongPress, false);
  menu.props.onOpenMenu();
  menu.props.onCloseMenu();
  assert.deepEqual(events, ['open', 'close']);
  for (const group of menu.props.actions) {
    for (const action of group.subactions) {
      events.length = 0;
      menu.props.onPressAction({ nativeEvent: { event: action.id } });
      assert.deepEqual(events, ['close', action.id]);
    }
  }
  events.length = 0;
  menu.props.onPressAction({ nativeEvent: { event: 'unknown' } });
  assert.deepEqual(events, []);
});
