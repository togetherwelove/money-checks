const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const { modules } = require("./annualReportHelpers.cjs");
const { AppFontSize, AppLineHeight } = require("./typographyTestValues.cjs");

const sourceRoot = path.join(__dirname, "../src");
function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}

test("the shared typography scale has exactly five sizes and enough line height", () => {
  assert.deepEqual(Object.values(AppFontSize), [12, 14, 16, 20, 24]);
  for (const role of Object.keys(AppFontSize)) {
    assert.ok(AppLineHeight[role] > AppFontSize[role], role);
  }
});

test("screens, aliases and native font configurations do not define private font sizes", () => {
  const violations = [];
  for (const file of sourceFiles(sourceRoot)) {
    if (file === path.join(sourceRoot, "constants/typography.ts")) continue;
    const source = new TextDecoder("utf-8", { fatal: true }).decode(fs.readFileSync(file));
    assert.ok(!source.includes("\uFFFD"), `Corrupt UTF-8: ${file}`);
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    function inspect(node) {
      let value;
      if (ts.isPropertyAssignment(node) || ts.isVariableDeclaration(node)) {
        const name = node.name.getText(ast).replace(/["'_]/g, "").toLowerCase();
        const nativeFont =
          name === "size" &&
          ((ts.isCallExpression(node.parent.parent) &&
            node.parent.parent.expression.getText(ast) === "font") ||
            (ts.isPropertyAssignment(node.parent.parent) &&
              /font$/i.test(node.parent.parent.name.getText(ast))));
        if (name.endsWith("fontsize") || name === "textsize" || nativeFont) {
          value = node.initializer;
        }
      } else if (ts.isJsxAttribute(node) && node.name.getText(ast) === "fontSize") {
        value = node.initializer;
      }
      if (value) {
        function findLiteral(child) {
          if (ts.isNumericLiteral(child)) {
            const { line } = ast.getLineAndCharacterOfPosition(child.getStart(ast));
            violations.push(`${path.relative(sourceRoot, file)}:${line + 1}`);
          }
          ts.forEachChild(child, findLiteral);
        }
        findLiteral(value);
      }
      ts.forEachChild(node, inspect);
    }
    inspect(ast);
  }
  assert.deepEqual(violations, [], "Use AppFontSize or an alias of it");
});

const load = modules({
  "react-native": { StyleSheet: { create: (styles) => styles, hairlineWidth: 1 } },
  "src/components/monthCalendarPager/calendarLayout.ts": undefined,
});

test("calendar rows and footer reserve space for the larger labels and accessibility scaling", () => {
  const calendar = load("src/components/monthCalendarPager/calendarLayout.ts");
  const day = load("src/constants/calendarDay.ts").getCalendarDayUi();
  const { FooterTabBarUi: footer, resolveFooterTabBarHeight } = load("src/constants/menu.ts");
  assert.ok(calendar.CALENDAR_DAY_NUMBER_LINE_HEIGHT >= day.dayNumberFontSize);
  assert.equal(day.amountFontSize, 10);
  assert.equal(day.weekdayFontSize, AppFontSize.caption);
  assert.ok(day.amountLineHeight >= day.amountFontSize);
  for (const scale of [1, 1.3, 2]) {
    const effectiveScale = Math.min(scale, 1.3);
    const textHeight =
      (calendar.CALENDAR_DAY_NUMBER_LINE_HEIGHT + day.amountLineHeight * 2) * effectiveScale;
    assert.ok(calendar.resolveCalendarWeekHeight([], scale) >= textHeight);
    const footerContentHeight =
      footer.iconButtonSize +
      footer.labelGap +
      footer.labelLineHeight * effectiveScale +
      footer.tabPaddingVertical * 2;
    assert.ok(resolveFooterTabBarHeight(scale) >= footerContentHeight);
  }
});

test("inputs reserve their line height and menu capsules keep their agreed geometry", () => {
  const { getFormInputTextStyle, getScreenTitleTextStyle } = load("src/constants/uiStyles.ts");
  const input = getFormInputTextStyle();
  assert.ok(input.minHeight >= input.lineHeight + input.paddingVertical * 2);
  assert.equal(input.fontSize, AppFontSize.label);
  assert.equal(getScreenTitleTextStyle().fontSize, AppFontSize.title);
  assert.equal(
    load("src/constants/nativeBottomNavigation.ts").NativeBottomNavigationUi.labelStyle.fontSize,
    AppFontSize.caption,
  );
  const { SettingsGroupDesign: group } = load("src/constants/settingsGroupStyles.ts");
  assert.equal(group.singleLineHeight, group.radius * 2);
  assert.ok(group.fieldMinHeight >= AppLineHeight.label);
});
