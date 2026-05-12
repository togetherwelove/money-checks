import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import type { ComponentRef } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, type TextInput, View, findNodeHandle } from "react-native";

import { AppBannerAd } from "../components/AppBannerAd";
import { EntryDatePickerModal } from "../components/EntryDatePickerModal";
import { EntryDateToolbar } from "../components/EntryDateToolbar";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { LedgerEditorPanel } from "../components/LedgerEditorPanel";
import { AppColors } from "../constants/colors";
import { ENTRY_PHOTO_LIMIT, EntryPhotoCopy } from "../constants/entryPhotos";
import { KeyboardLayout } from "../constants/keyboard";
import { AppLayout } from "../constants/layout";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { appPlatform } from "../lib/appPlatform";
import { pickImageAttachments } from "../lib/imageAttachments";
import { fetchLedgerBookMembers } from "../lib/ledgerBooks";
import { logAppError } from "../lib/logAppError";
import { showNativeToast } from "../lib/nativeToast";
import type { LedgerEntry } from "../types/ledger";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import { formatSelectedDate, parseIsoDate, toIsoDate } from "../utils/calendar";

type EntryScreenProps = {
  currentUserId: string;
  onSaveEntry: () => Promise<void>;
  onSettleInstallmentEntry: (entry: LedgerEntry) => Promise<void>;
  showsBannerAd: boolean;
  state: LedgerScreenState;
};

type KeyboardAwareScrollViewRef = ComponentRef<typeof KeyboardAwareScrollView> & {
  scrollToFocusedInput?: (nodeHandle: number) => void;
};

export function EntryScreen({
  currentUserId,
  onSaveEntry,
  onSettleInstallmentEntry,
  showsBannerAd,
  state,
}: EntryScreenProps) {
  const actualToday = new Date();
  const todayIsoDate = toIsoDate(actualToday);
  const scrollViewRef = useRef<ComponentRef<typeof KeyboardAwareScrollView>>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryDragging, setIsCategoryDragging] = useState(false);
  const [focusedInputHeight, setFocusedInputHeight] = useState(0);
  const [members, setMembers] = useState<LedgerBookMember[]>([]);
  const {
    draft,
    editingEntryId,
    entries,
    errorMessage,
    selectedDate,
    handleSelectDate,
    updateDraftField,
    updateDraftInstallmentMonths,
    updateDraftPhotoAttachments,
    updateDraftType,
  } = state;
  const activeBookId = state.activeBook?.id ?? null;
  const editingEntry = entries.find((entry) => entry.id === editingEntryId) ?? null;
  const entryFormDate = editingEntryId ? draft.date : selectedDate;

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
  const applyEntryFormDate = (isoDate: string) => {
    if (editingEntryId) {
      updateDraftField("date", isoDate);
      return;
    }

    handleSelectDate(isoDate);
  };

  const handleOpenDatePicker = () => {
    if (appPlatform.usesAndroidDatePickerDialog) {
      DateTimePickerAndroid.open({
        mode: "date",
        value: parseIsoDate(entryFormDate),
        onChange: (_event, nextDate) => {
          if (!nextDate) {
            return;
          }

          applyEntryFormDate(toIsoDate(nextDate));
        },
      });
      return;
    }

    setIsDatePickerOpen(true);
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

  const handleEntryInputFocus = (input: TextInput | null, inputHeight: number) => {
    setFocusedInputHeight(inputHeight);

    const inputNodeHandle = input ? findNodeHandle(input) : null;
    const keyboardAwareScrollView = scrollViewRef.current as KeyboardAwareScrollViewRef | null;
    if (!inputNodeHandle || !keyboardAwareScrollView?.scrollToFocusedInput) {
      return;
    }

    requestAnimationFrame(() => {
      keyboardAwareScrollView.scrollToFocusedInput?.(inputNodeHandle);
    });
  };

  const entryKeyboardExtraScrollHeight =
    resolveFocusedInputKeyboardExtraScrollHeight(focusedInputHeight);
  const contentBottomPadding = entryKeyboardExtraScrollHeight;
  const contentContainerStyle = useMemo(
    () => [styles.content, { paddingBottom: contentBottomPadding }],
    [contentBottomPadding],
  );

  return (
    <>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={contentContainerStyle}
        extraScrollHeight={entryKeyboardExtraScrollHeight}
        scrollEnabled={!isCategoryDragging}
        style={styles.screen}
      >
        {showsBannerAd ? <AppBannerAd /> : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <EntryDateToolbar
          dateLabel={formatSelectedDate(entryFormDate)}
          onMoveToToday={() => applyEntryFormDate(todayIsoDate)}
          onPressDateLabel={handleOpenDatePicker}
          onSelectType={updateDraftType}
          selectedType={draft.type}
          showMoveToToday={entryFormDate !== todayIsoDate}
        />
        <LedgerEditorPanel
          draft={draft}
          editingEntryId={editingEntryId}
          members={members}
          onCategoryDraggingChange={setIsCategoryDragging}
          onChangeDraft={updateDraftField}
          onChangeInstallmentMonths={updateDraftInstallmentMonths}
          onInputBlur={() => setFocusedInputHeight(0)}
          onInputFocus={handleEntryInputFocus}
          onPickPhotoAttachments={handlePickPhotoAttachments}
          onRemovePhotoAttachment={handleRemovePhotoAttachment}
          onSaveEntry={onSaveEntry}
          onSettleInstallmentEntry={
            editingEntry ? () => onSettleInstallmentEntry(editingEntry) : null
          }
          showInstallmentSettleAction={Boolean(
            editingEntry?.installmentMonths &&
              editingEntry.installmentOrder &&
              editingEntry.installmentOrder < editingEntry.installmentMonths,
          )}
        />
      </KeyboardAwareScrollView>
      <EntryDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={applyEntryFormDate}
        selectedDate={entryFormDate}
      />
    </>
  );
}

function resolveFocusedInputKeyboardExtraScrollHeight(inputHeight: number) {
  if (inputHeight <= 0) {
    return 0;
  }

  const measuredExtraHeight = inputHeight * KeyboardLayout.focusedInputExtraScrollHeightRatio;
  return Math.min(
    KeyboardLayout.focusedInputExtraScrollHeightMax,
    Math.max(KeyboardLayout.focusedInputExtraScrollHeightMin, measuredExtraHeight),
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: AppLayout.screenTopPadding,
  },
  error: {
    color: AppColors.expense,
    fontSize: 12,
  },
});
