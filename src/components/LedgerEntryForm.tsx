import { useEffect, useRef, useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";

import { CategorySelector } from "../components/CategorySelector";
import { EntryTargetMemberSelector } from "../components/EntryTargetMemberSelector";
import { CATEGORY_OPTIONS } from "../constants/categories";
import { AppColors } from "../constants/colors";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import {
  FormLabelTextStyle,
  UnderlineFormInputTextStyle,
} from "../constants/uiStyles";
import { showNativeToast } from "../lib/nativeToast";
import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import {
  type AmountInputSelection,
  formatAmountInput,
  resolveFormattedAmountInputSelection,
} from "../utils/amount";
import { ActionButton } from "./ActionButton";
import { EntryDateSelector } from "./EntryDateSelector";
import { EntryInstallmentSelector } from "./EntryInstallmentSelector";
import { EntryPhotoAttachmentField } from "./EntryPhotoAttachmentField";
import { EntryTypeToggleButton } from "./EntryTypeToggleButton";
import { IconActionButton } from "./IconActionButton";
import { InstallmentPickerModal } from "./InstallmentPickerModal";

const AMOUNT_SELECTION_IGNORE_RESET_DELAY_MS = 16;

type LedgerEntryFormProps = {
  activeBookId?: string | null;
  autoFocusContent?: boolean;
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  members: LedgerBookMember[];
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onChangeInstallmentMonths: (installmentMonths: number) => void;
  onPickPhotoAttachments: () => void | Promise<void>;
  onRemovePhotoAttachment: (attachmentId: string) => void;
  onSaveEntry: () => void | Promise<void>;
  onSelectType: (type: LedgerEntryType) => void;
  onPrepayInstallmentEntry?: (() => unknown) | null;
  showInstallmentPrepaymentAction?: boolean;
};

export function LedgerEntryForm({
  activeBookId = null,
  autoFocusContent = false,
  draft,
  editingEntryId,
  members,
  onChangeDraft,
  onChangeInstallmentMonths,
  onPickPhotoAttachments,
  onRemovePhotoAttachment,
  onSaveEntry,
  onSelectType,
  onPrepayInstallmentEntry = null,
  showInstallmentPrepaymentAction = false,
}: LedgerEntryFormProps) {
  const categories = CATEGORY_OPTIONS[draft.type];
  const formattedAmountValue = formatAmountInput(draft.amount);
  const amountInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);
  const amountSelectionRef = useRef<AmountInputSelection>({
    end: formattedAmountValue.length,
    start: formattedAmountValue.length,
  });
  const shouldIgnoreNextAmountSelectionChangeRef = useRef(false);
  const isInternalAmountTextChangeRef = useRef(false);
  const amountSelectionIgnoreResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [amountSelection, setAmountSelection] = useState<AmountInputSelection>(
    amountSelectionRef.current,
  );
  const [isInstallmentPickerOpen, setIsInstallmentPickerOpen] = useState(false);

  const handlePressSaveEntry = () => {
    const validationMessage = resolveDraftValidationMessage(draft);
    if (validationMessage) {
      showNativeToast(validationMessage);
      return;
    }

    return onSaveEntry();
  };

  useEffect(() => {
    return () => {
      if (amountSelectionIgnoreResetTimeoutRef.current) {
        clearTimeout(amountSelectionIgnoreResetTimeoutRef.current);
      }
    };
  }, []);

  const updateAmountSelection = (nextSelection: AmountInputSelection) => {
    amountSelectionRef.current = nextSelection;
    setAmountSelection(nextSelection);
  };

  const handleAmountChangeText = (nextDisplayValue: string) => {
    const nextSelection = resolveFormattedAmountInputSelection({
      nextDisplayValue,
      previousDisplayValue: formattedAmountValue,
      previousSelection: amountSelectionRef.current,
    });

    isInternalAmountTextChangeRef.current = true;
    shouldIgnoreNextAmountSelectionChangeRef.current = true;
    if (amountSelectionIgnoreResetTimeoutRef.current) {
      clearTimeout(amountSelectionIgnoreResetTimeoutRef.current);
    }
    amountSelectionIgnoreResetTimeoutRef.current = setTimeout(() => {
      shouldIgnoreNextAmountSelectionChangeRef.current = false;
      amountSelectionIgnoreResetTimeoutRef.current = null;
    }, AMOUNT_SELECTION_IGNORE_RESET_DELAY_MS);
    updateAmountSelection(nextSelection);
    onChangeDraft("amount", nextDisplayValue);
  };

  useEffect(() => {
    if (isInternalAmountTextChangeRef.current) {
      isInternalAmountTextChangeRef.current = false;
      return;
    }

    const nextSelection = {
      end: formattedAmountValue.length,
      start: formattedAmountValue.length,
    };
    amountSelectionRef.current = nextSelection;
    setAmountSelection(nextSelection);
  }, [formattedAmountValue]);

  return (
    <View style={styles.form}>
      <EntryDateSelector
        onSelectDate={(isoDate) => onChangeDraft("date", isoDate)}
        selectedDate={draft.date}
      />
      <View style={styles.fieldGroup}>
        <EntryTypeToggleButton onSelectType={onSelectType} selectedType={draft.type} />
        <View style={styles.clearableInputRow}>
          <TextInput
            ref={amountInputRef}
            submitBehavior="blurAndSubmit"
            keyboardType="number-pad"
            onChangeText={handleAmountChangeText}
            onSelectionChange={(event) => {
              if (shouldIgnoreNextAmountSelectionChangeRef.current) {
                shouldIgnoreNextAmountSelectionChangeRef.current = false;
                if (amountSelectionIgnoreResetTimeoutRef.current) {
                  clearTimeout(amountSelectionIgnoreResetTimeoutRef.current);
                  amountSelectionIgnoreResetTimeoutRef.current = null;
                }
                return;
              }

              updateAmountSelection(event.nativeEvent.selection);
            }}
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder={AppMessages.editorAmount}
            selection={amountSelection}
            style={styles.clearableInput}
            value={formattedAmountValue}
          />
          {formattedAmountValue ? (
            <IconActionButton
              accessibilityLabel={EntryRegistrationCopy.amountClearAccessibilityLabel}
              icon="x-circle"
              onPress={() => {
                handleAmountChangeText("");
                amountInputRef.current?.focus();
              }}
              size="compact"
            />
          ) : null}
        </View>
      </View>
      <EntryTargetMemberSelector
        members={members}
        onSelectMember={(member) => {
          onChangeDraft("targetMemberId", member.userId);
          onChangeDraft("targetMemberName", member.displayName);
        }}
        selectedMemberId={draft.targetMemberId}
      />
      <CategorySelector
        bookId={activeBookId}
        categories={categories}
        entryType={draft.type}
        onSelectCategory={(category) => {
          onChangeDraft("category", category?.label ?? "");
          onChangeDraft("categoryId", category?.id ?? "");
          if (category) {
            (formattedAmountValue ? contentInputRef : amountInputRef).current?.focus();
          }
        }}
        selectedCategoryId={draft.categoryId}
        title={EntryRegistrationCopy.categoryLabel}
      />
      {!editingEntryId ? (
        <EntryInstallmentSelector
          installmentMonths={draft.installmentMonths}
          onPress={() => setIsInstallmentPickerOpen(true)}
        />
      ) : null}
      <View style={styles.fieldGroup}>
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.label}>{EntryRegistrationCopy.contentLabel}</Text>
        </View>
        <View style={styles.clearableInputRow}>
          <TextInput
            autoFocus={autoFocusContent}
            ref={contentInputRef}
            submitBehavior="blurAndSubmit"
            onChangeText={(value) => onChangeDraft("content", value)}
            onSubmitEditing={() => {
              Keyboard.dismiss();
              void handlePressSaveEntry();
            }}
            placeholder={EntryRegistrationCopy.contentPlaceholder}
            returnKeyType="done"
            style={styles.clearableInput}
            value={draft.content}
          />
          {draft.content ? (
            <IconActionButton
              accessibilityLabel={EntryRegistrationCopy.contentClearAccessibilityLabel}
              icon="x-circle"
              onPress={() => {
                onChangeDraft("content", "");
                contentInputRef.current?.focus();
              }}
              size="compact"
            />
          ) : null}
        </View>
      </View>
      <View style={styles.fieldGroup}>
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.label}>{EntryRegistrationCopy.noteLabel}</Text>
        </View>
        <TextInput
          submitBehavior="blurAndSubmit"
          onChangeText={(value) => onChangeDraft("note", value)}
          onSubmitEditing={() => Keyboard.dismiss()}
          placeholder={EntryRegistrationCopy.notePlaceholder}
          returnKeyType="done"
          style={styles.input}
          value={draft.note}
        />
      </View>
      <EntryPhotoAttachmentField
        attachments={draft.photoAttachments}
        onPickAttachments={() => {
          void onPickPhotoAttachments();
        }}
        onRemoveAttachment={onRemovePhotoAttachment}
      />
      <View style={styles.formActions}>
        <View style={styles.primaryActionRow}>
          <ActionButton
            fullWidth
            label={editingEntryId ? AppMessages.editorUpdate : AppMessages.editorNewEntry}
            onPress={handlePressSaveEntry}
            size="large"
            variant="primary"
          />
        </View>
        {showInstallmentPrepaymentAction && onPrepayInstallmentEntry ? (
          <View style={styles.secondaryActionRow}>
            <ActionButton
              label={EntryRegistrationCopy.installmentPrepaymentAction}
              onPress={() => {
                void onPrepayInstallmentEntry();
              }}
              size="inline"
              variant="secondary"
            />
          </View>
        ) : null}
      </View>
      <InstallmentPickerModal
        installmentMonths={draft.installmentMonths}
        isOpen={isInstallmentPickerOpen}
        onClose={() => setIsInstallmentPickerOpen(false)}
        onSelectInstallmentMonths={onChangeInstallmentMonths}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: AppLayout.cardGap,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  label: FormLabelTextStyle,
  input: UnderlineFormInputTextStyle,
  clearableInputRow: {
    alignItems: "center",
    borderBottomColor: AppColors.border,
    borderBottomWidth: AppLayout.dividerWidth,
    flexDirection: "row",
  },
  clearableInput: {
    ...UnderlineFormInputTextStyle,
    borderBottomWidth: 0,
    flex: 1,
    minWidth: 0,
  },
  formActions: {
    paddingTop: 4,
    gap: 8,
  },
  primaryActionRow: {
    flexDirection: "row",
  },
  secondaryActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});

function resolveDraftValidationMessage(draft: LedgerEntryDraft): string | null {
  if (!Number(draft.amount)) {
    return EntryRegistrationCopy.amountRequiredError;
  }

  if (!draft.content.trim()) {
    return EntryRegistrationCopy.contentRequiredError;
  }

  if (!draft.categoryId.trim()) {
    return EntryRegistrationCopy.categoryRequiredError;
  }

  return null;
}
