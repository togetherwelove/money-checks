const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');

for (const showAnnualReportDownload of [false, true]) {
  test('settings preserves destinations, action IDs and report visibility (report=' + showAnnualReportDownload + ')', () => {
    const { buildSettingsMenuSections, getAppMenuItemId } = modules({})('src/lib/menuItems.ts');
    const sections = buildSettingsMenuSections({ showAnnualReportDownload });
    const items = sections.flatMap(section => section.items);
    assert.deepEqual(Array.from(items.filter(item => 'targetScreen' in item), item => item.targetScreen).sort(),
      ['account', 'contact-support', 'help', 'subscription', 'support']);
    assert.equal(items.filter(item => item.action === 'annual-report-download').length, Number(showAnnualReportDownload));
    assert.equal(sections.length, showAnnualReportDownload ? 3 : 2);
    assert.ok(sections.every(section => section.items.length > 0));
    for (const item of items) {
      assert.equal(getAppMenuItemId(item), item.targetScreen ?? item.action);
      assert.ok(item.label);
      assert.ok(item.icon);
    }
  });
}
