const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, entry, currencyMock } = require("./annualReportHelpers.cjs");
const load = modules({ "src/lib/currencyPreference.ts": currencyMock });
const { buildCumulativeExpenses, buildMonthlyExpenseComparison } = load(
  "src/utils/cumulativeExpenses.ts",
);
const { buildExpenseComparisonChart } = load("src/utils/expenseComparisonChart.ts");
const { buildMonthlyInsightsFromMonths, buildPeriodInsights } = load(
  "src/utils/monthlyInsights.ts",
);
const { ExpenseMountainLayout: Ui } = load("src/constants/monthlyInsightCharts.ts");
const values = (days) => Array.from(days, (day) => day.amount);

test("daily expenses aggregate duplicate dates, ignore income and carry totals across empty days", () => {
  const days = buildCumulativeExpenses(
    [
      entry("later", { date: "2026-11-03", amount: 40 }),
      entry("first", { date: "2026-11-01", amount: 10 }),
      entry("second", { date: "2026-11-01", amount: 20 }),
      entry("income", { date: "2026-11-02", type: "income", amount: 1000 }),
      entry("outside", { date: "2026-10-31", amount: 999 }),
    ],
    { startDate: "2026-11-01", endDate: "2026-11-04" },
  );
  assert.deepEqual(values(days), [30, 30, 70, 70]);
  assert.equal(days[0].date, "2026-11-01");
  assert.equal(days.at(-1).date, "2026-11-04");
});

test("month comparisons preserve real month lengths, leap days and year boundaries", () => {
  for (const [month, currentDays, previousDays, previousStart] of [
    [new Date(2024, 1, 1), 29, 31, "2024-01-01"],
    [new Date(2025, 2, 1), 31, 28, "2025-02-01"],
    [new Date(2026, 0, 1), 31, 31, "2025-12-01"],
  ]) {
    const result = buildMonthlyExpenseComparison(month, [], []);
    assert.equal(result.current.length, currentDays);
    assert.equal(result.previous.length, previousDays);
    assert.equal(result.previous[0].date, previousStart);
    assert.ok(result.current.every((day) => day.amount === 0));
  }
});

test("insights carry the actual daily series for calendar months and custom summary periods", () => {
  const current = [entry("current", { date: "2026-11-20", amount: 75 })];
  const previous = [entry("previous", { date: "2026-10-20", amount: 100 })];
  const monthly = buildMonthlyInsightsFromMonths(new Date(2026, 10, 1), current, previous);
  assert.equal(monthly.dailyExpenseComparison.current[19].amount, 75);
  assert.equal(monthly.dailyExpenseComparison.previous.at(-1).amount, 100);
  const period = buildPeriodInsights({
    currentRange: { startDate: "2026-11-15", endDate: "2026-12-14" },
    previousRange: { startDate: "2026-10-15", endDate: "2026-11-14" },
    currentLabel: "current",
    previousLabel: "previous",
    currentPeriodEntries: [...current, entry("dec", { date: "2026-12-01", amount: 25 })],
    previousPeriodEntries: previous,
    trendPeriods: [],
  });
  assert.equal(period.dailyExpenseComparison.current[5].amount, 75);
  assert.equal(period.dailyExpenseComparison.current.at(-1).amount, 100);
  assert.equal(period.dailyExpenseComparison.current.length, 30);
  assert.equal(period.dailyExpenseComparison.previous.length, 31);
});

test("the current curve stops at today, preserves last month's full curve and ignores future expenses", () => {
  const comparison = buildMonthlyExpenseComparison(
    new Date(2026, 10, 1),
    [
      entry("current", { date: "2026-11-02", amount: 100 }),
      entry("future", { date: "2026-11-30", amount: 9999 }),
    ],
    [entry("previous", { date: "2026-10-31", amount: 200 })],
  );
  const chart = buildExpenseComparisonChart(comparison, "2026-11-25");
  const { getExpenseComparisonThroughDate } = load("src/utils/expenseComparisonChart.ts");
  const summary = getExpenseComparisonThroughDate(comparison, "2026-11-25");
  assert.equal(summary.previousAmount, 200);
  assert.equal(summary.direction, "decrease");
  assert.equal(summary.deltaAmount, 100);
  assert.equal(chart.currentAmount, 100);
  assert.equal(chart.previousAmount, 200);
  assert.equal(chart.currentDayCount, 25);
  assert.equal(chart.lastCurrentDate, "2026-11-25");
  assert.equal(chart.dayCount, 31);
  assert.equal(chart.endpoint.x, Ui.inset + (24 / 30) * (Ui.width - Ui.inset * 2));
  assert.equal(chart.endpoint.y, chart.baseline - (Ui.height - Ui.inset * 2) / 2);
  assert.equal((chart.current.line.match(/ C /g) ?? []).length, 24);
  assert.equal((chart.previous.line.match(/ C /g) ?? []).length, 30);
});

test("past periods finish at their last day, future periods stay empty and zero expenses stay flat", () => {
  const comparison = buildMonthlyExpenseComparison(new Date(2026, 1, 1), [], []);
  const past = buildExpenseComparisonChart(comparison, "2026-03-01");
  assert.equal(past.currentDayCount, 28);
  assert.equal(past.endpoint.x, Ui.width - Ui.inset);
  assert.equal(past.endpoint.y, past.baseline);
  assert.ok(!/NaN|Infinity/.test(past.current.area + past.previous.area));
  const future = buildExpenseComparisonChart(comparison, "2026-01-31");
  assert.equal(future.endpoint, undefined);
  assert.equal(future.current.line, "");
  assert.equal(future.currentAmount, 0);
});

test("daily display spacing plots the exact cumulative total for each day", () => {
  const comparison = buildMonthlyExpenseComparison(
    new Date(2026, 10, 1),
    [
      entry("second", { date: "2026-11-02", amount: 100 }),
      entry("fourth", { date: "2026-11-04", amount: 500 }),
      entry("sixth", { date: "2026-11-06", amount: 100 }),
      entry("eighth", { date: "2026-11-08", amount: 100 }),
    ],
    [],
  );
  const chart = buildExpenseComparisonChart(comparison, "2026-11-08");
  const segments = [...chart.current.line.matchAll(/ C (.*?)(?= C |$)/g)].map((match) =>
    match[1].match(/-?\d+(?:\.\d+)?/g).map(Number),
  );
  assert.equal(segments.length, 7);
  for (const [index, [day, amount]] of [
    [2, 100],
    [3, 100],
    [4, 600],
    [5, 600],
    [6, 700],
    [7, 700],
    [8, 800],
  ].entries()) {
    const coordinates = segments[index];
    assert.equal(coordinates[4], Ui.inset + ((day - 1) / 30) * (Ui.width - Ui.inset * 2));
    assert.equal(coordinates[5], chart.baseline - (amount / 800) * (Ui.height - Ui.inset * 2));
    assert.ok(coordinates[1] >= coordinates[3]);
    assert.equal(coordinates[3], coordinates[5]);
  }
  assert.equal(chart.currentAmount, 800);
  assert.equal(chart.currentDayCount, 8);
  assert.equal(chart.lastCurrentDate, "2026-11-08");
  assert.equal(comparison.current.length, 30);
  assert.equal(comparison.current[1].amount, 100);
});
