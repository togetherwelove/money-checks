import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppColors } from "../constants/colors";
import { DateMemoCopy, DateMemoUi } from "../constants/dateMemo";
import { FormMultilineInputTextStyle } from "../constants/uiStyles";
import { TextLinkButton } from "./TextLinkButton";

type SelectedDateMemoAccordionProps = {
  isExpanded: boolean;
  note: string;
  onBeginEditing?: ((input: TextInput | null) => void) | null;
  onCollapse?: (() => void) | null;
  onDelete: () => Promise<void>;
  onSave: (note: string) => Promise<void>;
};

export function SelectedDateMemoAccordion({
  isExpanded,
  note,
  onBeginEditing = null,
  onCollapse = null,
  onDelete,
  onSave,
}: SelectedDateMemoAccordionProps) {
  const [draftNote, setDraftNote] = useState(note);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const savedNoteRef = useRef(note);

  useEffect(() => {
    setDraftNote(note);
    savedNoteRef.current = note;
    setIsEditing(false);
  }, [note]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      onBeginEditing?.(inputRef.current);
    });
  }, [isEditing, onBeginEditing]);

  if (!isExpanded) {
    return null;
  }

  const startEditing = () => {
    setIsEditing(true);
  };

  const persistDraftNote = async () => {
    const trimmedDraftNote = draftNote.trim();
    const trimmedSavedNote = savedNoteRef.current.trim();

    if (!trimmedDraftNote) {
      if (trimmedSavedNote) {
        await onDelete();
        savedNoteRef.current = "";
      }
      onCollapse?.();
      return;
    }

    if (trimmedDraftNote === trimmedSavedNote) {
      return;
    }

    await onSave(trimmedDraftNote);
    savedNoteRef.current = trimmedDraftNote;
  };

  return (
    <View style={styles.panel}>
      {isEditing ? (
        <TextInput
          ref={inputRef}
          maxLength={DateMemoUi.inputMaxLength}
          multiline
          onBlur={() => {
            setIsEditing(false);
            void persistDraftNote();
          }}
          onChangeText={setDraftNote}
          onSubmitEditing={() => {
            inputRef.current?.blur();
          }}
          placeholder={DateMemoCopy.placeholder}
          returnKeyType="done"
          scrollEnabled
          style={styles.input}
          submitBehavior="blurAndSubmit"
          textAlignVertical="top"
          value={draftNote}
        />
      ) : (
        <Pressable onPress={startEditing} style={styles.previewContainer}>
          <View style={styles.previewActionRow}>
            <TextLinkButton label={DateMemoCopy.editAction} onPress={startEditing} />
          </View>
          <View pointerEvents="none">
            <TextInput
              editable={false}
              multiline
              placeholder={DateMemoCopy.placeholder}
              scrollEnabled
              style={styles.previewInput}
              textAlignVertical="top"
              value={draftNote}
            />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    minHeight: DateMemoUi.accordionMinHeight,
    backgroundColor: AppColors.surfaceMuted,
    borderRadius: DateMemoUi.panelBorderRadius,
    overflow: "hidden",
  },
  previewContainer: {
    position: "relative",
    minHeight: DateMemoUi.accordionMinHeight,
    maxHeight: DateMemoUi.accordionMaxHeight,
  },
  previewActionRow: {
    position: "absolute",
    top: DateMemoUi.panelPadding,
    right: DateMemoUi.panelPadding,
    zIndex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  previewInput: {
    ...FormMultilineInputTextStyle,
    minHeight: DateMemoUi.accordionMinHeight,
    maxHeight: DateMemoUi.accordionMaxHeight,
    padding: DateMemoUi.panelPadding,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: AppColors.surfaceMuted,
    color: AppColors.text,
  },
  input: {
    ...FormMultilineInputTextStyle,
    minHeight: DateMemoUi.accordionMinHeight,
    maxHeight: DateMemoUi.accordionMaxHeight,
    padding: DateMemoUi.panelPadding,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: AppColors.surfaceMuted,
  },
});
