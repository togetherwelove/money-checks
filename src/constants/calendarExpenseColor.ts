export const CalendarExpenseColorModes = {
  defaultText: "default-text",
  expense: "expense",
} as const;

export type CalendarExpenseColorMode =
  (typeof CalendarExpenseColorModes)[keyof typeof CalendarExpenseColorModes];

export const CalendarExpenseColorOptions: readonly {
  label: string;
  value: CalendarExpenseColorMode;
}[] = [
  {
    label: "검은색",
    value: CalendarExpenseColorModes.defaultText,
  },
  {
    label: "빨간색",
    value: CalendarExpenseColorModes.expense,
  },
];

export const CalendarExpenseColorStorage = {
  key: "money-checks.settings.calendar-expense-color",
} as const;

export const CalendarExpenseColorUi = {
  labelFontSize: 12,
  pressedOpacity: 0.72,
  segmentBorderWidth: 1,
  segmentMinHeight: 36,
  segmentRadius: 6,
  swatchBorderWidth: 1,
  swatchSize: 12,
} as const;
