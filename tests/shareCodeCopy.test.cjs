const assert = require('node:assert/strict');
const test = require('node:test');
const { modules, hooks } = require('./annualReportHelpers.cjs');
const flush = () => new Promise(setImmediate);

function flow({ copyError, shareError } = {}) {
  const copied = [], shared = [], toasts = [], alerts = [], errors = [];
  const load = modules({
    'expo-clipboard': { setStringAsync: async text => { if (copyError) throw copyError; copied.push(text); } },
    'react-native': {
      Alert: { alert: (...args) => alerts.push(args) },
      Share: { share: async value => { if (shareError) throw shareError; shared.push(value); } },
    },
    'src/lib/nativeToast.ts': { showNativeToast: text => toasts.push(text) },
    'src/lib/logAppError.ts': { logAppError: (...args) => errors.push(args) },
  });
  return { copy: load('src/lib/copyLedgerShareCode.ts').copyLedgerShareCode,
    copied, shared, toasts, alerts, errors, messages: load('src/constants/shareLedgerMessages.ts').ShareLedgerMessages };
}

test('every copy waits for its ad, copies exactly the code, and only shares after acceptance', async () => {
  const f = flow(); let finishAd, ads = 0;
  const beforeCopy = () => { ads++; return new Promise(resolve => { finishAd = resolve; }); };
  for (const accept of [false, true]) {
    const pending = f.copy('AB12-CD34', beforeCopy, () => true);
    assert.equal(f.copied.length, ads - 1);
    finishAd(); await flush();
    assert.equal(f.copied.at(-1), 'AB12-CD34');
    assert.equal(f.toasts.at(-1), f.messages.copyCodeSuccessToast);
    assert.equal(f.shared.length, 0);
    const [title, message, buttons] = f.alerts.at(-1);
    assert.equal(title, f.messages.copyCodeSuccessToast);
    assert.equal(message, f.messages.shareCodeQuestion);
    buttons[accept ? 1 : 0].onPress();
    await pending;
  }
  assert.equal(ads, 2);
  assert.deepEqual(f.copied, ['AB12-CD34', 'AB12-CD34']);
  assert.equal(f.shared.length, 1);
  assert.equal(f.shared[0].message, 'AB12-CD34');
});

test('dismissing the question copies only; unavailable ads do not prevent copying', async () => {
  const f = flow();
  const pending = f.copy('CODE1234', async () => { throw Error('Ad unavailable'); }, () => true);
  await flush();
  f.alerts[0][3].onDismiss();
  await pending;
  assert.deepEqual(f.copied, ['CODE1234']);
  assert.deepEqual(f.shared, []);
  assert.equal(f.errors[0][2].step, 'show_copy_ad');
});

test('copy failures do not announce success or ask to share, and share failures preserve the copied code', async () => {
  const failedCopy = flow({ copyError: Error('Clipboard failed') });
  await failedCopy.copy('CODE1234', () => {}, () => true);
  assert.deepEqual(failedCopy.toasts, [failedCopy.messages.copyCodeErrorToast]);
  assert.deepEqual(failedCopy.alerts, []);
  const failedShare = flow({ shareError: Error('Share failed') });
  const pending = failedShare.copy('CODE1234', () => {}, () => true);
  await flush();
  failedShare.alerts[0][2][1].onPress();
  await pending;
  assert.deepEqual(failedShare.copied, ['CODE1234']);
  assert.equal(failedShare.toasts.at(-1), failedShare.messages.shareCodeErrorToast);
});

test('closing or changing books while waiting cannot copy or share an old code', async () => {
  const f = flow(); let current = true, finishAd;
  const cancelled = f.copy('OLD12345', () => new Promise(resolve => { finishAd = resolve; }), () => current);
  current = false; finishAd(); await cancelled;
  assert.deepEqual(f.copied, []);
  current = true;
  const pending = f.copy('NEW12345', () => {}, () => current);
  await flush(); current = false;
  f.alerts[0][2][1].onPress(); await pending;
  assert.deepEqual(f.shared, []);
});

test('rapid taps start a single copy flow, retain its lock through the question, and respect readonly access', async () => {
  const h = hooks(), requests = []; let finish;
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    react: h.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', TextInput: 'Input' },
    '@expo/vector-icons': { Feather: 'Icon' },
    'src/lib/copyLedgerShareCode.ts': { copyLedgerShareCode: (...args) => {
      requests.push(args); return new Promise(resolve => { finish = resolve; });
    } },
    'src/components/ActionButton.tsx': { ActionButton: 'Button' },
    'src/components/IconActionButton.tsx': { IconActionButton: 'IconButton' },
    'src/components/LedgerBookJoinRequests.tsx': { LedgerBookJoinRequests: 'Requests' },
    'src/components/sharedLedgerPanel/sharedLedgerPanelStyles.ts': { sharedLedgerPanelStyles: {} },
  });
  const { SharedLedgerBookCard } = load('src/components/sharedLedgerPanel/SharedLedgerBookCard.tsx');
  const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];
  const props = { activeBook: { id: 'a', shareCode: 'CODE1234' }, pendingJoinRequests: [], onBeforeCopyShareCode() {} };
  const render = extra => h.render(() => SharedLedgerBookCard({ ...props, ...extra }));
  const button = tree => nodes(tree).find(node => node.type === 'Button');
  const initial = button(render());
  initial.props.onPress(); initial.props.onPress();
  assert.equal(requests.length, 1);
  assert.equal(button(render()).props.loading, true);
  assert.equal(button(render()).props.disabled, true);
  render({ activeBook: { id: 'b', shareCode: 'NEW12345' } });
  assert.equal(requests[0][2](), false);
  finish(); await flush();
  button(render({ isReadOnlyDueToPlanLimit: true })).props.onPress();
  assert.equal(requests.length, 1);
  button(render()).props.onPress();
  assert.equal(requests.length, 2);
  h.unmount();
  assert.equal(requests[1][2](), false);
  finish(); await flush();
});
