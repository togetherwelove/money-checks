import { useEffect, useRef, useState } from "react";
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppColors } from "../constants/colors";
import { DateMemoCopy, DateMemoUi } from "../constants/dateMemo";
import { FormMultilineInputTextStyle } from "../constants/uiStyles";

const PREVIEW_TAP_MAX_MOVE_DISTANCE = 6;

type SelectedDateMemoAccordionProps = {
  isExpanded: boolean;
  note: string;
  onBeginEditing?: ((input: TextInput | null) => void) | null;
  onCollapse?: (() => void) | null;
  onDelete: () => Promise<void>;
  onEditingChange?: ((isEditing: boolean) => void) | null;
  onHeightChange?: ((height: number) => void) | null;
  onSave: (note: string) => Promise<void>;
};

export function SelectedDateMemoAccordion({
  isExpanded,
  note,
  onBeginEditing = null,
  onCollapse = null,
  onDelete,
  onEditingChange = null,
  onHeightChange = null,
  onSave,
}: SelectedDateMemoAccordionProps) {
  const [draftNote, setDraftNote] = useState(note);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const pressStartPositionRef = useRef<{ pageX: number; pageY: number } | null>(null);
  const isPreviewTapCandidateRef = useRef(false);
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

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  if (!isExpanded) {
    return null;
  }

  const startEditing = () => {
    setIsEditing(true);
  };

  const updatePreviewTapCandidate = (event: GestureResponderEvent) => {
    const startPosition = pressStartPositionRef.current;
    if (!startPosition) {
      isPreviewTapCandidateRef.current = false;
      return;
    }

    const moveX = Math.abs(event.nativeEvent.pageX - startPosition.pageX);
    const moveY = Math.abs(event.nativeEvent.pageY - startPosition.pageY);
    if (moveX > PREVIEW_TAP_MAX_MOVE_DISTANCE || moveY > PREVIEW_TAP_MAX_MOVE_DISTANCE) {
      isPreviewTapCandidateRef.current = false;
    }
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

  const handlePanelLayout = (event: LayoutChangeEvent) => {
    onHeightChange?.(event.nativeEvent.layout.height);
  };

  return (
    <View onLayout={handlePanelLayout} style={styles.panel}>
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
          placeholder={DateMemoCopy.placeholder}
          scrollEnabled
          style={styles.input}
          textAlignVertical="top"
          value={draftNote}
        />
      ) : (
        <ScrollView
          bounces={false}
          onScrollBeginDrag={() => {
            isPreviewTapCandidateRef.current = false;
          }}
          onTouchEnd={(event) => {
            updatePreviewTapCandidate(event);
            pressStartPositionRef.current = null;
            if (isPreviewTapCandidateRef.current) {
              startEditing();
            }
            isPreviewTapCandidateRef.current = false;
          }}
          onTouchMove={updatePreviewTapCandidate}
          onTouchStart={(event) => {
            pressStartPositionRef.current = {
              pageX: event.nativeEvent.pageX,
              pageY: event.nativeEvent.pageY,
            };
            isPreviewTapCandidateRef.current = true;
          }}
          scrollEventThrottle={16}
          style={styles.previewContainer}
        >
          <Text style={[styles.previewText, draftNote ? null : styles.placeholderText]}>
            {draftNote || DateMemoCopy.placeholder}
          </Text>
        </ScrollView>
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
    minHeight: DateMemoUi.accordionMinHeight,
    maxHeight: DateMemoUi.accordionMaxHeight,
  },
  previewText: {
    minHeight: DateMemoUi.accordionMinHeight,
    padding: DateMemoUi.panelPadding,
    color: AppColors.text,
    fontSize: FormMultilineInputTextStyle.fontSize,
    lineHeight: FormMultilineInputTextStyle.lineHeight,
  },
  placeholderText: {
    color: AppColors.mutedText,
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
