import type {
  MonthlyComparisonMetric,
  MonthlyInsightComparisonBasis,
  MonthlyInsights,
} from "../types/ledger";
import { formatCurrency } from "../utils/calendar";

export type MonthlyComparisonTone = "expense" | "income" | "muted";
export type MonthlyComparisonVariant = "expense" | "income";

export type MonthlyComparisonSentenceParts = {
  prefix: string;
  subject: string;
  suffix: string;
};

export type MonthlyComparisonSummary = {
  comparisonSentence: string;
  currentAmountLabel: string;
  currentSentence: string;
  currentSentenceParts: MonthlyComparisonSentenceParts;
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
    currentExpense: {
      prefix: "이번 달의 ",
      subject: "지출",
      suffix: "은 {amount}이에요.",
    },
    currentIncome: {
      prefix: "이번 달의 ",
      subject: "수입",
      suffix: "은 {amount}이에요.",
    },
    expenseDecrease: "지난달보다 {amount} 덜 썼어요.",
    expenseIncrease: "지난달보다 {amount} 더 썼어요.",
    incomeDecrease: "지난달보다 {amount} 덜 들어왔어요.",
    incomeIncrease: "지난달보다 {amount} 더 들어왔어요.",
    periodExpenseDecrease: "이전 기간보다 {amount} 덜 썼어요.",
    periodExpenseIncrease: "이전 기간보다 {amount} 더 썼어요.",
    periodIncomeDecrease: "이전 기간보다 {amount} 덜 들어왔어요.",
    periodIncomeIncrease: "이전 기간보다 {amount} 더 들어왔어요.",
    periodPreviousAmountPrefix: "이전 기간",
    periodPreviousDataUnavailable: "이전 기간 기록이 없어 아직 비교할 수 없어요.",
    periodSame: "이전 기간과 같아요.",
    previousAmountPrefix: "전월",
    previousDataUnavailable: "지난달 기록이 아직 없어 다음 달부터 비교할 수 있어요.",
    same: "지난달과 같아요.",
  } as const;

const MonthlyComparisonCurrentSentenceFallbackCopy = {
    expense: {
      prefix: "이번 달의 ",
      subject: "지출",
      suffix: "은 {amount}이에요.",
    },
    income: {
      prefix: "이번 달의 ",
      subject: "수입",
      suffix: "은 {amount}이에요.",
    },
  } as const;

const PreviousMonthSummaryCopy = {
    body: "수입: {incomeSummary}\n지출: {expenseSummary}",
    title: "{currentMonthLabel} 수입·지출 돌아보기",
  } as const;

export function buildMonthlyComparisonSummary(
  metric: MonthlyComparisonMetric,
  previousMonthLabel: string,
  variant: MonthlyComparisonVariant,
  basis: MonthlyInsightComparisonBasis = "month",
): MonthlyComparisonSummary {
  const currentAmountLabel = formatCurrency(metric.currentAmount);
  const previousAmountPrefix =
    basis === "period"
      ? MonthlyComparisonCopy.periodPreviousAmountPrefix
      : MonthlyComparisonCopy.previousAmountPrefix;
  const previousAmountLabel = `${previousAmountPrefix} ${previousMonthLabel} | ${formatCurrency(metric.previousAmount)}`;
  const currentSentenceParts = buildCurrentSentenceParts(metric.currentAmount, variant);
  const currentSentence = formatCurrentSentence(currentSentenceParts);

  if (metric.previousAmount <= 0) {
    const unavailableMessage =
      basis === "period"
        ? MonthlyComparisonCopy.periodPreviousDataUnavailable
        : MonthlyComparisonCopy.previousDataUnavailable;
    return {
      comparisonSentence: unavailableMessage,
      currentAmountLabel,
      currentSentence,
      currentSentenceParts,
      previousAmountLabel,
      summaryMessage: unavailableMessage,
      tone: "muted",
    };
  }

  if (isMeaningfullyFlat(metric)) {
    const sameMessage =
      basis === "period" ? MonthlyComparisonCopy.periodSame : MonthlyComparisonCopy.same;
    return {
      comparisonSentence: sameMessage,
      currentAmountLabel,
      currentSentence,
      currentSentenceParts,
      previousAmountLabel,
      summaryMessage: sameMessage,
      tone: "muted",
    };
  }

  const comparisonSentence = formatSummaryMessage(
    formatCurrency(metric.deltaAmount),
    metric.direction,
    variant,
    basis,
  );

  return {
    comparisonSentence,
    currentAmountLabel,
    currentSentence,
    currentSentenceParts,
    previousAmountLabel,
    summaryMessage: comparisonSentence,
    tone: resolveComparisonTone(metric.direction, variant),
  };
}

function buildPreviousMonthSummaryLines(
  insights: MonthlyInsights,
): PreviousMonthSummaryLines {
  return {
    expenseSummary: buildMonthlyComparisonSummary(
      insights.expenseComparison,
      insights.previousMonthLabel,
      "expense",
      insights.comparisonBasis,
    ).summaryMessage,
    incomeSummary: buildMonthlyComparisonSummary(
      insights.incomeComparison,
      insights.previousMonthLabel,
      "income",
      insights.comparisonBasis,
    ).summaryMessage,
  };
}

function buildPreviousMonthSummaryPushContent(
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

function buildCurrentSentenceParts(
  amount: number,
  variant: MonthlyComparisonVariant,
): MonthlyComparisonSentenceParts {
  const template =
    variant === "income"
      ? (MonthlyComparisonCopy.currentIncome ?? MonthlyComparisonCurrentSentenceFallbackCopy.income)
      : (MonthlyComparisonCopy.currentExpense ??
        MonthlyComparisonCurrentSentenceFallbackCopy.expense);

  return {
    ...template,
    suffix: template.suffix.replace("{amount}", formatCurrency(amount)),
  };
}

function formatCurrentSentence(parts: MonthlyComparisonSentenceParts): string {
  return `${parts.prefix}${parts.subject}${parts.suffix}`;
}

function formatSummaryMessage(
  deltaAmountLabel: string,
  direction: MonthlyComparisonMetric["direction"],
  variant: MonthlyComparisonVariant,
  basis: MonthlyInsightComparisonBasis,
): string {
  if (variant === "expense") {
    const template =
      basis === "period"
        ? direction === "increase"
          ? MonthlyComparisonCopy.periodExpenseIncrease
          : MonthlyComparisonCopy.periodExpenseDecrease
        : direction === "increase"
          ? MonthlyComparisonCopy.expenseIncrease
          : MonthlyComparisonCopy.expenseDecrease;
    return template.replace("{amount}", deltaAmountLabel);
  }

  const template =
    basis === "period"
      ? direction === "increase"
        ? MonthlyComparisonCopy.periodIncomeIncrease
        : MonthlyComparisonCopy.periodIncomeDecrease
      : direction === "increase"
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
