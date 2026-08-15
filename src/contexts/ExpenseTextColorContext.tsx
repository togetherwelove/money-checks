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
import { useExpenseTextColorSetting } from "../hooks/useExpenseTextColorSetting";

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

type ExpenseTextColorProviderProps = PropsWithChildren;

export function ExpenseTextColorProvider({
  children,
}: ExpenseTextColorProviderProps) {
  const { expenseTextColorMode, updateExpenseTextColorMode } =
    useExpenseTextColorSetting();
  const value = useMemo<ExpenseTextColorContextValue>(
    () => {
      const textColor =
        expenseTextColorMode === ExpenseTextColorModes.expense
          ? AppColors.expense
          : AppColors.text;

      return {
        mode: expenseTextColorMode,
        textColor,
        textStyle: { color: textColor },
        updateMode: updateExpenseTextColorMode,
      };
    },
    [expenseTextColorMode, updateExpenseTextColorMode],
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
