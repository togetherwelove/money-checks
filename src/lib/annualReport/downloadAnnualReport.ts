import { Alert } from "react-native";

import { AnnualReportCopy, buildAnnualReportConfirmMessage } from "../../constants/annualReport";
import { CommonActionCopy } from "../../constants/commonActions";
import { appPlatform } from "../appPlatform";
import { showNativeToast } from "../nativeToast";
import { buildAnnualReportData } from "./annualReportData";
import { buildAnnualReportFileName, buildAnnualReportWorkbook } from "./annualReportWorkbook";

type DownloadAnnualReportParams = {
  bookName: string;
  entries: Parameters<typeof buildAnnualReportData>[1];
  year: number;
};

export async function confirmAndDownloadAnnualReport(params: DownloadAnnualReportParams) {
  const { bookName, entries, year } = params;
  const shouldDownload = await confirmAnnualReportDownload(year, bookName);
  if (!shouldDownload) {
    return false;
  }

  const report = buildAnnualReportData(bookName, entries, year);
  const workbook = buildAnnualReportWorkbook(report);
  const fileName = buildAnnualReportFileName(bookName, year);

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
    throw new Error(AnnualReportCopy.errorMessage);
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

  showNativeToast(AnnualReportCopy.successMessage);
  return true;
}

async function confirmAnnualReportDownload(year: number, bookName: string) {
  const message = buildAnnualReportConfirmMessage(year, bookName);
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
