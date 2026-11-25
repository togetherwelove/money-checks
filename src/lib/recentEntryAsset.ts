import { randomUUID } from "expo-crypto";
import type { EntryAssetLink } from "../types/assetLink";
import type { AppStorage } from "./appStorage.shared";

function storageKey(userId: string, bookId: string) {
  return `recent-entry-cash-asset:${encodeURIComponent(userId)}:${encodeURIComponent(bookId)}`;
}

export function readRecentEntryAsset(storage: AppStorage, userId: string, bookId: string | null) {
  return bookId ? storage.getItem(storageKey(userId, bookId)) : null;
}

export function rememberEntryAsset(
  storage: AppStorage,
  userId: string,
  bookId: string | null,
  cashAssetId: string | null,
) {
  if (!bookId) return;
  const key = storageKey(userId, bookId);
  if (cashAssetId) storage.setItem(key, cashAssetId);
  else storage.removeItem(key);
}

export function createRecentEntryAssetLink(cashAssetId: string | null): EntryAssetLink | undefined {
  return cashAssetId
    ? { requestId: randomUUID(), cashAssetId, loanAssetId: null, principal: "0", fee: "0" }
    : undefined;
}
