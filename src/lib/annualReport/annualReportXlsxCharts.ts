import { AnnualReportCopy } from "../../constants/annualReport";
import type { AnnualReportData } from "./annualReportData";
import {
  type XlsxZipEntry,
  decodeZipText,
  encodeZipText,
  readStoredZipEntries,
  writeStoredZipEntries,
} from "./xlsxZip";

const ContentTypesPath = "[Content_Types].xml";
const SheetRelationshipType =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing";
const DrawingRelationshipType =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart";
const DrawingContentType = "application/vnd.openxmlformats-officedocument.drawing+xml";
const ChartContentType = "application/vnd.openxmlformats-officedocument.drawingml.chart+xml";
const ChartSheetIndex = 6;
const MonthlyDataFirstRow = 2;
const CategoryExpenseHeaderRow = 1;
const CategoryDataFirstRow = 2;
const MemberDataFirstRow = 2;
const DrawingEmuOffset = 0;
const MonthlyChartCategoryAxisId = 60010001;
const MonthlyChartValueAxisId = 60010002;
const ExpenseCategoryChartCategoryAxisId = 60020001;
const ExpenseCategoryChartValueAxisId = 60020002;
const IncomeCategoryChartCategoryAxisId = 60030001;
const IncomeCategoryChartValueAxisId = 60030002;
const MemberChartCategoryAxisId = 60040001;
const MemberChartValueAxisId = 60040002;

type ChartPlacement = {
  fromColumn: number;
  fromRow: number;
  name: string;
  relationshipId: string;
  toColumn: number;
  toRow: number;
};

type SeriesReference = {
  titleCell: string;
  valueRange: string;
};

export function addAnnualReportXlsxCharts(bytes: Uint8Array, report: AnnualReportData): Uint8Array {
  const entryMap = new Map(readStoredZipEntries(bytes).map((entry) => [entry.name, entry]));

  upsertTextEntry(
    entryMap,
    ContentTypesPath,
    addContentTypeOverrides(getTextEntry(entryMap, ContentTypesPath), [
      ["/xl/drawings/drawing1.xml", DrawingContentType],
      ["/xl/charts/chart1.xml", ChartContentType],
      ["/xl/charts/chart2.xml", ChartContentType],
      ["/xl/charts/chart3.xml", ChartContentType],
      ["/xl/charts/chart4.xml", ChartContentType],
    ]),
  );

  addDrawingToWorksheet(entryMap, ChartSheetIndex, "drawing1.xml");

  upsertTextEntry(
    entryMap,
    "xl/drawings/drawing1.xml",
    buildDrawingXml([
      createPlacement(0, 0, 8, 18, "월별 수입 지출", "rId1"),
      createPlacement(8, 0, 16, 18, "지출 분류", "rId2"),
      createPlacement(0, 18, 8, 36, "수입 분류", "rId3"),
      createPlacement(8, 18, 16, 36, "담당자별 수입 지출", "rId4"),
    ]),
  );
  upsertTextEntry(
    entryMap,
    "xl/drawings/_rels/drawing1.xml.rels",
    buildRelationshipsXml([
      [DrawingRelationshipType, "../charts/chart1.xml", "rId1"],
      [DrawingRelationshipType, "../charts/chart2.xml", "rId2"],
      [DrawingRelationshipType, "../charts/chart3.xml", "rId3"],
      [DrawingRelationshipType, "../charts/chart4.xml", "rId4"],
    ]),
  );

  const categoryLayout = getCategorySummaryLayout(report);
  upsertTextEntry(entryMap, "xl/charts/chart1.xml", buildMonthlyChartXml(report));
  upsertTextEntry(entryMap, "xl/charts/chart2.xml", buildExpenseCategoryChartXml(categoryLayout));
  upsertTextEntry(entryMap, "xl/charts/chart3.xml", buildIncomeCategoryChartXml(categoryLayout));
  upsertTextEntry(entryMap, "xl/charts/chart4.xml", buildMemberChartXml(report));

  return writeStoredZipEntries([...entryMap.values()]);
}

function buildMonthlyChartXml(report: AnnualReportData) {
  const lastRow = Math.max(MonthlyDataFirstRow, report.monthlyRows.length + 1);
  const sheetName = AnnualReportCopy.monthlySummarySheetName;

  return buildBarChartXml({
    axisIds: [MonthlyChartCategoryAxisId, MonthlyChartValueAxisId],
    barDirection: "col",
    categoriesRange: buildSheetRange(sheetName, "A", MonthlyDataFirstRow, "A", lastRow),
    series: [
      {
        titleCell: buildSheetRange(sheetName, "B", 1, "B", 1),
        valueRange: buildSheetRange(sheetName, "B", MonthlyDataFirstRow, "B", lastRow),
      },
      {
        titleCell: buildSheetRange(sheetName, "C", 1, "C", 1),
        valueRange: buildSheetRange(sheetName, "C", MonthlyDataFirstRow, "C", lastRow),
      },
    ],
    title: "월별 수입과 지출",
  });
}

