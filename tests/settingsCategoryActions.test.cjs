const assert = require("node:assert/strict");
const test = require("node:test");
const { modules, hooks } = require("./annualReportHelpers.cjs");

function setup() {
  const host = hooks();
  const alerts = [];
  const writes = [];
  let hasLoans = false;
  const category = {
    id: "custom-category-loan-repayment",
    label: "상환",
    iconName: "circle",
    source: "custom",
    type: "expense",
  };
  const customization = {
    customCategories: [category],
    categoryOrderIds: [],
    hiddenSystemCategoryIds: [],
    systemCategoryIconOverrides: {},
    systemCategoryLabelOverrides: {},
    saveCustomCategories: async (next) => {
      writes.push(next);
      return true;
    },
    saveHiddenSystemCategoryIds: (next) => writes.push(next),
  };
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    react: host.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { Alert: { alert: (...args) => alerts.push(args) } },
    "src/hooks/useCustomCategories.ts": { useCustomCategories: () => customization },
    "src/lib/ledgerBookCategories.ts": { hasLedgerBookLoans: async () => hasLoans },
    "src/components/categorySelector/CategoryManageModal.tsx": { CategoryManageModal: "Manager" },
    "src/components/appSettings/SettingsCategoryCreateModal.tsx": {
      SettingsCategoryCreateModal: "Editor",
    },
  });
  const { SettingsCategoryOrderModal } = load(
    "src/components/appSettings/SettingsCategoryOrderModal.tsx",
  );
  return {
    category,
    alerts,
    writes,
    customization,
    loans: (value) => {
      hasLoans = value;
    },
    render: () =>
      host.render(() => SettingsCategoryOrderModal({ bookId: "book", onClose() {} })).props,
  };
}

test("settings category menu opens editing with the selected category", () => {
  const ui = setup();
  ui.render().onEdit(ui.category);
  const modal = ui.render().creationModal;
  assert.equal(modal.props.category.id, ui.category.id);
  modal.props.onClose();
  assert.equal(ui.render().creationModal, null);
});

test("settings category deletion requires confirmation and rechecks registered loans", async () => {
  const ui = setup();
  ui.loans(true);
  await ui.render().onDelete(ui.category);
  assert.equal(ui.alerts[0][1], "대출이 등록되어 있어 삭제할 수 없어요.");
  assert.equal(ui.writes.length, 0);
  ui.loans(false);
  await ui.render().onDelete(ui.category);
  assert.equal(ui.writes.length, 0);
  ui.loans(true);
  await ui.alerts.at(-1)[2][1].onPress();
  assert.equal(ui.writes.length, 0);
  ui.loans(false);
  await ui.render().onDelete(ui.category);
  await ui.alerts.at(-1)[2][1].onPress();
  assert.equal(ui.writes[0].length, 0);
});

test("settings deleting a system category hides it after confirmation", async () => {
  const ui = setup();
  await ui.render().onDelete({ id: "food", source: "system" });
  await ui.alerts.at(-1)[2][1].onPress();
  assert.deepEqual(Array.from(ui.writes[0]), ["food"]);
});

test("editing a custom category preserves its id and retains input on save failure", async () => {
  const host = hooks();
  let closed = false;
  let saved;
  let succeeds = false;
  const category = {
    id: "custom-category-loan-repayment",
    label: "상환",
    iconName: "circle",
    source: "custom",
    type: "expense",
  };
  const categories = {
    customCategories: [category],
    systemCategoryLabelOverrides: {},
    saveCustomCategories: async (next) => {
      saved = next;
      return succeeds;
    },
  };
  const jsx = (type, props) => ({ type, props });
  const load = modules({
    react: host.react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "src/components/categorySelector/CategoryCreateModal.tsx": { CategoryCreateModal: "Form" },
  });
  const { SettingsCategoryCreateModal } = load(
    "src/components/appSettings/SettingsCategoryCreateModal.tsx",
  );
  const render = () =>
    host.render(() =>
      SettingsCategoryCreateModal({
        category,
        categories,
        entryType: "expense",
        onClose: () => {
          closed = true;
        },
      }),
    ).props;
  assert.equal(render().label, "상환");
  render().onChangeLabel("대출 원금");
  render().onChangeIcon("credit-card");
  await render().onSubmit();
  assert.equal(closed, false);
  assert.ok(render().errorMessage);
  assert.equal(render().label, "대출 원금");
  assert.equal(saved[0].id, category.id);
  assert.equal(saved[0].iconName, "credit-card");
  succeeds = true;
  await render().onSubmit();
  assert.equal(closed, true);
});
