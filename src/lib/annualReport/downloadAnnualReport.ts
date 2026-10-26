import { Alert } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { AnnualReportCopy } from "../../constants/annualReport";
import { formatCurrency } from "../../utils/currency";
import { showNativeToast } from "../nativeToast";
import { buildAnnualReportData, type AnnualReportData } from "./annualReportData";
import type { AnnualReportPeriod } from "./annualReportPeriods";
import { buildAnnualReportFileName, writeAnnualReportWorkbook } from "./annualReportWorkbook";

type DownloadAnnualReportParams = {
  bookName: string;
  entries: Parameters<typeof buildAnnualReportData>[1];
  onBeforeDownload?: (() => Promise<void> | void) | null;
  period: AnnualReportPeriod;
};

export async function confirmAndDownloadAnnualReport(params: DownloadAnnualReportParams) {
  const { bookName, entries, onBeforeDownload = null, period } = params;
  const report = buildAnnualReportData(bookName, entries, period.dateFrom, period.dateTo);
  if (!report.entries.length) {
    Alert.alert(AnnualReportCopy.emptyPeriodMessage);
    return false;
  }
  if (!(await Sharing.isAvailableAsync())) {
    Alert.alert(AnnualReportCopy.sharingUnavailableMessage);
    return false;
  }
  const shouldDownload = await confirmAnnualReportDownload(report);
  if (!shouldDownload) {
    return false;
  }

  await onBeforeDownload?.();

  const fileName = buildAnnualReportFileName(bookName, period.dateFrom, period.dateTo);
  const workbookBytes = writeAnnualReportWorkbook(report);

  const reportFile = new File(Paths.cache, fileName);

  reportFile.create({ overwrite: true });
  await reportFile.write(workbookBytes);

  await Sharing.shareAsync(reportFile.uri, {
      dialogTitle: fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      UTI: "org.openxmlformats.spreadsheetml.sheet",
  });

  showNativeToast(AnnualReportCopy.successMessage);
  return true;
}

async function confirmAnnualReportDownload(report: AnnualReportData) {
  const labels = AnnualReportCopy.summaryRows;
  const message = [report.bookName, report.periodLabel, "",
    `${labels.entryCount}: ${report.entries.length.toLocaleString()}건`,
    `${labels.income}: ${formatCurrency(report.totalIncome)}`,
    `${labels.expense}: ${formatCurrency(report.totalExpense)}`,
    `${labels.balance}: ${formatCurrency(report.totalIncome - report.totalExpense)}`,
  ].join("\n");

  return new Promise<boolean>((resolve) => {
    Alert.alert(AnnualReportCopy.previewTitle, message, [
      {
        style: "cancel",
        text: AnnualReportCopy.cancelAction,
        onPress: () => resolve(false),
      },
      {
        text: AnnualReportCopy.downloadAction,
        onPress: () => resolve(true),
      },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}
