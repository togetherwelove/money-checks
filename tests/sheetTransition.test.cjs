const assert = require('node:assert/strict');
const test = require('node:test');
const { hooks, modules } = require('./annualReportHelpers.cjs');

function setup() {
  const h = hooks();
  const load = modules({ react: { ...h.react, useLayoutEffect: h.react.useEffect, useCallback: callback => callback } });
  const { useSheetTransition } = load('src/hooks/useSheetTransition.ts');
  return { render: () => h.render(useSheetTransition), unmount: h.unmount };
}

test('sheet handoff waits for native dismissal instead of visibility or elapsed time', () => {
  const ui = setup(), events = [];
  let sheet = ui.render();
  sheet.setOpen(true); sheet = ui.render();
  assert.equal(sheet.isOpen, true);
  sheet.closeAfterDismiss(() => events.push('next'));
  sheet = ui.render();
  assert.equal(sheet.isOpen, false);
  assert.equal(sheet.isPresented, true);
  assert.deepEqual(events, []);
  for (let render = 0; render < 10; render++) ui.render();
  assert.deepEqual(events, []);
  sheet.onDismiss(); sheet = ui.render();
  assert.deepEqual(events, ['next']);
  assert.equal(sheet.isPresented, false);
  sheet.onDismiss(); assert.deepEqual(events, ['next']);
});

test('reopening during dismissal waits and ignores late duplicate completions', () => {
  const ui = setup();
  let sheet = ui.render();
  sheet.setOpen(true); sheet = ui.render();
  sheet.setOpen(false); sheet = ui.render();
  sheet.setOpen(true); sheet = ui.render();
  assert.equal(sheet.isOpen, false);
  sheet.onDismiss(); sheet = ui.render();
  assert.equal(sheet.isOpen, true);
  sheet.onDismiss(); assert.equal(ui.render().isOpen, true);
});

test('requests cancelled before presentation commit cannot leave the sheet blocked', () => {
  const ui = setup();
  let sheet = ui.render();
  sheet.setOpen(true); sheet.setOpen(false); sheet = ui.render();
  assert.equal(sheet.isPresented, false);
  let next = 0;
  sheet.setOpen(true); sheet.closeAfterDismiss(() => next++);
  assert.equal(next, 1);
  assert.equal(ui.render().isPresented, false);
});

test('unmount drops queued navigation and reopening callbacks', () => {
  const ui = setup(); let next = 0;
  let sheet = ui.render(); sheet.setOpen(true); sheet = ui.render();
  sheet.closeAfterDismiss(() => next++); sheet = ui.render();
  ui.unmount(); sheet.onDismiss(); sheet.setOpen(true);
  assert.equal(next, 0);
});

test('composer to management to subscription never presents the next step before dismissal', () => {
  const h = hooks();
  const load = modules({ react: { ...h.react, useLayoutEffect: h.react.useEffect, useCallback: callback => callback } });
  const { useSheetTransition } = load('src/hooks/useSheetTransition.ts');
  const render = () => h.render(() => ({ composer: useSheetTransition(), management: useSheetTransition() }));
  let sheets = render(), subscriptions = 0;
  sheets.composer.setOpen(true); sheets = render();
  const openManagement = sheets.management.setOpen;
  sheets.composer.closeAfterDismiss(() => openManagement(true)); sheets = render();
  assert.equal(sheets.composer.isPresented, true);
  assert.equal(sheets.management.isPresented, false);
  sheets.composer.onDismiss(); sheets = render();
  assert.equal(sheets.composer.isPresented, false);
  assert.equal(sheets.management.isOpen, true);
  sheets.management.closeAfterDismiss(() => subscriptions++); sheets = render();
  assert.equal(subscriptions, 0);
  assert.equal(sheets.management.isPresented, true);
  sheets.management.onDismiss(); sheets = render();
  assert.equal(subscriptions, 1);
  assert.equal(sheets.management.isPresented, false);
});
