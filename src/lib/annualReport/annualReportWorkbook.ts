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
    buildMonthlyDetailRows(report.bookName, report.entries, report.year),
    [8, 13, 10, 14, 14, 24, 14],
  );
  appendSheet(
    workbook,
    AnnualReportCopy.monthlyChartSheetName,
    buildMonthlyChartRows(report.monthlyRows),
    [8, 14, 16, 14, 16, 14],
  );
  appendSheet(
    workbook,
    AnnualReportCopy.yearlySummarySheetName,
    buildYearlySummaryRows(report),
    [18, 18, 18],
  );
  appendSheet(
    workbook,
    AnnualReportCopy.yearlyChartSheetName,
    buildYearlyChartRows(report),
    [16, 14, 12, 18],
  );

  return workbook;
}

export function buildAnnualReportFileName(bookName: string, year: number): string {
  const normalizedBookName = bookName.replace(/[^\w가-힣.-]+/g, "-");
  return `${AnnualReportUi.fileNamePrefix}-${normalizedBookName}-${year}.xlsx`;
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

function buildMonthlyDetailRows(bookName: string, entries: LedgerEntry[], year: number) {
  const rows: Array<Array<string | number>> = [
    [`${year}년 ${bookName} 월별 내역`],
    [],
    ["월", "날짜", "구분", "분류", "금액", "메모", "작성자"],
  ];

  if (entries.length === 0) {
    rows.push(["-", "-", "-", "-", "-", "내역이 없습니다.", "-"]);
    return rows;
  }

  for (const entry of entries) {
    rows.push([
      `${Number(entry.date.slice(5, 7))}월`,
      entry.date,
      entry.type === "income" ? "수입" : "지출",
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

function buildYearlySummaryRows(report: AnnualReportData) {
  const topExpenseCategory = report.expenseCategories[0]?.category ?? "-";
  const topIncomeCategory = report.incomeCategories[0]?.category ?? "-";

  return [
    [`${report.year}년 ${report.bookName} 연간 종합`],
    [],
    ["생성일", report.generatedAtLabel],
    ["총수입", formatSignedReportAmount(report.totalIncome, "income")],
    ["총지출", formatSignedReportAmount(report.totalExpense, "expense")],
    ["연간 수지", formatCurrency(report.totalIncome - report.totalExpense)],
    ["기록 건수", report.entries.length],
    ["주요 수입 분류", topIncomeCategory],
    ["주요 지출 분류", topExpenseCategory],
  ];
}

function buildYearlyChartRows(report: AnnualReportData) {
  const rows: Array<Array<string | number>> = [
    [`${report.year}년 ${report.bookName} 연간 차트`],
    [],
    ["지출 분류", "금액", "비율", "막대"],
    ...buildCategoryChartRows(report.expenseCategories),
    [],
    ["수입 분류", "금액", "비율", "막대"],
    ...buildCategoryChartRows(report.incomeCategories),
  ];

  return rows;
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
