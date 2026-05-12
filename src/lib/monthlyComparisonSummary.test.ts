import { describe, expect, it } from "vitest";

import type { MonthlyInsights } from "../types/ledger";
import {
  buildMonthlyComparisonSummary,
  buildPreviousMonthSummaryLines,
  buildPreviousMonthSummaryPushContent,
} from "./monthlyComparisonSummary";

describe("buildMonthlyComparisonSummary", () => {
  it("describes expense decreases without rate labels", () => {
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

    expect(summary.currentSentence).toBe("이번 달의 지출은 60,000원이에요.");
    expect(summary.currentSentenceParts).toEqual({
      prefix: "이번 달의 ",
      subject: "지출",
      suffix: "은 60,000원이에요.",
    });
    expect(summary.comparisonSentence).toBe("지난달보다 40,000원 덜 썼어요.");
    expect(summary.summaryMessage).toBe("지난달보다 40,000원 덜 썼어요.");
    expect(summary.currentAmountLabel).toBe("60,000원");
    expect(summary.previousAmountLabel).toBe("전월 3월 100,000원");
    expect(summary.tone).toBe("income");
  });

  it("describes income changes with the exact delta amount", () => {
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

    expect(summary.currentSentence).toBe("이번 달의 수입은 100,500원이에요.");
    expect(summary.currentSentenceParts).toEqual({
      prefix: "이번 달의 ",
      subject: "수입",
      suffix: "은 100,500원이에요.",
    });
    expect(summary.comparisonSentence).toBe("지난달보다 500원 더 들어왔어요.");
    expect(summary.summaryMessage).toBe("지난달보다 500원 더 들어왔어요.");
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

    expect(summary.comparisonSentence).toBe("지난달과 같아요.");
    expect(summary.summaryMessage).toBe("지난달과 같아요.");
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

    expect(summary.comparisonSentence).toBe(
      "지난달 기록이 아직 없어 다음 달부터 비교할 수 있어요.",
    );
    expect(summary.summaryMessage).toBe("지난달 기록이 아직 없어 다음 달부터 비교할 수 있어요.");
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

    expect(summaryLines.expenseSummary).toBe("지난달보다 40,000원 덜 썼어요.");
    expect(summaryLines.incomeSummary).toBe("지난달보다 50,000원 더 들어왔어요.");
    expect(pushContent.title).toBe("4월 수입·지출 돌아보기");
    expect(pushContent.body).toBe(
      "수입: 지난달보다 50,000원 더 들어왔어요.\n지출: 지난달보다 40,000원 덜 썼어요.",
    );
  });
});
