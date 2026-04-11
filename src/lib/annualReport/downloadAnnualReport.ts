import { Alert } from "react-native";

import { buildAnnualReportConfirmMessage } from "../../constants/annualReport";
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
  const FileSystem = await import("expo-file-system/legacy");
  const Sharing = await import("expo-sharing");
  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) {
    throw new Error("보고서를 만들지 못했습니다.");
  }
  const fileUri = `${cacheDirectory}${fileName}`;
  const base64 = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      dialogTitle: fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      UTI: "org.openxmlformats.spreadsheetml.sheet",
    });
  }

  showNativeToast("보고서를 준비했습니다.");
  return true;
}

async function confirmAnnualReportDownload(bookName: string, periodLabel: string) {
  const message = `${buildAnnualReportConfirmMessage(bookName)}\n\n${periodLabel}`;
  if (appPlatform.isWeb) {
    return window.confirm(message);
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert("보고서를 다운로드할까요?", message, [
      {
        style: "cancel",
        text: CommonActionCopy.cancel,
        onPress: () => resolve(false),
      },
      {
        text: "다운로드",
        onPress: () => resolve(true),
      },
    ]);
  });
}
