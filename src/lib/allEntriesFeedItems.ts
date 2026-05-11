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
  let nextNativeAdEntryCount = NativeAdListConfig.insertionStartAfterEntryCount;

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const entryCount = index + 1;

    items.push({
      entry,
      key: entry.id,
      type: "entry",
    });

    if (shouldInsertNativeAdAfterEntryCount(entryCount)) {
      items.push({
        key: `native-ad-${entryCount}`,
        slotIndex: nativeAdSlotIndex,
        type: "native-ad",
      });
      nativeAdSlotIndex += 1;
      nextNativeAdEntryCount += getNativeAdInsertionInterval(nativeAdSlotIndex);
    }
  }

  return items;

  function shouldInsertNativeAdAfterEntryCount(entryCount: number) {
    return entryCount < entries.length && entryCount === nextNativeAdEntryCount;
  }
}

function getNativeAdInsertionInterval(slotIndex: number) {
  const intervalRange =
    NativeAdListConfig.insertionIntervalMax - NativeAdListConfig.insertionIntervalMin + 1;
  const stableRandomOffset =
    (slotIndex * NativeAdListConfig.insertionIntervalRandomMultiplier +
      NativeAdListConfig.insertionIntervalRandomSeed) %
    intervalRange;

  return NativeAdListConfig.insertionIntervalMin + stableRandomOffset;
}
