const assert = require('node:assert/strict');
const { test } = require('node:test');
const { modules, entry, currencyMock } = require('./annualReportHelpers.cjs');

const load = modules({ 'src/lib/currencyPreference.ts': currencyMock });
const { buildAnnualReportData } = load('src/lib/annualReport/annualReportData.ts');
const { writeAnnualReportWorkbook } = load('src/lib/annualReport/annualReportWorkbook.ts');
const { readStoredZipEntries, decodeZipText } = load('src/lib/annualReport/xlsxZip.ts');

test('report pagination retrieves over 1000 entries even when the server caps each page below the request', async () => {
  const all = Array.from({ length: 1205 }, (_, index) => entry(String(index)));
  const calls = [];
  const local = modules({ 'src/lib/ledgerEntries.ts': { async fetchLedgerEntries(book, from, to, options) {
    calls.push({ book, from, to, options });
    const start = options.cursor ? Number(options.cursor.id) + 1 : 0;
    return all.slice(start, start + 200);
  }}});
  const result = await local('src/lib/annualReport/fetchAnnualReportEntries.ts').fetchAnnualReportEntries('book', '2026-01-01', '2026-12-31');
  assert.equal(result.length, 1205);
  assert.equal(new Set(result.map(item => item.id)).size, 1205);
  assert.equal(calls.length, 8);
  assert.equal(calls[1].options.cursor.createdAt, all[199].createdAt);
  assert.equal(calls[1].options.cursor.id, '199');
  assert.ok(calls.every(call => call.from === '2026-01-01' && call.to === '2026-12-31'
    && call.options.orderBy === 'created_at' && call.options.includePhotoSignedUrls === false));
});

test('failed or repeated pages never return a partial report', async () => {
  for (const repeated of [false, true]) {
    let calls = 0;
    const local = modules({ 'src/lib/ledgerEntries.ts': { async fetchLedgerEntries() {
      if (++calls === 1 || repeated) return [entry('same')];
      throw Error('network');
    }}});
    await assert.rejects(local('src/lib/annualReport/fetchAnnualReportEntries.ts').fetchAnnualReportEntries('b', '2026-01-01', '2026-12-31'));
  }
});

test('report query forwards cursor and date bounds while preserving attachment counts without signing URLs', async () => {
  let rpcParams, signedRequests = 0;
  const local = modules({
    'src/lib/currencyPreference.ts': currencyMock,
    'src/lib/performanceTrace.ts': { createPerformanceTrace: () => () => {} },
    'src/utils/ledgerMapper.ts': { mapLedgerEntryRow: row => entry(row.id) },
    'src/lib/ledgerEntryPhotoAttachments.ts': {
      createLedgerEntryPhotoSignedUrlMap: async () => { signedRequests++; return new Map(); },
      mapLedgerEntryPhotoAttachmentFromReceiptFile: row => ({ id: row.id, uri: row.storage_path }),
    },
    'src/lib/supabase.ts': { supabase: { rpc(_name, params) {
      rpcParams = params;
      return { returns: async () => ({ data: [{ id: 'a', user_id: 'u', photo_attachments: [{ id: 'photo', storage_path: 'receipt.jpg' }] }], error: null }) };
    } } },
  });
  const { fetchLedgerEntries } = local('src/lib/ledgerEntries.ts');
  const entries = await fetchLedgerEntries('book', '2026-01-01', '2026-02-28', {
    cursor: { id: 'previous', createdAt: '2026-01-01T00:00:00Z' }, limit: 500,
    orderBy: 'created_at', includePhotoSignedUrls: false,
  });
  assert.equal(rpcParams.page_cursor_id, 'previous');
  assert.equal(rpcParams.page_cursor_created_at, '2026-01-01T00:00:00Z');
  assert.equal(rpcParams.page_limit, 500);
  assert.equal(rpcParams.date_from, '2026-01-01');
  assert.equal(rpcParams.date_to, '2026-02-28');
  assert.equal(entries[0].photoAttachments.length, 1);
  assert.equal(signedRequests, 0);
  await fetchLedgerEntries('book');
  assert.equal(signedRequests, 1);
});

test('ID-based aggregation separates identical names and unifies renamed categories', () => {
  const report = buildAnnualReportData('가계부', [
    entry('a', { category: '이전 이름' }),
    entry('b', { category: '새 이름', amount: 200 }),
    entry('c', { targetMemberId: 'member-b', categoryId: 'other', category: '새 이름', amount: 300 }),
    entry('d', { type: 'income', amount: 1000 }),
    entry('excluded', { date: '2025-12-31', amount: 9999 }),
  ], '2026-01-01', '2026-02-28');
  assert.equal(report.entries.length, 4);
  assert.equal(report.totalIncome, 1000);
  assert.equal(report.totalExpense, 600);
  assert.equal(report.memberRows.length, 2);
  assert.equal(new Set(report.memberRows.map(row => row.memberName)).size, 2);
  assert.equal(report.expenseCategories.length, 2);
  assert.equal(new Set(report.expenseCategories.map(row => row.category)).size, 2);
  assert.equal(report.monthlyRows[1].count, 0);
  assert.equal(report.monthlyRows.reduce((sum, row) => sum + row.count, 0), report.entries.length);
  assert.equal(report.memberRows.reduce((sum, row) => sum + row.expense, 0), report.totalExpense);
  assert.equal(report.expenseCategories.reduce((sum, row) => sum + row.amount, 0), report.totalExpense);
});

