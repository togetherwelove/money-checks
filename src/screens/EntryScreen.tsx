import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import type { ComponentRef } from "react";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppBannerAd } from "../components/AppBannerAd";
import { EntryDatePickerModal } from "../components/EntryDatePickerModal";
import { EntryDateToolbar } from "../components/EntryDateToolbar";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { LedgerEditorPanel } from "../components/LedgerEditorPanel";
import { QueuedLedgerEntryList } from "../components/QueuedLedgerEntryList";
import { ScreenContentContainer } from "../components/ScreenContentContainer";
import { AppColors } from "../constants/colors";
import { ENTRY_PHOTO_LIMIT, EntryPhotoCopy } from "../constants/entryPhotos";
import { AppLayout } from "../constants/layout";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { appPlatform } from "../lib/appPlatform";
import { pickImageAttachments } from "../lib/imageAttachments";
import { fetchLedgerBookMembers } from "../lib/ledgerBooks";
import { logAppError } from "../lib/logAppError";
import { showNativeToast } from "../lib/nativeToast";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import type { LedgerEntry, LedgerEntryDraft, QueuedLedgerEntryDraft } from "../types/ledger";
import { formatSelectedDate, parseIsoDate, toIsoDate } from "../utils/calendar";
import { canSubmitDraft, createQueuedEntryId } from "../utils/ledgerEntries";

type EntryDatePickerTarget =
  | { kind: "draft" }
  | {
      entryId: string;
      kind: "queued-entry";
    };

type EntryScreenProps = {
  currentUserId: string;
  onSaveEntry: () => Promise<void>;
  onSaveEntries: (drafts: LedgerEntryDraft[]) => Promise<void>;
  onSettleInstallmentEntry: (entry: LedgerEntry) => Promise<void>;
  showsBannerAd: boolean;
  state: LedgerScreenState;
};

export function EntryScreen({
  currentUserId,
  onSaveEntry,
  onSaveEntries,
  onSettleInstallmentEntry,
  showsBannerAd,
  state,
}: EntryScreenProps) {
  const actualToday = new Date();
  const todayIsoDate = toIsoDate(actualToday);
  const scrollViewRef = useRef<ComponentRef<typeof KeyboardAwareScrollView>>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryDragging, setIsCategoryDragging] = useState(false);
  const [members, setMembers] = useState<LedgerBookMember[]>([]);
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
    updateDraftInstallmentMonths,
    updateDraftPhotoAttachments,
    updateDraftType,
  } = state;
  const activeBookId = state.activeBook?.id ?? null;
  const editingEntry = entries.find((entry) => entry.id === editingEntryId) ?? null;
  const pickerMode = appPlatform.entryDatePickerMode;
  const canQueueEntry = canSubmitDraft(draft);

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      if (!activeBookId) {
        setMembers([]);
        return;
      }

      try {
        const nextMembers = await fetchLedgerBookMembers(activeBookId);
        if (isMounted) {
          setMembers(nextMembers);
        }
      } catch (error) {
        logAppError("EntryScreen", error, {
          activeBookId,
          step: "load_target_members",
        });
        if (isMounted) {
          setMembers([]);
        }
      }
    };

    void loadMembers();

    return () => {
      isMounted = false;
    };
  }, [activeBookId]);

  useEffect(() => {
    if (members.length === 0) {
      return;
    }

    const selectedMember = members.find((member) => member.userId === draft.targetMemberId);
    if (selectedMember) {
      if (draft.targetMemberName !== selectedMember.displayName) {
        updateDraftField("targetMemberName", selectedMember.displayName);
      }
      return;
    }

    const fallbackMemberId =
      members.find((member) => member.userId === currentUserId)?.userId ?? members[0]?.userId;
    const fallbackMember = members.find((member) => member.userId === fallbackMemberId);
    if (!fallbackMemberId || !fallbackMember) {
      return;
    }

    updateDraftField("targetMemberId", fallbackMemberId);
    updateDraftField("targetMemberName", fallbackMember.displayName);
  }, [
    currentUserId,
    draft.targetMemberId,
    draft.targetMemberName,
    members,
    updateDraftField,
  ]);
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

  const handlePickPhotoAttachments = async () => {
    try {
      const remainingAttachmentSlots = Math.max(
        0,
        ENTRY_PHOTO_LIMIT - draft.photoAttachments.length,
      );
      if (remainingAttachmentSlots === 0) {
        showNativeToast(EntryPhotoCopy.limitReachedError);
        return;
      }

      const nextAttachments = await pickImageAttachments({
        selectionLimit: remainingAttachmentSlots,
      });
      if (nextAttachments.length === 0) {
        return;
      }

      updateDraftPhotoAttachments([
        ...draft.photoAttachments,
        ...nextAttachments.map((attachment) => ({
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          uri: attachment.uri,
        })),
      ]);
    } catch {
      showNativeToast(EntryPhotoCopy.imagePickerError);
    }
  };

  const handleRemovePhotoAttachment = (attachmentId: string) => {
    updateDraftPhotoAttachments(
      draft.photoAttachments.filter(
        (attachment) => (attachment.id ?? attachment.uri) !== attachmentId,
      ),
    );
  };

  return (
    <>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        scrollEnabled={!isCategoryDragging}
        style={styles.screen}
      >
        <ScreenContentContainer style={styles.contentContainer}>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <EntryDateToolbar
            dateLabel={formatSelectedDate(selectedDate)}
            onMoveToToday={() => handleSelectDate(todayIsoDate)}
            onPressDateLabel={() => handleOpenDatePicker({ kind: "draft" })}
            showMoveToToday={selectedDate !== todayIsoDate}
          />
          {showsBannerAd ? <AppBannerAd /> : null}
          <LedgerEditorPanel
            canQueueEntry={canQueueEntry}
            draft={draft}
            editingEntryId={editingEntryId}
            members={members}
            onChangeDraft={updateDraftField}
            onChangeInstallmentMonths={updateDraftInstallmentMonths}
            onPickPhotoAttachments={handlePickPhotoAttachments}
            onCategoryDraggingChange={setIsCategoryDragging}
            onRemovePhotoAttachment={handleRemovePhotoAttachment}
            onQueueEntry={!editingEntryId ? handleQueueEntry : null}
            onSaveEntry={handleSaveEntries}
            onSelectType={updateDraftType}
            onSettleInstallmentEntry={
              editingEntry ? () => onSettleInstallmentEntry(editingEntry) : null
            }
            showInstallmentSettleAction={Boolean(
              editingEntry?.installmentMonths &&
                editingEntry.installmentOrder &&
                editingEntry.installmentOrder < editingEntry.installmentMonths,
            )}
          />
          {!editingEntryId ? (
            <QueuedLedgerEntryList
              entries={queuedEntries}
              onPressEntryDate={(entryId) =>
                handleOpenDatePicker({ entryId, kind: "queued-entry" })
              }
              onRemoveEntry={(entryId) =>
                setQueuedEntries((currentEntries) =>
                  currentEntries.filter((entry) => entry.id !== entryId),
                )
              }
            />
          ) : null}
        </ScreenContentContainer>
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
    paddingHorizontal: AppLayout.screenPadding,
    paddingBottom: 24,
  },
  contentContainer: {
    gap: AppLayout.cardGap,
    paddingTop: AppLayout.screenPadding,
  },
  error: {
    color: AppColors.expense,
    fontSize: 12,
  },
});
