const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { modules } = require('./annualReportHelpers.cjs');
const flush = () => new Promise(setImmediate);

test('automatic detection and explicit reads share one request per book and later reads are fresh', async () => {
  const { createScopedClipboardReader } = modules()('src/lib/scopedClipboardReader.ts');
  const read = createScopedClipboardReader(); let calls = 0, finish;
  const load = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const first = read('a', load), second = read('a', load);
  assert.equal(first, second);
  await flush(); assert.equal(calls, 1);
  finish('card-a'); assert.equal(await first, 'card-a');
  assert.equal(await second, 'card-a');
  const next = read('a', load); await flush(); assert.equal(calls, 2);
  finish('card-b'); assert.equal(await next, 'card-b');
});

test('a stale book request cannot clear the current book read and failures remain retryable', async () => {
  const { createScopedClipboardReader } = modules()('src/lib/scopedClipboardReader.ts');
  const read = createScopedClipboardReader(); let finishA, finishB;
  const a = read('a', () => new Promise(resolve => { finishA = resolve; }));
  const b = read('b', () => new Promise(resolve => { finishB = resolve; }));
  await flush(); finishA('a'); await a;
  assert.equal(read('b', () => { throw Error('Must share'); }), b);
  finishB('b'); await b;
  await assert.rejects(read('b', async () => { throw Error('Denied'); }), /Denied/);
  assert.equal(await read('b', async () => 'recovered'), 'recovered');
});

test('+ opens immediately, asynchronous recognition does not reopen a dismissed sheet, and old-book results are ignored', async () => {
  const source = fs.readFileSync('src/hooks/useEntryClipboard.ts', 'utf8');
  const tree = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'handleOpenEntryFromCalendar') handler = node.initializer.arguments[0].getText(tree);
    ts.forEachChild(node, visit);
  }
  visit(tree); assert.ok(handler);
  let opened = 0, finish;
  const drafts = [], scope = { current: 'a' };
  const code = ts.transpileModule(`const handler = ${handler};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const open = vm.runInNewContext(`${code}\nhandler;`, {
    isSignedInInteractionReady: true, ledgerState: { isReadOnlyDueToPlanLimit: false },
    lastHandledClipboardRef: { current: null }, clipboardScopeRef: scope, navigateToEntryFromCalendar: () => opened++,
    readAvailableCardSmsClipboardDraft: () => new Promise(resolve => { finish = resolve; }),
    setClipboardSuggestionDraft: draft => drafts.push(draft), handleReadOnlyEditBlocked() {},
  });
  const pending = open(); assert.equal(opened, 1);
  const draft = { amount: '8500', content: 'Coffee' };
  finish(draft); await pending;
  assert.equal(opened, 1); assert.equal(drafts[0], draft);
  const stale = open(); scope.current = 'b'; finish({ amount: '999' }); await stale;
  assert.equal(drafts.length, 1);
});

test('detected SMS retains amount, merchant, date and cancellation type; empty clipboard is never read', async () => {
  let text = '[Web발신]\n테스트카드 승인\n10/25 12:34\n8,500원\n동네카페\n누적 100,000원', hasText = true, reads = 0;
  const load = modules({
    'expo-clipboard': { hasStringAsync: async () => hasText, getStringAsync: async () => { reads++; return text; } },
    'src/lib/logAppError.ts': { logAppError() {} },
  });
  const { readCardSmsClipboardDraft } = load('src/lib/cardSmsClipboardImport.ts');
  const baseDate = new Date(2026, 9, 25);
  const draft = await readCardSmsClipboardDraft({ baseDate });
  assert.equal(draft.amount, '8500'); assert.equal(draft.content, '동네카페');
  assert.equal(draft.date, '2026-10-25'); assert.equal(draft.type, 'expense');
  text = text.replace('승인', '취소');
  assert.equal((await readCardSmsClipboardDraft({ baseDate })).type, 'income');
  assert.equal(await readCardSmsClipboardDraft({ baseDate, shouldIgnoreDraft: () => true }), null);
  hasText = false; const before = reads;
  assert.equal(await readCardSmsClipboardDraft({ baseDate }), null); assert.equal(reads, before);
  hasText = true; text = 'Ordinary text';
  assert.equal(await readCardSmsClipboardDraft({ baseDate }), null);
});


test('returning while data is loading defers clipboard detection until readiness and cleans up its listener', () => {
  const source = fs.readFileSync('src/hooks/useEntryClipboard.ts', 'utf8');
  const tree = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let readinessEffect, resumeEffect;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(tree) === 'useEffect') {
      const callback = node.arguments[0]?.getText(tree);
      if (callback?.includes('pendingClipboardCheckRef.current')) {
        if (callback.includes('AppState.addEventListener')) resumeEffect = callback;
        else readinessEffect = callback;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree); assert.ok(readinessEffect); assert.ok(resumeEffect);
  let listener, removed = 0, reads = 0;
  const pending = { current: false };
  const context = vm.createContext({
    isSignedInInteractionReady: false, clipboardScope: "book", pendingClipboardCheckRef: pending,
    previousClipboardImportAppStateRef: { current: 'background' },
    handleDetectClipboardSuggestion: () => { pending.current = false; reads++; },
    AppState: { currentState: 'active', addEventListener: (_event, callback) => {
      listener = callback; return { remove: () => removed++ };
    } },
  });
  const evaluate = text => vm.runInContext(ts.transpileModule(`(${text})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  const retryWhenReady = evaluate(readinessEffect);
  const cleanup = evaluate(resumeEffect)();
  listener('active'); retryWhenReady();
  assert.equal(reads, 0); assert.equal(pending.current, true);
  context.isSignedInInteractionReady = true;
  retryWhenReady(); retryWhenReady();
  assert.equal(reads, 1); assert.equal(pending.current, false);
  cleanup(); assert.equal(removed, 1);
});
