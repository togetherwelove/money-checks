import { selectStaticCopy } from "../i18n/staticCopy";
import type { MonthlyComparisonMetric, MonthlyInsights } from "../types/ledger";
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

const MonthlyComparisonCopy = selectStaticCopy({
  en: {
    currentExpense: {
      prefix: "This month's ",
      subject: "expense",
      suffix: " was {amount}.",
    },
    currentIncome: {
      prefix: "This month's ",
      subject: "income",
      suffix: " was {amount}.",
    },
    expenseDecrease: "That is {amount} less than last month.",
    expenseIncrease: "That is {amount} more than last month.",
    incomeDecrease: "That is {amount} less than last month.",
    incomeIncrease: "That is {amount} more than last month.",
    previousAmountPrefix: "Previous",
    previousDataUnavailable:
      "There is no previous month record yet, so comparison will be available next month.",
    same: "That is the same as last month.",
  },
  ko: {
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
    previousAmountPrefix: "전월",
    previousDataUnavailable: "지난달 기록이 아직 없어 다음 달부터 비교할 수 있어요.",
    same: "지난달과 같아요.",
  },
} as const);

const MonthlyComparisonCurrentSentenceFallbackCopy = selectStaticCopy({
  en: {
    expense: {
      prefix: "This month's ",
      subject: "expense",
      suffix: " was {amount}.",
    },
    income: {
      prefix: "This month's ",
      subject: "income",
      suffix: " was {amount}.",
    },
  },
  ko: {
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
  },
} as const);

const PreviousMonthSummaryCopy = selectStaticCopy({
  en: {
    body: "Income: {incomeSummary}\nExpense: {expenseSummary}",
    title: "{currentMonthLabel} Income & Expense Review",
  },
  ko: {
    body: "수입: {incomeSummary}\n지출: {expenseSummary}",
    title: "{currentMonthLabel} 수입·지출 돌아보기",
  },
} as const);

export function buildMonthlyComparisonSummary(
  metric: MonthlyComparisonMetric,
  previousMonthLabel: string,
  variant: MonthlyComparisonVariant,
): MonthlyComparisonSummary {
  const currentAmountLabel = formatCurrency(metric.currentAmount);
  const previousAmountLabel = `${MonthlyComparisonCopy.previousAmountPrefix} ${previousMonthLabel} ${formatCurrency(metric.previousAmount)}`;
  const currentSentenceParts = buildCurrentSentenceParts(metric.currentAmount, variant);
  const currentSentence = formatCurrentSentence(currentSentenceParts);

  if (metric.previousAmount <= 0) {
    return {
      comparisonSentence: MonthlyComparisonCopy.previousDataUnavailable,
      currentAmountLabel,
      currentSentence,
      currentSentenceParts,
      previousAmountLabel,
      summaryMessage: MonthlyComparisonCopy.previousDataUnavailable,
      tone: "muted",
    };
  }

  if (isMeaningfullyFlat(metric)) {
    return {
      comparisonSentence: MonthlyComparisonCopy.same,
      currentAmountLabel,
      currentSentence,
      currentSentenceParts,
      previousAmountLabel,
      summaryMessage: MonthlyComparisonCopy.same,
      tone: "muted",
    };
  }

  const comparisonSentence = formatSummaryMessage(
    formatCurrency(metric.deltaAmount),
    metric.direction,
    variant,
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