function buildExpenseCategoryChartXml(layout: ReturnType<typeof getCategorySummaryLayout>) {
  const sheetName = AnnualReportCopy.categorySummarySheetName;

  return buildBarChartXml({
    axisIds: [ExpenseCategoryChartCategoryAxisId, ExpenseCategoryChartValueAxisId],
    barDirection: "bar",
    categoriesRange: buildSheetRange(
      sheetName,
      "A",
      layout.expenseFirstRow,
      "A",
      layout.expenseLastRow,
    ),
    series: [
      {
        titleCell: buildSheetRange(
          sheetName,
          "B",
          CategoryExpenseHeaderRow,
          "B",
          CategoryExpenseHeaderRow,
        ),
        valueRange: buildSheetRange(
          sheetName,
          "B",
          layout.expenseFirstRow,
          "B",
          layout.expenseLastRow,
        ),
      },
    ],
    title: "지출 분류별 금액",
  });
}

function buildIncomeCategoryChartXml(layout: ReturnType<typeof getCategorySummaryLayout>) {
  const sheetName = AnnualReportCopy.categorySummarySheetName;

  return buildBarChartXml({
    axisIds: [IncomeCategoryChartCategoryAxisId, IncomeCategoryChartValueAxisId],
    barDirection: "bar",
    categoriesRange: buildSheetRange(
      sheetName,
      "A",
      layout.incomeFirstRow,
      "A",
      layout.incomeLastRow,
    ),
    series: [
      {
        titleCell: buildSheetRange(
          sheetName,
          "B",
          layout.incomeHeaderRow,
          "B",
          layout.incomeHeaderRow,
        ),
        valueRange: buildSheetRange(
          sheetName,
          "B",
          layout.incomeFirstRow,
          "B",
          layout.incomeLastRow,
        ),
      },
    ],
    title: "수입 분류별 금액",
  });
}

function buildMemberChartXml(report: AnnualReportData) {
  const lastRow = Math.max(MemberDataFirstRow, report.memberRows.length + 1);
  const sheetName = AnnualReportCopy.authorSummarySheetName;

  return buildBarChartXml({
    axisIds: [MemberChartCategoryAxisId, MemberChartValueAxisId],
    barDirection: "bar",
    categoriesRange: buildSheetRange(sheetName, "A", MemberDataFirstRow, "A", lastRow),
    series: [
      {
        titleCell: buildSheetRange(sheetName, "B", 1, "B", 1),
        valueRange: buildSheetRange(sheetName, "B", MemberDataFirstRow, "B", lastRow),
      },
      {
        titleCell: buildSheetRange(sheetName, "C", 1, "C", 1),
        valueRange: buildSheetRange(sheetName, "C", MemberDataFirstRow, "C", lastRow),
      },
    ],
    title: "담당자별 수입과 지출",
  });
}

function getCategorySummaryLayout(report: AnnualReportData) {
  const expenseRowCount = Math.max(report.expenseCategories.length, 1);
  const incomeRowCount = Math.max(report.incomeCategories.length, 1);
  const expenseFirstRow = CategoryDataFirstRow;
  const expenseLastRow = expenseFirstRow + expenseRowCount - 1;
  const incomeHeaderRow = expenseLastRow + 2;
  const incomeFirstRow = incomeHeaderRow + 1;
  const incomeLastRow = incomeFirstRow + incomeRowCount - 1;

  return {
    expenseFirstRow,
    expenseLastRow,
    incomeFirstRow,
    incomeHeaderRow,
    incomeLastRow,
  };
}

function addDrawingToWorksheet(
  entryMap: Map<string, XlsxZipEntry>,
  sheetIndex: number,
  drawingFileName: string,
) {
  const sheetPath = `xl/worksheets/sheet${sheetIndex}.xml`;
  const relationshipPath = `xl/worksheets/_rels/sheet${sheetIndex}.xml.rels`;
  const relationshipId = appendRelationship(
    entryMap,
    relationshipPath,
    SheetRelationshipType,
    `../drawings/${drawingFileName}`,
  );
  const sheetXml = ensureWorksheetRelationshipNamespace(getTextEntry(entryMap, sheetPath));
  upsertTextEntry(
    entryMap,
    sheetPath,
    sheetXml.includes("<drawing ")
      ? sheetXml
      : sheetXml.replace("</worksheet>", `<drawing r:id="${relationshipId}"/></worksheet>`),
  );
}

function appendRelationship(
  entryMap: Map<string, XlsxZipEntry>,
  relationshipPath: string,
  type: string,
  target: string,
) {
  const currentXml = entryMap.has(relationshipPath)
    ? getTextEntry(entryMap, relationshipPath)
    : buildRelationshipsXml([]);
  const nextRelationshipId = resolveNextRelationshipId(currentXml);

  upsertTextEntry(
    entryMap,
    relationshipPath,
    currentXml.replace(
      "</Relationships>",
      `<Relationship Id="${nextRelationshipId}" Type="${type}" Target="${target}"/></Relationships>`,
    ),
  );

  return nextRelationshipId;
}

