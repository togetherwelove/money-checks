import { createSystemCategory } from "./categoryFactory";

type IncomeCategoryLabelKey =
  | "bonus"
  | "interest"
  | "other"
  | "refund"
  | "resale"
  | "salary"
  | "sideIncome";

export const INCOME_CATEGORY_LABELS: Record<IncomeCategoryLabelKey, string> = {
    bonus: "성과급",
    interest: "이자",
    other: "기타",
    refund: "환급",
    resale: "중고판매",
    salary: "급여",
    sideIncome: "부수입",
} as const;

export const INCOME_CATEGORIES = [
  createSystemCategory("income-salary", INCOME_CATEGORY_LABELS.salary, "briefcase", "income"),
  createSystemCategory("income-side", INCOME_CATEGORY_LABELS.sideIncome, "plus-circle", "income"),
  createSystemCategory("income-bonus", INCOME_CATEGORY_LABELS.bonus, "award", "income"),
  createSystemCategory("income-resale", INCOME_CATEGORY_LABELS.resale, "tag", "income"),
  createSystemCategory("income-refund", INCOME_CATEGORY_LABELS.refund, "rotate-ccw", "income"),
  createSystemCategory("income-interest", INCOME_CATEGORY_LABELS.interest, "percent", "income"),
  createSystemCategory("income-other", INCOME_CATEGORY_LABELS.other, "grid", "income"),
] as const;
