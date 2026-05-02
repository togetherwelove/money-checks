import * as XLSX from "xlsx";

import { AnnualReportCopy } from "../../constants/annualReport";
import { parseIsoDate } from "../../utils/calendar";
import type {
  AnnualReportCategoryRow,
  AnnualReportData,
  AnnualReportMemberRow,
  AnnualReportMonthRow,
} from "./annualReportData";
import { addAnnualReportXlsxCharts } from "./annualReportXlsxCharts";

type SheetCellValue = Date | number | string;

const LedgerSheetColumnWidths = [12, 10, 8, 22, 14, 14, 14, 14, 12, 12, 24, 8, 12, 18, 18, 22];
const MonthlySummaryColumnWidths = [14, 14, 14, 14, 10];
const CategorySummaryColumnWidths = [16, 14, 12, 10];
const MemberSummaryColumnWidths = [16, 14, 14, 14, 10];
const SummaryColumnWidths = [18, 18, 18];
const ChartSheetColumnWidths = Array.from({ length: 16 }, () => 12);
const CurrencyFormat = "#,##0";
const PercentFormat = "0%";
const DateFormat = "yyyy-mm-dd";

export function buildAnnualReportWorkbook(report: AnnualReportData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  appendTableSheet(
    workbook,
    AnnualReportCopy.ledgerSheetName,
    buildLedgerRows(report),
    LedgerSheetColumnWidths,
    { currencyColumns: [5, 6, 7], dateColumns: [0] },
  );
  appendTableSheet(
    workbook,
    AnnualReportCopy.monthlySummarySheetName,
    buildMonthlySummaryRows(report.monthlyRows),
    MonthlySummaryColumnWidths,
    { currencyColumns: [1, 2, 3] },
  );
  appendTableSheet(
    workbook,
    AnnualReportCopy.categorySummarySheetName,
    buildCategorySummaryRows(report),
    CategorySummaryColumnWidths,
    { currencyColumns: [1], percentColumns: [2] },
  );
  appendTableSheet(
    workbook,
    AnnualReportCopy.authorSummarySheetName,
    buildMemberSummaryRows(report.memberRows),
    MemberSummaryColumnWidths,
    { currencyColumns: [1, 2, 3] },
  );
  appendTableSheet(
    workbook,
    AnnualReportCopy.summarySheetName,
    buildSummaryRows(report),
    SummaryColumnWidths,
    { currencyColumns: [1] },
  );
  appendTableSheet(
    workbook,
    AnnualReportCopy.chartSheetName,
    [[`${report.bookName} 차트`]],
    ChartSheetColumnWidths,
  );

  return workbook;
}

export function writeAnnualReportWorkbook(report: AnnualReportData): Uint8Array {
  const workbookBuffer = XLSX.write(buildAnnualReportWorkbook(report), {
    bookType: "xlsx",
    compression: false,
    type: "array",
  });

  return addAnnualReportXlsxCharts(new Uint8Array(workbookBuffer), report);
}

export function buildAnnualReportFileName(
  bookName: string,
  dateFrom: string,
  dateTo: string,
): string {
  const normalizedBookName = bookName.replace(/[^\w가-힣-]+/g, "-");
  const normalizedDateFrom = dateFrom.replaceAll("-", "");
  const normalizedDateTo = dateTo.replaceAll("-", "");

  return `${normalizedBookName}-${normalizedDateFrom}-${normalizedDateTo}.xlsx`;
}

