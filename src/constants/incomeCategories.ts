import { createSystemCategory } from "./categoryFactory";

const INCOME_LABELS = {
  bonus: "성과금",
  interest: "이자",
  other: "기타",
  refund: "환급",
  resale: "중고판매",
  salary: "급여",
  sideIncome: "부수입",
} as const;

export const INCOME_CATEGORIES = [
  createSystemCategory("income-salary", INCOME_LABELS.salary, "briefcase", "income"),
  createSystemCategory("income-side", INCOME_LABELS.sideIncome, "plus-circle", "income"),
  createSystemCategory("income-bonus", INCOME_LABELS.bonus, "award", "income"),
  createSystemCategory("income-resale", INCOME_LABELS.resale, "tag", "income"),
  createSystemCategory("income-refund", INCOME_LABELS.refund, "rotate-ccw", "income"),
  createSystemCategory("income-interest", INCOME_LABELS.interest, "percent", "income"),
  createSystemCategory("income-other", INCOME_LABELS.other, "grid", "income"),
] as const;
