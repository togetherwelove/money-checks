const assert = require('node:assert/strict');
const { test } = require('node:test');
const { modules, hooks, entry } = require('./annualReportHelpers.cjs');

function environment() {
  const host = hooks(), alerts = [], calls = [];
  const props = { activeBook: { id: 'book-a', name: '우리 가계부' }, visibleMonth: new Date(2026, 5, 1) };
  let fetchFailure = false, downloadFailure = false, pendingBounds;
  const load = modules({
    react: host.react,
    'react-native': { Alert: { alert: (...args) => alerts.push(args) } },
    'src/lib/ledgerEntries.ts': { fetchLedgerEntryDateBounds: async () => pendingBounds ?? { firstDate: '2025-01-01', lastDate: '2026-10-01' } },
    'src/lib/annualReport/fetchAnnualReportEntries.ts': { fetchAnnualReportEntries: async (...args) => {
      calls.push(args); if (fetchFailure) throw Error('offline'); return [entry('a')];
    } },
    'src/lib/annualReport/downloadAnnualReport.ts': { confirmAndDownloadAnnualReport: async () => {
      if (downloadFailure) throw Error('file failure'); return true;
    } },
  });
  const { useAnnualLedgerReportAction } = load('src/hooks/useAnnualLedgerReportAction.ts');
  let state;
  const render = () => { state = host.render(() => useAnnualLedgerReportAction(props)); return state; };
  render();
  return { props, alerts, calls, render, get state() { return state; },
    failFetch(value) { fetchFailure = value; }, failDownload(value) { downloadFailure = value; },
    waitForBounds(promise) { pendingBounds = promise; }, unmount: host.unmount,
    async open() { await state.handleDownloadReport(); render(); },
  };
}

for (const mode of ['first-to-last', 'selected-year', 'custom-range']) {
  for (const failure of ['fetch', 'download']) test(`${mode}: ${failure} failure is caught, loading ends and retry succeeds`, async () => {
    const e = environment();
    await e.open();
    if (failure === 'fetch') e.failFetch(true); else e.failDownload(true);
    async function select() {
      const result = await e.state.handleSelectPeriod(mode); e.render();
      if (mode !== 'custom-range') return result;
      const customResult = await e.state.handleConfirmCustomRange('2026-02-01', '2026-03-31'); e.render();
      return customResult;
    }
    assert.equal(await select(), false);
    assert.equal(e.state.isDownloading, false);
    assert.equal(e.alerts.length, 1);
    if (mode === 'custom-range') assert.equal(e.state.customRangeDraft.isOpen, true);
    e.failFetch(false); e.failDownload(false);
    await e.open();
    assert.equal(await select(), true);
    const expected = mode === 'first-to-last' ? ['2025-01-01', '2026-10-01']
      : mode === 'selected-year' ? ['2026-01-01', '2026-12-31'] : ['2026-02-01', '2026-03-31'];
    assert.deepEqual(e.calls.at(-1), ['book-a', ...expected]);
  });
}

test('double tap cannot begin concurrent downloads', async () => {
  const e = environment(); await e.open();
  const first = e.state.handleSelectPeriod('selected-year');
  const second = e.state.handleSelectPeriod('selected-year');
  assert.equal(await second, false);
  assert.equal(await first, true);
  assert.equal(e.calls.length, 1);
});

test('switching books during initial query discards the old book selection', async () => {
  const e = environment(); let resolve;
  e.waitForBounds(new Promise(done => { resolve = done; }));
  const pending = e.state.handleDownloadReport();
  e.props.activeBook = { id: 'book-b', name: '다른 가계부' }; e.render();
  resolve({ firstDate: '2026-01-01', lastDate: '2026-12-31' });
  assert.equal(await pending, false); e.render();
  assert.equal(e.state.periodSelection, null);
  assert.equal(e.calls.length, 0);
});

test('invalid custom dates retain the picker and do not fetch data', async () => {
  const e = environment(); await e.open();
  await e.state.handleSelectPeriod('custom-range'); e.render();
  assert.equal(await e.state.handleConfirmCustomRange('2026-03-01', '2026-02-01'), false);
  e.render();
  assert.equal(e.state.customRangeDraft.isOpen, true);
  assert.equal(e.calls.length, 0);
});
