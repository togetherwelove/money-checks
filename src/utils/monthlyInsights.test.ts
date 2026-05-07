import type { LedgerEntry } from "../types/ledger";
import { buildMonthlyInsights } from "./monthlyInsights";

function createEntry(
  date: string,
  type: "expense" | "income",
  amount: number,
  category: string,
  targetMemberName?: string,
): LedgerEntry {
  return {
    amount,
    category,
    categoryId: category,
    content: category,
    date,
    id: `${date}-${type}-${amount}-${category}`,
    note: "",
    photoAttachments: [],
    targetMemberName,
    type,
  };
}

describe("buildMonthlyInsights", () => {
  it("builds month-over-month comparisons and category shares", () => {
    const entries = [
      createEntry("2026-04-02", "income", 300000, "월급"),
      createEntry("2026-04-03", "expense", 40000, "식비"),
      createEntry("2026-04-10", "expense", 20000, "교통"),
      createEntry("2026-03-05", "income", 250000, "월급"),
      createEntry("2026-03-06", "expense", 90000, "식비"),
      createEntry("2026-03-16", "expense", 10000, "카페"),
    ];

    entries[1].targetMemberName = "A";
    entries[2].targetMemberName = "B";

    const insights = buildMonthlyInsights("2026-04", entries);

    expect(insights.incomeComparison).toEqual({
      currentAmount: 300000,
      deltaAmount: 50000,
      direction: "increase",
      previousAmount: 250000,
    });
    expect(insights.expenseComparison).toEqual({
      currentAmount: 60000,
      deltaAmount: 40000,
      direction: "decrease",
      previousAmount: 100000,
    });
    expect(insights.categoryExpenses).toEqual([
      { amount: 40000, category: "식비", share: 40000 / 60000 },
      { amount: 20000, category: "교통", share: 20000 / 60000 },
    ]);
    expect(insights.memberExpenses).toEqual([
      { amount: 40000, memberName: "A", share: 40000 / 60000 },
      { amount: 20000, memberName: "B", share: 20000 / 60000 },
    ]);
    expect(insights.trendMonths.map((month) => month.key)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
    ]);
    expect(insights.trendMonths.at(-2)).toMatchObject({
      expenseAmount: 100000,
      incomeAmount: 250000,
      isCurrentMonth: false,
      key: "2026-03",
    });
    expect(insights.trendMonths.at(-1)).toMatchObject({
      expenseAmount: 60000,
      incomeAmount: 300000,
      isCurrentMonth: true,
      key: "2026-04",
    });
  });

  it("returns empty category data and same direction when there is no delta", () => {
    const entries = [createEntry("2026-04-02", "income", 100000, "월급")];

    const insights = buildMonthlyInsights("2026-04", entries);

    expect(insights.expenseComparison).toEqual({
      currentAmount: 0,
      deltaAmount: 0,
      direction: "same",
      previousAmount: 0,
    });
    expect(insights.categoryExpenses).toEqual([]);
    expect(insights.memberExpenses).toEqual([]);
  });
});
