import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type SheetPhase = "closed" | "open" | "closing";

export function useSheetTransition() {
  const [phase, setPhase] = useState<SheetPhase>("closed");
  const currentPhase = useRef<SheetPhase>("closed");
  const afterDismiss = useRef<(() => void) | undefined>(undefined);
  const mounted = useRef(true);
  const committedOpen = useRef(false);
  useLayoutEffect(() => {
    if (phase !== "closing") committedOpen.current = phase === "open";
  }, [phase]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; afterDismiss.current = undefined; };
  }, []);
  const updatePhase = useCallback((next: SheetPhase) => {
    if (!mounted.current) return;
    currentPhase.current = next;
    setPhase(next);
  }, []);
  const setOpen = useCallback((open: boolean) => {
    if (!mounted.current) return;
    if (open && currentPhase.current === "closing") {
      afterDismiss.current = () => updatePhase("open");
    } else if (open) updatePhase("open");
    else if (currentPhase.current === "open") updatePhase(committedOpen.current ? "closing" : "closed");
  }, [updatePhase]);
  const closeAfterDismiss = useCallback((action: () => void) => {
    if (!mounted.current) return;
    if (currentPhase.current === "closed" || (currentPhase.current === "open" && !committedOpen.current)) {
      updatePhase("closed");
      action();
      return;
    }
    afterDismiss.current = action;
    if (currentPhase.current === "open") updatePhase("closing");
  }, [updatePhase]);
  const onDismiss = useCallback(() => {
    if (!mounted.current || currentPhase.current !== "closing") return;
    const action = afterDismiss.current;
    afterDismiss.current = undefined;
    updatePhase("closed");
    action?.();
  }, [updatePhase]);
  return { isOpen: phase === "open", isPresented: phase !== "closed", setOpen, closeAfterDismiss, onDismiss };
}
