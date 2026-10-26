const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });
const nodes = value => !value || typeof value !== 'object' ? []
  : Array.isArray(value) ? value.flatMap(nodes) : [value, ...nodes(value.props?.children)];

function setup() {
  const h = hooks();
  const load = modules({
    react: h.react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: value => value } },
    '@expo/vector-icons': { Feather: 'Icon' },
  });
  const { HelpFaqSection } = load('src/components/HelpFaqSection.tsx');
  const { HelpFaqGroups } = load('src/constants/helpFaq.ts');
  return { render: () => h.render(HelpFaqSection), items: HelpFaqGroups.flatMap(group => group.items) };
}

test('every FAQ question opens its own full answer and closes on the next press', () => {
  const { render, items } = setup();
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  for (const item of items) {
    const question = tree => nodes(tree).find(node => node.props?.accessibilityLabel === item.question);
    question(render()).props.onPress();
    let tree = render();
    assert.equal(question(tree).props.accessibilityState.expanded, true);
    assert.ok(nodes(tree).some(node => node.props?.children === item.answer));
    question(tree).props.onPress();
    tree = render();
    assert.equal(question(tree).props.accessibilityState.expanded, false);
    assert.ok(!nodes(tree).some(node => node.props?.children === item.answer));
  }
});

test('opening another question closes the previously expanded answer', () => {
  const { render, items } = setup();
  const press = item => nodes(render()).find(node => node.props?.accessibilityLabel === item.question).props.onPress();
  press(items[0]);
  press(items[1]);
  const tree = render();
  assert.ok(!nodes(tree).some(node => node.props?.children === items[0].answer));
  assert.ok(nodes(tree).some(node => node.props?.children === items[1].answer));
});

test('two queued presses toggle twice using the latest state', () => {
  const { render } = setup();
  const button = nodes(render()).find(node => node.type === 'Pressable');
  button.props.onPress();
  button.props.onPress();
  assert.equal(nodes(render()).find(node => node.type === 'Pressable').props.accessibilityState.expanded, false);
});

test('the second question can be opened first and repeatedly switched with the first', () => {
  const { render, items } = setup();
  for (const index of [1, 1, 0, 1, 0, 1]) {
    const tree = render();
    const button = nodes(tree).find(node => node.props?.accessibilityLabel === items[index].question);
    const expected = !button.props.accessibilityState.expanded;
    button.props.onPress();
    const updated = nodes(render()).find(node => node.props?.accessibilityLabel === items[index].question);
    assert.equal(updated.props.accessibilityState.expanded, expected);
  }
});
