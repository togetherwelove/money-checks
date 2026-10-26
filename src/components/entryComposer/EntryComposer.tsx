import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Alert, Keyboard } from "react-native";
import type { TextInputInstance } from "react-native";

import { CardSmsClipboardCopy } from "../../constants/cardSmsClipboard";
import { EntryComposerCopy as Copy, type EntryComposerUnavailableReason } from "../../constants/entryComposer";
import { EntryRegistrationCopy } from "../../constants/entryRegistration";
import { useEntryComposer } from "../../hooks/useEntryComposer";
import { useLedgerCategories } from "../../hooks/useLedgerCategories";
import { createDuplicateEntryDraft } from "../../utils/duplicateLedgerEntry";
import { showNativeToast } from "../../lib/nativeToast";
import type { LedgerEntry, LedgerEntryDraft } from "../../types/ledger";
import { canSubmitDraft, createDraftFromEntry } from "../../utils/ledgerEntries";
import { getEntryComposerInvalidField, hasEntryComposerChanges, hasEntryComposerValues } from "../../utils/entryComposer";
import { EntryComposerPanel } from "./EntryComposerPanel";
import { EntryComposerSheet } from "./EntryComposerSheet";
import { EntryComposerHeader } from "./EntryComposerHeader";
import { EntryComposerForm } from "./EntryComposerForm";
import { InstallmentConversionModal } from "./InstallmentConversionModal";
import { InstallmentStatuses } from "../../constants/installments";
import { InstallmentConversionCopy } from "../../constants/installmentConversion";

type Props = {
  sheet: { visible: boolean; onClose: () => void; onDismiss?: () => void };
  ref?: Ref<EntryComposerHandle>;
  onDismissClipboard?: () => void;
  onReadClipboard?: () => void;
  bookId: string | null;
  selectedDate: string;
  userId: string;
  disabled: boolean;
  unavailableReason?: EntryComposerUnavailableReason;
  onSelectBook?: () => void;
  onSave: (draft: LedgerEntryDraft, sourceEntry?: LedgerEntry) => Promise<boolean>;
  onEntryReviewChange?: (open: boolean) => void;
  onConverted?: () => void;
  onComplete?: () => void;
};

export type EntryComposerHandle = {
  isSaving: () => boolean;
  isBusy: () => boolean;
  focus: () => void;
  importDraft: (draft: LedgerEntryDraft) => void;
  editEntry: (entry: LedgerEntry) => void;
  duplicateEntry: (entry: LedgerEntry) => void;
  discardDeletedEntry: (entries: LedgerEntry[]) => void;
};

