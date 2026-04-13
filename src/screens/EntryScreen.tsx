import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { EntryDatePickerModal } from "../components/EntryDatePickerModal";
import { EntryDateToolbar } from "../components/EntryDateToolbar";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { LedgerEditorPanel } from "../components/LedgerEditorPanel";
import { QueuedLedgerEntryList } from "../components/QueuedLedgerEntryList";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { appPlatform } from "../lib/appPlatform";
import type { LedgerEntryDraft, QueuedLedgerEntryDraft } from "../types/ledger";
import { formatSelectedDate, parseIsoDate, toIsoDate } from "../utils/calendar";
import { canSubmitDraft, createQueuedEntryId } from "../utils/ledgerEntries";

type EntryDatePickerTarget =
  | { kind: "draft" }
  | {
      entryId: string;
      kind: "queued-entry";
    };

type EntryScreenProps = {
  onSaveEntry: () => Promise<void>;
  onSaveEntries: (drafts: LedgerEntryDraft[]) => Promise<void>;
  state: LedgerScreenState;
};

export function EntryScreen({ onSaveEntry, onSaveEntries, state }: EntryScreenProps) {
  const actualToday = new Date();
  const todayIsoDate = toIsoDate(actualToday);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryDragging, setIsCategoryDragging] = useState(false);
  const [queuedEntries, setQueuedEntries] = useState<QueuedLedgerEntryDraft[]>([]);
  const [datePickerTarget, setDatePickerTarget] = useState<EntryDatePickerTarget>({
    kind: "draft",
  });
  const {
    draft,
    editingEntryId,
    entries,
    errorMessage,
    selectedDate,
    handleSelectDate,
    resetEditor,
    updateDraftField,
    updateDraftType,
  } = state;
  const pickerMode = appPlatform.entryDatePickerMode;
  const canQueueEntry = canSubmitDraft(draft);
  const resolvePickerDate = () => {
    if (datePickerTarget.kind === "queued-entry") {
      return (
        queuedEntries.find((entry) => entry.id === datePickerTarget.entryId)?.draft.date ??
        selectedDate
      );
    }

    return selectedDate;
  };

  const applySelectedDate = (isoDate: string) => {
    if (datePickerTarget.kind === "queued-entry") {
      setQueuedEntries((currentEntries) =>
        currentEntries.map((entry) =>
          entry.id === datePickerTarget.entryId
            ? {
                ...entry,
                draft: {
                  ...entry.draft,
                  date: isoDate,
                },
              }
            : entry,
        ),
      );
      return;
    }

    handleSelectDate(isoDate);
  };

  const handleOpenDatePicker = (target: EntryDatePickerTarget = { kind: "draft" }) => {
    setDatePickerTarget(target);
    const pickerDate = resolveDatePickerValue(target, queuedEntries, selectedDate);

    if (pickerMode === "native" && appPlatform.usesAndroidDatePickerDialog) {
      DateTimePickerAndroid.open({
        mode: "date",
        value: parseIsoDate(pickerDate),
        onChange: (_event, nextDate) => {
          if (!nextDate) {
            return;
          }

          applySelectedDate(toIsoDate(nextDate));
        },
      });
      return;
    }

    setIsDatePickerOpen(true);
  };

  const handleQueueEntry = () => {
    if (!canQueueEntry) {
      return;
    }

    setQueuedEntries((currentEntries) => [
      ...currentEntries,
      {
        draft: { ...draft, date: selectedDate },
        id: createQueuedEntryId(),
      },
    ]);
    resetEditor(selectedDate);
    updateDraftType(draft.type);
  };

  const handleSaveEntries = async () => {
    const draftsToSave = [
      ...queuedEntries.map((entry) => entry.draft),
      ...(canQueueEntry ? [{ ...draft, date: selectedDate }] : []),
    ];

    if (draftsToSave.length === 0) {
      return;
    }

    if (editingEntryId) {
      await onSaveEntry();
      return;
    }

    await onSaveEntries(draftsToSave);
    setQueuedEntries([]);
  };

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={!isCategoryDragging}
        style={styles.screen}
      >
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <EntryDateToolbar
          dateLabel={formatSelectedDate(selectedDate)}
          onMoveToToday={() => handleSelectDate(todayIsoDate)}
          onPressDateLabel={() => handleOpenDatePicker({ kind: "draft" })}
          showMoveToToday={selectedDate !== todayIsoDate}
        />
        {!editingEntryId ? (
          <QueuedLedgerEntryList
            entries={queuedEntries}
            onPressEntryDate={(entryId) => handleOpenDatePicker({ entryId, kind: "queued-entry" })}
            onRemoveEntry={(entryId) =>
              setQueuedEntries((currentEntries) =>
                currentEntries.filter((entry) => entry.id !== entryId),
              )
            }
          />
        ) : null}
        <LedgerEditorPanel
          canQueueEntry={canQueueEntry}
          draft={draft}
          editingEntryId={editingEntryId}
          onChangeDraft={updateDraftField}
          onCategoryDraggingChange={setIsCategoryDragging}
          onQueueEntry={!editingEntryId ? handleQueueEntry : null}
          onSaveEntry={handleSaveEntries}
          onSelectType={updateDraftType}
        />
      </KeyboardAwareScrollView>
      <EntryDatePickerModal
        entries={entries}
        isOpen={isDatePickerOpen}
        mode={pickerMode}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={applySelectedDate}
        selectedDate={resolvePickerDate()}
      />
    </>
  );
}

function resolveDatePickerValue(
  target: EntryDatePickerTarget,
  queuedEntries: QueuedLedgerEntryDraft[],
  selectedDate: string,
) {
  if (target.kind === "queued-entry") {
    return queuedEntries.find((entry) => entry.id === target.entryId)?.draft.date ?? selectedDate;
  }

  return selectedDate;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
    backgroundColor: AppColors.background,
    paddingBottom: 24,
  },
  error: {
    color: AppColors.expense,
    fontSize: 12,
  },
});
