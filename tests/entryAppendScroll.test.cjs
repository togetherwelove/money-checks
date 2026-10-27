const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');

function setup(t, reduceMotion = false) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const state = hooks(), calls = [];
  let focused = true;
  const load = modules({
    react: state.react,
    '@react-navigation/native': { useIsFocused: () => focused },
    'react-native': { AccessibilityInfo: { isReduceMotionEnabled: async () => reduceMotion } },
  });
  const { useEntryAppendScroll } = load('src/hooks/useEntryAppendScroll.ts');
  const { EntryListScrollUi } = load('src/constants/scroll.ts');
  const params = { scope: 'book:date-a', loading: false, count: 20 };
  const render = () => state.render(() => useEntryAppendScroll(params.scope, params.loading, params.count));
  let current = render();
  current.ref.current = {
    scrollTo: options => calls.push(['top', { ...options }]),
    scrollToEnd: options => calls.push(['end', { ...options }]),
  };
  const measure = (height = 900) => {
    current = render();
    current.onLayout({ nativeEvent: { layout: { height: 300 } } });
    current.onContentSizeChange(400, height);
    return current;
  };
  return { params, calls, render, measure, unmount: state.unmount,
    focus: value => { focused = value; },
    tick: () => t.mock.timers.tick(EntryListScrollUi.firstEntryPreviewMs) };
}

test('long lists preview the top before revealing the append row once; background updates do not restart it', t => {
  const ui = setup(t);
  ui.measure();
  assert.deepEqual(ui.calls, []);
  ui.tick();
  assert.deepEqual(ui.calls, [['end', { animated: true }]]);
  ui.params.count++;
  ui.measure(1000); ui.tick();
  assert.equal(ui.calls.length, 1);
  ui.params.scope = 'book:date-b';
  ui.measure();
  assert.deepEqual(ui.calls.at(-1), ['top', { y: 0, animated: false }]);
  ui.tick();
  assert.deepEqual(ui.calls.at(-1), ['end', { animated: true }]);
  ui.unmount();
});

test('data and layout must be ready; short lists do not move', t => {
  const ui = setup(t);
  ui.params.loading = true;
  ui.measure(); ui.tick();
  assert.equal(ui.calls.length, 0);
  ui.params.loading = false;
  ui.measure(200); ui.tick();
  assert.equal(ui.calls.length, 0);
  ui.params.scope = 'long-date';
  ui.measure(900); ui.tick();
  assert.equal(ui.calls.filter(call => call[0] === 'end').length, 1);
  ui.unmount();
});

test('touch, blur, scope changes and unmount cancel pending movement', t => {
  const ui = setup(t);
  ui.measure().onTouchStart(); ui.tick();
  assert.equal(ui.calls.length, 0);
  ui.params.scope = 'next-date'; ui.measure();
  ui.focus(false); ui.render(); ui.tick();
  assert.equal(ui.calls.filter(call => call[0] === 'end').length, 0);
  ui.focus(true); ui.measure();
  ui.unmount(); ui.tick();
  assert.equal(ui.calls.filter(call => call[0] === 'end').length, 0);
});

test('reduced motion skips animation and user dragging enables pagination', async t => {
  const ui = setup(t, true);
  const scroll = ui.measure();
  assert.equal(scroll.suppressPagination.current, false);
  await Promise.resolve();
  ui.tick();
  assert.deepEqual(ui.calls.at(-1), ['end', { animated: false }]);
  assert.equal(scroll.suppressPagination.current, true);
  scroll.onScrollBeginDrag();
  assert.equal(scroll.suppressPagination.current, false);
  ui.unmount();
});
