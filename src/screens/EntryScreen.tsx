import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { EntryDatePickerModal } from "../components/EntryDatePickerModal";
import { EntryDateToolbar } from "../components/EntryDateToolbar";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { LedgerEditorPanel } from "../components/LedgerEditorPanel";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { appPlatform } from "../lib/appPlatform";
import { formatSelectedDate, parseIsoDate, toIsoDate } from "../utils/calendar";

type EntryScreenProps = {
  onSaveEntry: () => Promise<void>;
  state: LedgerScreenState;
};

export function EntryScreen({ onSaveEntry, state }: EntryScreenProps) {
  const actualToday = new Date();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryDragging, setIsCategoryDragging] = useState(false);
  const {
    draft,
    editingEntryId,
    entries,
    errorMessage,
    selectedDate,
    handleSelectDate,
    resetEditor,
    updateDraftField,
    updateDraftType,
  } = state;
  const pickerMode = appPlatform.entryDatePickerMode;

  const handleOpenDatePicker = () => {
    if (pickerMode === "native" && appPlatform.usesAndroidDatePickerDialog) {
      DateTimePickerAndroid.open({
        mode: "date",
        value: parseIsoDate(selectedDate),
        onChange: (_event, nextDate) => {
          if (!nextDate) {
            return;
          }

          handleSelectDate(toIsoDate(nextDate));
        },
      });
      return;
    }

    setIsDatePickerOpen(true);
  };

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={!isCategoryDragging}
        style={styles.screen}
      >
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <EntryDateToolbar
          dateLabel={formatSelectedDate(selectedDate)}
          onMoveToToday={() => handleSelectDate(toIsoDate(actualToday))}
          onPressDateLabel={handleOpenDatePicker}
        />
        <LedgerEditorPanel
          draft={draft}
          editingEntryId={editingEntryId}
          onChangeDraft={updateDraftField}
          onCategoryDraggingChange={setIsCategoryDragging}
          onSaveEntry={onSaveEntry}
          onSelectType={updateDraftType}
        />
      </KeyboardAwareScrollView>
      <EntryDatePickerModal
        entries={entries}
        isOpen={isDatePickerOpen}
        mode={pickerMode}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={handleSelectDate}
        selectedDate={selectedDate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
    backgroundColor: AppColors.background,
    paddingBottom: 24,
  },
  error: {
    color: AppColors.expense,
    fontSize: 12,
  },
});
