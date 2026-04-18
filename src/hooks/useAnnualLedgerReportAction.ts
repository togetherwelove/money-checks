import { useMemo, useState } from "react";
import { Alert } from "react-native";

import { AnnualReportCopy, buildSelectedYearOptionLabel } from "../constants/annualReport";
import { CommonActionCopy } from "../constants/commonActions";
import {
  type AnnualReportPeriod,
  buildCustomRangePeriod,
  buildFirstToLastPeriod,
  buildSelectedYearPeriod,
} from "../lib/annualReport/annualReportPeriods";
import { confirmAndDownloadAnnualReport } from "../lib/annualReport/downloadAnnualReport";
import { appPlatform } from "../lib/appPlatform";
import { fetchLedgerEntries, fetchLedgerEntryDateBounds } from "../lib/ledgerEntries";
import type { LedgerBook } from "../types/ledgerBook";

type UseAnnualLedgerReportActionParams = {
  activeBook: LedgerBook | null;
  onAfterDownloadReport?: (() => Promise<void> | void) | null;
  visibleMonth: Date;
};

type CustomRangeDraft = {
  endDate: string;
  isOpen: boolean;
  startDate: string;
};

export function useAnnualLedgerReportAction({
  activeBook,
  onAfterDownloadReport = null,
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

    setIsDownloading(true);
    try {
      const dateBounds = await fetchLedgerEntryDateBounds(activeBook.id);
      if (!dateBounds) {
        Alert.alert(AnnualReportCopy.noEntriesMessage);
        return;
      }

      const selectedYear = visibleMonth.getFullYear();
      if (appPlatform.isWeb) {
        const reportPeriod = selectAnnualReportPeriodOnWeb(
          dateBounds.firstDate,
          dateBounds.lastDate,
          selectedYear,
        );
        if (reportPeriod) {
          await downloadReportForPeriod(
            activeBook.id,
            bookName,
            reportPeriod,
            onAfterDownloadReport,
          );
        }
        return;
      }

      await selectAnnualReportPeriodOnNative(
        dateBounds.firstDate,
        dateBounds.lastDate,
        selectedYear,
        bookName,
        activeBook.id,
        setCustomRangeDraft,
        downloadReportForPeriod,
        onAfterDownloadReport,
      );
    } catch {
      Alert.alert(AnnualReportCopy.errorMessage);
    } finally {
      setIsDownloading(false);
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
        onAfterDownloadReport,
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

function selectAnnualReportPeriodOnWeb(firstDate: string, lastDate: string, selectedYear: number) {
  const selectedValue = window.prompt(
    `1. ${AnnualReportCopy.firstToLastOption}\n2. ${buildSelectedYearOptionLabel(selectedYear)}\n3. ${AnnualReportCopy.customRangeOption}`,
    "2",
  );

  if (selectedValue === "1") {
    return buildFirstToLastPeriod(firstDate, lastDate);
  }

  if (selectedValue === "2") {
    return buildSelectedYearPeriod(selectedYear);
  }

  if (selectedValue === "3") {
    const startDate = window.prompt(AnnualReportCopy.rangeStartLabel, firstDate);
    const endDate = window.prompt(AnnualReportCopy.rangeEndLabel, lastDate);
    if (!startDate || !endDate || startDate > endDate) {
      return null;
    }
    return buildCustomRangePeriod(startDate, endDate);
  }

  return null;
}

async function selectAnnualReportPeriodOnNative(
  firstDate: string,
  lastDate: string,
  selectedYear: number,
  bookName: string,
  bookId: string,
  setCustomRangeDraft: (draft: CustomRangeDraft) => void,
  downloadReportForPeriod: (
    bookId: string,
    bookName: string,
    period: AnnualReportPeriod,
    onAfterDownloadReport?: (() => Promise<void> | void) | null,
  ) => Promise<void>,
  onAfterDownloadReport: (() => Promise<void> | void) | null,
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
          void downloadReportForPeriod(
            bookId,
            bookName,
            buildFirstToLastPeriod(firstDate, lastDate),
            onAfterDownloadReport,
          ).finally(resolve);
        },
      },
      {
        text: buildSelectedYearOptionLabel(selectedYear),
        onPress: () => {
          void downloadReportForPeriod(
            bookId,
            bookName,
            buildSelectedYearPeriod(selectedYear),
            onAfterDownloadReport,
          ).finally(resolve);
        },
      },
      {
        text: AnnualReportCopy.customRangeOption,
        onPress: () => {
          setCustomRangeDraft({
            endDate: lastDate,
            isOpen: true,
            startDate: firstDate,
          });
          resolve();
        },
      },
    ]);
  });
}

async function downloadReportForPeriod(
  bookId: string,
  bookName: string,
  period: AnnualReportPeriod,
  onAfterDownloadReport: (() => Promise<void> | void) | null = null,
) {
  const entries = await fetchLedgerEntries(bookId, period.dateFrom, period.dateTo);
  await confirmAndDownloadAnnualReport({
    bookName,
    entries,
    period,
  });
  await onAfterDownloadReport?.();
}
