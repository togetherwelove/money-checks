import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { AnnualReportCopy, type AnnualReportRangeMode } from "../constants/annualReport";
import { buildCustomRangePeriod, buildFirstToLastPeriod, buildSelectedYearPeriod, type AnnualReportPeriod } from "../lib/annualReport/annualReportPeriods";
import { confirmAndDownloadAnnualReport } from "../lib/annualReport/downloadAnnualReport";
import { fetchAnnualReportEntries } from "../lib/annualReport/fetchAnnualReportEntries";
import { fetchLedgerEntryDateBounds } from "../lib/ledgerEntries";
import type { LedgerBook } from "../types/ledgerBook";

type ReportSelection = {
  bookId: string;
  bookName: string;
  startDate: string;
  endDate: string;
  selectedYear: number;
};

type Params = {
  activeBook: LedgerBook | null;
  onBeforeDownloadReport?: (() => Promise<void> | void) | null;
  visibleMonth: Date;
};

export function useAnnualLedgerReportAction({ activeBook, onBeforeDownloadReport = null, visibleMonth }: Params) {
  const [periodSelection, setPeriodSelection] = useState<ReportSelection | null>(null);
  const [customRangeDraft, setCustomRangeDraft] = useState<(ReportSelection & { isOpen: boolean }) | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const activeBookId = useRef(activeBook?.id);
  activeBookId.current = activeBook?.id;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    setPeriodSelection(null);
    setCustomRangeDraft(null);
  }, [activeBook?.id]);

  const run = async (task: () => Promise<boolean>) => {
    if (busy.current) return false;
    busy.current = true;
    setIsDownloading(true);
    try {
      return await task();
    } catch {
      if (mounted.current) Alert.alert(AnnualReportCopy.errorMessage);
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) setIsDownloading(false);
    }
  };

  const handleDownloadReport = () => run(async () => {
    if (!activeBook) return false;
    const bounds = await fetchLedgerEntryDateBounds(activeBook.id);
    if (!mounted.current || activeBookId.current !== activeBook.id) return false;
    if (!bounds) {
      Alert.alert(AnnualReportCopy.noEntriesMessage);
      return false;
    }
    setPeriodSelection({ bookId: activeBook.id, bookName: activeBook.name,
      startDate: bounds.firstDate, endDate: bounds.lastDate, selectedYear: visibleMonth.getFullYear() });
    return true;
  });

  const download = (selection: ReportSelection, period: AnnualReportPeriod) => run(async () => {
    if (activeBookId.current !== selection.bookId) return false;
    const entries = await fetchAnnualReportEntries(selection.bookId, period.dateFrom, period.dateTo);
    if (!mounted.current || activeBookId.current !== selection.bookId) return false;
    const completed = await confirmAndDownloadAnnualReport({
      bookName: selection.bookName, entries, period, onBeforeDownload: onBeforeDownloadReport,
    });
    if (completed && mounted.current) setCustomRangeDraft(null);
    return completed;
  });

  const handleSelectPeriod = async (mode: AnnualReportRangeMode) => {
    if (!periodSelection || busy.current) return false;
    const selection = periodSelection;
    setPeriodSelection(null);
    if (mode === "custom-range") {
      setCustomRangeDraft({ ...selection, isOpen: true });
      return true;
    }
    return download(selection, mode === "first-to-last"
      ? buildFirstToLastPeriod(selection.startDate, selection.endDate)
      : buildSelectedYearPeriod(selection.selectedYear));
  };

  const handleConfirmCustomRange = async (startDate: string, endDate: string) => {
    if (!customRangeDraft || busy.current) return false;
    if (startDate > endDate) {
      Alert.alert(AnnualReportCopy.customRangeInvalidMessage);
      return false;
    }
    return download(customRangeDraft, buildCustomRangePeriod(startDate, endDate));
  };

  return {
    bookName: activeBook?.name ?? null,
    periodSelection,
    handleClosePeriodPicker: () => setPeriodSelection(null),
    handleSelectPeriod,
    customRangeDraft,
    handleCloseCustomRangePicker: () => { if (!busy.current) setCustomRangeDraft(null); },
    handleConfirmCustomRange,
    handleDownloadReport,
    isDownloading,
  };
}
