import { useMemo, useState } from "react";
import { Alert, InteractionManager } from "react-native";

import { AnnualReportCopy, buildSelectedYearOptionLabel } from "../constants/annualReport";
import { CommonActionCopy } from "../constants/commonActions";
import {
  type AnnualReportPeriod,
  buildCustomRangePeriod,
  buildFirstToLastPeriod,
  buildSelectedYearPeriod,
} from "../lib/annualReport/annualReportPeriods";
import { confirmAndDownloadAnnualReport } from "../lib/annualReport/downloadAnnualReport";
import { fetchLedgerEntries, fetchLedgerEntryDateBounds } from "../lib/ledgerEntries";
import type { LedgerBook } from "../types/ledgerBook";

type UseAnnualLedgerReportActionParams = {
  activeBook: LedgerBook | null;
  onBeforeDownloadReport?: (() => Promise<void> | void) | null;
  visibleMonth: Date;
};

type CustomRangeDraft = {
  endDate: string;
  isOpen: boolean;
  startDate: string;
};

export function useAnnualLedgerReportAction({
  activeBook,
  onBeforeDownloadReport = null,
  visibleMonth,
}: UseAnnualLedgerReportActionParams) {
  const [customRangeDraft, setCustomRangeDraft] = useState<CustomRangeDraft | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const bookName = useMemo(() => {
    if (!activeBook) {
      return null;
    }

    return activeBook.name;
  }, [activeBook]);

  const handleDownloadReport = async () => {
    if (!activeBook || !bookName) {
      return;
    }

    try {
      const dateBounds = await fetchLedgerEntryDateBounds(activeBook.id);
      if (!dateBounds) {
        Alert.alert(AnnualReportCopy.noEntriesMessage);
        return;
      }

      const selectedYear = visibleMonth.getFullYear();
      await selectAnnualReportPeriod(
        dateBounds.firstDate,
        dateBounds.lastDate,
        selectedYear,
        bookName,
        activeBook.id,
        setCustomRangeDraft,
        runDownloadReportForPeriod,
        onBeforeDownloadReport,
        setIsDownloading,
      );
    } catch {
      Alert.alert(AnnualReportCopy.errorMessage);
    }
  };

  const handleCloseCustomRangePicker = () => setCustomRangeDraft(null);

  const handleConfirmCustomRange = async (startDate: string, endDate: string) => {
    if (!activeBook || !bookName) {
      return false;
    }

    if (startDate > endDate) {
      Alert.alert(AnnualReportCopy.customRangeInvalidMessage);
      return false;
    }

    setCustomRangeDraft(null);
    setIsDownloading(true);
    try {
      await downloadReportForPeriod(
        activeBook.id,
        bookName,
        buildCustomRangePeriod(startDate, endDate),
        onBeforeDownloadReport,
      );
      return true;
    } catch {
      Alert.alert(AnnualReportCopy.errorMessage);
      return false;
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    bookName,
    customRangeDraft,
    handleCloseCustomRangePicker,
    handleConfirmCustomRange,
    handleDownloadReport,
    isDownloading,
  };
}

async function selectAnnualReportPeriod(
  firstDate: string,
  lastDate: string,
  selectedYear: number,
  bookName: string,
  bookId: string,
  setCustomRangeDraft: (draft: CustomRangeDraft) => void,
  runDownloadReportForPeriod: (
    bookId: string,
    bookName: string,
    period: AnnualReportPeriod,
    onBeforeDownloadReport?: (() => Promise<void> | void) | null,
    setIsDownloading?: ((nextValue: boolean) => void) | null,
  ) => Promise<void>,
  onBeforeDownloadReport: (() => Promise<void> | void) | null,
  setIsDownloading: (nextValue: boolean) => void,
) {
  return new Promise<void>((resolve) => {
    Alert.alert(AnnualReportCopy.confirmTitle, AnnualReportCopy.optionTitle, [
      {
        style: "cancel",
        text: CommonActionCopy.close,
        onPress: () => resolve(),
      },
      {
        text: AnnualReportCopy.firstToLastOption,
        onPress: () => {
          void runDownloadReportForPeriod(
            bookId,
            bookName,
            buildFirstToLastPeriod(firstDate, lastDate),
            onBeforeDownloadReport,
            setIsDownloading,
          ).finally(resolve);
        },
      },
      {
        text: buildSelectedYearOptionLabel(selectedYear),
        onPress: () => {
          void runDownloadReportForPeriod(
            bookId,
            bookName,
            buildSelectedYearPeriod(selectedYear),
            onBeforeDownloadReport,
            setIsDownloading,
          ).finally(resolve);
        },
      },
      {
        text: AnnualReportCopy.customRangeOption,
        onPress: () => {
          resolve();
          InteractionManager.runAfterInteractions(() => {
            setCustomRangeDraft({
              endDate: lastDate,
              isOpen: true,
              startDate: firstDate,
            });
          });
        },
      },
    ]);
  });
}

async function downloadReportForPeriod(
  bookId: string,
  bookName: string,
  period: AnnualReportPeriod,
  onBeforeDownloadReport: (() => Promise<void> | void) | null = null,
) {
  const entries = await fetchLedgerEntries(bookId, period.dateFrom, period.dateTo);
  await confirmAndDownloadAnnualReport({
    bookName,
    entries,
    onBeforeDownload: onBeforeDownloadReport,
    period,
  });
}

async function runDownloadReportForPeriod(
  bookId: string,
  bookName: string,
  period: AnnualReportPeriod,
  onBeforeDownloadReport: (() => Promise<void> | void) | null = null,
  setIsDownloading: ((nextValue: boolean) => void) | null = null,
) {
  setIsDownloading?.(true);
  try {
    await downloadReportForPeriod(bookId, bookName, period, onBeforeDownloadReport);
  } finally {
    setIsDownloading?.(false);
  }
}
