const assert = require("node:assert/strict");
const test = require("node:test");
const { hooks, modules, currencyMock } = require("./annualReportHelpers.cjs");

function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

test("registration date survives restart, but cancellation and consumption remove it", () => {
  const cache = storage();
  function mount() {
    const harness = hooks();
    const load = modules({
      react: harness.react,
      "src/lib/appStorage.ts": { appStorage: cache },
      "src/utils/currency.ts": currencyMock,
    });
    const { useGuestEntryRequest } = load("src/hooks/useGuestEntryRequest.ts");
    return () => harness.render(useGuestEntryRequest);
  }
  const first = mount();
  assert.equal(first().date, null);
  first().request("2026-10-15");
  assert.equal(first().date, "2026-10-15");
  const restarted = mount();
  assert.equal(restarted().date, "2026-10-15");
  restarted().clear();
  assert.equal(restarted().date, null);
  assert.equal(mount()().date, null);
});

test("expired, malformed and impossible stored dates cannot reopen registration", () => {
  const load = modules({ "src/utils/currency.ts": currencyMock });
  const { readGuestEntryRequest } = load("src/lib/guestEntryRequest.ts");
  const { GuestEntryConfig } = load("src/constants/guest.ts");
  const now = Date.now();
  for (const record of [
    "invalid JSON",
    null,
    {},
    { date: "2026-02-31", createdAt: now },
    { date: "2026-11-09", createdAt: now - GuestEntryConfig.maxAgeMs - 1 },
    { date: "2026-11-09", createdAt: now + 1 },
  ]) {
    const cache = storage();
    cache.setItem(
      GuestEntryConfig.storageKey,
      typeof record === "string" ? record : JSON.stringify(record),
    );
    assert.equal(readGuestEntryRequest(cache, now), null);
    assert.equal(cache.getItem(GuestEntryConfig.storageKey), null);
  }
});

test("resume waits for readiness, foreground and date restoration, then opens once", () => {
  const harness = hooks();
  let listener;
  let removed = 0;
  const load = modules({
    react: harness.react,
    "react-native": {
      AppState: {
        currentState: "background",
        addEventListener: (_, callback) => {
          listener = callback;
          return { remove: () => removed++ };
        },
      },
    },
  });
  const { useResumeGuestEntry } = load("src/hooks/useResumeGuestEntry.ts");
  let opens = 0;
  let consumes = 0;
  const options = {
    date: "2026-10-15",
    selectedDate: "2026-11-09",
    ready: false,
    onSelectDate: (date) => {
      options.selectedDate = date;
    },
    onOpen: () => opens++,
    onConsume: () => consumes++,
  };
  const render = () => harness.render(() => useResumeGuestEntry(options));
  render();
  listener("active");
  render();
  assert.equal(opens, 0);
  options.ready = true;
  render();
  assert.equal(opens, 0);
  assert.equal(options.selectedDate, options.date);
  render();
  render();
  listener("background");
  render();
  listener("active");
  render();
  assert.equal(opens, 1);
  assert.equal(consumes, 1);
  options.date = null;
  render();
  harness.unmount();
  assert.equal(removed, 1);
});

test("normal login and cancelled registration do not open an entry", () => {
  const harness = hooks();
  const load = modules({
    react: harness.react,
    "react-native": {
      AppState: {
        currentState: "active",
        addEventListener: () => ({ remove() {} }),
      },
    },
  });
  const { useResumeGuestEntry } = load("src/hooks/useResumeGuestEntry.ts");
  let opens = 0;
  const options = {
    date: "2026-10-15",
    selectedDate: "2026-10-15",
    ready: false,
    onSelectDate() {},
    onOpen: () => opens++,
    onConsume() {},
  };
  const render = () => harness.render(() => useResumeGuestEntry(options));
  render();
  options.date = null;
  options.ready = true;
  render();
  render();
  assert.equal(opens, 0);
});

test("guest calendar builds empty months and tracks selected dates without account queries", () => {
  const harness = hooks();
  const load = modules({
    react: harness.react,
    "react-native": { useWindowDimensions: () => ({ fontScale: 1 }) },
    "src/utils/currency.ts": currencyMock,
    "src/components/monthCalendarPager/monthCalendarPagerUtils.ts": {
      buildMonthPageFromSummary: (key, summary) => ({ key, summary, height: 100, signature: key }),
    },
  });
  const { useGuestHomeState } = load("src/hooks/useGuestHomeState.ts");
  let date = "2026-11-09";
  const render = () =>
    harness.render(() =>
      useGuestHomeState(date, (value) => {
        date = value;
      }),
    );
  let state = render();
  assert.equal(state.currentMonthPage.key, "2026-11");
  assert.equal(state.previousMonthPage.key, "2026-10");
  assert.equal(state.nextMonthPage.key, "2026-12");
  assert.equal(state.monthlyLedger.totalExpense, 0);
  assert.equal(state.activeBook, null);
  assert.equal(state.isLoading, false);
  state.handleSelectDate("2026-10-15");
  state = render();
  assert.equal(state.currentMonthPage.key, "2026-10");
  assert.equal(state.selectedDate, "2026-10-15");
});
