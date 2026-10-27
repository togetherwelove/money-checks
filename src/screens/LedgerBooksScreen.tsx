import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { LedgerBookManagementView, type LedgerBookManagementViewProps } from "../components/LedgerBookManagementView";

export function LedgerBooksScreen(props: LedgerBookManagementViewProps) {
  const focused = useIsFocused();
  const bookId = props.state.activeBook?.id;
  const refreshShareCode = useRef(props.state.refreshExpiredShareCode);
  refreshShareCode.current = props.state.refreshExpiredShareCode;
  useEffect(() => {
    if (focused && bookId) void refreshShareCode.current();
  }, [focused, bookId]);

  return focused ? <LedgerBookManagementView {...props} /> : null;
}
