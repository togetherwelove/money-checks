import {
  type ExpenseTextColorMode,
  ExpenseTextColorOptions,
} from "../../constants/expenseTextColor";
import { SettingsValueSelector } from "./SettingsValueSelector";

type ExpenseTextColorSelectorProps = {
  mode: ExpenseTextColorMode;
  onChange: (mode: ExpenseTextColorMode) => void;
};

export function ExpenseTextColorSelector({ mode, onChange }: ExpenseTextColorSelectorProps) {
  return (
    <SettingsValueSelector value={mode} options={ExpenseTextColorOptions} onChange={onChange} />
  );
}
