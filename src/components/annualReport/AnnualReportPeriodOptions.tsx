import {
  AnnualReportCopy as Copy,
  buildSelectedYearOptionLabel,
  type AnnualReportRangeMode,
} from "../../constants/annualReport";
import { SettingsGroup } from "../appSettings/SettingsGroup";
import { SettingsRow } from "../appSettings/SettingsRow";

export function AnnualReportPeriodOptions({
  selectedYear,
  onSelect,
}: {
  selectedYear: number;
  onSelect: (mode: AnnualReportRangeMode) => Promise<boolean>;
}) {
  return (
    <SettingsGroup>
      <SettingsRow
        label={Copy.firstToLastOption}
        onPress={() => {
          void onSelect("first-to-last");
        }}
      />
      <SettingsRow
        label={buildSelectedYearOptionLabel(selectedYear)}
        onPress={() => {
          void onSelect("selected-year");
        }}
      />
      <SettingsRow
        label={Copy.customRangeOption}
        onPress={() => {
          void onSelect("custom-range");
        }}
      />
    </SettingsGroup>
  );
}