function appendTableSheet(
  workbook: XLSX.WorkBook,
  name: string,
  rows: SheetCellValue[][],
  widths: number[],
  options: {
    currencyColumns?: number[];
    dateColumns?: number[];
    percentColumns?: number[];
  } = {},
) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = widths.map((width) => ({ wch: width }));

  if (rows.length > 1 && rows[0]) {
    const lastColumn = XLSX.utils.encode_col(rows[0].length - 1);
    sheet["!autofilter"] = { ref: `A1:${lastColumn}${rows.length}` };
  }

  applyColumnFormat(sheet, rows.length, options.currencyColumns ?? [], CurrencyFormat);
  applyColumnFormat(sheet, rows.length, options.dateColumns ?? [], DateFormat);
  applyColumnFormat(sheet, rows.length, options.percentColumns ?? [], PercentFormat);

  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function buildLedgerRows(report: AnnualReportData): SheetCellValue[][] {
  const header = [
    "거래일",
    "연월",
    "유형",
    "내용",
    "분류",
    "수입",
    "지출",
    "수지",
    "담당자",
    "작성자",
    "메모",
    "증빙수",
    "분할",
    "등록일",
    "수정일",
    "거래ID",
  ];

  if (report.entries.length === 0) {
    return [header];
  }

  return [
    header,
    ...report.entries.map((entry) => [
      parseIsoDate(entry.date),
      entry.date.slice(0, 7),
      entry.type === "income" ? "수입" : "지출",
      entry.content || "-",
      entry.category,
      entry.type === "income" ? entry.amount : 0,
      entry.type === "expense" ? entry.amount : 0,
      entry.type === "income" ? entry.amount : -entry.amount,
      entry.targetMemberName || "-",
      entry.authorName || "-",
      entry.note || "-",
      entry.photoAttachments.length,
      buildInstallmentLabel(entry.installmentOrder, entry.installmentMonths),
      entry.createdAt ?? "-",
      entry.updatedAt ?? "-",
      entry.id,
    ]),
  ];
}

function buildMonthlySummaryRows(monthlyRows: AnnualReportMonthRow[]): SheetCellValue[][] {
  return [
    ["월", "수입", "지출", "수지", "건수"],
    ...monthlyRows.map((row) => [row.monthLabel, row.income, row.expense, row.balance, row.count]),
  ];
}

function buildCategorySummaryRows(report: AnnualReportData): SheetCellValue[][] {
  return [
    ["지출 분류", "지출", "비중", "건수"],
    ...buildCategoryRows(report.expenseCategories, "expense"),
    [],
    ["수입 분류", "수입", "비중", "건수"],
    ...buildCategoryRows(report.incomeCategories, "income"),
  ];
}

function buildMemberSummaryRows(memberRows: AnnualReportMemberRow[]): SheetCellValue[][] {
  return [
    ["담당자", "수입", "지출", "수지", "건수"],
    ...memberRows.map((row) => [row.memberName, row.income, row.expense, row.balance, row.count]),
  ];
}

function buildSummaryRows(report: AnnualReportData): SheetCellValue[][] {
  const topExpenseCategory = report.expenseCategories[0]?.category ?? "-";
  const topIncomeCategory = report.incomeCategories[0]?.category ?? "-";

  return [
    ["가계부", report.bookName],
    ["기간", report.periodLabel],
    ["생성일", report.generatedAtLabel],
    ["총수입", report.totalIncome],
    ["총지출", report.totalExpense],
    ["기간 수지", report.totalIncome - report.totalExpense],
    ["기록 건수", report.entries.length],
    ["주요 수입 분류", topIncomeCategory],
    ["주요 지출 분류", topExpenseCategory],
    ["안내", "모임 장부 정리와 공유를 위한 참고용 자료입니다."],
  ];
}

function buildCategoryRows(
  rows: AnnualReportCategoryRow[],
  type: "expense" | "income",
): SheetCellValue[][] {
  if (rows.length === 0) {
    return [[type === "income" ? "수입 없음" : "지출 없음", 0, 0, 0]];
  }

  return rows.map((row) => [row.category, row.amount, row.share, row.count]);
}

function buildInstallmentLabel(order?: number | null, months?: number | null) {
  if (!order || !months || months <= 1) {
    return "-";
  }

  return `${order}/${months}`;
}

function applyColumnFormat(
  sheet: XLSX.WorkSheet,
  rowCount: number,
  columnIndexes: number[],
  format: string,
) {
  for (const columnIndex of columnIndexes) {
    for (let rowIndex = 1; rowIndex < rowCount; rowIndex += 1) {
      const cellAddress = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex });
      const cell = sheet[cellAddress];
      if (cell) {
        cell.z = format;
      }
    }
  }
}
