import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { CategorySelector } from "../components/CategorySelector";
import { EntryTargetMemberSelector } from "../components/EntryTargetMemberSelector";
import { CATEGORY_OPTIONS } from "../constants/categories";
import { CommonActionCopy } from "../constants/commonActions";
import { EntryRegistrationCopy } from "../constants/entryRegistration";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import {
  FormInputTextStyle,
  FormLabelTextStyle,
  FormMultilineInputTextStyle,
  SurfaceCardStyle,
} from "../constants/uiStyles";
import { scheduleIdleTask } from "../lib/idleScheduler";
import { formatInstallmentLabel } from "../lib/installments";
import { showNativeToast } from "../lib/nativeToast";
import type { LedgerEntryDraft, LedgerEntryType } from "../types/ledger";
import type { LedgerBookMember } from "../types/ledgerBookMember";
import { formatAmountInput } from "../utils/amount";
import { ActionButton } from "./ActionButton";
import { EntryDirectionSelector } from "./EntryDirectionSelector";
import { EntryPhotoAttachmentField } from "./EntryPhotoAttachmentField";
import { InstallmentPickerModal } from "./InstallmentPickerModal";

const AMOUNT_INPUT_FOCUS_DELAY_MS = 120;
const CONTENT_INPUT_FOCUS_DELAY_MS = 80;

type EntryInputName = "amount" | "content" | "note";

type LedgerEntryFormProps = {
  draft: LedgerEntryDraft;
  editingEntryId: string | null;
  members: LedgerBookMember[];
  onChangeDraft: (field: keyof LedgerEntryDraft, value: string) => void;
  onChangeInstallmentMonths: (installmentMonths: number) => void;
  onPickPhotoAttachments: () => void | Promise<void>;
  onCategoryDraggingChange?: (isDragging: boolean) => void;
  onInputBlur?: (() => void) | null;
  onInputFocus?: ((input: TextInput | null, inputHeight: number) => void) | null;
  onRemovePhotoAttachment: (attachmentId: string) => void;
  onSaveEntry: () => void | Promise<void>;
  onSelectType: (type: LedgerEntryType) => void;
  onSettleInstallmentEntry?: (() => void | Promise<void>) | null;
  showInstallmentSettleAction?: boolean;
};

export function LedgerEntryForm({
  draft,
  editingEntryId,
  members,
  onChangeDraft,
  onChangeInstallmentMonths,
  onPickPhotoAttachments,
  onCategoryDraggingChange,
  onInputBlur = null,
  onInputFocus = null,
  onRemovePhotoAttachment,
  onSaveEntry,
  onSelectType,
  onSettleInstallmentEntry = null,
  showInstallmentSettleAction = false,
}: LedgerEntryFormProps) {
  const categories = CATEGORY_OPTIONS[draft.type];
  const amountInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const inputHeightsRef = useRef<Record<EntryInputName, number>>({
    amount: 0,
    content: 0,
    note: 0,
  });
  const amountFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    let isCancelled = false;
    const idleTask = scheduleIdleTask(() => {
      amountFocusTimeoutRef.current = setTimeout(() => {
        if (!isCancelled) {
          amountInputRef.current?.focus();
        }
      }, AMOUNT_INPUT_FOCUS_DELAY_MS);
    });

    return () => {
      isCancelled = true;
      if (amountFocusTimeoutRef.current) {
        clearTimeout(amountFocusTimeoutRef.current);
      }
      idleTask.cancel();
    };
  }, []);

  const handleInputLayout = (inputName: EntryInputName, event: LayoutChangeEvent) => {
    inputHeightsRef.current[inputName] = event.nativeEvent.layout.height;
  };

  const handleInputFocus = (inputName: EntryInputName, input: TextInput | null) => {
    onInputFocus?.(input, inputHeightsRef.current[inputName]);
  };

  return (
    <View style={styles.form}>
      <EntryDirectionSelector onSelectType={onSelectType} selectedType={draft.type} />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{AppMessages.editorAmount}</Text>
        <TextInput
          ref={amountInputRef}
          submitBehavior="blurAndSubmit"
          keyboardType="number-pad"
          onBlur={onInputBlur ?? undefined}
          onChangeText={(value) => onChangeDraft("amount", value)}
          onFocus={() => handleInputFocus("amount", amountInputRef.current)}
          onLayout={(event) => handleInputLayout("amount", event)}
          onSubmitEditing={() => Keyboard.dismiss()}
          placeholder={AppMessages.editorAmount}
          style={styles.input}
          value={formatAmountInput(draft.amount)}
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
        categories={categories}
        entryType={draft.type}
        onDraggingChange={onCategoryDraggingChange}
        onSelectCategory={(category) => {
          onChangeDraft("category", category?.label ?? "");
          onChangeDraft("categoryId", category?.id ?? "");
          if (!category) {
            return;
          }

          setTimeout(() => {
            contentInputRef.current?.focus();
          }, CONTENT_INPUT_FOCUS_DELAY_MS);
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
          onBlur={onInputBlur ?? undefined}
          onChangeText={(value) => onChangeDraft("content", value)}
          onFocus={() => handleInputFocus("content", contentInputRef.current)}
          onLayout={(event) => handleInputLayout("content", event)}
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
          ref={noteInputRef}
          multiline
          onBlur={onInputBlur ?? undefined}
          onChangeText={(value) => onChangeDraft("note", value)}
          onFocus={() => handleInputFocus("note", noteInputRef.current)}
          onLayout={(event) => handleInputLayout("note", event)}
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
                      text: CommonActionCopy.cancel,
                    },
                    {
                      onPress: () => {
                        void onSettleInstallmentEntry();
                      },
                      text: CommonActionCopy.confirm,
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
    ...SurfaceCardStyle,
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
  input: FormInputTextStyle,
  multilineInput: FormMultilineInputTextStyle,
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
