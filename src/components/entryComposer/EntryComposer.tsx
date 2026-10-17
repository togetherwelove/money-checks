import { AppScrollBehavior } from "../../constants/scroll";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Feather } from "@expo/vector-icons";
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CATEGORY_OPTIONS } from "../../constants/categories";
import { CardSmsClipboardCopy } from "../../constants/cardSmsClipboard";
import { AppColors } from "../../constants/colors";
import { EntryComposerCopy as Copy, EntryComposerUi as Ui, type EntryComposerStep } from "../../constants/entryComposer";
import { EntryRegistrationCopy } from "../../constants/entryRegistration";
import { AppLayout } from "../../constants/layout";
import { useEntryComposer } from "../../hooks/useEntryComposer";
import { formatInstallmentLabel } from "../../lib/installments";
import { showNativeToast } from "../../lib/nativeToast";
import type { LedgerEntry, LedgerEntryDraft } from "../../types/ledger";
import { formatAmountInput, sanitizeAmountValue } from "../../utils/amount";
import { formatCurrency } from "../../utils/calendar";
import { canSubmitDraft, createDraftFromEntry } from "../../utils/ledgerEntries";
import { getEntryComposerInvalidField, getEntryComposerNextStep } from "../../utils/entryComposer";
import { ActionButton } from "../ActionButton";
import { ICON_ACTION_BUTTON_COMPACT_SIZE, IconActionButton } from "../IconActionButton";
import { EntryDiscardModal } from "./EntryDiscardModal";
import { EntryCancelButton } from "./EntryCancelButton";
import { EntryPendingStatus } from "./EntryPendingStatus";
import { CategorySelector } from "../CategorySelector";
import { EntryTypeToggleButton } from "../EntryTypeToggleButton";
import { EntryComposerDetails } from "./EntryComposerDetails";
import { InstallmentConversionModal } from "./InstallmentConversionModal";
import { InstallmentStatuses } from "../../constants/installments";
import { InstallmentConversionCopy } from "../../constants/installmentConversion";
import { ClipboardEntrySuggestion } from "./ClipboardEntrySuggestion";
import type { CardSmsClipboardDraft } from "../../lib/cardSmsClipboardImport";

type Props = {
  ref?: Ref<EntryComposerHandle>;
  clipboardDraft?: CardSmsClipboardDraft | null;
  onApplyClipboard?: () => void;
  onDismissClipboard?: () => void;
  onReadClipboard?: () => void;
  availableHeight: number;
  bookId: string | null;
  selectedDate: string;
  userId: string;
  disabled: boolean;
  onSave: (draft: LedgerEntryDraft, sourceEntry?: LedgerEntry) => Promise<boolean>;
  onEditingChange?: (editing: boolean) => void;
  onConverted?: () => void;
};

export type EntryComposerHandle = {
  isBusy: () => boolean;
  focus: () => void;
  importDraft: (draft: LedgerEntryDraft) => void;
  editEntry: (entry: LedgerEntry) => void;
  discardDeletedEntry: (entries: LedgerEntry[]) => void;
};

