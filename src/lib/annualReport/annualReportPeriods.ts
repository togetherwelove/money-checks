import {
  type AnnualReportRangeMode,
  buildSelectedYearOptionLabel,
} from "../../constants/annualReport";

export type AnnualReportPeriod = {
  dateFrom: string;
  dateTo: string;
  mode: AnnualReportRangeMode;
  optionLabel: string;
  periodLabel: string;
};

export function buildFirstToLastPeriod(firstDate: string, lastDate: string): AnnualReportPeriod {
  return {
    dateFrom: firstDate,
    dateTo: lastDate,
    mode: "first-to-last",
    optionLabel: "최초 - 마지막 등록 날짜",
    periodLabel: `${firstDate} ~ ${lastDate}`,
  };
}

export function buildSelectedYearPeriod(selectedYear: number): AnnualReportPeriod {
  const dateFrom = `${selectedYear}-01-01`;
  const dateTo = `${selectedYear}-12-31`;

  return {
    dateFrom,
    dateTo,
    mode: "selected-year",
    optionLabel: buildSelectedYearOptionLabel(selectedYear),
    periodLabel: `${dateFrom} ~ ${dateTo}`,
  };
}

export function buildCustomRangePeriod(dateFrom: string, dateTo: string): AnnualReportPeriod {
  return {
    dateFrom,
    dateTo,
    mode: "custom-range",
    optionLabel: "기간 직접 선택",
    periodLabel: `${dateFrom} ~ ${dateTo}`,
  };
}
