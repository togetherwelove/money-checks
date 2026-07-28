import { useEffect, useRef, useState } from "react";
import { Alert, Keyboard, StyleSheet, Text, TextInput, View } from "react-native";

import { CategorySelector } from "../components/CategorySelector";
import { EntryTargetMemberSelector } from "../components/EntryTargetMemberSelector";
import { CATEGORY_OPTIONS } from "../constants/categories";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import {
  FormLabelTextStyle,
  UnderlineFormInputTextStyle,
  UnderlineFormMultilineInputTextStyle,
} from "../constants/uiStyles";
import { formatInstallmentLabel } from "../lib/installments";
import { showNativeToast } from "../lib/nativeToast";
import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import {
  type AmountInputSelection,
  formatAmountInput,
  resolveFormattedAmountInputSelection,
} from "../utils/amount";
import { ActionButton } from "./ActionButton";
import { EntryPhotoAttachmentField } from "./EntryPhotoAttachmentField";
import { EntryTypeToggleButton } from "./EntryTypeToggleButton";
import { InstallmentPickerModal } from "./InstallmentPickerModal";

const AMOUNT_SELECTION_IGNORE_RESET_DELAY_MS = 16;

type LedgerEntryFormProps = {
  activeBookId?: string | null;
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  members: LedgerBookMember[];
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onChangeInstallmentMonths: (installmentMonths: number) => void;
  onPickPhotoAttachments: () => void | Promise<void>;
  onRemovePhotoAttachment: (attachmentId: string) => void;
  onSaveEntry: () => void | Promise<void>;
  onSelectType: (type: LedgerEntryType) => void;
  onSettleInstallmentEntry?: (() => void | Promise<void>) | null;
  showInstallmentSettleAction?: boolean;
};

export function LedgerEntryForm({
  activeBookId = null,
  draft,
  editingEntryId,
  members,
  onChangeDraft,
  onChangeInstallmentMonths,
  onPickPhotoAttachments,
  onRemovePhotoAttachment,
  onSaveEntry,
  onSelectType,
  onSettleInstallmentEntry = null,
  showInstallmentSettleAction = false,
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
      <View style={styles.fieldGroup}>
        <EntryTypeToggleButton onSelectType={onSelectType} selectedType={draft.type} />
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
          style={styles.input}
          value={formattedAmountValue}
        />
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
      <View style={styles.fieldGroup}>
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.label}>{EntryRegistrationCopy.contentLabel}</Text>
          {!editingEntryId ? (
            <ActionButton
              label={formatInstallmentLabel(draft.installmentMonths)}
              onPress={() => setIsInstallmentPickerOpen(true)}
              size="inline"
              variant="secondary"
            />
          ) : null}
        </View>
        <TextInput
          ref={contentInputRef}
          submitBehavior="blurAndSubmit"
          onChangeText={(value) => onChangeDraft("content", value)}
          onSubmitEditing={() => {
            Keyboard.dismiss();
            void handlePressSaveEntry();
          }}
          placeholder={EntryRegistrationCopy.contentPlaceholder}
          returnKeyType="done"
          style={styles.input}
          value={draft.content}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{EntryRegistrationCopy.noteLabel}</Text>
        <TextInput
          multiline
          onChangeText={(value) => onChangeDraft("note", value)}
          placeholder={EntryRegistrationCopy.noteLabel}
          style={styles.multilineInput}
          textAlignVertical="top"
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
        {showInstallmentSettleAction && onSettleInstallmentEntry ? (
          <View style={styles.secondaryActionRow}>
            <ActionButton
              label={EntryRegistrationCopy.installmentSettleAction}
              onPress={() => {
                Alert.alert(
                  EntryRegistrationCopy.installmentSettleAction,
                  EntryRegistrationCopy.installmentSettleConfirmMessage,
                  [
                    {
                      style: "cancel",
                      text: "취소",
                    },
                    {
                      onPress: () => {
                        void onSettleInstallmentEntry();
                      },
                      text: "확인",
                    },
                  ],
                );
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
  multilineInput: UnderlineFormMultilineInputTextStyle,
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