export function EntryComposer({ ref, clipboardDraft, onApplyClipboard, onDismissClipboard, onReadClipboard, availableHeight, bookId, selectedDate, userId, disabled, onSave, onEditingChange, onConverted }: Props) {
  const [conversionOpen, setConversionOpen] = useState(false);
  const [sourceEntry, setSourceEntry] = useState<LedgerEntry | undefined>();
  const composer = useEntryComposer(bookId, selectedDate, userId);
  const { draft, update, setDraft } = composer;
  const [step, setStep] = useState<EntryComposerStep>("amount");
  const [confirmed, setConfirmed] = useState({ amount: false, content: false });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const showExpandedDetails = detailsOpen && step === "review";
  const SummaryContainer = showExpandedDetails ? View : ScrollView;
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const returnToReview = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const isTextStep = step === "amount" || step === "content" || step === "note";
  const inputField = step === "amount" ? "amount" : step === "content" ? "content" : "note";
  const hasSummaryContent = Boolean(confirmed.amount || confirmed.content || draft.categoryId || draft.note || step === "category" || step === "review");
  const locked = disabled || saving;
  const hasInput = Boolean(draft.amount || draft.content || draft.note || draft.categoryId || draft.photoAttachments.length);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  useImperativeHandle(ref, () => ({
    isBusy: () => hasInput || savingRef.current,
    focus: () => { if (!locked) inputRef.current?.focus(); },
    discardDeletedEntry: (entries) => {
      if (!sourceEntry || !entries.some((entry) => entry.id === sourceEntry.id)) return;
      composer.reset(); setSourceEntry(undefined); onEditingChange?.(false);
      setStep("amount"); setConfirmed({ amount: false, content: false }); setDetailsOpen(false);
      returnToReview.current = false;
      Keyboard.dismiss();
    },
    editEntry: (entry) => {
      if (locked || savingRef.current || sourceEntry?.id === entry.id) return;
      const apply = () => {
        if (!mounted.current || lockedRef.current || savingRef.current) return;
        setDraft(createDraftFromEntry(entry, userId));
        setSourceEntry(entry);
        onEditingChange?.(true);
        onDismissClipboard?.();
        setConfirmed({ amount: true, content: true });
        setStep("review");
        setDetailsOpen(false);
        returnToReview.current = false;
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
        onEditingChange?.(false);
        setConfirmed({ amount: true, content: true });
        setStep("category");
        setDetailsOpen(false);
        returnToReview.current = false;
        Keyboard.dismiss();
      };
      if (!hasInput) { apply(); return; }
      Alert.alert(CardSmsClipboardCopy.replaceTitle, CardSmsClipboardCopy.replaceMessage, [
        { text: CardSmsClipboardCopy.keepAction, style: "cancel" },
        { text: CardSmsClipboardCopy.replaceAction, style: "destructive", onPress: apply },
      ]);
    },
  }));
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (step === "content" || step === "note" || (step === "amount" && confirmed.amount)) {
      inputRef.current?.focus();
    }
  }, [step, confirmed.amount]);

  const edit = (next: EntryComposerStep) => {
    returnToReview.current = canSubmitDraft(draft);
    setStep(next);
    if (next === "category") Keyboard.dismiss();
    else if (next === step) inputRef.current?.focus();
  };
  const advance = () => {
    if (locked) return;
    if (step === "amount" && getEntryComposerInvalidField(draft) === "amount") {
      showNativeToast(EntryRegistrationCopy.amountRequiredError);
      return;
    }
    if (step === "content" && !draft.content.trim()) {
      showNativeToast(EntryRegistrationCopy.contentRequiredError);
      return;
    }
    if (step === "amount" || step === "content") setConfirmed((current) => ({ ...current, [step]: true }));
    const next = getEntryComposerNextStep(draft, step, returnToReview.current);
    returnToReview.current = false;
    setStep(next);
    if (next !== "content") Keyboard.dismiss();
  };
  const clear = () => {
    if (lockedRef.current || savingRef.current) return;
    setDiscardOpen(true);
  };
  const discard = () => {
    if (lockedRef.current || savingRef.current) return;
    Keyboard.dismiss();
    setDiscardOpen(false);
    composer.reset();
    setSourceEntry(undefined);
    onEditingChange?.(false);
    setStep("amount");
    setConfirmed({ amount: false, content: false });
    setDetailsOpen(false);
    returnToReview.current = false;
  };
  const save = async () => {
    if (locked || savingRef.current || getEntryComposerInvalidField(draft)) return;
    savingRef.current = true;
    setSaving(true);
    Keyboard.dismiss();
    try {
      if (await onSave(draft, sourceEntry)) {
        if (!mounted.current) return;
        composer.reset(); setStep("amount"); setConfirmed({ amount: false, content: false }); setDetailsOpen(false);
        setSourceEntry(undefined); onEditingChange?.(false);
        showNativeToast(sourceEntry ? EntryRegistrationCopy.saveUpdateSuccess : EntryRegistrationCopy.saveCreateSuccess);
      }
    } catch {
      showNativeToast(EntryRegistrationCopy.saveError);
    } finally { savingRef.current = false; setSaving(false); }
  };
  const row = (label: string, value: string, field: EntryComposerStep) => (
    <View style={styles.summaryRow}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${value}`}
      accessibilityHint={Copy.editAccessibilityHint}
      disabled={locked} onPress={() => edit(field)} style={({ pressed }) => [styles.row, styles.summaryEditButton, pressed && styles.pressedRow]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.editableValue}>
        <Text style={styles.value}>{value}</Text>
        <Feather name="edit-2" size={Ui.editIconSize} color={AppColors.mutedText} />
      </View>
    </Pressable>
    {field === "note" ? <IconActionButton size="compact" disabled={locked}
      accessibilityLabel={Copy.clearNote} icon="x" onPress={() => update("note", "")} /> : null}
    </View>
  );

  return (
    <View style={[styles.panel, step === "amount" && styles.amountPanel]}>
      {conversionOpen && bookId && sourceEntry?.installmentGroupId ? <InstallmentConversionModal
        bookId={bookId} groupId={sourceEntry.installmentGroupId}
        onClose={() => setConversionOpen(false)} onConverted={() => {
          setConversionOpen(false);
          discard();
          showNativeToast(InstallmentConversionCopy.success);
          onConverted?.();
        }} /> : null}
      <EntryDiscardModal visible={discardOpen} onCancel={() => setDiscardOpen(false)} onDiscard={discard} />
      {!locked && clipboardDraft && onApplyClipboard && onDismissClipboard ? (
        <ClipboardEntrySuggestion draft={clipboardDraft} onApply={onApplyClipboard} onDismiss={onDismissClipboard} />
      ) : null}
      {hasSummaryContent ? <SummaryContainer {...AppScrollBehavior} pointerEvents={locked ? "none" : "auto"} accessibilityElementsHidden={saving}
        style={showExpandedDetails ? styles.scrollContent : [styles.stackViewport, { maxHeight: availableHeight * Ui.panelMaxHeightRatio }]}
        contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.stack}>
          {confirmed.amount || confirmed.content ? <View style={styles.pendingHeader}>
            <EntryPendingStatus entryType={draft.type} editing={Boolean(sourceEntry)} />
            <EntryCancelButton disabled={locked} onPress={clear} />
          </View> : null}
          {confirmed.amount ? row(Copy.amount, formatCurrency(Number(draft.amount)), "amount") : null}
          {confirmed.content ? row(EntryRegistrationCopy.contentLabel, draft.content, "content") : null}
          {draft.categoryId ? row(EntryRegistrationCopy.categoryLabel, draft.category, "category") : null}
          {draft.note ? row(EntryRegistrationCopy.noteLabel, draft.note, "note") : null}
        </View>
        {step === "category" || step === "review" ? (
        <View style={styles.reviewSection}>
          {step === "category" ? <CategorySelector bookId={bookId} categories={CATEGORY_OPTIONS[draft.type]} entryType={draft.type}
            selectedCategoryId={draft.categoryId} onSelectCategory={(category) => {
              update("category", category?.label ?? ""); update("categoryId", category?.id ?? "");
              if (category) { setStep("review"); returnToReview.current = false; }
            }} /> : null}
          {step === "review" ? <>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} disabled={locked} onPress={() => setDetailsOpen((open) => !open)} style={({ pressed }) => [styles.detailsToggle, pressed && styles.pressedRow]}>
              <View style={styles.detailsHeading}>
                <Text style={styles.detailsTitle}>{Copy.details}</Text>
                {!detailsOpen ? <Text numberOfLines={2} style={styles.detailsSummary}>{[draft.date, draft.targetMemberName, formatInstallmentLabel(draft.installmentMonths)].filter(Boolean).join(Copy.summarySeparator)}</Text> : null}
              </View>
              <Feather name={detailsOpen ? "chevron-up" : "chevron-down"} size={Ui.cancelIconSize} color={AppColors.mutedText} />
            </Pressable>
            {detailsOpen ? <EntryComposerDetails composer={composer} editing={Boolean(sourceEntry)}
              onConvert={sourceEntry?.installmentGroupId && sourceEntry.type === "expense" && sourceEntry.installmentStatus !== InstallmentStatuses.prepaid
                ? () => setConversionOpen(true) : undefined} /> : null}
            {!detailsOpen && draft.photoAttachments.length ? <Text style={styles.label}>{Copy.photoCount}: {draft.photoAttachments.length}</Text> : null}
            <ActionButton disabled={locked} label={draft.note.trim() ? Copy.editNote : Copy.note} onPress={() => edit("note")} size="inline" />
          </> : null}
        </View>
        ) : null}
      </SummaryContainer> : null}
      {step === "amount" ? <EntryTypeToggleButton disabled={locked} selectedType={draft.type} onSelectType={(type) => {
        if (!locked) setDraft((current) => ({ ...current, type, category: "", categoryId: "" }));
      }} /> : null}
      {isTextStep ? <View style={styles.inputRow}>
        {onReadClipboard ? <IconActionButton icon="clipboard" size="compact" disabled={locked}
          accessibilityLabel={CardSmsClipboardCopy.showSuggestion} onPress={onReadClipboard} /> : null}
        <View style={[styles.inputContainer, disabled && styles.disabledInputContainer]}>
        <View style={styles.inputContent}>
        <TextInput key={step} ref={inputRef} editable={!locked} style={[styles.input, disabled && styles.disabledInput]}
          accessibilityState={{ disabled: locked }}
          accessibilityHint={disabled ? Copy.unavailable : undefined}
          keyboardAppearance="light" submitBehavior="submit"
          accessibilityLabel={step === "amount" ? Copy.amount : step === "content" ? EntryRegistrationCopy.contentLabel : EntryRegistrationCopy.noteLabel}
          placeholder={disabled ? Copy.unavailable : step === "amount" ? EntryRegistrationCopy.amountRequiredError : step === "content" ? EntryRegistrationCopy.contentPlaceholder : EntryRegistrationCopy.notePlaceholder}
          placeholderTextColor={AppColors.mutedText}
          keyboardType={step === "amount" ? "decimal-pad" : "default"} returnKeyType="default"
          value={step === "amount" ? formatAmountInput(draft.amount) : draft[step === "content" ? "content" : "note"]}
          onChangeText={(value) => { if (locked) return; if (clipboardDraft) onDismissClipboard?.(); if (step === "amount") update("amount", sanitizeAmountValue(value)); else update(step === "content" ? "content" : "note", value); }}
          onSubmitEditing={advance} />
        <View style={styles.clearButtonSlot}>
        {draft[inputField] ? <IconActionButton icon="x-circle" size="compact" disabled={locked}
          accessibilityLabel={Copy.clearField} onPress={() => {
            if (locked) return;
            if (clipboardDraft) onDismissClipboard?.();
            update(inputField, "");
            inputRef.current?.focus();
          }} /> : null}
        </View>
        </View>
        {disabled && draft[inputField] ? <Text style={styles.unavailableHint}>{Copy.unavailable}</Text> : null}
        </View>
        <ActionButton disabled={locked} label={step === "note" ? Copy.confirm : Copy.next} onPress={advance} variant="primary" />
      </View> : disabled ? <View style={styles.unavailableField} accessibilityState={{ disabled: true }}>
        <Text style={styles.label}>{Copy.unavailable}</Text>
      </View> : step === "review" ? <ActionButton disabled={locked || !canSubmitDraft(draft)} loading={saving} label={sourceEntry ? Copy.saveEdit : Copy.save} onPress={save} variant="primary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: AppColors.surface, borderTopWidth: AppLayout.dividerWidth, borderTopColor: AppColors.border, padding: Ui.panelPadding, gap: AppLayout.cardGap },
  amountPanel: { paddingTop: AppLayout.compactGap },
  scrollContent: { gap: AppLayout.cardGap },
  reviewSection: { gap: AppLayout.cardGap },
  detailsToggle: { flexDirection: "row", alignItems: "center", gap: AppLayout.cardGap, minHeight: Ui.fieldHeight, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: AppColors.border, paddingTop: AppLayout.cardGap },
  detailsHeading: { flex: 1, gap: AppLayout.compactGap },
  detailsTitle: { fontSize: Ui.summaryFontSize, fontWeight: "600", color: AppColors.text },
  detailsSummary: { fontSize: Ui.detailsFontSize, color: AppColors.mutedText },
  stack: { gap: Ui.summaryRowGap },
  stackViewport: { flexGrow: 0 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: AppLayout.compactGap },
  summaryEditButton: { flex: 1 },
  pendingHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: AppLayout.compactGap, minHeight: Ui.pendingHeaderHeight },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: AppLayout.cardGap, minHeight: Ui.summaryRowHeight },
  label: { fontSize: Ui.summaryFontSize, color: AppColors.mutedText },
  editableValue: { flexShrink: 1, flexDirection: "row", alignItems: "center", gap: AppLayout.compactGap },
  pressedRow: { backgroundColor: AppColors.surfaceMuted },
  value: { flexShrink: 1, fontSize: Ui.summaryFontSize, color: AppColors.text, textAlign: "right" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: AppLayout.compactGap },
  inputContainer: { flex: 1, minWidth: 0, backgroundColor: AppColors.surfaceMuted, borderRadius: AppLayout.groupRadius },
  inputContent: { flexDirection: "row", alignItems: "center", paddingRight: AppLayout.compactGap },
  disabledInputContainer: { backgroundColor: AppColors.surfaceStrong },
  disabledInput: { color: AppColors.mutedText },
  unavailableHint: { color: AppColors.mutedText, fontSize: Ui.detailsFontSize, paddingHorizontal: AppLayout.screenPadding, paddingBottom: AppLayout.compactGap },
  unavailableField: { minHeight: Ui.fieldHeight, justifyContent: "center", backgroundColor: AppColors.surfaceStrong, borderRadius: AppLayout.groupRadius, padding: AppLayout.screenPadding },
  clearButtonSlot: { width: ICON_ACTION_BUTTON_COMPACT_SIZE, height: ICON_ACTION_BUTTON_COMPACT_SIZE, flexShrink: 0 },
  input: { flex: 1, minWidth: 0, minHeight: Ui.fieldHeight, fontSize: Ui.fontSize, color: AppColors.text, paddingHorizontal: AppLayout.screenPadding },
});
