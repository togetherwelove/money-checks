import { useEffect, useMemo } from "react";

import { fetchLedgerEntriesSummary } from "../lib/ledgerEntries";
import { logAppError } from "../lib/logAppError";
import { clearLedgerWidgetSummary, updateLedgerWidgetSummary } from "../lib/nativeWidget";
import { storeActiveLedgerWidgetBookId } from "../lib/widgetPushPayload";
import { buildLedgerWidgetSummary } from "../lib/widgetSummary";
import type { LedgerEntry } from "../types/ledger";
import { addMonths, startOfMonth, toIsoDate } from "../utils/calendar";

export function useLedgerWidgetSync(activeBookId: string | null, entries: LedgerEntry[]) {
  const entrySignature = useMemo(
    () =>
      entries
        .map((entry) => `${entry.id}:${entry.date}:${entry.type}:${entry.amount}:${entry.content}`)
        .join("|"),
    [entries],
  );

  useEffect(() => {
    let isCancelled = false;
    const syncRevision = entrySignature;

    async function syncWidgetSummary() {
      if (!activeBookId) {
        storeActiveLedgerWidgetBookId(null);
        await clearLedgerWidgetSummary();
        return;
      }

      storeActiveLedgerWidgetBookId(activeBookId);
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = addMonths(monthStart, 1);
      monthEnd.setDate(monthEnd.getDate() - 1);

      const monthEntries = await fetchLedgerEntriesSummary(
        activeBookId,
        toIsoDate(monthStart),
        toIsoDate(monthEnd),
        { ascending: true, orderBy: "occurred_on" },
      );
      if (isCancelled) {
        return;
      }

      await updateLedgerWidgetSummary(buildLedgerWidgetSummary(monthEntries, toIsoDate(today)));
    }

    void syncWidgetSummary().catch((error) => {
      logAppError("LedgerWidgetSync", error, {
        activeBookId,
        syncRevision,
        step: "sync_widget_summary",
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [activeBookId, entrySignature]);
}
