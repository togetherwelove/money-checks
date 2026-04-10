import { createSystemCategory } from "./categoryFactory";

const EXPENSE_LABELS = {
  beauty: "미용",
  dining: "외식/술",
  education: "교육",
  food: "식비",
  housing: "주거",
  leisure: "여가",
  medical: "의료",
  occasion: "경조사",
  other: "기타",
  publicUtilities: "공과금",
  shopping: "쇼핑",
  subscription: "구독",
  transport: "교통",
} as const;

export const EXPENSE_CATEGORIES = [
  createSystemCategory("expense-food", EXPENSE_LABELS.food, "shopping-cart", "expense"),
  createSystemCategory("expense-housing", EXPENSE_LABELS.housing, "home", "expense"),
  createSystemCategory("expense-occasion", EXPENSE_LABELS.occasion, "gift", "expense"),
  createSystemCategory("expense-utilities", EXPENSE_LABELS.publicUtilities, "zap", "expense"),
  createSystemCategory("expense-subscription", EXPENSE_LABELS.subscription, "repeat", "expense"),
  createSystemCategory("expense-dining", EXPENSE_LABELS.dining, "coffee", "expense"),
  createSystemCategory("expense-transport", EXPENSE_LABELS.transport, "navigation", "expense"),
  createSystemCategory("expense-shopping", EXPENSE_LABELS.shopping, "shopping-bag", "expense"),
  createSystemCategory("expense-medical", EXPENSE_LABELS.medical, "heart", "expense"),
  createSystemCategory("expense-beauty", EXPENSE_LABELS.beauty, "scissors", "expense"),
  createSystemCategory("expense-leisure", EXPENSE_LABELS.leisure, "smile", "expense"),
  createSystemCategory("expense-education", EXPENSE_LABELS.education, "book-open", "expense"),
  createSystemCategory("expense-other", EXPENSE_LABELS.other, "grid", "expense"),
] as const;
