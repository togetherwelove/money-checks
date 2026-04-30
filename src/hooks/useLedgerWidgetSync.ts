import { useEffect, useMemo } from "react";

import { logAppError } from "../lib/logAppError";
import { clearLedgerWidgetSummary, updateLedgerWidgetSummary } from "../lib/nativeWidget";
import { storeActiveLedgerWidgetBookId } from "../lib/widgetPushPayload";
import { fetchLedgerWidgetSummary } from "../lib/widgetSummary";
import type { LedgerEntry } from "../types/ledger";
import { toIsoDate } from "../utils/calendar";

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
      const summary = await fetchLedgerWidgetSummary(activeBookId, toIsoDate(today));
      if (isCancelled) {
        return;
      }

      await updateLedgerWidgetSummary(summary);
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
