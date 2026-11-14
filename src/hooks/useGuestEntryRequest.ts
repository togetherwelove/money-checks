import { useCallback, useState } from "react";
import { GuestEntryConfig } from "../constants/guest";
import { appStorage } from "../lib/appStorage";
import { readGuestEntryRequest, storeGuestEntryRequest } from "../lib/guestEntryRequest";

export function useGuestEntryRequest() {
  const [date, setDate] = useState(() => readGuestEntryRequest(appStorage));
  const clear = useCallback(() => {
    appStorage.removeItem(GuestEntryConfig.storageKey);
    setDate(null);
  }, []);
  const request = useCallback((selectedDate: string) => {
    storeGuestEntryRequest(appStorage, selectedDate);
    setDate(selectedDate);
  }, []);
  return { date, request, clear };
}
