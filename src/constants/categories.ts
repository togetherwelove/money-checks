import type { CategoryDefinition, CategoryIconName } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";

const CATEGORY_LABELS = {
  bonus: "\uC131\uACFC\uAE09",
  cafe: "\uCE74\uD398",
  family: "\uAC00\uC871",
  fee: "\uC218\uC218\uB8CC",
  food: "\uC2DD\uBE44",
  housing: "\uC8FC\uAC70",
  interest: "\uC774\uC790",
  leisure: "\uC5EC\uAC00",
  living: "\uC0DD\uD65C",
  medical: "\uC758\uB8CC",
  occasion: "\uACBD\uC870\uC0AC",
  other: "\uAE30\uD0C0",
  refund: "\uD658\uAE09",
  resale: "\uC911\uACE0\uD310\uB9E4",
  salary: "\uAE09\uC5EC",
  savings: "\uC800\uCD95",
  shopping: "\uC1FC\uD551",
  sideIncome: "\uBD80\uC218\uC785",
  subscription: "\uAD6C\uB3C5",
  transport: "\uAD50\uD1B5",
} as const;

const CATEGORY_ICON_OPTIONS = [
  "archive",
  "award",
  "briefcase",
  "coffee",
  "credit-card",
  "gift",
  "grid",
  "heart",
  "home",
  "navigation",
  "percent",
  "plus-circle",
  "repeat",
  "rotate-ccw",
  "shopping-bag",
  "shopping-cart",
  "smile",
  "sun",
  "tag",
  "users",
] as const satisfies readonly CategoryIconName[];

const INCOME_CATEGORIES = [
  createSystemCategory("income-salary", CATEGORY_LABELS.salary, "briefcase", "income"),
  createSystemCategory("income-side", CATEGORY_LABELS.sideIncome, "plus-circle", "income"),
  createSystemCategory("income-bonus", CATEGORY_LABELS.bonus, "award", "income"),
  createSystemCategory("income-resale", CATEGORY_LABELS.resale, "tag", "income"),
  createSystemCategory("income-refund", CATEGORY_LABELS.refund, "rotate-ccw", "income"),
  createSystemCategory("income-interest", CATEGORY_LABELS.interest, "percent", "income"),
  createSystemCategory("income-savings", CATEGORY_LABELS.savings, "archive", "income"),
  createSystemCategory("income-other", CATEGORY_LABELS.other, "grid", "income"),
];

const EXPENSE_CATEGORIES = [
  createSystemCategory("expense-food", CATEGORY_LABELS.food, "shopping-cart", "expense"),
  createSystemCategory("expense-cafe", CATEGORY_LABELS.cafe, "coffee", "expense"),
  createSystemCategory("expense-transport", CATEGORY_LABELS.transport, "navigation", "expense"),
  createSystemCategory("expense-living", CATEGORY_LABELS.living, "sun", "expense"),
  createSystemCategory("expense-shopping", CATEGORY_LABELS.shopping, "shopping-bag", "expense"),
  createSystemCategory("expense-housing", CATEGORY_LABELS.housing, "home", "expense"),
  createSystemCategory("expense-medical", CATEGORY_LABELS.medical, "heart", "expense"),
  createSystemCategory("expense-subscription", CATEGORY_LABELS.subscription, "repeat", "expense"),
  createSystemCategory("expense-leisure", CATEGORY_LABELS.leisure, "smile", "expense"),
  createSystemCategory("expense-family", CATEGORY_LABELS.family, "users", "expense"),
  createSystemCategory("expense-occasion", CATEGORY_LABELS.occasion, "gift", "expense"),
  createSystemCategory("expense-fee", CATEGORY_LABELS.fee, "credit-card", "expense"),
  createSystemCategory("expense-other", CATEGORY_LABELS.other, "grid", "expense"),
];

export const CATEGORY_OPTIONS: Record<LedgerEntryType, CategoryDefinition[]> = {
  expense: EXPENSE_CATEGORIES,
  income: INCOME_CATEGORIES,
} as const;

export const CATEGORY_ICON_PICKER_OPTIONS = [...CATEGORY_ICON_OPTIONS];

function createSystemCategory(
  id: string,
  label: string,
  iconName: CategoryIconName,
  type: LedgerEntryType,
): CategoryDefinition {
  return { iconName, id, label, source: "system", type };
}
