import type { CategoryDefinition, CategoryIconName } from "../types/category";
import type { LedgerEntryType } from "../types/ledger";
import { EXPENSE_CATEGORIES } from "./expenseCategories";
import { INCOME_CATEGORIES } from "./incomeCategories";

const CATEGORY_ICON_OPTIONS = [
  "archive",
  "award",
  "book-open",
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
  "scissors",
  "shopping-bag",
  "shopping-cart",
  "smile",
  "sun",
  "tag",
  "users",
  "zap",
] as const satisfies readonly CategoryIconName[];

export const CATEGORY_OPTIONS: Record<LedgerEntryType, readonly CategoryDefinition[]> = {
  expense: EXPENSE_CATEGORIES,
  income: INCOME_CATEGORIES,
} as const;

export const CATEGORY_ICON_PICKER_OPTIONS = [...CATEGORY_ICON_OPTIONS];
