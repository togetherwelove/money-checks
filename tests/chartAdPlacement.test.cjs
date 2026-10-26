const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');

test('chart has one stable ad outside paging and scrolling across month and scope changes', () => {
  const h = hooks();
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    react: { useEffect() {}, useMemo(factory, deps) {
      const ref = h.react.useRef();
      if (!ref.current || deps.some((value, index) => value !== ref.current.deps[index])) {
        ref.current = { deps, value: factory() };
      }
      return ref.current.value;
    } },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@react-navigation/native': { useIsFocused: () => true },
    'src/components/ScreenLoadingOverlay.tsx': { ScreenLoadingOverlay: 'LocalLoading' },
    'react-native': { View: 'View', StyleSheet: { create: value => value } },
    '../components/AppBannerAd': { AppBannerAd: 'Ad' },
    '../components/chartScreen/ChartMonthPager': { ChartMonthPager: 'Pager' },
    '../components/chartScreen/ChartMonthPageContent': { ChartMonthPageContent: 'Page' },
  });
  const { ChartScreen } = load('src/screens/ChartScreen.tsx');
  const props = { showsBannerAd: true, renderScreenTitle: () => null,
    state: { currentChartMonth: { scope: 'periodic', key: '2026-10' } } };
  const render = () => h.render(() => ChartScreen(props));
  const first = render();
  const adSlot = first.props.children[0];
  const ad = adSlot.props.children;
  assert.equal(ad.type, 'Ad');
  assert.equal(adSlot.props.style.flexShrink, 0);
  assert.equal(adSlot.props.style.position, undefined);
  assert.equal(first.props.children[1].type, 'View');
  assert.equal(first.props.children[1].props.children[1].type, 'Pager');
  assert.equal(first.props.children[1].props.children[1].props.showsBannerAd, undefined);
  props.state.currentChartMonth = { scope: 'periodic', key: '2026-11' };
  assert.equal(render().props.children[0].props.children, ad);
  props.state.currentChartMonth = { scope: 'all', key: 'all' };
  const all = render();
  assert.equal(all.props.children[0].props.children, ad);
  assert.equal(all.props.children[1].type, 'Page');
  assert.equal(all.props.children[1].props.showsBannerAd, undefined);
  props.showsBannerAd = false;
  assert.equal(render().props.children[0].props.children, null);
  props.state.isLoadingChartEntries = true;
  assert.equal(render().props.children[2].type, 'LocalLoading');
  props.state.isLoadingChartEntries = false;
  props.state.isLoadingTotalSummary = true;
  assert.equal(render().props.children[2].type, 'LocalLoading');
});
