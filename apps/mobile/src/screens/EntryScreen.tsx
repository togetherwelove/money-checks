import { ScrollView, StyleSheet, Text, View } from "react-native";

import { EntryDateToolbar } from "../components/EntryDateToolbar";
import { LedgerEditorPanel } from "../components/LedgerEditorPanel";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { addDays, formatSelectedDate, parseIsoDate, toIsoDate } from "../utils/calendar";

const PREVIOUS_DAY_OFFSET = -1;
const NEXT_DAY_OFFSET = 1;

type EntryScreenProps = {
  onCancelEntry: () => void;
  onSaveEntry: () => Promise<void>;
  state: LedgerScreenState;
};

export function EntryScreen({ onCancelEntry, onSaveEntry, state }: EntryScreenProps) {
  const actualToday = new Date();
  const {
    draft,
    editingEntryId,
    errorMessage,
    selectedDate,
    handleSelectDate,
    resetEditor,
    updateDraftField,
    updateDraftType,
  } = state;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{AppMessages.entryScreenTitle}</Text>
          <Text style={styles.subtitle}>{AppMessages.entryScreenSubtitle}</Text>
        </View>
      </View>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <EntryDateToolbar
        dateLabel={formatSelectedDate(selectedDate)}
        onMoveNextDay={() => moveDay(selectedDate, NEXT_DAY_OFFSET, handleSelectDate)}
        onMovePreviousDay={() => moveDay(selectedDate, PREVIOUS_DAY_OFFSET, handleSelectDate)}
        onMoveToToday={() => handleSelectDate(toIsoDate(actualToday))}
      />
      <LedgerEditorPanel
        draft={draft}
        editingEntryId={editingEntryId}
        onCancelEdit={onCancelEntry}
        onChangeDraft={updateDraftField}
        onSaveEntry={onSaveEntry}
        onSelectType={updateDraftType}
      />
    </ScrollView>
  );
}

function moveDay(
  selectedDate: string,
  dayOffset: number,
  handleSelectDate: (isoDate: string) => void,
) {
  const nextDate = addDays(parseIsoDate(selectedDate), dayOffset);
  handleSelectDate(toIsoDate(nextDate));
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 8,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: AppColors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: AppColors.expense,
    fontSize: 12,
  },
});
