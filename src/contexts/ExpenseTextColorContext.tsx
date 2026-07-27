import {
  type PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from "react";
import type { TextStyle } from "react-native";

import { AppColors } from "../constants/colors";
import {
  type ExpenseTextColorMode,
  ExpenseTextColorModes,
} from "../constants/expenseTextColor";

type ExpenseTextColorContextValue = {
  mode: ExpenseTextColorMode;
  textColor: string;
  textStyle: TextStyle;
  updateMode: (mode: ExpenseTextColorMode) => void;
};

const defaultExpenseTextStyle: TextStyle = {
  color: AppColors.text,
};

const ExpenseTextColorContext = createContext<ExpenseTextColorContextValue>({
  mode: ExpenseTextColorModes.defaultText,
  textColor: AppColors.text,
  textStyle: defaultExpenseTextStyle,
  updateMode: () => undefined,
});

type ExpenseTextColorProviderProps = PropsWithChildren<{
  mode: ExpenseTextColorMode;
  onChange: (mode: ExpenseTextColorMode) => void;
}>;

export function ExpenseTextColorProvider({
  children,
  mode,
  onChange,
}: ExpenseTextColorProviderProps) {
  const value = useMemo<ExpenseTextColorContextValue>(
    () => {
      const textColor =
        mode === ExpenseTextColorModes.expense ? AppColors.expense : AppColors.text;

      return {
        mode,
        textColor,
        textStyle: { color: textColor },
        updateMode: onChange,
      };
    },
    [mode, onChange],
  );

  return (
    <ExpenseTextColorContext.Provider value={value}>
      {children}
    </ExpenseTextColorContext.Provider>
  );
}

export function useExpenseTextColor() {
  return useContext(ExpenseTextColorContext);
}
