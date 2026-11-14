import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

type Options = {
  date: string | null;
  selectedDate: string;
  ready: boolean;
  onSelectDate: (date: string) => void;
  onOpen: () => void;
  onConsume: () => void;
};

export function useResumeGuestEntry({
  date,
  selectedDate,
  ready,
  onSelectDate,
  onOpen,
  onConsume,
}: Options) {
  const [active, setActive] = useState(AppState.currentState === "active");
  const consumed = useRef(false);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!date) {
      consumed.current = false;
      return;
    }
    if (!ready || !active || consumed.current) return;
    if (selectedDate !== date) {
      onSelectDate(date);
      return;
    }
    consumed.current = true;
    onConsume();
    onOpen();
  }, [date, selectedDate, ready, active, onSelectDate, onOpen, onConsume]);
}
