import { LedgerWidgetConfig } from "../constants/widget";
import type { LedgerWidgetSummary } from "../types/widget";
import { appStorage } from "./appStorage";

const ACTIVE_WIDGET_BOOK_ID_STORAGE_KEY = "moneychecks.widget.active-book-id";
const WIDGET_PUSH_KIND = "ledger_widget_summary";

type LedgerWidgetPushPayload = {
  bookId: string;
  kind: typeof WIDGET_PUSH_KIND;
  monthKey: string;
  summary: LedgerWidgetSummary;
};

type SerializedLedgerWidgetPushPayload = {
  bookId: string;
  kind: typeof WIDGET_PUSH_KIND;
  monthKey: string;
  summary: string;
};

export function storeActiveLedgerWidgetBookId(bookId: string | null): void {
  if (!bookId) {
    appStorage.removeItem(ACTIVE_WIDGET_BOOK_ID_STORAGE_KEY);
    return;
  }

  appStorage.setItem(ACTIVE_WIDGET_BOOK_ID_STORAGE_KEY, bookId);
}

export function readActiveLedgerWidgetBookId(): string | null {
  const storedBookId = appStorage.getItem(ACTIVE_WIDGET_BOOK_ID_STORAGE_KEY);
  return storedBookId?.trim() ? storedBookId : null;
}

export function buildLedgerWidgetPushPayload(
  bookId: string,
  monthKey: string,
  summary: LedgerWidgetSummary,
): SerializedLedgerWidgetPushPayload {
  return {
    bookId,
    kind: WIDGET_PUSH_KIND,
    monthKey,
    summary: JSON.stringify(summary),
  };
}

export function parseLedgerWidgetPushPayload(
  data: Record<string, unknown> | null | undefined,
): LedgerWidgetPushPayload | null {
  if (!data || data.kind !== WIDGET_PUSH_KIND) {
    return null;
  }

  const bookId = typeof data.bookId === "string" ? data.bookId.trim() : "";
  const monthKey = typeof data.monthKey === "string" ? data.monthKey.trim() : "";
  const rawSummary = typeof data.summary === "string" ? data.summary : null;

  if (!bookId || !monthKey || !rawSummary) {
    return null;
  }

  try {
    const summary = JSON.parse(rawSummary) as unknown;
    if (!isLedgerWidgetSummary(summary)) {
      return null;
    }

    return {
      bookId,
      kind: WIDGET_PUSH_KIND,
      monthKey,
      summary,
    };
  } catch {
    return null;
  }
}

function isLedgerWidgetSummary(value: unknown): value is LedgerWidgetSummary {
  const candidate = value as Partial<LedgerWidgetSummary> | null;

  return (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof candidate.monthExpenseAmount === "number" &&
    typeof candidate.monthExpenseLabel === "string" &&
    typeof candidate.monthIncomeAmount === "number" &&
    typeof candidate.monthIncomeLabel === "string" &&
    typeof candidate.todayExpenseLabel === "string" &&
    typeof candidate.todayIncomeLabel === "string" &&
    Array.isArray(candidate.recentEntries) &&
    candidate.recentEntries.length <= LedgerWidgetConfig.maxRecentEntries
  );
}
