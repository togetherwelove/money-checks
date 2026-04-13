import type { LedgerEntry } from "../../types/ledger";
import { getExpenseTotalForPeriod, shouldNotifyExpenseLimit } from "./expenseThresholds";

function createExpenseEntry(date: string, amount: number): LedgerEntry {
  return {
    amount,
    category: "식비",
    content: "식사",
    date,
    id: `${date}-${amount}`,
    note: "",
    authorName: "테스터",
    sourceType: "manual",
    type: "expense",
  };
}

describe("expenseThresholds", () => {
  it("returns the week expense total for the selected date window", () => {
    const entries = [
      createExpenseEntry("2026-04-05", 3000),
      createExpenseEntry("2026-04-07", 5000),
      createExpenseEntry("2026-04-11", 7000),
      createExpenseEntry("2026-04-13", 9000),
    ];

    expect(getExpenseTotalForPeriod(entries, "2026-04-08", "week")).toBe(15000);
  });

  it("notifies only when the threshold is crossed upward", () => {
    const currentEntries = [createExpenseEntry("2026-04-03", 6000)];
    const nextEntries = [...currentEntries, createExpenseEntry("2026-04-03", 5000)];

    expect(
      shouldNotifyExpenseLimit({
        currentEntries,
        entryDate: "2026-04-03",
        nextEntries,
        period: "day",
        thresholdAmount: 10000,
      }),
    ).toBe(true);

    expect(
      shouldNotifyExpenseLimit({
        currentEntries: nextEntries,
        entryDate: "2026-04-03",
        nextEntries: [...nextEntries, createExpenseEntry("2026-04-03", 1000)],
        period: "day",
        thresholdAmount: 10000,
      }),
    ).toBe(false);
  });
});
