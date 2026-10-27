const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');

const jsx = (type, props) => ({ type, props });
const modifierNames = ['accessibilityLabel', 'buttonBorderShape', 'buttonStyle', 'controlSize',
  'disabled', 'foregroundStyle', 'frame', 'glassEffect', 'labelStyle', 'padding', 'pickerStyle', 'tag', 'tint', 'semantics', 'size',
  'accessibilityAddTraits', 'background', 'clipShape', 'fixedSize', 'onGeometryChange', 'scaleEffect', 'font'];
const modifiers = Object.fromEntries(modifierNames.map(name => [name, value => ({ name, value })]));
modifiers.createModifier = (name, value) => ({ name, value });
const controls = Object.fromEntries(['Button', 'Host', 'HStack', 'Image', 'Picker', 'ProgressView', 'Text',
  'CircularProgressIndicator', 'FilledIconButton', 'Icon', 'IconButton', 'SingleChoiceSegmentedButtonRow']
  .map(name => [name, name]));
const SegmentedButton = Object.assign(() => {}, { Label: 'SegmentLabel' });
let fontScale = 1;
const load = modules({
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'react-native': { View: 'View', Text: 'HeaderTitle', StyleSheet: { create: value => value }, useWindowDimensions: () => ({ fontScale }) },
  '@expo/ui/swift-ui': controls,
  'expo-glass-effect': { isLiquidGlassAvailable: () => true },
  '@expo/ui/swift-ui/modifiers': modifiers,
  '@expo/ui/jetpack-compose': { ...controls, SegmentedButton },
  '@expo/ui/jetpack-compose/modifiers': modifiers,
  '../../../assets/native-icons/close.xml': 'close-icon',
  '../../../assets/native-icons/check.xml': 'check-icon',
  'src/contexts/ExpenseTextColorContext.tsx': { useExpenseTextColor: () => ({ textColor: '#000000' }) },
});
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];

for (const platform of ['ios', 'android']) {
  test(`${platform} native header dispatches actions and locks them during saving`, () => {
    const { EntryComposerHeader } = load(`src/components/entryComposer/EntryComposerHeader.${platform}.tsx`);
    const events = [];
    const props = { type: 'expense', typeDisabled: false, saving: false, actionDisabled: false,
      actionLabel: '등록', onClose: () => events.push('close'), onAction: () => events.push('save'),
      onSelectType: value => events.push(value) };
    function actions(overrides = {}) {
      const all = nodes(EntryComposerHeader({ ...props, ...overrides }));
      if (platform === 'ios') {
        const buttons = all.filter(node => node.type === 'Button');
        return { close: buttons[0].props.onPress, save: buttons[1].props.onPress,
          select: () => all.find(node => node.type === 'Picker').props.onSelectionChange('income'), all };
      }
      return { close: all.find(node => node.type === 'IconButton').props.onClick,
        save: all.find(node => node.type === 'FilledIconButton').props.onClick,
        select: () => all.filter(node => node.type === SegmentedButton)[1].props.onClick(), all };
    }
    const active = actions();
    if (platform === 'ios') {
      const picker = active.all.find(node => node.type === 'Picker');
      const pickerModifiers = picker.props.modifiers;
      assert.deepEqual(Array.from(pickerModifiers, modifier => modifier.name),
        ['pickerStyle', 'controlSize', 'glassEffect', 'disabled']);
      assert.equal(pickerModifiers[1].value, 'regular');
      const pickerHost = active.all.find(node => node.type === 'Host' && node.props.children.type === 'Picker');
      assert.equal(pickerHost.props.style[1].width, 176);
      fontScale = 2;
      const scaled = actions().all.find(node => node.type === 'Host' && node.props.children.type === 'Picker');
      assert.equal(scaled.props.style[1].width, 352);
      assert.equal(scaled.props.style[0].maxWidth, '100%');
      fontScale = 1;
      const glass = pickerModifiers.find(modifier => modifier.name === 'glassEffect');
      assert.equal(glass.value.glass.interactive, false);
      assert.equal(glass.value.glass.tint, undefined);
      for (const node of active.all.filter(node => node.type === 'Button')) {
        const frame = node.props.modifiers.find(modifier => modifier.name === 'frame').value;
        assert.equal(frame.height ?? frame.minHeight, 48);
        assert.ok(node.props.modifiers.some(modifier => modifier.name === 'glassEffect'));
      }
      for (const button of active.all.filter(node => node.type === 'Button')) {
        assert.equal(button.props.label, undefined);
        assert.equal(button.props.children.type, 'Image');
      }
    }
    active.close(); active.select(); active.save();
    assert.deepEqual(events, ['close', 'income', 'save']);
    actions({ actionDisabled: true }).save();
    const locked = actions({ saving: true, typeDisabled: true });
    locked.close(); locked.select(); locked.save();
    assert.deepEqual(events, ['close', 'income', 'save']);
    assert.ok(locked.all.some(node => node.type === (platform === 'ios' ? 'ProgressView' : 'CircularProgressIndicator')));
    const custom = actions({ title: '직접 입력' });
    assert.equal(custom.all.find(node => node.type === 'HeaderTitle').props.children, '직접 입력');
    assert.equal(custom.all.some(node => node.type === 'Picker' || node.type === SegmentedButton), false);
    const immediate = nodes(EntryComposerHeader({ title: '내 가계부', onClose: props.onClose }));
    assert.equal(immediate.filter(node => node.type === (platform === 'ios' ? 'Button' : 'IconButton')).length, 1);
    assert.equal(immediate.some(node => node.type === 'FilledIconButton'), false);
    assert.equal(immediate.some(node => node.type === 'Picker' || node.type === SegmentedButton), false);
    assert.equal(immediate.find(node => node.type === 'HeaderTitle').props.children, '내 가계부');
  });
}
