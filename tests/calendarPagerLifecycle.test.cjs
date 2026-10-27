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
function mount() {
  const host = hookHost(), moves = [], selected = [], resets = [];
  const { CalendarSwipeViewport } = load('src/components/monthCalendarPager/CalendarSwipeViewport.tsx', {
    react: host.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', StyleSheet: { create: s => s } },
    'react-native-pager-view': { __esModule: true, default: 'Pager' },
    '../../constants/scroll': { AppPagerScrollBehavior: {} }, '../../constants/uiStyles': { FullBleedHorizontalStyle: {} },
    './MonthCalendarSection': { MonthCalendarSection: 'Month' },
  });
  const props = { active: true, geometryKey: 'initial', resetRevision: 0,
    pages: [{ key: '09', height: 100 }, { key: '10', height: 140 }, { key: '11', height: 120 }],
    onMoveMonth: value => moves.push(value), onSelectDate: date => selected.push(date), onHeightChange() {} };
  const render = () => host.render(() => CalendarSwipeViewport(props));
  const tree = render();
  tree.props.ref.current = { setPageWithoutAnimation: value => resets.push(value) };
  return { props, moves, selected, resets, render, dispose: host.dispose };
}
const stateEvent = pageScrollState => ({ nativeEvent: { pageScrollState } });
const selectedEvent = position => ({ nativeEvent: { position } });
const scrollEvent = (position, offset = 0) => ({ nativeEvent: { position, offset } });

test('calendar uses native horizontal paging with the current grid height', () => {
  const tree = mount().render();
  assert.equal(tree.type, 'Pager');
  assert.equal(tree.props.orientation, 'horizontal');
  assert.equal(tree.props.initialPage, 1);
  assert.equal(tree.props.style[1].height, 140);
});
for (const [page, direction] of [[0, -1], [2, 1]]) {
  test(`a swipe commits month direction ${direction} only once after native scrolling ends`, () => {
    const ui = mount(), tree = ui.render();
    tree.props.onPageSelected(selectedEvent(page));
    assert.deepEqual(ui.moves, []);
    tree.props.onPageScrollStateChanged(stateEvent('dragging'));
    tree.props.onPageSelected(selectedEvent(page));
    assert.deepEqual(ui.moves, []);
    tree.props.onPageScrollStateChanged(stateEvent('idle'));
    tree.props.onPageScrollStateChanged(stateEvent('idle'));
    tree.props.onPageSelected(selectedEvent(page));
    assert.deepEqual(ui.moves, [direction]);
  });
}
test('idle before page-selected still commits the final native scroll position', () => {
  const ui = mount(), tree = ui.render();
  tree.props.onPageScrollStateChanged(stateEvent('dragging'));
  tree.props.onPageScroll(scrollEvent(2));
  tree.props.onPageScrollStateChanged(stateEvent('idle'));
  tree.props.onPageSelected(selectedEvent(2));
  assert.deepEqual(ui.moves, [1]);
});
test('a cancelled swipe keeps the month and does not select a date while dragging', () => {
  const ui = mount(), tree = ui.render();
  tree.props.onPageScrollStateChanged(stateEvent('dragging'));
  tree.props.children[1].props.children.props.onSelectDate('2026-10-02');
  tree.props.onPageScroll(scrollEvent(1));
  tree.props.onPageScrollStateChanged(stateEvent('idle'));
  assert.deepEqual(ui.moves, []); assert.deepEqual(ui.selected, []);
  tree.props.children[1].props.children.props.onSelectDate('2026-10-02');
  tree.props.children[0].props.children.props.onSelectDate('2026-09-02');
  assert.deepEqual(ui.selected, ['2026-10-02']);
});
for (const change of ['blur', 'foreground', 'geometry']) {
  test(`${change} cancels stale page events and recenters without changing the month`, () => {
    const ui = mount(), tree = ui.render();
    tree.props.onPageScrollStateChanged(stateEvent('dragging'));
    tree.props.onPageSelected(selectedEvent(2));
    if (change === 'blur') ui.props.active = false;
    if (change === 'foreground') ui.props.resetRevision++;
    if (change === 'geometry') {
      ui.props.geometryKey = 'new';
      ui.props.pages = [{key:'10',height:120},{key:'11',height:220},{key:'12',height:100}];
    }
    const next = ui.render();
    tree.props.onPageScrollStateChanged(stateEvent('idle'));
    assert.deepEqual(ui.moves, []); assert.equal(ui.resets.at(-1), 1);
    if (change === 'geometry') assert.equal(next.props.style[1].height, 220);
    ui.dispose();
  });
}

test('geometry, focus, foreground, menu and data renders retain the viewport', () => {
  const host = hookHost(); let focused = true, listener, removed = false;
  const { MonthCalendarPager } = load('src/components/MonthCalendarPager.native.tsx', {
    react: host.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, '@react-navigation/native': { useIsFocused: () => focused },
    'react-native': { AppState: { currentState: 'active', addEventListener(_, fn) { listener = fn; return { remove() { removed = true; } }; } } },
    './monthCalendarPager/CalendarSwipeViewport': { CalendarSwipeViewport: 'Viewport' },
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