export function EntryComposer({ ref, sheet, onDismissClipboard, onReadClipboard, bookId, selectedDate, userId, disabled, unavailableReason, onSelectBook, onSave, onEntryReviewChange, onConverted, onComplete }: Props) {
  const [conversionOpen, setConversionOpen] = useState(false);
  const [sourceEntry, setSourceEntry] = useState<LedgerEntry | undefined>();
  const composer = useEntryComposer(bookId, selectedDate, userId);
  const categories = useLedgerCategories(bookId);
  const duplicationContext = useRef({ selectedDate, members: composer.members, categories });
  duplicationContext.current = { selectedDate, members: composer.members, categories };
  const { draft, setDraft } = composer;
  const discardAlertOpen = useRef(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const inputRef = useRef<TextInputInstance>(null);
  const locked = disabled || saving;
  const hasInput = Boolean(draft.amount || draft.content || draft.note || draft.categoryId || draft.photoAttachments.length);
  const defaultMemberId = composer.members.find(member => member.userId === userId)?.userId
    ?? composer.members[0]?.userId ?? userId;
  const hasCloseValues = sourceEntry
    ? hasEntryComposerChanges(draft, sourceEntry, userId)
    : hasEntryComposerValues(draft, selectedDate, defaultMemberId);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const sheetVisible = sheet.visible;
  const sheetVisibleRef = useRef(sheetVisible);
  sheetVisibleRef.current = sheetVisible;
  const sheetPresented = useRef(false);

  useImperativeHandle(ref, () => ({
    isSaving: () => savingRef.current,
    isBusy: () => hasInput || savingRef.current,
    focus: () => { if (!locked) inputRef.current?.focus(); },
    discardDeletedEntry: (entries) => {
      if (!sourceEntry || !entries.some((entry) => entry.id === sourceEntry.id)) return;
      composer.reset(); setSourceEntry(undefined); onEntryReviewChange?.(false);
      Keyboard.dismiss();
    },
    editEntry: (entry) => {
      if (locked || savingRef.current || sourceEntry?.id === entry.id) return;
      const apply = () => {
        if (!mounted.current || lockedRef.current || savingRef.current) return;
        setDraft(createDraftFromEntry(entry, userId));
        setSourceEntry(entry);
        onEntryReviewChange?.(true);
        onDismissClipboard?.();
          Keyboard.dismiss();
      };
      if (!hasInput) { apply(); return; }
      Alert.alert(Copy.replaceEditTitle, Copy.replaceEditMessage, [
        { text: CardSmsClipboardCopy.keepAction, style: "cancel" },
        { text: Copy.replaceEditAction, style: "destructive", onPress: apply },
      ]);
    },
    importDraft: (imported) => {
      if (locked || savingRef.current) return;
      const apply = () => {
        if (!mounted.current || lockedRef.current || savingRef.current) return;
        const member = composer.members.find((item) => item.userId === userId) ?? composer.members[0];
        setDraft({ ...imported, targetMemberId: member?.userId ?? userId, targetMemberName: member?.displayName });
        setSourceEntry(undefined);
        onEntryReviewChange?.(false);
          Keyboard.dismiss();
      };
      if (!hasInput) { apply(); return; }
      Alert.alert(CardSmsClipboardCopy.replaceTitle, CardSmsClipboardCopy.replaceMessage, [
        { text: CardSmsClipboardCopy.keepAction, style: "cancel" },
        { text: CardSmsClipboardCopy.replaceAction, style: "destructive", onPress: apply },
      ]);
    },
    duplicateEntry: (entry) => {
      if (locked || savingRef.current) return;
      const apply = () => {
        if (!mounted.current || lockedRef.current || savingRef.current) return;
        const context = duplicationContext.current;
        const copied = createDuplicateEntryDraft(entry, context.selectedDate, userId, context.members, context.categories);
        setDraft(copied);
        setSourceEntry(undefined);
        onEntryReviewChange?.(true);
        onDismissClipboard?.();
          Keyboard.dismiss();
        if (!copied.categoryId || copied.targetMemberId !== (entry.targetMemberId ?? entry.authorId ?? userId)) {
          showNativeToast(Copy.duplicateAdjustedMessage);
        }
      };
      if (!hasInput) { apply(); return; }
      Alert.alert(Copy.replaceDuplicateTitle, Copy.replaceDuplicateMessage, [
        { text: CardSmsClipboardCopy.keepAction, style: "cancel" },
        { text: Copy.duplicate, style: "destructive", onPress: apply },
      ]);
    },
  }));
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => { if (locked) Keyboard.dismiss(); }, [locked]);

  useEffect(() => {
    if (sheetVisible === false) {
      sheetPresented.current = false;
      inputRef.current?.blur();
      Keyboard.dismiss();
    } else if (sheetVisible && sheetPresented.current && !locked) {
      inputRef.current?.focus();
    }
  }, [sheetVisible, locked]);

  const requestDiscard = (afterDiscard?: () => void, allowDisabled = false) => {
    if ((!allowDisabled && lockedRef.current) || savingRef.current || !mounted.current || discardAlertOpen.current) return;
    discardAlertOpen.current = true;
    let resolved = false;
    const close = () => {
      if (resolved) return false;
      resolved = true;
      discardAlertOpen.current = false;
      return true;
    };
    Alert.alert(EntryRegistrationCopy.discardChangesTitle, EntryRegistrationCopy.discardChangesMessage, [
      { text: EntryRegistrationCopy.discardChangesCancelAction, style: "cancel", onPress: close },
      { text: EntryRegistrationCopy.discardChangesConfirmAction, style: "destructive", onPress: () => {
        if (close() && discard(allowDisabled)) afterDiscard?.();
      } },
    ], { cancelable: true, onDismiss: close });
  };
  const discard = (allowDisabled = false) => {
    if (!mounted.current || (!allowDisabled && lockedRef.current) || savingRef.current) return false;
    Keyboard.dismiss();
    composer.reset();
    setSourceEntry(undefined);
    onEntryReviewChange?.(false);
    return true;
  };
  const dismissSheet = () => {
    if (!mounted.current || savingRef.current) return;
    sheetPresented.current = false;
    sheetVisibleRef.current = false;
    inputRef.current?.blur();
    Keyboard.dismiss();
    sheet.onClose();
  };
  const requestClose = () => {
    if (!mounted.current || savingRef.current) return;
    if (hasCloseValues) requestDiscard(dismissSheet, true);
    else {
      if (sourceEntry) discard(true);
      dismissSheet();
    }
  };
  const save = async () => {
    if (locked || savingRef.current || getEntryComposerInvalidField(draft)) return;
    savingRef.current = true;
    setSaving(true);
    Keyboard.dismiss();
    try {
      if (await onSave(draft, sourceEntry)) {
        if (!mounted.current) return;
        composer.reset();
        setSourceEntry(undefined); onEntryReviewChange?.(false);
        onComplete?.();
        showNativeToast(sourceEntry ? EntryRegistrationCopy.saveUpdateSuccess : EntryRegistrationCopy.saveCreateSuccess);
      }
    } catch {
      showNativeToast(EntryRegistrationCopy.saveError);
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  const content = (
    <EntryComposerPanel disabled={disabled} saving={saving}
      unavailableReason={unavailableReason} onSelectBook={onSelectBook}>
      {conversionOpen && bookId && sourceEntry?.installmentGroupId ? <InstallmentConversionModal
        bookId={bookId} groupId={sourceEntry.installmentGroupId}
        onClose={() => setConversionOpen(false)} onConverted={() => {
          setConversionOpen(false);
          discard();
          showNativeToast(InstallmentConversionCopy.success);
          onConverted?.();
        }} /> : null}
      <EntryComposerForm composer={composer} bookId={bookId} disabled={locked}
        onReadClipboard={onReadClipboard}
        editing={Boolean(sourceEntry)} inputRef={inputRef} onChangeText={onDismissClipboard}
        onConvert={sourceEntry?.installmentGroupId && sourceEntry.type === "expense" && sourceEntry.installmentStatus !== InstallmentStatuses.prepaid
          ? () => setConversionOpen(true) : undefined} />
    </EntryComposerPanel>
  );
  return <EntryComposerSheet visible={sheet.visible} saving={saving} onDismiss={sheet.onDismiss}
    onShow={() => {
      if (!sheetVisibleRef.current) return;
      sheetPresented.current = true;
      if (!lockedRef.current) inputRef.current?.focus();
    }}
    onClose={requestClose} header={<EntryComposerHeader type={draft.type}
      typeDisabled={locked}
      onSelectType={type => { if (!locked && type !== draft.type) setDraft(current => ({ ...current, type, category: "", categoryId: "" })); }}
      saving={saving} actionDisabled={locked || !canSubmitDraft(draft)}
      actionLabel={saving ? Copy.saving : sourceEntry ? Copy.saveEdit : Copy.save}
      onAction={save} onClose={requestClose} />}>{content}</EntryComposerSheet>;
}
