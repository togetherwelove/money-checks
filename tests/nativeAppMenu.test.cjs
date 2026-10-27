const assert = require("node:assert/strict");
const test = require("node:test");
const { modules } = require("./annualReportHelpers.cjs");

for (const showAnnualReportDownload of [false, true]) {
  test(
    "all menu groups preserve destinations, action IDs and report visibility (report=" +
      showAnnualReportDownload +
      ")",
    () => {
      const { buildAllMenuSections, getAppMenuItemId } = modules({})("src/lib/menuItems.ts");
      const sections = buildAllMenuSections({ showAnnualReportDownload });
      const items = sections.flatMap((section) => section.items);
      assert.deepEqual(
        Array.from(
          items.filter((item) => "targetScreen" in item),
          (item) => item.targetScreen,
        ).sort(),
        [
          "account",
          "app-settings",
          "contact-support",
          "help",
          "notification-settings",
          "share",
          "subscription",
          "support",
        ],
      );
      assert.equal(
        items.filter((item) => item.action === "annual-report-download").length,
        Number(showAnnualReportDownload),
      );
      assert.equal(sections.length, 4);
      assert.deepEqual(
        Array.from(sections, (section) => section.label),
        ["내 계정", "가계부", "설정", "이용 및 지원"],
      );
      assert.ok(sections.every((section) => section.items.length > 0));
      for (const item of items) {
        assert.equal(getAppMenuItemId(item), item.targetScreen ?? item.action);
        assert.ok(item.label);
        assert.ok(item.icon);
      }
    },
  );
}

test("category menu explains its active book and disables changes without edit access", () => {
  const { buildAllMenuSections } = modules({})("src/lib/menuItems.ts");
  const category = (options) =>
    buildAllMenuSections(options)
      .flatMap((section) => section.items)
      .find((item) => item.action === "manage-categories");
  assert.equal(
    category({ canManageCategories: true, activeBookName: "My book" }).description,
    "적용 가계부: My book",
  );
  assert.equal(category({ canManageCategories: true }).disabled, false);
  assert.equal(category({}).disabled, true);
  assert.ok(category({}).description);
});
