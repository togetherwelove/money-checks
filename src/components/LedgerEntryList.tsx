import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { useLedgerCategoryIconMap } from "../hooks/useLedgerCategoryIconMap";
import { useLedgerCategoryLabelMap } from "../hooks/useLedgerCategoryLabelMap";
import type { LedgerEntry } from "../types/ledger";
import { LedgerEntryListItem } from "./LedgerEntryListItem";

type LedgerEntryListProps = {
  closeSwipeRevision?: number;
  entries: LedgerEntry[];
  onDeleteEntry: (entry: LedgerEntry) => void | Promise<void>;
  onEditEntry: (entry: LedgerEntry) => void;
};

export function LedgerEntryList({
  closeSwipeRevision = 0,
  entries,
  onDeleteEntry,
  onEditEntry,
}: LedgerEntryListProps) {
  const [openSwipeEntryId, setOpenSwipeEntryId] = useState<string | null>(null);
  const closeSwipeRevisionRef = useRef(closeSwipeRevision);
  const categoryIconByKey = useLedgerCategoryIconMap();
  const categoryLabelById = useLedgerCategoryLabelMap();

  useEffect(() => {
    if (closeSwipeRevisionRef.current === closeSwipeRevision) {
      return;
    }

    closeSwipeRevisionRef.current = closeSwipeRevision;
    setOpenSwipeEntryId(null);
  });

  if (entries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{AppMessages.editorEmpty}</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry) => (
        <LedgerEntryListItem
          categoryIconByKey={categoryIconByKey}
          categoryLabelById={categoryLabelById}
          entry={entry}
          hasOpenSwipe={openSwipeEntryId !== null}
          isSwipeOpen={openSwipeEntryId === entry.id}
          key={entry.id}
          onDeleteEntry={onDeleteEntry}
          onEditEntry={onEditEntry}
          onRequestCloseOpenSwipe={() => setOpenSwipeEntryId(null)}
          onSwipeClose={(entryId) => {
            setOpenSwipeEntryId((currentEntryId) =>
              currentEntryId === entryId ? null : currentEntryId,
            );
          }}
          onSwipeOpen={setOpenSwipeEntryId}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: AppLayout.listItemGap,
  },
  emptyState: {
    flex: 1,
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: AppColors.mutedText,
    fontSize: 12,
    textAlign: "center",
  },
});
