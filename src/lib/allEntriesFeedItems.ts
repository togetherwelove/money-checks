import { NativeAdListConfig } from "../constants/ads";
import type { LedgerEntry } from "../types/ledger";

export type AllEntriesFeedItem =
  | {
      entry: LedgerEntry;
      key: string;
      type: "entry";
    }
  | {
      key: string;
      slotIndex: number;
      type: "native-ad";
    };

export function buildAllEntriesFeedItems(entries: LedgerEntry[]): AllEntriesFeedItem[] {
  const items: AllEntriesFeedItem[] = [];
  let nativeAdSlotIndex = 0;

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const entryCount = index + 1;

    items.push({
      entry,
      key: entry.id,
      type: "entry",
    });

    if (shouldInsertNativeAdAfterEntryCount(entryCount, entries.length)) {
      items.push({
        key: `native-ad-${entryCount}`,
        slotIndex: nativeAdSlotIndex,
        type: "native-ad",
      });
      nativeAdSlotIndex += 1;
    }
  }

  return items;
}

function shouldInsertNativeAdAfterEntryCount(entryCount: number, totalEntryCount: number) {
  if (entryCount >= totalEntryCount) {
    return false;
  }

  if (entryCount < NativeAdListConfig.insertionStartAfterEntryCount) {
    return false;
  }

  return (
    (entryCount - NativeAdListConfig.insertionStartAfterEntryCount) %
      NativeAdListConfig.insertionInterval ===
    0
  );
}
