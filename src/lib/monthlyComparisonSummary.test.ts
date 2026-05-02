import { describe, expect, it } from "vitest";

import type { MonthlyInsights } from "../types/ledger";
import {
  buildMonthlyComparisonSummary,
  buildPreviousMonthSummaryLines,
  buildPreviousMonthSummaryPushContent,
} from "./monthlyComparisonSummary";

describe("buildMonthlyComparisonSummary", () => {
  it("formats expense decreases with rate labels", () => {
    const summary = buildMonthlyComparisonSummary(
      {
        currentAmount: 60000,
        deltaAmount: 40000,
        direction: "decrease",
        previousAmount: 100000,
      },
      "3월",
      "expense",
    );

    expect(summary.summaryMessage).toBe("전월보다 40,000원 덜 썼어요");
    expect(summary.changeRateLabel).toBe("3월 대비 40% 감소");
    expect(summary.currentAmountLabel).toBe("- 60,000원");
    expect(summary.previousAmountLabel).toBe("전월 3월 - 100,000원");
    expect(summary.tone).toBe("income");
  });

  it("describes small changes with the exact delta amount", () => {
    const summary = buildMonthlyComparisonSummary(
      {
        currentAmount: 100500,
        deltaAmount: 500,
        direction: "increase",
        previousAmount: 100000,
      },
      "3월",
      "income",
    );

    expect(summary.summaryMessage).toBe("전월보다 500원 더 벌었어요");
    expect(summary.changeRateLabel).toBe("3월 대비 1% 증가");
    expect(summary.tone).toBe("income");
  });

  it("uses an exact same message only when there is no delta", () => {
    const summary = buildMonthlyComparisonSummary(
      {
        currentAmount: 100000,
        deltaAmount: 0,
        direction: "same",
        previousAmount: 100000,
      },
      "3월",
      "expense",
    );

    expect(summary.summaryMessage).toBe("전월과 같아요");
    expect(summary.changeRateLabel).toBeNull();
    expect(summary.tone).toBe("muted");
  });

  it("treats zero previous amounts as unavailable comparison", () => {
    const summary = buildMonthlyComparisonSummary(
      {
        currentAmount: 0,
        deltaAmount: 0,
        direction: "same",
        previousAmount: 0,
      },
      "3월",
      "income",
    );

    expect(summary.summaryMessage).toBe("전월 데이터 없음");
    expect(summary.changeRateLabel).toBeNull();
    expect(summary.tone).toBe("muted");
  });

  it("builds previous-month summary lines from monthly insights", () => {
    const insights: MonthlyInsights = {
      categoryExpenses: [],
      currentMonthLabel: "4월",
      expenseComparison: {
        currentAmount: 60000,
        deltaAmount: 40000,
        direction: "decrease",
        previousAmount: 100000,
      },
      incomeComparison: {
        currentAmount: 300000,
        deltaAmount: 50000,
        direction: "increase",
        previousAmount: 250000,
      },
      memberExpenses: [],
      trendMonths: [],
      previousMonthLabel: "3월",
    };
    const summaryLines = buildPreviousMonthSummaryLines(insights);
    const pushContent = buildPreviousMonthSummaryPushContent(insights);

    expect(summaryLines.expenseSummary).toBe("전월보다 40,000원 덜 썼어요");
    expect(summaryLines.incomeSummary).toBe("전월보다 50,000원 더 벌었어요");
    expect(pushContent.title).toBe("4월 수입·지출 돌아보기");
    expect(pushContent.body).toBe(
      "수입: 전월보다 50,000원 더 벌었어요\n지출: 전월보다 40,000원 덜 썼어요",
    );
  });
});
