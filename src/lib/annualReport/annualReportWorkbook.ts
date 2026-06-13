import { AnnualReportCopy } from "../../constants/annualReport";
import { parseIsoDate } from "../../utils/calendar";
import type {
  AnnualReportCategoryRow,
  AnnualReportData,
  AnnualReportMemberRow,
  AnnualReportMonthRow,
} from "./annualReportData";
import { addAnnualReportXlsxCharts } from "./annualReportXlsxCharts";
import { type XlsxZipEntry, encodeZipText, writeStoredZipEntries } from "./xlsxZip";

type SheetCellValue = Date | number | string;
type SheetFormat = "currency" | "percent";

type WorkbookSheet = {
  autoFilterRef: string | null;
  columnWidths: number[];
  formattedColumns: Map<number, SheetFormat>;
  name: string;
  rows: SheetCellValue[][];
};

const SpreadsheetNamespace = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RelationshipNamespace = "http://schemas.openxmlformats.org/package/2006/relationships";
const OfficeRelationshipNamespace =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const WorkbookRelationshipType =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument";
const WorksheetRelationshipType =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet";
const StylesRelationshipType =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles";
const XmlContentType = "application/xml";
const RelationshipsContentType = "application/vnd.openxmlformats-package.relationships+xml";
const WorkbookContentType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml";
const WorksheetContentType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml";
const StylesContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml";
const CurrencyStyleIndex = 1;
const PercentStyleIndex = 2;
const BuiltInCurrencyFormatId = 3;
const BuiltInPercentFormatId = 9;

const LedgerSheetColumnWidths = [12, 10, 8, 22, 14, 14, 14, 14, 12, 12, 24, 8, 12, 18, 18, 22];
const MonthlySummaryColumnWidths = [14, 14, 14, 14, 10];
const CategorySummaryColumnWidths = [16, 14, 12, 10];
const MemberSummaryColumnWidths = [16, 14, 14, 14, 10];
const SummaryColumnWidths = [18, 18, 18];
const ChartSheetColumnWidths = Array.from({ length: 16 }, () => 12);

