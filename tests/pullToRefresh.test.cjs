const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");
const tick = () => new Promise(setImmediate);
function deferred() {
  let resolve, reject;
  const promise = new Promise((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
function setup() {
  const host = hooks(),
    requests = [],
    errors = [];
  const props = {
    focused: true,
    resetKey: "book:date",
    onRefresh: () => {
      const request = deferred();
      requests.push(request);
      return request.promise;
    },
  };
  const { usePullToRefresh } = modules({
    react: host.react,
    "@react-navigation/native": { useIsFocused: () => props.focused },
    "src/lib/logAppError.ts": { logAppError: (...args) => errors.push(args) },
  })("src/hooks/usePullToRefresh.ts");
  return {
    props,
    requests,
    errors,
    unmount: host.unmount,
    render: () => host.render(() => usePullToRefresh(props.onRefresh, props.resetKey)),
  };
}

test("automatic data refresh and rerenders never start the native pull indicator", async () => {
  const ui = setup();
  assert.equal(ui.render().isPullRefreshing, false);
  const background = ui.props.onRefresh();
  assert.equal(ui.render().isPullRefreshing, false);
  ui.requests[0].resolve();
  await background;
  assert.equal(ui.render().isPullRefreshing, false);
  ui.unmount();
});

test("a user pull keeps the indicator until all refresh requests have completed", async () => {
  const ui = setup(),
    month = deferred(),
    day = deferred();
  ui.props.onRefresh = () => Promise.all([month.promise, day.promise]);
  const pending = ui.render().onPullRefresh();
  assert.equal(ui.render().isPullRefreshing, true);
  month.resolve();
  await tick();
  assert.equal(ui.render().isPullRefreshing, true);
  day.resolve();
  await pending;
  assert.equal(ui.render().isPullRefreshing, false);
  ui.unmount();
});

test("duplicate pull events do not start overlapping requests", async () => {
  const ui = setup();
  const handler = ui.render().onPullRefresh;
  const first = handler();
  await handler();
  assert.equal(ui.requests.length, 1);
  ui.requests[0].resolve();
  await first;
  assert.equal(ui.render().isPullRefreshing, false);
  ui.unmount();
});

test("failed requests release the native indicator and allow retry", async () => {
  const ui = setup();
  const pending = ui.render().onPullRefresh();
  ui.requests[0].reject(new Error("offline"));
  await pending;
  assert.equal(ui.errors.length, 1);
  assert.equal(ui.render().isPullRefreshing, false);
  const retry = ui.render().onPullRefresh();
  ui.requests[1].resolve();
  await retry;
  assert.equal(ui.render().isPullRefreshing, false);
  ui.unmount();
});

test("book, date or query changes clear the old pull and ignore its late completion", async () => {
  const ui = setup();
  const old = ui.render().onPullRefresh();
  ui.props.resetKey = "another-query";
  assert.equal(ui.render().isPullRefreshing, false);
  const current = ui.render().onPullRefresh();
  ui.requests[0].resolve();
  await old;
  assert.equal(ui.render().isPullRefreshing, true);
  ui.requests[1].resolve();
  await current;
  assert.equal(ui.render().isPullRefreshing, false);
  ui.unmount();
});

test("leaving the screen clears the indicator and inactive screens reject pull events", async () => {
  const ui = setup();
  const pending = ui.render().onPullRefresh();
  ui.props.focused = false;
  assert.equal(ui.render().isPullRefreshing, false);
  await ui.render().onPullRefresh();
  assert.equal(ui.requests.length, 1);
  ui.props.focused = true;
  assert.equal(ui.render().isPullRefreshing, false);
  ui.unmount();
  ui.requests[0].resolve();
  await pending;
});
