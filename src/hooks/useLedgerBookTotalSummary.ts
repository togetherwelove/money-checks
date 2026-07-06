import { useEffect, useState } from "react";

import { fetchLedgerBookTotalSummary } from "../lib/ledgerBookSummary";
import { logAppError } from "../lib/logAppError";
import type { LedgerTotalSummary } from "../types/ledger";

type LedgerBookTotalSummaryState = {
  isLoadingTotalSummary: boolean;
  totalLedgerSummary: LedgerTotalSummary | null;
};

export function useLedgerBookTotalSummary(
  bookId: string | null,
  isEnabled: boolean,
  refreshKey: string,
  dateFrom?: string | null,
  dateTo?: string | null,
): LedgerBookTotalSummaryState {
  const [totalLedgerSummary, setTotalLedgerSummary] = useState<LedgerTotalSummary | null>(null);
  const [isLoadingTotalSummary, setIsLoadingTotalSummary] = useState(false);

  useEffect(() => {
    if (!bookId || !isEnabled) {
      setTotalLedgerSummary(null);
      setIsLoadingTotalSummary(false);
      return;
    }

    let isMounted = true;
    setIsLoadingTotalSummary(true);

    void fetchLedgerBookTotalSummary(bookId, { dateFrom, dateTo })
      .then((nextSummary) => {
        if (isMounted) {
          setTotalLedgerSummary(nextSummary);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setTotalLedgerSummary(null);
        }

        logAppError("LedgerBookTotalSummary", error, {
          bookId,
          dateFrom,
          dateTo,
          step: "fetch_ledger_book_total_summary",
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingTotalSummary(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [bookId, dateFrom, dateTo, isEnabled, refreshKey]);

  return {
    isLoadingTotalSummary,
    totalLedgerSummary,
  };
}