export function writeAnnualReportWorkbook(report: AnnualReportData): Uint8Array {
  const workbookBytes = writeStoredZipEntries(buildAnnualReportWorkbookEntries(report));
  return addAnnualReportXlsxCharts(workbookBytes, report);
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

function buildAnnualReportWorkbookEntries(report: AnnualReportData): XlsxZipEntry[] {
  const sheets = buildWorkbookSheets(report);
  return [
    createTextEntry("[Content_Types].xml", buildContentTypesXml(sheets.length)),
    createTextEntry("_rels/.rels", buildRootRelationshipsXml()),
    createTextEntry("xl/workbook.xml", buildWorkbookXml(sheets)),
    createTextEntry("xl/_rels/workbook.xml.rels", buildWorkbookRelationshipsXml(sheets.length)),
    createTextEntry("xl/styles.xml", buildStylesXml()),
    ...sheets.map((sheet, index) =>
      createTextEntry(`xl/worksheets/sheet${index + 1}.xml`, buildWorksheetXml(sheet)),
    ),
  ];
}

function buildWorkbookSheets(report: AnnualReportData): WorkbookSheet[] {
  return [
    createSheet(AnnualReportCopy.ledgerSheetName, buildLedgerRows(report), LedgerSheetColumnWidths, {
      currencyColumns: [5, 6, 7],
    }),
    createSheet(
      AnnualReportCopy.monthlySummarySheetName,
      buildMonthlySummaryRows(report.monthlyRows),
      MonthlySummaryColumnWidths,
      { currencyColumns: [1, 2, 3] },
    ),
    createSheet(
      AnnualReportCopy.categorySummarySheetName,
      buildCategorySummaryRows(report),
      CategorySummaryColumnWidths,
      { currencyColumns: [1], percentColumns: [2] },
    ),
    createSheet(
      AnnualReportCopy.authorSummarySheetName,
      buildMemberSummaryRows(report.memberRows),
      MemberSummaryColumnWidths,
      { currencyColumns: [1, 2, 3] },
    ),
    createSheet(AnnualReportCopy.summarySheetName, buildSummaryRows(report), SummaryColumnWidths, {
      currencyColumns: [1],
    }),
    createSheet(
      AnnualReportCopy.chartSheetName,
      [[`${report.bookName} ${AnnualReportCopy.chartTitleSuffix}`]],
      ChartSheetColumnWidths,
    ),
  ];
}

function createSheet(
  name: string,
  rows: SheetCellValue[][],
  columnWidths: number[],
  options: {
    currencyColumns?: number[];
    percentColumns?: number[];
  } = {},
): WorkbookSheet {
  return {
    autoFilterRef: resolveAutoFilterRef(rows),
    columnWidths,
    formattedColumns: createFormattedColumnMap(options),
    name,
    rows,
  };
}

function createFormattedColumnMap(options: {
  currencyColumns?: number[];
  percentColumns?: number[];
}) {
  const formattedColumns = new Map<number, SheetFormat>();
  for (const columnIndex of options.currencyColumns ?? []) {
    formattedColumns.set(columnIndex, "currency");
  }
  for (const columnIndex of options.percentColumns ?? []) {
    formattedColumns.set(columnIndex, "percent");
  }
  return formattedColumns;
}

function resolveAutoFilterRef(rows: SheetCellValue[][]) {
  const header = rows[0];
  if (rows.length <= 1 || !header || header.length === 0) {
    return null;
  }
  return `A1:${encodeColumnName(header.length - 1)}${rows.length}`;
}

function buildLedgerRows(report: AnnualReportData): SheetCellValue[][] {
  const header = [...AnnualReportCopy.ledgerHeaders];

  if (report.entries.length === 0) {
    return [header];
  }

  return [
    header,
    ...report.entries.map((entry) => [
      parseIsoDate(entry.date),
      entry.date.slice(0, 7),
      entry.type === "income"
        ? AnnualReportCopy.typeLabels.income
        : AnnualReportCopy.typeLabels.expense,
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
    [...AnnualReportCopy.monthlySummaryHeaders],
    ...monthlyRows.map((row) => [row.monthLabel, row.income, row.expense, row.balance, row.count]),
  ];
}

function buildCategorySummaryRows(report: AnnualReportData): SheetCellValue[][] {
  return [
    [...AnnualReportCopy.expenseCategoryHeaders],
    ...buildCategoryRows(report.expenseCategories, "expense"),
    [],
    [...AnnualReportCopy.incomeCategoryHeaders],
    ...buildCategoryRows(report.incomeCategories, "income"),
  ];
}

function buildMemberSummaryRows(memberRows: AnnualReportMemberRow[]): SheetCellValue[][] {
  return [
    [...AnnualReportCopy.memberSummaryHeaders],
    ...memberRows.map((row) => [row.memberName, row.income, row.expense, row.balance, row.count]),
  ];
}

function buildSummaryRows(report: AnnualReportData): SheetCellValue[][] {
  const topExpenseCategory = report.expenseCategories[0]?.category ?? "-";
  const topIncomeCategory = report.incomeCategories[0]?.category ?? "-";

  return [
    [AnnualReportCopy.summaryRows.ledger, report.bookName],
    [AnnualReportCopy.summaryRows.period, report.periodLabel],
    [AnnualReportCopy.summaryRows.generatedAt, report.generatedAtLabel],
    [AnnualReportCopy.summaryRows.income, report.totalIncome],
    [AnnualReportCopy.summaryRows.expense, report.totalExpense],
    [AnnualReportCopy.summaryRows.balance, report.totalIncome - report.totalExpense],
    [AnnualReportCopy.summaryRows.entryCount, report.entries.length],
    [AnnualReportCopy.summaryRows.topIncomeCategory, topIncomeCategory],
    [AnnualReportCopy.summaryRows.topExpenseCategory, topExpenseCategory],
    [AnnualReportCopy.summaryRows.note, AnnualReportCopy.summaryRows.noteValue],
  ];
}

function buildCategoryRows(
  rows: AnnualReportCategoryRow[],
  type: "expense" | "income",
): SheetCellValue[][] {
  if (rows.length === 0) {
    return [[AnnualReportCopy.emptyCategoryLabels[type], 0, 0, 0]];
  }

  return rows.map((row) => [row.category, row.amount, row.share, row.count]);
}

function buildInstallmentLabel(order?: number | null, months?: number | null) {
  if (!order || !months || months <= 1) {
    return "-";
  }

  return `${order}/${months}`;
}

function buildContentTypesXml(sheetCount: number) {
  const worksheetOverrides = Array.from({ length: sheetCount }, (_, index) => {
    const sheetNumber = index + 1;
    return `<Override PartName="/xl/worksheets/sheet${sheetNumber}.xml" ContentType="${WorksheetContentType}"/>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="${RelationshipsContentType}"/><Default Extension="xml" ContentType="${XmlContentType}"/><Override PartName="/xl/workbook.xml" ContentType="${WorkbookContentType}"/><Override PartName="/xl/styles.xml" ContentType="${StylesContentType}"/>${worksheetOverrides}</Types>`;
}

function buildRootRelationshipsXml() {
  return buildRelationshipsXml([[WorkbookRelationshipType, "xl/workbook.xml", "rId1"]]);
}

function buildWorkbookRelationshipsXml(sheetCount: number) {
  const sheetRelationships = Array.from({ length: sheetCount }, (_, index) => {
    const sheetNumber = index + 1;
    return [WorksheetRelationshipType, `worksheets/sheet${sheetNumber}.xml`, `rId${sheetNumber}`] as [
      string,
      string,
      string,
    ];
  });

  return buildRelationshipsXml([
    ...sheetRelationships,
    [StylesRelationshipType, "styles.xml", `rId${sheetCount + 1}`],
  ]);
}

function buildRelationshipsXml(relationships: Array<[string, string, string]>) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${RelationshipNamespace}">${relationships
    .map(([type, target, id]) => `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`)
    .join("")}</Relationships>`;
}

function buildWorkbookXml(sheets: WorkbookSheet[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="${SpreadsheetNamespace}" xmlns:r="${OfficeRelationshipNamespace}"><sheets>${sheets
    .map(
      (sheet, index) =>
        `<sheet name="${escapeXmlAttribute(sheet.name)}" sheetId="${index + 1}" r:id="rId${
          index + 1
        }"/>`,
    )
    .join("")}</sheets></workbook>`;
}

function buildStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="${SpreadsheetNamespace}"><fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="${BuiltInCurrencyFormatId}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="${BuiltInPercentFormatId}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}

function buildWorksheetXml(sheet: WorkbookSheet) {
  const dimensionRef = resolveSheetDimension(sheet.rows);
  const columnXml = buildColumnXml(sheet.columnWidths);
  const rowXml = sheet.rows
    .map((row, rowIndex) => buildRowXml(row, rowIndex, sheet.formattedColumns))
    .join("");
  const autoFilterXml = sheet.autoFilterRef
    ? `<autoFilter ref="${escapeXmlAttribute(sheet.autoFilterRef)}"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="${SpreadsheetNamespace}" xmlns:r="${OfficeRelationshipNamespace}"><dimension ref="${dimensionRef}"/>${columnXml}<sheetData>${rowXml}</sheetData>${autoFilterXml}</worksheet>`;
}

function resolveSheetDimension(rows: SheetCellValue[][]) {
  const rowCount = Math.max(rows.length, 1);
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  return `A1:${encodeColumnName(columnCount - 1)}${rowCount}`;
}

function buildColumnXml(widths: number[]) {
  if (widths.length === 0) {
    return "";
  }

  return `<cols>${widths
    .map((width, index) => {
      const columnNumber = index + 1;
      return `<col min="${columnNumber}" max="${columnNumber}" width="${width}" customWidth="1"/>`;
    })
    .join("")}</cols>`;
}

function buildRowXml(
  row: SheetCellValue[],
  rowIndex: number,
  formattedColumns: Map<number, SheetFormat>,
) {
  const rowNumber = rowIndex + 1;
  const cells = row
    .map((value, columnIndex) =>
      buildCellXml(value, encodeCellReference(columnIndex, rowNumber), formattedColumns),
    )
    .join("");
  return `<row r="${rowNumber}">${cells}</row>`;
}

function buildCellXml(
  value: SheetCellValue,
  cellReference: string,
  formattedColumns: Map<number, SheetFormat>,
) {
  if (typeof value === "number") {
    return `<c r="${cellReference}"${resolveStyleAttribute(cellReference, formattedColumns)}><v>${value}</v></c>`;
  }

  const text = value instanceof Date ? formatDateCellValue(value) : value;
  return `<c r="${cellReference}" t="inlineStr"><is><t>${escapeXmlText(text)}</t></is></c>`;
}

function resolveStyleAttribute(cellReference: string, formattedColumns: Map<number, SheetFormat>) {
  const columnIndex = decodeColumnIndex(cellReference);
  const format = formattedColumns.get(columnIndex);
  if (format === "currency") {
    return ` s="${CurrencyStyleIndex}"`;
  }
  if (format === "percent") {
    return ` s="${PercentStyleIndex}"`;
  }
  return "";
}

function formatDateCellValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function encodeCellReference(columnIndex: number, rowNumber: number) {
  return `${encodeColumnName(columnIndex)}${rowNumber}`;
}

function encodeColumnName(columnIndex: number) {
  let dividend = columnIndex + 1;
  let columnName = "";

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
}

function decodeColumnIndex(cellReference: string) {
  const columnName = cellReference.match(/^[A-Z]+/)?.[0] ?? "A";
  return [...columnName].reduce(
    (columnIndex, character) => columnIndex * 26 + character.charCodeAt(0) - 64,
    0,
  ) - 1;
}

function createTextEntry(name: string, text: string): XlsxZipEntry {
  return {
    data: encodeZipText(text),
    name,
  };
}

function escapeXmlText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXmlAttribute(value: string) {
  return escapeXmlText(value).replace(/"/g, "&quot;");
}
