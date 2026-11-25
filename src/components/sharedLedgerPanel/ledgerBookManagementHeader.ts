import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { LedgerBookManagementCopy } from "../../constants/ledgerBookManagement";
import type { SheetHeaderAction } from "../NativeSelectionSheet";

export const LedgerBookManagementHeaderContext = createContext<Dispatch<
  SetStateAction<SheetHeaderAction | undefined>
> | null>(null);

export function useLedgerBookManagementHeader() {
  const [action, setAction] = useState<SheetHeaderAction>();
  return { action, setAction };
}

export function useRegisterLedgerBookCreateAction(onPress: () => void, disabled: boolean) {
  const setAction = useContext(LedgerBookManagementHeaderContext);
  const currentAction = useRef(onPress);
  currentAction.current = onPress;
  const handlePress = useCallback(() => currentAction.current(), []);
  useEffect(() => {
    if (!setAction) return;
    setAction({
      label: LedgerBookManagementCopy.createAction,
      icon: "plus",
      onPress: handlePress,
      disabled,
    });
    return () => setAction(undefined);
  }, [setAction, handlePress, disabled]);
  return Boolean(setAction);
}
