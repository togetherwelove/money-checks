const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");
const query = {
  activeBookId: "book",
  selectedCategoryIds: ["food"],
  searchQuery: "",
  dateRange: { startDate: "2026-01-01", endDate: "2026-01-31" },
  entryTypeFilter: "all",
};
const row = (id, amount, type = "expense", currency = "KRW") => ({
  id: String(id),
  created_at: String(id),
  amount,
  entry_type: type,
  currency,
});

test("totals cover every page including server-capped pages, preserve query bounds, separate currencies and add decimals accurately", async () => {
  const rows = Array.from({ length: 1205 }, (_, i) => row(i, "0.1"));
  rows.push(row(1205, "4.5", "income"), row(1206, "2.5", "expense", "USD"));
  const calls = [];
  const load = modules({
    "src/lib/ledgerEntries.ts": {
      fetchEnrichedLedgerEntryRows: async (book, params) => {
        calls.push({ book, params });
        const start = params.cursor ? Number(params.cursor.id) + 1 : 0;
        return rows.slice(start, start + 100);
      },
    },
  });
  const { fetchFilteredLedgerTotals } = load("src/lib/filteredLedgerTotals.ts");
  const result = await fetchFilteredLedgerTotals(query, new AbortController().signal);
  assert.equal(result.find((x) => x.currency === "KRW").expense, 120.5);
  assert.equal(result.find((x) => x.currency === "KRW").income, 4.5);
  assert.equal(result.find((x) => x.currency === "USD").expense, 2.5);
  assert.ok(
    calls.every(
      ({ book, params }) =>
        book === "book" &&
        params.dateFrom === query.dateRange.startDate &&
        params.dateTo === query.dateRange.endDate &&
        params.categoryIds[0] === "food",
    ),
  );
});
test("search pagination advances raw offsets even when all entries on an intermediate page have the other type", async () => {
  const pages = [[row(1, 10, "income")], [row(2, 20)], []],
    calls = [];
  const load = modules({
    "src/lib/ledgerEntries.ts": {
      fetchEnrichedLedgerEntryRows: async (_, params) => {
        calls.push(params);
        return pages.shift();
      },
    },
  });
  const result = await load("src/lib/filteredLedgerTotals.ts").fetchFilteredLedgerTotals(
    { ...query, searchQuery: "memo", entryTypeFilter: "expense" },
    new AbortController().signal,
  );
  assert.equal(result[0].expense, 20);
  assert.equal(result[0].income, 0);
  assert.deepEqual(
    calls.map((x) => x.pageOffset),
    [0, 1, 2],
  );
  assert.ok(calls.every((x) => x.cursor === null && x.searchQuery === "memo"));
});
test("failed, repeated or cancelled pages never publish a partial total", async () => {
  for (const failure of ["network", "repeat", "abort"]) {
    const controller = new AbortController();
    let calls = 0;
    const load = modules({
      "src/lib/ledgerEntries.ts": {
        fetchEnrichedLedgerEntryRows: async () => {
          if (++calls === 1) return [row(1, 100)];
          if (failure === "network") throw Error("offline");
          if (failure === "abort") controller.abort();
          return [row(1, 100)];
        },
      },
    });
    await assert.rejects(
      load("src/lib/filteredLedgerTotals.ts").fetchFilteredLedgerTotals(query, controller.signal),
    );
  }
});
test("changing period hides the old total and aborts its request before any late result can update the new period", async () => {
  const h = hooks(),
    requests = [];
  const load = modules({
    react: h.react,
    "src/lib/filteredLedgerTotals.ts": {
      filteredLedgerQueryKey: (q) => JSON.stringify(q),
      fetchFilteredLedgerTotals: (q, signal) =>
        new Promise((resolve) => requests.push({ q, signal, resolve })),
    },
  });
  const { useFilteredLedgerTotals } = load("src/hooks/useFilteredLedgerTotals.ts");
  const render = (q) => h.render(() => useFilteredLedgerTotals(q, 0));
  render(query);
  const next = { ...query, dateRange: { startDate: "2026-02-01", endDate: "2026-02-28" } };
  assert.equal(render(next), null);
  assert.equal(requests[0].signal.aborted, true);
  requests[0].resolve([{ expense: 100 }]);
  await new Promise(setImmediate);
  assert.equal(render(next), null);
  requests[1].resolve([{ expense: 200 }]);
  await new Promise(setImmediate);
  assert.equal(render(next).totals[0].expense, 200);
  assert.equal(
    render({
      ...next,
      dateRange: null,
      selectedCategoryIds: [],
      searchQuery: "",
      entryTypeFilter: "all",
    }),
    null,
  );
  assert.equal(requests.length, 2);

  h.unmount();
  assert.equal(requests[1].signal.aborted, true);
});

