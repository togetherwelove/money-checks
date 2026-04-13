import { Alert } from "react-native";

import { AnnualReportCopy, buildAnnualReportConfirmMessage } from "../../constants/annualReport";
import { CommonActionCopy } from "../../constants/commonActions";
import { appPlatform } from "../appPlatform";
import { showNativeToast } from "../nativeToast";
import { buildAnnualReportData } from "./annualReportData";
import type { AnnualReportPeriod } from "./annualReportPeriods";
import { buildAnnualReportFileName, buildAnnualReportWorkbook } from "./annualReportWorkbook";

type DownloadAnnualReportParams = {
  bookName: string;
  entries: Parameters<typeof buildAnnualReportData>[1];
  period: AnnualReportPeriod;
};

export async function confirmAndDownloadAnnualReport(params: DownloadAnnualReportParams) {
  const { bookName, entries, period } = params;
  const shouldDownload = await confirmAnnualReportDownload(bookName, period.periodLabel);
  if (!shouldDownload) {
    return false;
  }

  const report = buildAnnualReportData(bookName, entries, period.dateFrom, period.dateTo);
  const workbook = buildAnnualReportWorkbook(report);
  const fileName = buildAnnualReportFileName(
    bookName,
    period.dateFrom,
    period.dateTo,
    period.fileNameSuffix,
  );

  if (appPlatform.isWeb) {
    const XLSX = await import("xlsx");
    XLSX.writeFile(workbook, fileName, { bookType: "xlsx" });
    return true;
  }

  const XLSX = await import("xlsx");
  const fileSystem = (await import("expo-file-system")) as unknown as {
    File: new (
      ...segments: string[]
    ) => {
      create: (options?: { overwrite?: boolean }) => void;
      uri: string;
      write: (content: Uint8Array) => void;
    };
    Paths: {
      cache: string;
    };
  };
  const Sharing = await import("expo-sharing");
  const reportFile = new fileSystem.File(fileSystem.Paths.cache, fileName);
  const workbookBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  reportFile.create({ overwrite: true });
  reportFile.write(new Uint8Array(workbookBuffer));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(reportFile.uri, {
      dialogTitle: fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      UTI: "org.openxmlformats.spreadsheetml.sheet",
    });
  }

  showNativeToast(AnnualReportCopy.successMessage);
  return true;
}

async function confirmAnnualReportDownload(bookName: string, periodLabel: string) {
  const message = `${buildAnnualReportConfirmMessage(bookName)}\n\n${periodLabel}`;
  if (appPlatform.isWeb) {
    return window.confirm(message);
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(AnnualReportCopy.confirmTitle, message, [
      {
        style: "cancel",
        text: CommonActionCopy.cancel,
        onPress: () => resolve(false),
      },
      {
        text: AnnualReportCopy.downloadAction,
        onPress: () => resolve(true),
      },
    ]);
  });
}
