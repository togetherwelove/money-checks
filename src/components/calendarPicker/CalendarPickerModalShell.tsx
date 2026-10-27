import type { ReactNode } from "react";
import { NativePickerSheet } from "../NativePickerSheet";
import type { SheetHeaderAction } from "../NativeSelectionSheet";

export function CalendarPickerModalShell(props: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  scrollEnabled?: boolean;
  title: string;
  action?: SheetHeaderAction;
}) {
  return <NativePickerSheet {...props} />;
}
