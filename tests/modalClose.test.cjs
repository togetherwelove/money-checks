const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

const jsx = (type, props) => ({ type, props });
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name.endsWith('/ComposerBlockingModal')) return { ComposerBlockingModal: 'Modal' };
    if (name in dependencies) return dependencies[name];
    throw Error(`Missing dependency: ${name}`);
  }});
  return exports;
}
function nodes(root) {
  return !root || typeof root !== 'object' ? [] :
    [root, ...[root.props?.children].flat(Infinity).flatMap(nodes)];
}
const modalUi = load('src/constants/modal.ts', {});
const native = Object.fromEntries(['Image', 'Modal', 'Pressable', 'ScrollView', 'Text', 'View'].map(name => [name, name]));
native.StyleSheet = { create: value => value };

test('common close control exposes an accessible dismiss action and native disabled state', () => {
  const { ModalCloseButton } = load('src/components/ModalCloseButton.tsx', {
    './AppIcons': { Feather: 'Feather' }, 'react-native': native,
    '../constants/colors': { AppColors: {} }, '../constants/modal': modalUi,
  });
  let closed = 0;
  const button = ModalCloseButton({ onPress: () => closed++ });
  assert.equal(button.props.accessibilityRole, 'button');
  assert.equal(button.props.accessibilityLabel, '닫기');
  button.props.onPress();
  assert.equal(closed, 1);
  const disabled = ModalCloseButton({ onPress: () => closed++, disabled: true });
  assert.equal(disabled.props.disabled, true);
  assert.equal(disabled.props.accessibilityState.disabled, true);
});

test('photo preview X, backdrop and system back dismiss without removing the attachment', () => {
  let preview = null;
  let removed = 0;
  const { EntryPhotoAttachmentField } = load('src/components/EntryPhotoAttachmentField.tsx', {
    react: { useState: () => [preview, value => { preview = value; }] },
    'react-native': native,
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 40, right: 0 }) },
    '../constants/scroll': {}, '../constants/colors': { AppColors: {} },
    '../constants/layout': { AppLayout: { screenPadding: 16 } },
    '../constants/modal': modalUi, '../constants/entryDetailStyles': {},
    '../constants/uiStyles': {},
    '../constants/textLayout': {},
    '../constants/entryPhotos': { EntryPhotoCopy: { attachmentCountLabel: count => String(count) } },
    './IconActionButton': { IconActionButton: 'IconActionButton' },
    './TextLinkButton': { TextLinkButton: 'TextLinkButton' },
    './ModalCloseButton': { ModalCloseButton: 'ModalCloseButton' },
  });
  const attachments = [{ id: 'photo', uri: 'file://photo.jpg', fileName: 'photo.jpg' }];
  const render = () => nodes(EntryPhotoAttachmentField({ attachments, onPickAttachments() {}, onRemoveAttachment() { removed++; } }));
  for (const action of ['x', 'backdrop', 'system']) {
    render().find(node => node.type === 'Pressable').props.onPress();
    const all = render();
    const modal = all.find(node => node.type === 'Modal');
    assert.equal(modal.props.visible, true);
    if (action === 'x') all.find(node => node.type === 'ModalCloseButton').props.onPress();
    if (action === 'backdrop') nodes(modal).find(node => node.type === 'Pressable').props.onPress();
    if (action === 'system') modal.props.onRequestClose();
    assert.equal(render().find(node => node.type === 'Modal').props.visible, false);
    assert.equal(removed, 0);
    assert.equal(attachments.length, 1);
  }
});
