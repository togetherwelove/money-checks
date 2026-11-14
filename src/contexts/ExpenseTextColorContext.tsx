import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { type PropsWithChildren, createContext, useContext, useMemo } from "react";
import type { TextStyle } from "react-native";

import { getAppColors } from "../constants/colors";
import { type ExpenseTextColorMode, ExpenseTextColorModes } from "../constants/expenseTextColor";
import { useExpenseTextColorSetting } from "../hooks/useExpenseTextColorSetting";

type ExpenseTextColorContextValue = {
  mode: ExpenseTextColorMode;
  textColor: string;
  textStyle: TextStyle;
  updateMode: (mode: ExpenseTextColorMode) => void;
};

const getDefaultExpenseTextStyle = createThemeValue(
  (): TextStyle => ({
    color: getAppColors().text,
  }),
);

const getDefaultExpenseTextColor = createThemeValue(
  (): ExpenseTextColorContextValue => ({
    mode: ExpenseTextColorModes.defaultText,
    textColor: getAppColors().text,
    textStyle: getDefaultExpenseTextStyle(),
    updateMode: () => undefined,
  }),
);

const ExpenseTextColorContext = createContext<ExpenseTextColorContextValue | null>(null);

type ExpenseTextColorProviderProps = PropsWithChildren;

export function ExpenseTextColorProvider({ children }: ExpenseTextColorProviderProps) {
  const colorScheme = useAppTheme();
  const { expenseTextColorMode, updateExpenseTextColorMode } = useExpenseTextColorSetting();
  const value = useMemo<ExpenseTextColorContextValue>(() => {
    const textColor =
      expenseTextColorMode === ExpenseTextColorModes.expense
        ? getAppColors().expense
        : getAppColors().text;

    return {
      mode: expenseTextColorMode,
      textColor,
      textStyle: { color: textColor },
      updateMode: updateExpenseTextColorMode,
    };
  }, [expenseTextColorMode, updateExpenseTextColorMode, colorScheme]);

  return (
    <ExpenseTextColorContext.Provider value={value}>{children}</ExpenseTextColorContext.Provider>
  );
}

export function useExpenseTextColor() {
  useAppTheme();
  return useContext(ExpenseTextColorContext) ?? getDefaultExpenseTextColor();
}
