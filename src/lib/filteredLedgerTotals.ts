import Decimal from "decimal.js";
import type { AllEntriesDateRange, AllEntriesEntryTypeFilter } from "../constants/allEntries";
import { LedgerQueryConfig } from "../constants/ledgerQueries";
import { fetchEnrichedLedgerEntryRows, type LedgerEntriesPageCursor } from "./ledgerEntries";
import { resolveDisplayCurrency } from "./currencyPreference";

export type FilteredLedgerQuery = {
  activeBookId: string | null;
  selectedCategoryIds: readonly string[];
  searchQuery: string;
  dateRange?: AllEntriesDateRange | null;
  entryTypeFilter?: AllEntriesEntryTypeFilter;
};
export type FilteredLedgerTotal = { currency: string; expense: number; income: number };
export function filteredLedgerQueryKey(query: FilteredLedgerQuery): string {
  return JSON.stringify([
    query.activeBookId,
    query.selectedCategoryIds,
    query.searchQuery,
    query.dateRange,
    query.entryTypeFilter,
  ]);
}
export async function fetchFilteredLedgerTotals(
  query: FilteredLedgerQuery,
  signal: AbortSignal,
): Promise<FilteredLedgerTotal[]> {
  if (!query.activeBookId) return [];
  const totals = new Map<string, { expense: Decimal; income: Decimal }>();
  let cursor: LedgerEntriesPageCursor | null = null;
  let offset = 0;
  const seen = new Set<string>();
  while (!signal.aborted) {
    const rows = await fetchEnrichedLedgerEntryRows(query.activeBookId, {
      ascending: false,
      orderBy: "created_at",
      categoryIds: query.selectedCategoryIds,
      dateFrom: query.dateRange?.startDate,
      dateTo: query.dateRange?.endDate,
      searchQuery: query.searchQuery.trim(),
      cursor: query.searchQuery.trim() ? null : cursor,
      pageOffset: query.searchQuery.trim() ? offset : 0,
      limit: LedgerQueryConfig.filteredTotalsPageSize,
      signal,
    });
    if (signal.aborted) throw new Error("Aborted");
    if (!rows.length)
      return [...totals].map(([currency, total]) => ({
        currency,
        expense: total.expense.toNumber(),
        income: total.income.toNumber(),
      }));
    for (const row of rows) {
      if (seen.has(row.id)) throw new Error("Repeated ledger summary page");
      seen.add(row.id);
      if (
        query.entryTypeFilter &&
        query.entryTypeFilter !== "all" &&
        row.entry_type !== query.entryTypeFilter
      )
        continue;
      const currency = row.currency || resolveDisplayCurrency();
      let total = totals.get(currency);
      if (!total) {
        total = { expense: new Decimal(0), income: new Decimal(0) };
        totals.set(currency, total);
      }
      total[row.entry_type] = total[row.entry_type].plus(row.amount);
    }
    offset += rows.length;
    const last = rows[rows.length - 1];
    cursor = { createdAt: last.created_at, id: last.id };
  }
  throw new Error("Aborted");
}
