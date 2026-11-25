import { useEffect, useState } from "react";
import {
  fetchFilteredLedgerTotals,
  filteredLedgerQueryKey,
  type FilteredLedgerQuery,
  type FilteredLedgerTotal,
} from "../lib/filteredLedgerTotals";
export function useFilteredLedgerTotals(query: FilteredLedgerQuery, revision: number) {
  const key = filteredLedgerQueryKey(query);
  const enabled = Boolean(
    query.activeBookId &&
      (query.dateRange ||
        query.selectedCategoryIds.length ||
        query.searchQuery.trim() ||
        (query.entryTypeFilter && query.entryTypeFilter !== "all")),
  );
  const [result, setResult] = useState<{
    key: string;
    totals: FilteredLedgerTotal[] | null;
    failed: boolean;
  } | null>(null);
  useEffect(() => {
    if (!enabled) {
      setResult(null);
      return;
    }
    const controller = new AbortController();
    setResult(null);
    void fetchFilteredLedgerTotals(query, controller.signal)
      .then((totals) => {
        if (!controller.signal.aborted) setResult({ key, totals, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, totals: null, failed: true });
      });
    return () => controller.abort();
  }, [key, revision, enabled]);
  return enabled && result?.key === key ? result : null;
}
