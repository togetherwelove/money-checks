const assert = require('node:assert/strict');
const test = require('node:test');
const { modules } = require('./annualReportHelpers.cjs');

for (const installmentGroupId of [null, 'installments']) {
  test(`duplicate menu forwards the entry without triggering edit or delete (${installmentGroupId})`, () => {
    const jsx = (type, props) => ({ type, props });
    const load = modules({
      react: { useRef: current => ({ current }) },
      'react/jsx-runtime': { jsx, jsxs: jsx },
      'react-native': { View: 'View', Pressable: 'Pressable', Text: 'Text', StyleSheet: { create: value => value } },
      '@expo/vector-icons': { Feather: 'Feather' },
      '@react-native-menu/menu': { MenuView: 'MenuView' },
      'src/contexts/ExpenseTextColorContext.tsx': { useExpenseTextColor: () => ({ textStyle: {} }) },
      'src/lib/installments.ts': { formatInstallmentProgressLabel: () => '', stripInstallmentNoteSuffix: value => value },
      'src/lib/currencyPreference.ts': { resolveDisplayCurrency: () => 'KRW' },
      'src/components/InstallmentStatusBadge.tsx': { InstallmentStatusBadge: 'Badge' },
    });
    const { LedgerEntryListItem } = load('src/components/LedgerEntryListItem.tsx');
    const entry = { id: 'entry', type: 'expense', amount: 100, content: 'Meal', categoryId: 'food',
      category: 'Food', date: '2026-10-24', note: '', photoAttachments: [], installmentGroupId };
    const copied = [];
    const unexpected = () => assert.fail('unrelated action fired');
    const root = LedgerEntryListItem({ entry, categoryIconByKey: new Map(), categoryLabelById: new Map(),
      onDuplicateEntry: value => copied.push(value), onEditEntry: unexpected, onDeleteEntry: unexpected,
      onPrepayInstallmentEntry: unexpected });
    const pressable = root.props.children;
    const menu = pressable.props.children;
    const action = menu.props.actions.find(item => item.title === '복제');
    assert.ok(action);
    const { AppColors } = load('src/constants/colors.ts');
    assert.equal(action.image, 'doc.on.doc');
    assert.equal(action.imageColor, AppColors.text);
    const deleteAction = menu.props.actions.find(item => item.attributes?.destructive);
    assert.equal(deleteAction.image, 'trash');
    assert.equal(deleteAction.imageColor, AppColors.expense);
    menu.props.onPressAction({ nativeEvent: { event: action.id } });
    assert.deepEqual(copied, [entry]);
    pressable.props.onPress();
  });
}
