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
const constants = { CALENDAR_MONTH_TRANSITION_HEADER_HEIGHT: 40 };
function mount() {
  const host = hookHost(), moves = [], selected = [], scrolls = [];
  const { CalendarScrollViewport } = load('src/components/monthCalendarPager/CalendarScrollViewport.tsx', {
    react: host.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { ScrollView: 'ScrollView', View: 'View', StyleSheet: { create: s => s }, PixelRatio: { getPixelSizeForLayoutSize: value => Math.round(value * 2) } },
    '../../constants/scroll': { AppScrollBehavior: {} }, '../../constants/uiStyles': { FullBleedHorizontalStyle: {} },
    './calendarLayout': constants, './monthCalendarScrollSnap': layouts,
    './MonthCalendarSection': { MonthCalendarSection: 'Month' },
  });
  const props = { active: true, geometryKey: 'initial', resetRevision: 0,
    pages: [{ key: '09', height: 100 }, { key: '10', height: 140 }, { key: '11', height: 120 }],
    onMoveMonth: value => moves.push(value), onSelectDate: date => selected.push(date), onHeightChange() {} };
  const render = () => host.render(() => CalendarScrollViewport(props));
  let tree = render();
  tree.props.ref.current = { scrollTo: value => scrolls.push(value) };
  return { props, moves, selected, scrolls, render, dispose: host.dispose };
}
const event = y => ({ nativeEvent: { contentOffset: { y } } });
test('native scroll snaps to measured month offsets and keeps the current grid height', () => {
  const ui = mount(), tree = ui.render();
  assert.equal(tree.type, 'ScrollView');
  assert.deepEqual(Array.from(tree.props.snapToOffsets), [40, 180, 360]);
  assert.equal(tree.props.contentOffset.y, 180);
  assert.equal(tree.props.style[1].height, 140);
  assert.equal(tree.props.contentContainerStyle.paddingBottom, 60);
  assert.equal(tree.props.disableIntervalMomentum, true);
});
for (const [offset, direction] of [[40, -1], [360, 1]]) {
  test(`a user scroll commits month direction ${direction} once`, () => {
    const ui = mount(), tree = ui.render();
    tree.props.onMomentumScrollEnd(event(offset));
    assert.deepEqual(ui.moves, []);
    tree.props.onScrollBeginDrag(); tree.props.onMomentumScrollEnd(event(offset));
    tree.props.onMomentumScrollEnd(event(offset));
    assert.deepEqual(ui.moves, [direction]);
  });
}
test('blur and foreground resets discard pending scroll callbacks and preserve date selection', () => {
  const ui = mount();
  let tree = ui.render();
  tree.props.onScrollBeginDrag();
  ui.props.active = false; ui.render();
  tree.props.onMomentumScrollEnd(event(360));
  assert.deepEqual(ui.moves, []);
  ui.props.active = true; tree = ui.render();
  tree.props.onScrollBeginDrag();
  ui.props.resetRevision++; ui.render();
  tree.props.onMomentumScrollEnd(event(360));
  assert.deepEqual(ui.moves, []);
  tree = ui.render();
  tree.props.children[1].props.children.props.onSelectDate('2026-10-02');
  assert.deepEqual(ui.selected, ['2026-10-02']);
  tree.props.onScrollBeginDrag(); tree.props.onMomentumScrollEnd(event(40));
  assert.deepEqual(ui.moves, [-1]);
  assert.ok(ui.scrolls.every(value => value.animated === false));
});
test('geometry changes recenter the native scroll and reject previous pending commits', () => {
  const ui = mount(), tree = ui.render();
  tree.props.onScrollBeginDrag();
  ui.props.pages = [{ key: '10', height: 120 }, { key: '11', height: 220 }, { key: '12', height: 100 }];
  ui.props.geometryKey = 'changed';
  const next = ui.render();
  tree.props.onMomentumScrollEnd(event(360));
  assert.deepEqual(ui.moves, []);
  assert.equal(ui.scrolls.at(-1).y, 200);
  assert.equal(next.props.style[1].height, 220);
});

test('a slow drag ending exactly at a snap point commits without waiting for momentum', () => {
  const ui = mount(), tree = ui.render();
  tree.props.onScrollBeginDrag();
  tree.props.onScrollEndDrag({ nativeEvent: { contentOffset: { y: 360 }, velocity: { y: 0 } } });
  tree.props.onMomentumScrollEnd(event(360));
  assert.deepEqual(ui.moves, [1]);
});

test('geometry, focus, foreground, menu and data renders retain the viewport', () => {
  const host = hookHost(); let focused = true, listener, removed = false;
  const { MonthCalendarPager } = load('src/components/MonthCalendarPager.native.tsx', {
    react: host.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, '@react-navigation/native': { useIsFocused: () => focused },
    'react-native': { AppState: { currentState: 'active', addEventListener(_, fn) { listener = fn; return { remove() { removed = true; } }; } } },
    './monthCalendarPager/CalendarScrollViewport': { CalendarScrollViewport: 'Viewport' },
  });
  const props = { previousPage: {key:'09',height:100}, currentPage: {key:'10',height:100}, nextPage:{key:'11',height:100} };
  const render = () => host.render(() => MonthCalendarPager(props));
  let tree = render(), key = tree.key, geometry = tree.props.geometryKey;
  assert.equal(render().key, key);
  props.currentPage = {...props.currentPage}; assert.equal(render().key, key);
  tree.props.onHeightChange('09',120); tree = render(); assert.equal(tree.key, key);
  assert.notEqual(tree.props.geometryKey, geometry); geometry = tree.props.geometryKey;
  assert.equal(tree.props.pages[0].height,120);
  props.nextPage = props.currentPage; props.currentPage = props.previousPage; props.previousPage = {key:'08',height:100};
  tree = render(); assert.equal(tree.key, key); assert.notEqual(tree.props.geometryKey, geometry);
  const revision = tree.props.resetRevision;
  listener('inactive'); listener('active'); tree = render(); assert.equal(tree.key, key);
  assert.notEqual(tree.props.resetRevision, revision);
  focused = false; tree = render(); assert.equal(tree.props.active, false); assert.equal(tree.key, key);
  focused = true; assert.equal(render().props.active, true);
  host.dispose(); assert.equal(removed, true);
});