test("type-filtered list pages scan past opposite-type rows and preserve date bounds and search offsets", async () => {
  for (const searchQuery of ["", "note"]) {
    const all = [
      row(0, 1, "income"),
      row(1, 1, "income"),
      row(2, 10),
      row(3, 1, "income"),
      row(4, 20),
      row(5, 30),
    ];
    const calls = [];
    const load = modules({
      "src/lib/currencyPreference.ts": { resolveDisplayCurrency: () => "KRW" },
      "src/lib/performanceTrace.ts": { createPerformanceTrace: () => () => {} },
      "src/utils/ledgerMapper.ts": {
        mapLedgerEntryRow: (row) => ({ id: row.id, amount: row.amount }),
      },
      "src/lib/ledgerEntryMetadata.ts": { resolveLedgerEntryTargetMemberId: () => null },
      "src/lib/ledgerEntryPhotoAttachments.ts": {
        createLedgerEntryPhotoSignedUrlMap: async () => new Map(),
      },
      "src/lib/supabase.ts": {
        supabase: {
          rpc: (_, params) => {
            calls.push(params);
            const start = searchQuery
              ? params.page_offset
              : params.page_cursor_id
                ? Number(params.page_cursor_id) + 1
                : 0;
            return { returns: async () => ({ data: all.slice(start, start + 2), error: null }) };
          },
        },
      },
    });
    const { fetchLedgerEntriesPage } = load("src/lib/ledgerEntries.ts");
    const params = {
      limit: 1,
      ascending: false,
      categoryIds: [],
      entryType: "expense",
      searchQuery,
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
    };
    const first = await fetchLedgerEntriesPage("book", params);
    assert.deepEqual(
      Array.from(first.entries, (x) => x.id),
      ["2"],
    );
    assert.equal(first.hasMore, true);
    const second = await fetchLedgerEntriesPage("book", { ...params, cursor: first.nextCursor });
    assert.deepEqual(
      Array.from(second.entries, (x) => x.id),
      ["4"],
    );
    const third = await fetchLedgerEntriesPage("book", { ...params, cursor: second.nextCursor });
    assert.deepEqual(
      Array.from(third.entries, (x) => x.id),
      ["5"],
    );
    assert.equal(third.hasMore, false);
    assert.ok(calls.every((x) => x.date_from === params.dateFrom && x.date_to === params.dateTo));
  }
});

test("period presets include full local month/year boundaries across January and leap-year February", () => {
  const { resolveAllEntriesPeriod } = modules({})("src/lib/allEntriesPeriods.ts");
  const cases = [
    ["this-month", new Date(2026, 10, 22), "2026-11-01", "2026-11-30"],
    ["last-month", new Date(2026, 0, 15), "2025-12-01", "2025-12-31"],
    ["this-month", new Date(2024, 1, 29), "2024-02-01", "2024-02-29"],
    ["last-month", new Date(2024, 2, 31), "2024-02-01", "2024-02-29"],
    ["this-year", new Date(2026, 11, 31), "2026-01-01", "2026-12-31"],
  ];
  for (const [preset, now, start, end] of cases) {
    const range = resolveAllEntriesPeriod(preset, now);
    assert.equal(range.startDate, start);
    assert.equal(range.endDate, end);
  }
});
test("quick period choices select only a matching range and pass changes through the existing draft callback", () => {
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      View: "View",
      Text: "Text",
      Pressable: "Button",
      StyleSheet: { create: (x) => x },
    },
  });
  const { resolveAllEntriesPeriod } = load("src/lib/allEntriesPeriods.ts");
  const { AllEntriesPeriodPresets } = load("src/components/allEntries/AllEntriesPeriodPresets.tsx");
  let changed;
  const tree = AllEntriesPeriodPresets({
    range: resolveAllEntriesPeriod("this-month"),
    onChange: (range) => {
      changed = range;
    },
  });
  const buttons = tree.props.children;
  assert.equal(buttons.length, 5);
  assert.equal(buttons.filter((button) => button.props.accessibilityState.selected).length, 1);
  assert.equal(changed, undefined);
  buttons[2].props.onPress();
  assert.equal(changed.startDate, resolveAllEntriesPeriod("last-month").startDate);
  assert.equal(changed.endDate, resolveAllEntriesPeriod("last-month").endDate);
  const custom = AllEntriesPeriodPresets({
    range: { startDate: "2001-02-03", endDate: "2001-02-04" },
    onChange() {},
  });
  assert.equal(custom.props.children[4].props.accessibilityState.selected, true);
});
