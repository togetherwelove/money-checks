import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { LedgerEditorPanel } from "../components/LedgerEditorPanel";
import { AppColors } from "../constants/colors";
import { InstallmentStatuses } from "../constants/installments";
import { ENTRY_PHOTO_LIMIT, EntryPhotoCopy } from "../constants/entryPhotos";
import { KeyboardLayout } from "../constants/keyboard";
import { AppLayout } from "../constants/layout";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { pickImageAttachments } from "../lib/imageAttachments";
import { fetchLedgerBookMembers } from "../lib/ledgerBooks";
import { logAppError } from "../lib/logAppError";
import { showNativeToast } from "../lib/nativeToast";
import type { LedgerEntry, LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import type { InstallmentPrepaymentHandler } from "../types/installmentTransactions";

type EntryScreenProps = {
  autoFocusContent?: boolean;
  currentUserId: string;
  onDraftChange: () => void;
  onSaveEntry: () => Promise<void>;
  onPrepayInstallmentEntry: InstallmentPrepaymentHandler;
  state: LedgerScreenState;
};

export function EntryScreen({
  autoFocusContent = false,
  currentUserId,
  onDraftChange,
  onSaveEntry,
  onPrepayInstallmentEntry,
  state,
}: EntryScreenProps) {
  const [members, setMembers] = useState<LedgerBookMember[]>([]);
  const {
    draft,
    editingEntryId,
    entries,
    errorMessage,
    isRefreshing,
    refreshLedger,
    updateDraftField,
    updateDraftInstallmentMonths,
    updateDraftPhotoAttachments,
    updateDraftType,
  } = state;
  const activeBookId = state.activeBook?.id ?? null;
  const editingEntry = entries.find((entry) => entry.id === editingEntryId) ?? null;

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
  }, [currentUserId, draft.targetMemberId, draft.targetMemberName, members, updateDraftField]);
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

      onDraftChange();
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
    onDraftChange();
    updateDraftPhotoAttachments(
      draft.photoAttachments.filter(
        (attachment) => (attachment.id ?? attachment.uri) !== attachmentId,
      ),
    );
  };

  const handleChangeDraft = useCallback(
    (field: keyof LedgerEntryDraft, value: string) => {
      onDraftChange();
      updateDraftField(field, value);
    },
    [onDraftChange, updateDraftField],
  );

  const handleChangeInstallmentMonths = useCallback(
    (installmentMonths: number) => {
      onDraftChange();
      updateDraftInstallmentMonths(installmentMonths);
    },
    [onDraftChange, updateDraftInstallmentMonths],
  );

  const handleSelectType = useCallback(
    (entryType: LedgerEntryType) => {
      onDraftChange();
      updateDraftType(entryType);
    },
    [onDraftChange, updateDraftType],
  );

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardDismissMode={KeyboardLayout.dismissMode}
      keyboardShouldPersistTaps={KeyboardLayout.persistTaps}
      style={styles.screen}
    >
      {errorMessage ? (
        <Pressable
          accessibilityRole="button"
          disabled={isRefreshing}
          onPress={() => {
            if (isRefreshing) {
              return;
            }

            void refreshLedger();
          }}
          style={({ pressed }) => [
            styles.errorRetry,
            pressed && !isRefreshing ? styles.errorRetryPressed : null,
            isRefreshing ? styles.errorRetryDisabled : null,
          ]}
        >
          <Text style={styles.error}>{errorMessage}</Text>
          <Text style={styles.errorRetryLabel}>재시도</Text>
        </Pressable>
      ) : null}
      <LedgerEditorPanel
        activeBookId={activeBookId}
        autoFocusContent={autoFocusContent}
        draft={draft}
        editingEntryId={editingEntryId}
        members={members}
        onChangeDraft={handleChangeDraft}
        onChangeInstallmentMonths={handleChangeInstallmentMonths}
        onPickPhotoAttachments={handlePickPhotoAttachments}
        onRemovePhotoAttachment={handleRemovePhotoAttachment}
        onSaveEntry={onSaveEntry}
        onSelectType={handleSelectType}
        onPrepayInstallmentEntry={
          editingEntry ? () => onPrepayInstallmentEntry(editingEntry) : null
        }
        showInstallmentPrepaymentAction={Boolean(
          editingEntry?.type === "expense" &&
            editingEntry.installmentStatus !== InstallmentStatuses.prepaid &&
            editingEntry.installmentGroupId,
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  content: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.cardContentPadding,
  },
  error: {
    color: AppColors.expense,
    fontSize: 12,
  },
  errorRetry: {
    gap: 2,
    alignItems: "flex-start",
  },
  errorRetryPressed: {
    opacity: 0.7,
  },
  errorRetryDisabled: {
    opacity: 0.5,
  },
  errorRetryLabel: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});
