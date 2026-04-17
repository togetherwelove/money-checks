import { AnnualReportCopy } from "../constants/annualReport";
import { IconActionButton } from "./IconActionButton";

type AnnualReportDownloadActionProps = {
  onPress: () => void;
};

export function AnnualReportDownloadAction({ onPress }: AnnualReportDownloadActionProps) {
  return (
    <IconActionButton
      accessibilityLabel={AnnualReportCopy.headerAccessibilityLabel}
      icon="download"
      onPress={onPress}
      size="compact"
    />
  );
}
