import * as XLSX from "xlsx";

import { AnnualReportCopy, AnnualReportUi } from "../../constants/annualReport";
import type { LedgerEntry } from "../../types/ledger";
import { formatCurrency } from "../../utils/calendar";
import type {
  AnnualReportCategoryRow,
  AnnualReportData,
  AnnualReportMonthRow,
} from "./annualReportData";
import { formatSignedReportAmount } from "./annualReportData";

export function buildAnnualReportWorkbook(report: AnnualReportData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  appendSheet(
    workbook,
    AnnualReportCopy.monthlyDetailSheetName,
    buildMonthlyDetailRows(report),
    [14, 14, 10, 18, 14, 14, 24, 14],
  );
  appendSheet(
    workbook,
    AnnualReportCopy.monthlyChartSheetName,
    buildMonthlyChartRows(report.monthlyRows),
    [14, 14, 16, 14, 16, 14],
  );
  appendSheet(
    workbook,
    AnnualReportCopy.yearlySummarySheetName,
    buildPeriodSummaryRows(report),
    [18, 18, 18],
  );
  appendSheet(
    workbook,
    AnnualReportCopy.yearlyChartSheetName,
    buildPeriodChartRows(report),
    [16, 14, 12, 18],
  );

  return workbook;
}

export function buildAnnualReportFileName(
  bookName: string,
  dateFrom: string,
  dateTo: string,
  fileNameSuffix: string,
): string {
  const normalizedBookName = bookName.replace(/[^\w가-힣-]+/g, "-");
  const normalizedDateFrom = dateFrom.replaceAll("-", "");
  const normalizedDateTo = dateTo.replaceAll("-", "");

  return `${AnnualReportUi.fileNamePrefix}-${normalizedBookName}-${normalizedDateFrom}-${normalizedDateTo}-${fileNameSuffix}.xlsx`;
}

function appendSheet(
  workbook: XLSX.WorkBook,
  name: string,
  rows: Array<Array<string | number>>,
  widths: number[],
) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = widths.map((width) => ({ wch: width }));
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function buildMonthlyDetailRows(report: AnnualReportData) {
  const rows: Array<Array<string | number>> = [
    [`${report.bookName} 월별 기록`],
    [],
    ["기간", report.periodLabel],
    [],
    ["월", "날짜", "구분", "내용", "분류", "금액", "메모", "작성자"],
  ];

  if (report.entries.length === 0) {
    rows.push(["-", "-", "-", "-", "-", "-", "기록이 없습니다."]);
    return rows;
  }

  for (const entry of report.entries) {
    rows.push([
      entry.date.slice(0, 7),
      entry.date,
      entry.type === "income" ? "수입" : "지출",
      entry.content || "-",
      entry.category,
      formatSignedReportAmount(entry.amount, entry.type),
      entry.note || "-",
      entry.authorName || "-",
    ]);
  }

  return rows;
}

function buildMonthlyChartRows(monthlyRows: AnnualReportMonthRow[]) {
  const maxIncome = Math.max(...monthlyRows.map((row) => row.income), 1);
  const maxExpense = Math.max(...monthlyRows.map((row) => row.expense), 1);

  return [
    ["월", "총수입", "수입 막대", "총지출", "지출 막대", "수지"],
    ...monthlyRows.map((row) => [
      row.monthLabel,
      formatSignedReportAmount(row.income, "income"),
      buildBar(row.income, maxIncome),
      formatSignedReportAmount(row.expense, "expense"),
      buildBar(row.expense, maxExpense),
      formatCurrency(row.balance),
    ]),
  ];
}

function buildPeriodSummaryRows(report: AnnualReportData) {
  const topExpenseCategory = report.expenseCategories[0]?.category ?? "-";
  const topIncomeCategory = report.incomeCategories[0]?.category ?? "-";

  return [
    [`${report.bookName} 기간 종합`],
    [],
    ["기간", report.periodLabel],
    ["생성일", report.generatedAtLabel],
    ["총수입", formatSignedReportAmount(report.totalIncome, "income")],
    ["총지출", formatSignedReportAmount(report.totalExpense, "expense")],
    ["기간 수지", formatCurrency(report.totalIncome - report.totalExpense)],
    ["기록 건수", report.entries.length],
    ["주요 수입 분류", topIncomeCategory],
    ["주요 지출 분류", topExpenseCategory],
  ];
}

function buildPeriodChartRows(report: AnnualReportData) {
  return [
    [`${report.bookName} 기간 차트`],
    [],
    ["지출 분류", "금액", "비중", "막대"],
    ...buildCategoryChartRows(report.expenseCategories),
    [],
    ["수입 분류", "금액", "비중", "막대"],
    ...buildCategoryChartRows(report.incomeCategories),
  ];
}

function buildCategoryChartRows(rows: AnnualReportCategoryRow[]) {
  const maxAmount = Math.max(...rows.map((row) => row.amount), 1);

  if (rows.length === 0) {
    return [["-", "-", "-", "-"]];
  }

  return rows.map((row) => [
    row.category,
    formatSignedReportAmount(row.amount, row.type),
    `${Math.round(row.share * 100)}%`,
    buildBar(row.amount, maxAmount),
  ]);
}

function buildBar(amount: number, maxAmount: number) {
  const units = Math.max(
    amount > 0 ? 1 : 0,
    Math.round((amount / maxAmount) * AnnualReportUi.chartBarLength),
  );
  return AnnualReportUi.chartBarCharacter.repeat(units);
}
