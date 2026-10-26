const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const monthKey = (date) => date.toISOString().slice(0, 7);
const october = new Date("2026-10-01T00:00:00Z");
const june = new Date("2026-06-01T00:00:00Z");
const may = new Date("2026-05-01T00:00:00Z");
const flush = () => new Promise(setImmediate);

function mount(loadMonths) {
  const states = [], refs = [];
  let stateIndex = 0, refIndex = 0, effects = [], resync;
  const mocks = {
    react: {
      useState: (initial) => {
        const index = stateIndex++;
        if (!(index in states)) states[index] = index === 0
          ? { book: { "2026-06": [{ id: "deleted-while-away" }], "2026-10": [] } } : initial;
        return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
      },
      useRef: (initial) => { const index = refIndex++; return refs[index] ??= { current: initial }; },
      useMemo: (fn) => fn(), useCallback: (fn) => fn, useEffect: (fn) => effects.push(fn),
    },
    "../../constants/ledgerDisplay": {},
    "../../constants/ledgerQueries": { LedgerQueryConfig: {}, LedgerRealtimeConfig: {} },
    "../../constants/messages": { AppMessages: { ledgerError: "load failed" } },
    "../../lib/ledgerEntryMetadata": {},
    "../../lib/ledgerEntryRealtime": {
      subscribeToLedgerEntryChanges: (options) => { resync = options.onResync; return () => {}; },
    },
    "../../lib/logAppError": { logAppError: () => {} },
    "../../lib/performanceTrace": { createPerformanceTrace: () => () => {} },
    "../../lib/profiles": {},
    "../../utils/calendar": { getMonthKey: monthKey },
    "../../utils/ledgerMapper": {},
    "./helpers": { loadLedgerMonthsEntries: loadMonths },
    "./ledgerEntryCache": {
      getVisibleWindowMonths: (month) => [month],
      getCalendarPagePreloadMonths: (month) => [month],
      getCalendarBackgroundPreloadMonths: () => [],
      getChartTrendPreloadMonths: (month) => [month],
      hasCachedMonth: (cache, month) => monthKey(month) in cache,
      getVisibleWindowEntries: (cache, month) => cache[monthKey(month)] ?? [],
      setMonthEntriesInCache: (cache, month, entries) => ({ ...cache, [monthKey(month)]: entries }),
    },
  };
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, "../src/hooks/ledgerScreenState/useLedgerEntries.ts"), "utf8");
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, console, setTimeout, require: (name) => {
    if (name in mocks) return mocks[name]; throw new Error(name);
  } });
  const render = () => {
    stateIndex = 0; refIndex = 0; effects = [];
    return exports.useLedgerEntries("book", october, null);
  };
  render();
  effects.at(-1)(); // Mount the actual realtime subscription effect.
  return { render, resume: () => resync() };
}

test("resume invalidates old months and revisiting reloads changed/deleted entries", async () => {
  const calls = [];
  const instance = mount(async (_, months) => {
    calls.push(...months.map(monthKey));
    return Object.fromEntries(months.map((month) => [monthKey(month), [{ id: "fresh" }]]));
  });
  instance.resume();
  await flush();
  const refreshed = instance.render();
  assert.equal("2026-06" in refreshed.entryCache, false);
  assert.equal(refreshed.entryCache["2026-10"][0].id, "fresh");
  await refreshed.preloadChartEntries(june);
  assert.equal(instance.render().entryCache["2026-06"][0].id, "fresh");
  assert.deepEqual(calls, ["2026-10", "2026-06"]);
});

test("pre-resume chart request cannot restore stale cache after refresh", async () => {
  let finishOldRequest;
  const instance = mount(async (_, months) => monthKey(months[0]) === "2026-05"
    ? new Promise((resolve) => { finishOldRequest = resolve; })
    : { "2026-10": [{ id: "fresh" }] });
  const oldRequest = instance.render().preloadChartEntries(may);
  instance.resume();
  await flush();
  finishOldRequest({ "2026-05": [{ id: "stale" }] });
  await oldRequest;
  assert.equal("2026-05" in instance.render().entryCache, false);
});

test("concurrent chart preparations share the request and keep loading local until it completes", async () => {
  let finish, calls = 0;
  const instance = mount(async () => {
    calls++;
    return new Promise(resolve => { finish = resolve; });
  });
  const first = instance.render().preloadChartEntries(may);
  const second = instance.render().preloadChartEntries(may);
  assert.equal(calls, 1);
  assert.equal(instance.render().isLoadingChartEntries, true);
  assert.equal(instance.render().isLoadingEntries, false);
  finish({ "2026-05": [{ id: "chart-data" }] });
  await Promise.all([first, second]);
  assert.equal(instance.render().isLoadingChartEntries, false);
  assert.equal(instance.render().entryCache["2026-05"][0].id, 'chart-data');
});

test("overlapping resumes keep newest response and failed refresh remains retryable", async () => {
  let finishFirst, calls = 0;
  const instance = mount(async () => {
    calls++;
    if (calls === 1) return new Promise((resolve) => { finishFirst = resolve; });
    if (calls === 2) throw new Error("offline");
    return { "2026-10": [{ id: "latest" }] };
  });
  instance.resume();
  instance.resume();
  await flush();
  assert.equal(instance.render().entriesError, "load failed");
  assert.equal(instance.render().isRefreshing, false);
  instance.resume();
  await flush();
  finishFirst({ "2026-10": [{ id: "obsolete" }] });
  await flush();
  const result = instance.render();
  assert.equal(result.entriesError, null);
  assert.equal(result.entryCache["2026-10"][0].id, "latest");
  assert.equal("2026-06" in result.entryCache, false);
});
