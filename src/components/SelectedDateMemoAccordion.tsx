import { useEffect, useState } from "react";
import { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AppColors } from "../constants/colors";
import { DateMemoCopy, DateMemoUi } from "../constants/dateMemo";
import { FormMultilineInputTextStyle } from "../constants/uiStyles";

type SelectedDateMemoAccordionProps = {
  isExpanded: boolean;
  note: string;
  onDelete: () => Promise<void>;
  onSave: (note: string) => Promise<void>;
};

export function SelectedDateMemoAccordion({
  isExpanded,
  note,
  onDelete,
  onSave,
}: SelectedDateMemoAccordionProps) {
  const [draftNote, setDraftNote] = useState(note);
  const savedNoteRef = useRef(note);

  useEffect(() => {
    setDraftNote(note);
    savedNoteRef.current = note;
  }, [note]);

  if (!isExpanded) {
    return null;
  }

  const persistDraftNote = async () => {
    const trimmedDraftNote = draftNote.trim();
    const trimmedSavedNote = savedNoteRef.current.trim();

    if (trimmedDraftNote === trimmedSavedNote) {
      return;
    }

    if (!trimmedDraftNote) {
      if (trimmedSavedNote) {
        await onDelete();
        savedNoteRef.current = "";
      }
      return;
    }

    await onSave(trimmedDraftNote);
    savedNoteRef.current = trimmedDraftNote;
  };

  return (
    <View style={styles.panel}>
      <TextInput
        maxLength={DateMemoUi.inputMaxLength}
        multiline
        onChangeText={setDraftNote}
        onBlur={() => {
          void persistDraftNote();
        }}
        placeholder={DateMemoCopy.placeholder}
        style={styles.input}
        textAlignVertical="top"
        value={draftNote}
      />
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
  input: {
    ...FormMultilineInputTextStyle,
    minHeight: DateMemoUi.accordionMinHeight,
    padding: DateMemoUi.panelPadding,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: AppColors.surfaceMuted,
  },
});
