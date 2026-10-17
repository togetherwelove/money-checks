import { AnnualReportCopy as Copy, buildSelectedYearOptionLabel, type AnnualReportRangeMode } from "../../constants/annualReport";
import { ActionButton } from "../ActionButton";

export function AnnualReportPeriodOptions({ selectedYear, onSelect }: {
  selectedYear: number;
  onSelect: (mode: AnnualReportRangeMode) => Promise<boolean>;
}) {
  return (
    <>
      <ActionButton label={Copy.firstToLastOption} onPress={() => { void onSelect("first-to-last"); }} />
      <ActionButton label={buildSelectedYearOptionLabel(selectedYear)}
        onPress={() => { void onSelect("selected-year"); }} />
      <ActionButton label={Copy.customRangeOption} onPress={() => { void onSelect("custom-range"); }} />
    </>
  );
}
