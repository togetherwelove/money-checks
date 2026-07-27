import { useCallback, useState } from "react";

import type { ExpenseTextColorMode } from "../constants/expenseTextColor";
import {
  readExpenseTextColorMode,
  writeExpenseTextColorMode,
} from "../lib/expenseTextColorSettings";

export function useExpenseTextColorSetting() {
  const [expenseTextColorMode, setExpenseTextColorMode] = useState(readExpenseTextColorMode);

  const updateExpenseTextColorMode = useCallback((mode: ExpenseTextColorMode) => {
    setExpenseTextColorMode(mode);
    writeExpenseTextColorMode(mode);
  }, []);

  return {
    expenseTextColorMode,
    updateExpenseTextColorMode,
  };
}