test('workbook has summary first, separate filters, frozen headers, numeric dates and valid chart references', () => {
  const report = buildAnnualReportData('공유 가계부', [
    entry('a', { content: '=1+1 & <메모>', photoAttachments: [{ uri: 'photo' }], installmentOrder: 1, installmentMonths: 3, installmentStatus: 'PREPAID' }),
    entry('b', { type: 'income', amount: 2000 }),
  ], '2026-01-01', '2026-02-28');
  const bytes = writeAnnualReportWorkbook(report);
  const xml = new Map(readStoredZipEntries(bytes).map(item => [item.name, decodeZipText(item.data)]));
  const workbook = xml.get('xl/workbook.xml');
  assert.ok(workbook.indexOf('name="요약"') < workbook.indexOf('name="원장"'));
  assert.equal((workbook.match(/<sheet /g) || []).length, 7);
  assert.ok(!xml.get('xl/worksheets/sheet1.xml').includes('<autoFilter'));
  for (const index of [2, 3, 4, 5, 6]) {
    assert.match(xml.get(`xl/worksheets/sheet${index}.xml`), /state="frozen"/);
    assert.match(xml.get(`xl/worksheets/sheet${index}.xml`), /<autoFilter/);
  }
  const ledger = xml.get('xl/worksheets/sheet2.xml');
  assert.match(ledger, /<c r="A2" s="3"><v>46037<\/v>/);
  assert.match(ledger, /선결제/);
  assert.match(ledger, /<c r="L2"><v>1<\/v>/);
  assert.match(ledger, /=1\+1 &amp; &lt;메모&gt;/);
  assert.ok(!ledger.includes('<f>'));
  assert.match(xml.get('xl/worksheets/sheet7.xml'), /<drawing r:id=/);
  assert.match(xml.get('xl/charts/chart2.xml'), /지출 분류별 집계/);
  assert.match(xml.get('xl/charts/chart3.xml'), /수입 분류별 집계/);
  assert.match(xml.get('xl/charts/chart4.xml'), /구성원별 집계/);
  assert.match(xml.get('xl/charts/chart1.xml'), /<c:strCache>.*<c:v>수입<\/c:v>/);
  assert.match(xml.get('xl/charts/chart1.xml'), /<c:numCache>/);
  assert.match(xml.get('xl/charts/chart4.xml'), /<c:v>김이름<\/c:v>/);
  if (process.env.ANNUAL_REPORT_SAMPLE_PATH) require('node:fs').writeFileSync(process.env.ANNUAL_REPORT_SAMPLE_PATH, bytes);
});

function downloadEnvironment({ available = true, accept = true, failShare = false, failWrite = false } = {}) {
  const alerts = [], toasts = [], files = [];
  let ads = 0, shares = 0;
  const local = modules({
    'src/lib/currencyPreference.ts': currencyMock,
    'react-native': { Alert: { alert(...args) { alerts.push(args); if (args[0] === '보고서 내용을 확인해 주세요.') {
      if (accept === 'dismiss') args[3].onDismiss(); else args[2][accept ? 1 : 0].onPress();
    }}}},
    'src/lib/nativeToast.ts': { showNativeToast: message => toasts.push(message) },
    'expo-sharing': { isAvailableAsync: async () => available, shareAsync: async () => { assert.equal(files.length, 1, 'file writing must finish before sharing'); shares++; if (failShare) throw Error('share failed'); } },
    'expo-file-system': { Paths: { cache: 'cache' }, File: class { uri = 'cache/report.xlsx'; create() {} async write(bytes) { await Promise.resolve(); if (failWrite) throw Error('write failed'); files.push(bytes); } } },
  });
  return { alerts, toasts, files, get ads() { return ads; }, get shares() { return shares; },
    run(entries = [entry('a')]) { return local('src/lib/annualReport/downloadAnnualReport.ts').confirmAndDownloadAnnualReport({
      bookName: '가계부', entries, period: { dateFrom: '2026-01-01', dateTo: '2026-12-31', periodLabel: '2026' }, onBeforeDownload: async () => { ads++; },
    }); },
  };
}

test('preview contains period, count and totals before sharing the workbook', async () => {
  const e = downloadEnvironment();
  assert.equal(await e.run(), true);
  assert.match(e.alerts[0][1], /2026-01-01 ~ 2026-12-31/);
  assert.match(e.alerts[0][1], /기록 건수: 1건/);
  assert.match(e.alerts[0][1], /총지출: 100원/);
  assert.equal(e.ads, 1); assert.equal(e.shares, 1); assert.equal(e.files.length, 1); assert.equal(e.toasts.length, 1);
});

test('empty periods, unavailable sharing and dismissed previews do not advertise or create files', async () => {
  for (const [options, entries] of [[{}, []], [{ available: false }, [entry('a')]], [{ accept: false }, [entry('a')]], [{ accept: 'dismiss' }, [entry('a')]]]) {
    const e = downloadEnvironment(options);
    assert.equal(await e.run(entries), false);
    assert.equal(e.ads, 0); assert.equal(e.shares, 0); assert.equal(e.files.length, 0); assert.equal(e.toasts.length, 0);
  }
});

test('share failure propagates without a success toast', async () => {
  const e = downloadEnvironment({ failShare: true });
  await assert.rejects(e.run(), /share failed/);
  assert.equal(e.toasts.length, 0);
});

test('file write failure prevents sharing and success toast', async () => {
  const e = downloadEnvironment({ failWrite: true });
  await assert.rejects(e.run(), /write failed/);
  assert.equal(e.shares, 0);
  assert.equal(e.toasts.length, 0);
});
