import { useMemo, useState } from "react";
import { Alert } from "react-native";

import { AnnualReportCopy } from "../constants/annualReport";
import { confirmAndDownloadAnnualReport } from "../lib/annualReport/downloadAnnualReport";
import { resolveOwnedLedgerBookName } from "../lib/ledgerBookNickname";
import { loadLedgerBookNickname } from "../lib/ledgerBookNicknameStorage";
import { fetchLedgerEntries } from "../lib/ledgerEntries";
import type { LedgerBook } from "../types/ledgerBook";

type UseAnnualLedgerReportActionParams = {
  activeBook: LedgerBook | null;
  currentUserId: string;
  visibleMonth: Date;
};

export function useAnnualLedgerReportAction({
  activeBook,
  currentUserId,
  visibleMonth,
}: UseAnnualLedgerReportActionParams) {
  const [isDownloading, setIsDownloading] = useState(false);

  const bookName = useMemo(() => {
    if (!activeBook) {
      return null;
    }

    if (activeBook.ownerId !== currentUserId) {
      return activeBook.name;
    }

    return resolveOwnedLedgerBookName(loadLedgerBookNickname(activeBook.id));
  }, [activeBook, currentUserId]);

  const handleDownloadReport = async () => {
    if (!activeBook || !bookName) {
      return;
    }

    setIsDownloading(true);
    try {
      const year = visibleMonth.getFullYear();
      const entries = await fetchLedgerEntries(activeBook.id, `${year}-01-01`, `${year}-12-31`);
      await confirmAndDownloadAnnualReport({
        bookName,
        entries,
        year,
      });
    } catch {
      Alert.alert(AnnualReportCopy.errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    bookName,
    handleDownloadReport,
    isDownloading,
  };
}