function buildRelationshipsXml(relationships: Array<[string, string, string]>) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships
    .map(([type, target, id]) => `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`)
    .join("")}</Relationships>`;
}

function buildDrawingXml(placements: ChartPlacement[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${placements
    .map(buildChartAnchorXml)
    .join("")}</xdr:wsDr>`;
}

function createPlacement(
  fromColumn: number,
  fromRow: number,
  toColumn: number,
  toRow: number,
  name: string,
  relationshipId: string,
): ChartPlacement {
  return { fromColumn, fromRow, name, relationshipId, toColumn, toRow };
}

function buildChartAnchorXml(placement: ChartPlacement) {
  return `<xdr:twoCellAnchor><xdr:from><xdr:col>${placement.fromColumn}</xdr:col><xdr:colOff>${DrawingEmuOffset}</xdr:colOff><xdr:row>${placement.fromRow}</xdr:row><xdr:rowOff>${DrawingEmuOffset}</xdr:rowOff></xdr:from><xdr:to><xdr:col>${placement.toColumn}</xdr:col><xdr:colOff>${DrawingEmuOffset}</xdr:colOff><xdr:row>${placement.toRow}</xdr:row><xdr:rowOff>${DrawingEmuOffset}</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${placement.relationshipId.replace("rId", "")}" name="${escapeXml(placement.name)}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="${placement.relationshipId}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`;
}

function buildBarChartXml({
  axisIds,
  barDirection,
  categoriesRange,
  series,
  title,
}: {
  axisIds: [number, number];
  barDirection: "bar" | "col";
  categoriesRange: string;
  series: SeriesReference[];
  title: string;
}) {
  const [categoryAxisId, valueAxisId] = axisIds;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${escapeXml(title)}</a:t></a:r></a:p></c:rich></c:tx><c:layout/></c:title><c:plotArea><c:layout/><c:barChart><c:barDir val="${barDirection}"/><c:grouping val="clustered"/>${series
    .map((item, index) => buildSeriesXml(index, item, categoriesRange))
    .join(
      "",
    )}<c:axId val="${categoryAxisId}"/><c:axId val="${valueAxisId}"/></c:barChart><c:catAx><c:axId val="${categoryAxisId}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="${barDirection === "col" ? "b" : "l"}"/><c:tickLblPos val="nextTo"/><c:crossAx val="${valueAxisId}"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/></c:catAx><c:valAx><c:axId val="${valueAxisId}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="${barDirection === "col" ? "l" : "b"}"/><c:majorGridlines/><c:numFmt formatCode="#,##0" sourceLinked="0"/><c:tickLblPos val="nextTo"/><c:crossAx val="${categoryAxisId}"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx></c:plotArea><c:legend><c:legendPos val="b"/><c:layout/></c:legend><c:plotVisOnly val="1"/></c:chart></c:chartSpace>`;
}

function buildSeriesXml(index: number, series: SeriesReference, categoriesRange: string) {
  return `<c:ser><c:idx val="${index}"/><c:order val="${index}"/><c:tx><c:strRef><c:f>${escapeXml(series.titleCell)}</c:f></c:strRef></c:tx><c:cat><c:strRef><c:f>${escapeXml(categoriesRange)}</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>${escapeXml(series.valueRange)}</c:f></c:numRef></c:val></c:ser>`;
}

function buildSheetRange(
  sheetName: string,
  startColumn: string,
  startRow: number,
  endColumn: string,
  endRow: number,
) {
  const escapedSheetName = sheetName.replace(/'/g, "''");
  return `'${escapedSheetName}'!$${startColumn}$${startRow}:$${endColumn}$${endRow}`;
}

function addContentTypeOverrides(xml: string, overrides: Array<[string, string]>) {
  return overrides.reduce((currentXml, [partName, contentType]) => {
    if (currentXml.includes(`PartName="${partName}"`)) {
      return currentXml;
    }
    return currentXml.replace(
      "</Types>",
      `<Override PartName="${partName}" ContentType="${contentType}"/></Types>`,
    );
  }, xml);
}

function ensureWorksheetRelationshipNamespace(xml: string) {
  if (xml.includes("xmlns:r=")) {
    return xml;
  }

  return xml.replace(
    "<worksheet ",
    '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ',
  );
}

function resolveNextRelationshipId(xml: string) {
  const usedIds = [...xml.matchAll(/Id="rId(\d+)"/g)].map((match) => Number(match[1]));
  return `rId${Math.max(0, ...usedIds) + 1}`;
}

function getTextEntry(entryMap: Map<string, XlsxZipEntry>, path: string) {
  const entry = entryMap.get(path);
  if (!entry) {
    throw new Error(`Missing XLSX entry: ${path}`);
  }
  return decodeZipText(entry.data);
}

function upsertTextEntry(entryMap: Map<string, XlsxZipEntry>, name: string, text: string) {
  entryMap.set(name, {
    data: encodeZipText(text),
    name,
  });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
