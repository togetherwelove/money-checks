const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: (name) => {
    if (name in dependencies) return dependencies[name];
    throw new Error(name);
  } });
  return exports;
}
function hookHost() {
  const hooks = []; let index = 0, effects = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useRef(value) { return hooks[index++] ??= { current: value }; },
    useState(initial) {
      const key = index++;
      if (!(key in hooks)) hooks[key] = typeof initial === 'function' ? initial() : initial;
      return [hooks[key], value => { hooks[key] = typeof value === 'function' ? value(hooks[key]) : value; }];
    },
    useMemo(fn, deps) { const key = index++; if (!same(hooks[key]?.deps, deps)) hooks[key] = { deps, value: fn() }; return hooks[key].value; },
    useLayoutEffect(fn, deps) { return react.useEffect(fn, deps); },
    useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
    useEffect(fn, deps) { const key = index++; if (!same(hooks[key]?.deps, deps)) { const old = hooks[key]; hooks[key] = { deps }; effects.push(() => { old?.cleanup?.(); hooks[key].cleanup = fn(); }); } },
  };
  return { react, render(fn) { index = 0; effects = []; const result = fn(); effects.forEach(fn => fn()); return result; }, dispose() { hooks.forEach(h => h?.cleanup?.()); } };
}
const jsx = (type, props, key) => ({ type, props, key });
const layouts = load('src/components/monthCalendarPager/monthCalendarScrollSnap.ts', {});
const constants = {
  CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT: 40, CALENDAR_DRAG_ACTIVATION_DISTANCE: 8,
  CALENDAR_DRAG_HORIZONTAL_FAILURE_DISTANCE: 20, CALENDAR_FLICK_VELOCITY_PER_SECOND: 200,
  CALENDAR_MONTH_SNAP_MIN_DURATION_MS: 24, CALENDAR_MONTH_SNAP_FULL_DISTANCE_DURATION_MS: 180,
};
function mount(overrides = {}) {
  const host = hookHost(), animations = [], moves = [], previews = [], selected = [];
  class Value { constructor(value) { this.value = value; } setValue(value) { this.value = value; } }
  const { CalendarGestureViewport } = load('src/components/monthCalendarPager/CalendarGestureViewport.tsx', {
    react: host.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { StyleSheet: { create: s => s }, View: 'View', Easing: { linear: null }, Animated: {
      Value, View: 'AnimatedView', timing: (value, options) => ({ value, options }), parallel(children) {
        const animation = { start(callback) { this.callback = callback; }, stop() { this.callback?.({ finished: false }); }, finish() { children.forEach(c => c.value.setValue(c.options.toValue)); this.callback({ finished: true }); } };
        animations.push(animation); return animation;
      },
    } },
    'react-native-gesture-handler': { GestureDetector: 'GestureDetector', Gesture: { Pan() {
      const gesture = {};
      for (const method of ['runOnJS', 'enabled', 'activeOffsetY', 'failOffsetX', 'onStart', 'onUpdate', 'onEnd', 'onFinalize']) gesture[method] = value => { gesture[method + 'Value'] = value; return gesture; };
      return gesture;
    } } },
    '../../constants/uiStyles': { FullBleedHorizontalStyle: {} }, './calendarLayout': constants,
    './MonthCalendarSection': { MonthCalendarSection: 'Month' }, './monthCalendarScrollSnap': layouts,
  });
  const props = { active: true, pages: [{key:'09',height:100},{key:'10',height:100},{key:'11',height:100}], onMoveMonth: x => moves.push(x), onPreviewMonthOffsetChange: x => previews.push(x), onSelectDate: x => selected.push(x), ...overrides };
  let tree;
  function render() { tree = host.render(() => CalendarGestureViewport(props)); }
  render();
  return { props, animations, moves, previews, selected, render, dispose: host.dispose,
    get gesture() { return tree.props.gesture; },
    get position() { return tree.props.children.props.children.props.style[1].transform[0].translateY.value; },
    get height() { return tree.props.children.props.style[1].height.value; },
    get selectDate() { return tree.props.children.props.children.props.children[1].props.children.props.onSelectDate; },
  };
}
const event = (translationY, velocityY = 0) => ({ translationY, velocityY });
test('unequal month heights initialize at the current date grid and interpolate on drag', () => {
  const ui = mount({ pages: [{key:'09',height:120},{key:'10',height:100},{key:'11',height:140}] });
  assert.equal(ui.position, -200); assert.equal(ui.height, 100);
  ui.gesture.onStartValue(); ui.gesture.onUpdateValue(event(-70));
  assert.equal(ui.position, -270); assert.equal(ui.height, 120);
  ui.gesture.onEndValue(event(-100)); ui.animations[0].finish();
  assert.equal(ui.position, -340); assert.equal(ui.height, 140); assert.deepEqual(ui.moves, [1]);
});
test('inactive viewport rejects gestures even if queued callbacks are delivered', () => {
  const ui = mount({ active: false });
  ui.gesture.onStartValue(); ui.gesture.onUpdateValue(event(-100)); ui.gesture.onEndValue(event(-100));
  assert.equal(ui.position, -180); assert.equal(ui.animations.length, 0);
});
for (const direction of [-1, 1]) test(`actual drag commits direction ${direction} once`, () => {
  const ui = mount();
  ui.gesture.onStartValue(); ui.gesture.onUpdateValue(event(-direction * 100)); ui.gesture.onEndValue(event(-direction * 100));
  ui.gesture.onEndValue(event(-direction * 100));
  assert.equal(ui.animations.length, 1);
  ui.animations[0].finish();
  assert.deepEqual(ui.moves, [direction]);
  ui.gesture.onStartValue(); ui.gesture.onEndValue(event(-direction * 100));
  assert.equal(ui.animations.length, 1);
});
test('tap, menu rerenders and events without a recognized drag never move the calendar', () => {
  const ui = mount();
  ui.gesture.onEndValue(event(100)); ui.gesture.onFinalizeValue(event(0), false);
  for(let i=0;i<5;i++) { ui.props.pages = ui.props.pages.map(p => ({...p})); ui.render(); }
  assert.equal(ui.position, -180); assert.equal(ui.animations.length, 0); assert.deepEqual(ui.moves, []);
  ui.selectDate('2026-10-01'); assert.deepEqual(ui.selected, ['2026-10-01']);
});
test('menu rerenders preserve a completed backward transition until the parent commits', () => {
  const ui = mount(); ui.gesture.onStartValue(); ui.gesture.onEndValue(event(100)); ui.animations[0].finish();
  ui.render(); ui.render(); assert.equal(ui.position, -40); assert.deepEqual(ui.moves, [-1]);
});
test('cancelled gesture restores the same month and permits the next gesture', () => {
  const ui = mount(); ui.gesture.onStartValue(); ui.gesture.onUpdateValue(event(70)); ui.gesture.onFinalizeValue(event(70), false);
  ui.animations[0].finish(); assert.equal(ui.position, -180); assert.deepEqual(ui.moves, []);
  ui.gesture.onStartValue(); ui.gesture.onEndValue(event(-100)); ui.animations[1].finish(); assert.deepEqual(ui.moves, [1]);
});
test('small drag returns while fast flick uses points per second and correct direction', () => {
  const ui = mount(); ui.gesture.onStartValue(); ui.gesture.onEndValue(event(10)); ui.animations[0].finish();
  assert.deepEqual(ui.moves, []); assert.equal(ui.position, -180);
  ui.gesture.onStartValue(); ui.gesture.onEndValue(event(10, 250)); ui.animations[1].finish(); assert.deepEqual(ui.moves, [-1]);
});
test('replaced or unmounted geometry rejects late animation and gesture events', () => {
  const ui = mount(); ui.gesture.onStartValue(); ui.gesture.onEndValue(event(-100)); ui.dispose();
  ui.animations[0].callback({ finished: true }); ui.gesture.onStartValue(); ui.gesture.onEndValue(event(-100));
  assert.deepEqual(ui.moves, []); assert.equal(ui.animations.length, 1);
});
test('date presses during dragging or snapping are ignored', () => {
  const ui = mount(); ui.gesture.onStartValue(); ui.selectDate('2026-10-02'); ui.gesture.onEndValue(event(10)); ui.selectDate('2026-10-02');
  assert.deepEqual(ui.selected, []); ui.animations[0].finish(); ui.selectDate('2026-10-02'); assert.equal(ui.selected.length, 1);
});
test('geometry and foreground changes replace the viewport, menu and data renders retain it', () => {
  const host = hookHost(); let focused = true, listener, removed = false;
  const { MonthCalendarPager } = load('src/components/MonthCalendarPager.native.tsx', {
    react: host.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, '@react-navigation/native': { useIsFocused: () => focused },
    'react-native': { AppState: { currentState: 'active', addEventListener(_, fn) { listener = fn; return { remove() { removed = true; } }; } } },
    './monthCalendarPager/CalendarGestureViewport': { CalendarGestureViewport: 'Viewport' },
  });
  const props = { previousPage: {key:'09',height:100}, currentPage: {key:'10',height:100}, nextPage:{key:'11',height:100} };
  const render = () => host.render(() => MonthCalendarPager(props));
  let tree = render(), key = tree.key;
  assert.equal(render().key, key);
  props.currentPage = {...props.currentPage}; assert.equal(render().key, key);
  tree.props.onHeightChange('09',120); tree = render(); assert.notEqual(tree.key, key); key = tree.key;
  assert.equal(tree.props.pages[0].height,120);
  props.nextPage = props.currentPage; props.currentPage = props.previousPage; props.previousPage = {key:'08',height:100};
  tree = render(); assert.notEqual(tree.key, key); key = tree.key;
  listener('inactive'); listener('active'); tree = render(); assert.notEqual(tree.key, key); key = tree.key;
  focused = false; tree = render(); assert.equal(tree.props.active, false); assert.notEqual(tree.key, key);
  focused = true; assert.equal(render().props.active, true);
  host.dispose(); assert.equal(removed, true);
});
