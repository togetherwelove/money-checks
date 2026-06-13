import { useEffect, useRef, useState } from "react";

import { AppMessages } from "../../constants/messages";
import { fetchLedgerEntries } from "../../lib/ledgerEntries";
import { logAppError } from "../../lib/logAppError";
import { createPerformanceTrace } from "../../lib/performanceTrace";
import type { LedgerEntry } from "../../types/ledger";
import { buildLedgerEntryListSignature } from "../../utils/ledgerEntrySignature";

type SelectedDateEntriesState = {
  isLoadingSelectedDateEntries: boolean;
  refreshSelectedDateEntries: () => Promise<void>;
  selectedEntries: LedgerEntry[];
  selectedEntriesError: string | null;
};

export function useSelectedDateEntries(
  activeBookId: string | null,
  selectedDate: string,
  selectedDateEntrySignature: string,
): SelectedDateEntriesState {
  const [entriesByDate, setEntriesByDate] = useState<Record<string, LedgerEntry[]>>({});
  const [isLoadingSelectedDateEntries, setIsLoadingSelectedDateEntries] = useState(false);
  const [selectedEntriesError, setSelectedEntriesError] = useState<string | null>(null);
  const [signatureByDate, setSignatureByDate] = useState<Record<string, string>>({});
  const cachedBookIdRef = useRef<string | null>(activeBookId);

  useEffect(() => {
    if (cachedBookIdRef.current === activeBookId) {
      return;
    }

    cachedBookIdRef.current = activeBookId;
    setEntriesByDate({});
    setIsLoadingSelectedDateEntries(false);
    setSelectedEntriesError(null);
    setSignatureByDate({});
  }, [activeBookId]);

  useEffect(() => {
    let isMounted = true;
    if (!activeBookId) {
      setIsLoadingSelectedDateEntries(false);
      setSelectedEntriesError(null);
      return () => {
        isMounted = false;
      };
    }

    const hasCachedSelectedEntries = selectedDate in entriesByDate;
    const cachedSignature = signatureByDate[selectedDate] ?? null;

    if (!selectedDateEntrySignature) {
      setEntriesByDate((currentEntriesByDate) =>
        selectedDate in currentEntriesByDate
          ? currentEntriesByDate
          : {
              ...currentEntriesByDate,
              [selectedDate]: [],
            },
      );
      setSignatureByDate((currentSignatureByDate) =>
        currentSignatureByDate[selectedDate] === selectedDateEntrySignature
          ? currentSignatureByDate
          : {
              ...currentSignatureByDate,
              [selectedDate]: selectedDateEntrySignature,
            },
      );
      setIsLoadingSelectedDateEntries(false);
      setSelectedEntriesError(null);
      return () => {
        isMounted = false;
      };
    }

    if (hasCachedSelectedEntries && cachedSignature === selectedDateEntrySignature) {
      setIsLoadingSelectedDateEntries(false);
      setSelectedEntriesError(null);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingSelectedDateEntries(!hasCachedSelectedEntries);
    setSelectedEntriesError(null);

    const trace = createPerformanceTrace("SelectedDateEntries", {
      activeBookId,
      selectedDate,
      step: "load_selected_date_entries",
    });

    void fetchLedgerEntries(activeBookId, selectedDate, selectedDate)
      .then((nextEntries) => {
        trace("loaded_selected_date_entries", { entryCount: nextEntries.length });
        if (!isMounted) {
          return;
        }

        setEntriesByDate((currentEntriesByDate) => ({
          ...currentEntriesByDate,
          [selectedDate]: nextEntries,
        }));
        setSignatureByDate((currentSignatureByDate) => ({
          ...currentSignatureByDate,
          [selectedDate]: buildLedgerEntryListSignature(nextEntries),
        }));
      })
      .catch((error) => {
        logAppError("SelectedDateEntries", error, {
          activeBookId,
          selectedDate,
          step: "load_selected_date_entries",
        });
        if (isMounted) {
          setSelectedEntriesError(AppMessages.ledgerError);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSelectedDateEntries(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeBookId, entriesByDate, selectedDate, selectedDateEntrySignature, signatureByDate]);

  return {
    isLoadingSelectedDateEntries,
    refreshSelectedDateEntries: async () => {
      if (!activeBookId) {
        return;
      }

      setIsLoadingSelectedDateEntries(true);
      setSelectedEntriesError(null);
      try {
        const trace = createPerformanceTrace("SelectedDateEntries", {
          activeBookId,
          selectedDate,
          step: "refresh_selected_date_entries",
        });
        const nextEntries = await fetchLedgerEntries(activeBookId, selectedDate, selectedDate);
        trace("refreshed_selected_date_entries", { entryCount: nextEntries.length });
        setEntriesByDate((currentEntriesByDate) => ({
          ...currentEntriesByDate,
          [selectedDate]: nextEntries,
        }));
        setSignatureByDate((currentSignatureByDate) => ({
          ...currentSignatureByDate,
          [selectedDate]: buildLedgerEntryListSignature(nextEntries),
        }));
      } catch (error) {
        logAppError("SelectedDateEntries", error, {
          activeBookId,
          selectedDate,
          step: "refresh_selected_date_entries",
        });
        setSelectedEntriesError(AppMessages.ledgerError);
      } finally {
        setIsLoadingSelectedDateEntries(false);
      }
    },
    selectedEntries: entriesByDate[selectedDate] ?? [],
    selectedEntriesError,
  };
}
