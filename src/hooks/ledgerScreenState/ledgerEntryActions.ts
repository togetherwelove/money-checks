import type { Session } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import { InstallmentStatuses } from "../../constants/installments";
import { deleteInstallmentGroup, prepayInstallmentGroup } from "../../lib/installmentTransactions";
import type { LedgerEntry, LedgerEntryDraft } from "../../types/ledger";
import {
  LedgerEntryDeleteScopes,
  type LedgerEntryDeleteScope,
} from "../../types/ledgerEntryDeletion";
import type { LedgerBook } from "../../types/ledgerBook";
import { mergeEntries } from "../../utils/ledgerEntries";
import { loadInstallmentEntries, removeLedgerEntry } from "./helpers";
import { persistLedgerEntryDraft } from "./persistLedgerEntryDraft";
import type { BusyTaskTracker } from "./types";
import type { useLedgerEditor } from "./useLedgerEditor";
import type { useLedgerEntries } from "./useLedgerEntries";
import type { useSelectedDateEntries } from "./useSelectedDateEntries";

type Options = {
  session: Session;
  activeBook: LedgerBook | null;
  entries: LedgerEntry[];
  editor: ReturnType<typeof useLedgerEditor>;
  trackBusyTask: BusyTaskTracker;
  blockReadOnlyEditIfNeeded: () => boolean;
  entryData: Pick<
    ReturnType<typeof useLedgerEntries>,
    "setEntries" | "removeEntriesFromCache" | "replaceInstallmentGroupInCache"
  >;
  selectedDateData: Pick<
    ReturnType<typeof useSelectedDateEntries>,
    "removeSelectedDateEntries" | "refreshSelectedDateEntries"
  >;
  setAllChartEntries: Dispatch<SetStateAction<LedgerEntry[] | null>>;
  setLedgerMutationRevision: Dispatch<SetStateAction<number>>;
};

export function createLedgerEntryActions({
  session,
  activeBook,
  entries,
  editor,
  trackBusyTask,
  blockReadOnlyEditIfNeeded,
  entryData,
  selectedDateData,
  setAllChartEntries,
  setLedgerMutationRevision,
}: Options) {
  const {
    draft,
    editingEntryId,
    editingEntrySnapshot,
    selectedDate,
    resetEditor,
    handleSelectDate,
  } = editor;
  const { setEntries, removeEntriesFromCache, replaceInstallmentGroupInCache } = entryData;
  const { removeSelectedDateEntries, refreshSelectedDateEntries } = selectedDateData;
  const handleSaveEntry = async (newDraft?: LedgerEntryDraft, sourceEntry?: LedgerEntry) => {
    const savedDraft = newDraft ?? draft;
    const savedEntries = await persistLedgerEntryDraft(
      {
        session,
        activeBook,
        entries,
        editingEntrySnapshot,
        trackBusyTask,
        setEntries,
        blockReadOnlyEditIfNeeded,
      },
      savedDraft,
      sourceEntry?.id ?? (newDraft ? null : editingEntryId),
      sourceEntry,
    );
    if (savedEntries.length === 0) {
      return [];
    }

    if (sourceEntry) {
      return savedEntries;
    } else if (newDraft) {
      handleSelectDate(savedDraft.date);
    } else {
      resetEditor(savedDraft.date);
    }
    return savedEntries;
  };

  const handleDeleteEntry = async (entry: LedgerEntry, scope: LedgerEntryDeleteScope) => {
    if (blockReadOnlyEditIfNeeded()) {
      return [];
    }

    if (entry.installmentStatus === InstallmentStatuses.prepaid && !entry.installmentGroupId) {
      return [];
    }

    let entriesToDelete = [entry];
    let deletedEntryIds = [entry.id];
    const installmentGroupId = entry.installmentGroupId;
    if (
      (scope === LedgerEntryDeleteScopes.installmentGroup ||
        entry.installmentStatus === InstallmentStatuses.prepaid) &&
      activeBook &&
      installmentGroupId
    ) {
      entriesToDelete = await loadInstallmentEntries(
        activeBook.id,
        installmentGroupId,
        trackBusyTask,
      );
      deletedEntryIds = await trackBusyTask(() =>
        deleteInstallmentGroup(activeBook.id, installmentGroupId),
      );
    } else {
      await removeLedgerEntry(entry.id);
    }

    const deletedEntryIdSet = new Set(deletedEntryIds);
    removeEntriesFromCache(deletedEntryIds);
    removeSelectedDateEntries(deletedEntryIds);
    setAllChartEntries(
      (currentEntries) =>
        currentEntries?.filter((currentEntry) => !deletedEntryIdSet.has(currentEntry.id)) ?? null,
    );
    if (editingEntryId && deletedEntryIdSet.has(editingEntryId)) {
      resetEditor(selectedDate);
    }
    setLedgerMutationRevision((currentRevision) => currentRevision + 1);

    return entriesToDelete;
  };

  const previewInstallmentPrepayment = async (entry: LedgerEntry, prepaymentDate: string) => {
    if (
      blockReadOnlyEditIfNeeded() ||
      !activeBook ||
      !entry.installmentGroupId ||
      entry.installmentStatus === InstallmentStatuses.prepaid
    ) {
      return null;
    }

    const installmentEntries = await loadInstallmentEntries(
      activeBook.id,
      entry.installmentGroupId,
      trackBusyTask,
    );
    const futureEntries = installmentEntries.filter(
      (installmentEntry) => installmentEntry.date > prepaymentDate,
    );
    if (futureEntries.length === 0) {
      return null;
    }

    return {
      installmentCount: futureEntries.length,
      totalAmount: futureEntries.reduce(
        (totalAmount, futureEntry) => totalAmount + futureEntry.amount,
        0,
      ),
    };
  };

  const prepayInstallmentEntry = async (entry: LedgerEntry, prepaymentDate: string) => {
    const installmentGroupId = entry.installmentGroupId;
    if (
      blockReadOnlyEditIfNeeded() ||
      !activeBook ||
      !installmentGroupId ||
      entry.installmentStatus === InstallmentStatuses.prepaid
    ) {
      return null;
    }

    const transactionResult = await trackBusyTask(() =>
      prepayInstallmentGroup(activeBook.id, installmentGroupId, prepaymentDate),
    );
    const updatedEntries = await loadInstallmentEntries(
      activeBook.id,
      installmentGroupId,
      trackBusyTask,
      true,
    );

    replaceInstallmentGroupInCache(installmentGroupId, updatedEntries);
    await refreshSelectedDateEntries();
    setAllChartEntries((currentEntries) =>
      currentEntries
        ? mergeEntries(
            currentEntries.filter(
              (currentEntry) => currentEntry.installmentGroupId !== installmentGroupId,
            ),
            updatedEntries,
          )
        : null,
    );
    setLedgerMutationRevision((currentRevision) => currentRevision + 1);

    return {
      deletedEntryIds: transactionResult.deletedEntryIds,
      installmentCount: transactionResult.installmentCount,
      prepaidEntryId: transactionResult.prepaidEntryId,
      totalAmount: transactionResult.totalAmount,
      updatedEntries,
    };
  };

  return {
    handleSaveEntry,
    handleDeleteEntry,
    previewInstallmentPrepayment,
    prepayInstallmentEntry,
  };
}
