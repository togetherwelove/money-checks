const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const test = require('node:test');
const flush = () => new Promise(setImmediate);

function setup() {
  const source = fs.readFileSync('src/App.tsx', 'utf8');
  const tree = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let detect, ready, scopeChanged;
  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.name.getText(tree) === 'handleDetectClipboardSuggestion') detect = node.initializer.arguments[0].getText(tree);
    if (ts.isCallExpression(node) && node.expression.getText(tree) === 'useEffect') {
      const callback = node.arguments[0]?.getText(tree), dependencies = node.arguments[1]?.getText(tree);
      if (dependencies === '[clipboardScope]') scopeChanged = callback;
      if (callback?.includes('pendingClipboardCheckRef.current') && !callback.includes('AppState.addEventListener')) ready = callback;
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  const requests = [], shown = [];
  let revision = 0;
  const context = vm.createContext({
    AppState: { currentState: 'active' }, isSignedInInteractionReady: true,
    ledgerState: { isReadOnlyDueToPlanLimit: false },
    navigationRef: { getCurrentRoute: () => ({ name: 'calendar' }) },
    clipboardSuggestionDraft: null, clipboardScope: null,
    clipboardScopeRef: { current: null }, clipboardDetectionMountedRef: { current: true }, pendingClipboardCheckRef: { current: true },
    clipboardReadInFlightRef: { current: false }, lastHandledClipboardRef: { current: null },
    composerVisibleRef: { current: false }, entryComposerRef: { current: { isBusy: () => false } },
    readAvailableCardSmsClipboardDraft: () => new Promise(resolve => requests.push(resolve)),
    setClipboardSuggestionDraft: draft => { context.clipboardSuggestionDraft = draft; if (draft) shown.push(draft); },
    setClipboardCheckRevision: update => { revision = update(revision); },
  });
  const evaluate = text => vm.runInContext(ts.transpileModule(`(${text})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  context.handleDetectClipboardSuggestion = evaluate(detect);
  const check = evaluate(ready), reset = evaluate(scopeChanged);
  return { context, check, requests, shown, revision: () => revision,
    scope: value => { context.clipboardScope = value; context.clipboardScopeRef.current = value; reset(); } };
}

test('clipboard recognition stays pending until a ledger becomes available', async () => {
  const ui = setup();
  ui.check();
  assert.equal(ui.context.pendingClipboardCheckRef.current, true);
  assert.equal(ui.requests.length, 0);
  ui.scope('book-a'); ui.check();
  assert.equal(ui.requests.length, 1);
  const draft = { amount: '8500', content: 'Coffee' };
  ui.requests[0](draft); await flush();
  assert.equal(ui.shown[0], draft);
});

test('loading or ledger changes during a clipboard read retry after that read finishes', async () => {
  const ui = setup();
  ui.scope('book-a'); ui.check();
  ui.context.isSignedInInteractionReady = false; ui.scope(null); ui.check();
  ui.context.isSignedInInteractionReady = true; ui.scope('book-b'); ui.check();
  assert.equal(ui.requests.length, 1);
  assert.equal(ui.context.pendingClipboardCheckRef.current, true);
  ui.requests[0]({ amount: '100', content: 'Old book' }); await flush();
  assert.equal(ui.shown.length, 0);
  assert.equal(ui.revision(), 1);
  ui.check(); assert.equal(ui.requests.length, 2);
  const draft = { amount: '200', content: 'Current book' };
  ui.requests[1](draft); await flush();
  assert.equal(ui.shown[0], draft);
});

test('opening the composer defers an automatic clipboard check without consuming it', async () => {
  const ui = setup();
  ui.scope('book-a'); ui.context.composerVisibleRef.current = true; ui.check();
  assert.equal(ui.requests.length, 0);
  assert.equal(ui.context.pendingClipboardCheckRef.current, true);
  ui.context.composerVisibleRef.current = false; ui.check();
  assert.equal(ui.requests.length, 1);
  ui.requests[0](null); await flush();
  assert.equal(ui.context.pendingClipboardCheckRef.current, false);
});

test('a reload of the same book does not lose clipboard recognition', async () => {
  const ui = setup(), draft = { amount: '8500', content: 'Coffee' };
  ui.scope('book-a'); ui.check();
  ui.context.isSignedInInteractionReady = false; ui.scope(null);
  ui.requests[0](draft); await flush();
  assert.equal(ui.shown.length, 0);
  ui.context.isSignedInInteractionReady = true; ui.scope('book-a'); ui.check();
  assert.equal(ui.requests.length, 2);
  ui.requests[1](draft); await flush();
  assert.equal(ui.shown[0], draft);
});

test('background clipboard results remain pending until the app is active again', async () => {
  const ui = setup(), draft = { amount: '8500', content: 'Coffee' };
  ui.scope('book-a'); ui.check();
  ui.context.AppState.currentState = 'background';
  ui.requests[0](draft); await flush();
  assert.equal(ui.shown.length, 0);
  assert.equal(ui.context.pendingClipboardCheckRef.current, true);
  ui.context.AppState.currentState = 'active'; ui.check();
  assert.equal(ui.requests.length, 2);
  ui.requests[1](draft); await flush();
  assert.equal(ui.shown[0], draft);
});

test('unmounting during a read neither displays a card nor schedules another render', async () => {
  const ui = setup();
  ui.scope('book-a'); ui.check();
  ui.context.clipboardDetectionMountedRef.current = false;
  ui.context.pendingClipboardCheckRef.current = true;
  ui.requests[0]({ amount: '8500', content: 'Coffee' }); await flush();
  assert.equal(ui.shown.length, 0); assert.equal(ui.revision(), 0);
});
