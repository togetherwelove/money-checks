const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');

async function setup() {
  const { TabRouter, StackRouter, CommonActions, StackActions, TabActions } = await import('@react-navigation/routers');
  const { PrimaryTabRoutes } = modules()('src/app/signedInNavigation.ts');
  const tabs = TabRouter({ initialRouteName: 'calendar-tab', backBehavior: 'history' });
  const tabOptions = { routeNames: Object.values(PrimaryTabRoutes), routeParamList: {}, routeGetIdList: {} };
  const stackOptions = { routeNames: ['calendar', 'all-entries', 'charts', 'help', 'help-faq', 'entry-sheet'], routeParamList: {}, routeGetIdList: {} };
  const stacks = new Map();
  let state = tabs.getInitialState(tabOptions);
  state.routes = state.routes.map(route => {
    const screen = Object.keys(PrimaryTabRoutes).find(screen => PrimaryTabRoutes[screen] === route.name);
    const router = StackRouter({ initialRouteName: screen });
    const child = router.getInitialState(stackOptions);
    stacks.set(child.key, router);
    return { ...route, state: child };
  });
  const actions = [];
  const navigation = { getRootState: () => state, dispatch(action) {
    actions.push(action);
    if (action.target === state.key) state = tabs.getStateForAction(state, action, tabOptions);
    else {
      state = { ...state, routes: state.routes.map(route => route.state.key === action.target
        ? { ...route, state: stacks.get(action.target).getStateForAction(route.state, action, stackOptions) } : route) };
    }
    assert.ok(state);
  } };
  const { navigateToSingleInstanceStackScreen } = modules({ '@react-navigation/native': { CommonActions, StackActions, TabActions } })('src/app/navigateToStackScreen.ts');
  return { actions, state: () => state, navigate: screen => navigateToSingleInstanceStackScreen(navigation, screen) };
}

test('150 primary tab switches retain root route order and each real screen instance without stack resets', async () => {
  const ui = await setup();
  const original = ui.state().routes;
  for (let cycle = 0; cycle < 50; cycle++) {
    for (const target of ['all-entries', 'charts', 'calendar']) {
      ui.navigate(target);
      const state = ui.state();
      const active = state.routes[state.index];
      assert.equal(active.state.routes[active.state.index].name, target);
      assert.deepEqual(state.routes.map(route => route.key), original.map(route => route.key));
      state.routes.forEach((route, index) => assert.equal(route.state.routes[0].key, original[index].state.routes[0].key));
    }
  }
  assert.ok(ui.actions.every(action => action.type === 'JUMP_TO'));
});

test('secondary navigation targets only the active tab stack and returns to an existing screen with popTo', async () => {
  const ui = await setup();
  ui.navigate('all-entries'); ui.navigate('help');
  const active = ui.state().routes[ui.state().index];
  const help = active.state.routes.at(-1);
  ui.navigate('help-faq'); ui.navigate('help');
  assert.equal(ui.actions.at(-1).type, 'POP_TO');
  assert.equal(ui.state().routes[ui.state().index].state.routes.at(-1).key, help.key);
  ui.navigate('calendar');
  assert.equal(ui.state().routes[0].state.routes.length, 1);
  const entries = ui.state().routes.find(route => route.name === 'entries-tab');
  assert.equal(entries.state.routes.at(-1).key, help.key);
  ui.navigate('all-entries');
  assert.equal(ui.state().routes[ui.state().index].state.routes.length, 1);
  assert.equal(ui.actions.some(action => action.type === 'RESET'), false);
});
