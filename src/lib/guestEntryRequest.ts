import { GuestEntryConfig } from "../constants/guest";
import type { AppStorage } from "./appStorage.shared";
import { parseIsoDate, toIsoDate } from "../utils/calendar";

export function readGuestEntryRequest(storage: AppStorage, now = Date.now()): string | null {
  try {
    const stored = storage.getItem(GuestEntryConfig.storageKey);
    if (!stored) return null;
    const request = JSON.parse(stored);
    if (
      typeof request.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(request.date) ||
      typeof request.createdAt !== "number" ||
      !Number.isFinite(request.createdAt) ||
      now < request.createdAt ||
      now - request.createdAt > GuestEntryConfig.maxAgeMs ||
      toIsoDate(parseIsoDate(request.date)) !== request.date
    ) {
      storage.removeItem(GuestEntryConfig.storageKey);
      return null;
    }
    return request.date;
  } catch {
    storage.removeItem(GuestEntryConfig.storageKey);
    return null;
  }
}

export function storeGuestEntryRequest(storage: AppStorage, date: string) {
  storage.setItem(GuestEntryConfig.storageKey, JSON.stringify({ date, createdAt: Date.now() }));
}
