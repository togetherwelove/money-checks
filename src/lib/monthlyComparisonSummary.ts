import type { MonthlyComparisonMetric, MonthlyInsights } from "../types/ledger";
import { formatCurrency } from "../utils/calendar";

export type MonthlyComparisonTone = "expense" | "income" | "muted";
export type MonthlyComparisonVariant = "expense" | "income";

export type MonthlyComparisonSummary = {
  changeRateLabel: string | null;
  currentAmountLabel: string;
  previousAmountLabel: string;
  summaryMessage: string;
  tone: MonthlyComparisonTone;
};

type PreviousMonthSummaryLines = {
  expenseSummary: string;
  incomeSummary: string;
};

export type PushNotificationContent = {
  body: string;
  title: string;
};

const MonthlyComparisonCopy = {
  expenseDecrease: "전월보다 {amount} 덜 썼어요",
  expenseIncrease: "전월보다 {amount} 더 썼어요",
  incomeDecrease: "전월보다 {amount} 덜 벌었어요",
  incomeIncrease: "전월보다 {amount} 더 벌었어요",
  previousAmountPrefix: "전월",
  previousDataUnavailable: "전월 데이터 없음",
  rateDecrease: "{monthLabel} 대비 {rate}% 감소",
  rateIncrease: "{monthLabel} 대비 {rate}% 증가",
  same: "전월과 같아요",
} as const;

const PreviousMonthSummaryCopy = {
  body: "수입: {incomeSummary}\n지출: {expenseSummary}",
  title: "{currentMonthLabel} 수입·지출 돌아보기",
} as const;

export function buildMonthlyComparisonSummary(
  metric: MonthlyComparisonMetric,
  previousMonthLabel: string,
  variant: MonthlyComparisonVariant,
): MonthlyComparisonSummary {
  const currentAmountLabel = formatComparisonAmount(metric.currentAmount, variant);
  const previousAmountLabel = `${MonthlyComparisonCopy.previousAmountPrefix} ${previousMonthLabel} ${formatComparisonAmount(metric.previousAmount, variant)}`;

  if (metric.previousAmount <= 0) {
    return {
      changeRateLabel: null,
      currentAmountLabel,
      previousAmountLabel,
      summaryMessage: MonthlyComparisonCopy.previousDataUnavailable,
      tone: "muted",
    };
  }

  if (isMeaningfullyFlat(metric)) {
    return {
      changeRateLabel: null,
      currentAmountLabel,
      previousAmountLabel,
      summaryMessage: MonthlyComparisonCopy.same,
      tone: "muted",
    };
  }

  const deltaAmountLabel = formatCurrency(metric.deltaAmount);
  const changeRateLabel =
    metric.previousAmount > 0
      ? formatChangeRateLabel(
          metric.deltaAmount / metric.previousAmount,
          metric.direction,
          previousMonthLabel,
        )
      : null;

  return {
    changeRateLabel,
    currentAmountLabel,
    previousAmountLabel,
    summaryMessage: formatSummaryMessage(deltaAmountLabel, metric.direction, variant),
    tone: resolveComparisonTone(metric.direction, variant),
  };
}

export function buildPreviousMonthSummaryLines(
  insights: MonthlyInsights,
): PreviousMonthSummaryLines {
  return {
    expenseSummary: buildMonthlyComparisonSummary(
      insights.expenseComparison,
      insights.previousMonthLabel,
      "expense",
    ).summaryMessage,
    incomeSummary: buildMonthlyComparisonSummary(
      insights.incomeComparison,
      insights.previousMonthLabel,
      "income",
    ).summaryMessage,
  };
}

export function buildPreviousMonthSummaryPushContent(
  insights: MonthlyInsights,
): PushNotificationContent {
  const summaryLines = buildPreviousMonthSummaryLines(insights);

  return {
    body: PreviousMonthSummaryCopy.body
      .replace("{incomeSummary}", summaryLines.incomeSummary)
      .replace("{expenseSummary}", summaryLines.expenseSummary),
    title: PreviousMonthSummaryCopy.title.replace(
      "{currentMonthLabel}",
      insights.currentMonthLabel,
    ),
  };
}

function formatComparisonAmount(amount: number, variant: MonthlyComparisonVariant): string {
  const prefix = variant === "income" ? "+" : "-";
  return `${prefix} ${formatCurrency(amount)}`;
}

function formatChangeRateLabel(
  changeRate: number,
  direction: MonthlyComparisonMetric["direction"],
  previousMonthLabel: string,
): string {
  const roundedRate = Math.round(changeRate * 100);
  const template =
    direction === "increase"
      ? MonthlyComparisonCopy.rateIncrease
      : MonthlyComparisonCopy.rateDecrease;

  return template
    .replace("{monthLabel}", previousMonthLabel)
    .replace("{rate}", String(roundedRate));
}

function formatSummaryMessage(
  deltaAmountLabel: string,
  direction: MonthlyComparisonMetric["direction"],
  variant: MonthlyComparisonVariant,
): string {
  if (variant === "expense") {
    const template =
      direction === "increase"
        ? MonthlyComparisonCopy.expenseIncrease
        : MonthlyComparisonCopy.expenseDecrease;
    return template.replace("{amount}", deltaAmountLabel);
  }

  const template =
    direction === "increase"
      ? MonthlyComparisonCopy.incomeIncrease
      : MonthlyComparisonCopy.incomeDecrease;
  return template.replace("{amount}", deltaAmountLabel);
}

function isMeaningfullyFlat(metric: MonthlyComparisonMetric): boolean {
  return metric.direction === "same";
}

function resolveComparisonTone(
  direction: MonthlyComparisonMetric["direction"],
  variant: MonthlyComparisonVariant,
): MonthlyComparisonTone {
  if (direction === "same") {
    return "muted";
  }

  if (variant === "expense") {
    return direction === "increase" ? "expense" : "income";
  }

  return direction === "increase" ? "income" : "expense";
}
