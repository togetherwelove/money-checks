// Keep cached values alongside references for spreadsheet viewers that do not recalculate charts.
export function buildChartStringCache(values: string[]) {
  return `<c:strCache><c:ptCount val="${values.length}"/>${values.map((value, index) =>
    `<c:pt idx="${index}"><c:v>${escapeChartText(value)}</c:v></c:pt>`).join("")}</c:strCache>`;
}

export function buildChartNumberCache(values: number[]) {
  return `<c:numCache><c:formatCode>#,##0</c:formatCode><c:ptCount val="${values.length}"/>${values.map((value, index) =>
    `<c:pt idx="${index}"><c:v>${value}</c:v></c:pt>`).join("")}</c:numCache>`;
}

function escapeChartText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
