export const ExpenseTextColorModes = {
  defaultText: "default-text",
  expense: "expense",
} as const;

export type ExpenseTextColorMode =
  (typeof ExpenseTextColorModes)[keyof typeof ExpenseTextColorModes];

export const ExpenseTextColorOptions: readonly {
  label: string;
  value: ExpenseTextColorMode;
}[] = [
  {
    label: "기본색",
    value: ExpenseTextColorModes.defaultText,
  },
  {
    label: "강조색",
    value: ExpenseTextColorModes.expense,
  },
];

export const ExpenseTextColorStorage = {
  key: "money-checks.settings.expense-text-color",
  legacyCalendarKey: "money-checks.settings.calendar-expense-color",
} as const;
