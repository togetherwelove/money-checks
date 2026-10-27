const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');
const jsx = (type, props) => ({ type, props });

for (const glassAvailable of [false, true]) test(`floating entry keeps placement, interaction and keyboard behavior (glass=${glassAvailable})`, () => {
  const state = hooks(), listeners = new Map();
  let opened = 0, removed = 0;
  const load = modules({
    react: state.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
      Animated: { View: 'AnimatedView' }, Platform: { OS: 'ios' }, Pressable: 'Button', StyleSheet: { create: x => x },
      Keyboard: { isVisible: () => false, addListener: (event, callback) => {
        listeners.set(event, callback);
        return { remove: () => { removed++; listeners.delete(event); } };
      } },
    },
    'expo-glass-effect': { GlassView: 'Glass', isLiquidGlassAvailable: () => glassAvailable, isGlassEffectAPIAvailable: () => glassAvailable },
    'src/hooks/useClipboardExpansionAnimation.ts': { useClipboardExpansionAnimation: () => ({ interpolate: config => config }) },
    'src/components/AppIcons.tsx': { Feather: 'Icon' },
  });
  const { FloatingEntryButton } = load('src/components/FloatingEntryButton.tsx');
  const { FloatingEntryButtonUi } = load('src/constants/menu.ts');
  const props = { bottomInset: 90, disabled: false, onPress: () => opened++ };
  const render = extra => state.render(() => FloatingEntryButton({ ...props, ...extra }));
  const wrapper = render();
  const button = wrapper.props.children;
  assert.equal(button.props.children.some(child => child?.type === 'Glass'), glassAvailable);
  assert.equal(wrapper.props.style[1].bottom, 90 + FloatingEntryButtonUi.footerGap);
  button.props.onPress(); assert.equal(opened, 1);
  const blocked = render({ disabled: true }).props.children;
  assert.equal(blocked.props.accessibilityState.disabled, true);
  blocked.props.onPress(); assert.equal(opened, 1);
  assert.equal(render({ bottomInset: 0 }), null);
  listeners.get('keyboardWillShow')();
  assert.equal(render(), null);
  listeners.get('keyboardWillHide')();
  assert.equal(render().props.children.type, 'Button');
  assert.equal(render({ expanded: true }).props.pointerEvents, 'none');
  assert.equal(render({ expanded: true }).props.accessibilityElementsHidden, true);
  assert.equal(render({ bottomInset: 140 }).props.style[1].bottom, 140 + FloatingEntryButtonUi.footerGap);
  state.unmount();
  assert.equal(removed, 2);
  assert.equal(listeners.size, 0);
});
