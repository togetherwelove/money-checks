import { selectStaticCopy } from "../i18n/staticCopy";
import type { AppLanguage } from "../i18n/types";
import { createSystemCategory } from "./categoryFactory";

type ExpenseCategoryLabelKey =
  | "beauty"
  | "dining"
  | "education"
  | "food"
  | "leisure"
  | "living"
  | "medical"
  | "occasion"
  | "other"
  | "publicUtilities"
  | "shopping"
  | "subscription"
  | "transport";

export const EXPENSE_CATEGORY_LABEL_COPY: Record<
  AppLanguage,
  Record<ExpenseCategoryLabelKey, string>
> = {
  en: {
    beauty: "Beauty",
    dining: "Dining",
    education: "Edu.",
    food: "Food",
    living: "Living",
    leisure: "Leisure",
    medical: "Medical",
    occasion: "Events",
    other: "Other",
    publicUtilities: "Utilities",
    shopping: "Shopping",
    subscription: "Sub.",
    transport: "Transit",
  },
  ko: {
    beauty: "미용",
    dining: "외식",
    education: "교육",
    food: "식비",
    living: "생활",
    leisure: "여가",
    medical: "의료",
    occasion: "경조사",
    other: "기타",
    publicUtilities: "공과금",
    shopping: "쇼핑",
    subscription: "구독",
    transport: "교통",
  },
} as const;

export const EXPENSE_CATEGORY_LABELS = selectStaticCopy(EXPENSE_CATEGORY_LABEL_COPY);

export const EXPENSE_CATEGORIES = [
  createSystemCategory("expense-food", EXPENSE_CATEGORY_LABELS.food, "shopping-cart", "expense"),
  createSystemCategory("expense-housing", EXPENSE_CATEGORY_LABELS.living, "home", "expense"),
  createSystemCategory("expense-occasion", EXPENSE_CATEGORY_LABELS.occasion, "gift", "expense"),
  createSystemCategory(
    "expense-utilities",
    EXPENSE_CATEGORY_LABELS.publicUtilities,
    "zap",
    "expense",
  ),
  createSystemCategory(
    "expense-subscription",
    EXPENSE_CATEGORY_LABELS.subscription,
    "repeat",
    "expense",
  ),
  createSystemCategory("expense-dining", EXPENSE_CATEGORY_LABELS.dining, "coffee", "expense"),
  createSystemCategory(
    "expense-transport",
    EXPENSE_CATEGORY_LABELS.transport,
    "navigation",
    "expense",
  ),
  createSystemCategory(
    "expense-shopping",
    EXPENSE_CATEGORY_LABELS.shopping,
    "shopping-bag",
    "expense",
  ),
  createSystemCategory("expense-medical", EXPENSE_CATEGORY_LABELS.medical, "heart", "expense"),
  createSystemCategory("expense-beauty", EXPENSE_CATEGORY_LABELS.beauty, "scissors", "expense"),
  createSystemCategory("expense-leisure", EXPENSE_CATEGORY_LABELS.leisure, "smile", "expense"),
  createSystemCategory(
    "expense-education",
    EXPENSE_CATEGORY_LABELS.education,
    "book-open",
    "expense",
  ),
  createSystemCategory("expense-other", EXPENSE_CATEGORY_LABELS.other, "grid", "expense"),
] as const;
