const assert = require('node:assert/strict');
const test = require('node:test');
const { hooks, modules } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });

test('content and overlays use the actual native safe area across rotation and top-mounted iPad tabs', () => {
  const h = hooks(); let focused = true;
  const load = modules({
    react: { ...h.react, useLayoutEffect: h.react.useEffect },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@react-navigation/native': { useIsFocused: () => focused },
    'react-native': { View: 'View', StyleSheet: { create: styles => styles, absoluteFill: {} } },
    'react-native-screens/experimental': { SafeAreaView: 'NativeSafeArea' },
  });
  const { NativeTabScene } = load('src/app/NativeTabScene.tsx');
  const changes = [], report = value => changes.push(value);
  const render = () => h.render(() => NativeTabScene({ children: 'Stack', onBottomInsetChange: report }));
  const measure = (node, height) => node.props.onLayout({ nativeEvent: { layout: { height } } });
  let tree = render();
  assert.equal(tree.props.children[0], 'Stack');
  const probe = tree.props.children[1];
  assert.equal(probe.props.pointerEvents, 'none');
  assert.equal(probe.props.edges.bottom, true);
  for (const [height, safeHeight, bottom] of [[800, 717, 83], [400, 351, 49], [1000, 980, 20], [800, 800, 0]]) {
    measure(tree, height); measure(probe.props.children, safeHeight);
    tree = render(); assert.equal(changes.at(-1), bottom);
  }
  focused = false;
  measure(tree, 800); measure(probe.props.children, 700); render();
  assert.equal(changes.at(-1), 0);
  focused = true; render(); assert.equal(changes.at(-1), 100);
});
