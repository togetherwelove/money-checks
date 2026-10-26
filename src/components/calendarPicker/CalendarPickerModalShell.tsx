import type { ReactNode } from "react";
import { NativePickerSheet } from "../NativePickerSheet";

export function CalendarPickerModalShell(props: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  scrollEnabled?: boolean;
  title: string;
}) {
  return <NativePickerSheet {...props} />;
}
