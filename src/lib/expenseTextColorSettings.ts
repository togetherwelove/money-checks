import {
  type ExpenseTextColorMode,
  ExpenseTextColorModes,
  ExpenseTextColorStorage,
} from "../constants/expenseTextColor";
import { appStorage } from "./appStorage";

export function readExpenseTextColorMode(): ExpenseTextColorMode {
  const storedValue = appStorage.getItem(ExpenseTextColorStorage.key);
  if (isExpenseTextColorMode(storedValue)) {
    if (appStorage.getItem(ExpenseTextColorStorage.legacyCalendarKey) !== null) {
      appStorage.removeItem(ExpenseTextColorStorage.legacyCalendarKey);
    }
    return storedValue;
  }

  const legacyStoredValue = appStorage.getItem(ExpenseTextColorStorage.legacyCalendarKey);
  if (isExpenseTextColorMode(legacyStoredValue)) {
    writeExpenseTextColorMode(legacyStoredValue);
    appStorage.removeItem(ExpenseTextColorStorage.legacyCalendarKey);
    return legacyStoredValue;
  }

  return ExpenseTextColorModes.defaultText;
}

export function writeExpenseTextColorMode(mode: ExpenseTextColorMode): void {
  appStorage.setItem(ExpenseTextColorStorage.key, mode);
}

function isExpenseTextColorMode(value: string | null): value is ExpenseTextColorMode {
  return (
    value === ExpenseTextColorModes.defaultText || value === ExpenseTextColorModes.expense
  );
}
