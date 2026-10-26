const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');
test('native modal forwarding dismisses the previous keyboard without a global lock or timer', () => {
  let effect, dismissed = 0;
  const load = modules({
    react: { useLayoutEffect: callback => { effect = callback; } },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'react-native': { Modal: 'Modal', Keyboard: { dismiss: () => dismissed++ } },
  });
  const { ComposerBlockingModal } = load('src/components/ComposerBlockingModal.tsx');
  const close = () => {};
  let tree = ComposerBlockingModal({ visible: false, onRequestClose: close });
  effect(); assert.equal(dismissed, 0);
  tree = ComposerBlockingModal({ visible: true, onRequestClose: close });
  assert.equal(effect(), undefined);
  assert.equal(dismissed, 1);
  assert.equal(tree.type, 'Modal');
  assert.equal(tree.props.onRequestClose, close);
});
