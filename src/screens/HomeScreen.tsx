import { useEffect, useRef, useState } from "react";
import type { ComponentRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  findNodeHandle,
} from "react-native";

import { AppBannerAd } from "../components/AppBannerAd";
import { CalendarToolbar } from "../components/CalendarToolbar";
import { DateMemoToggleButton } from "../components/DateMemoToggleButton";
import { IconActionButton } from "../components/IconActionButton";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { LedgerEntryList } from "../components/LedgerEntryList";
import { MonthCalendarPager } from "../components/MonthCalendarPager";
import { MonthlySummary } from "../components/MonthlySummary";
import { ScreenContentContainer } from "../components/ScreenContentContainer";
import { SelectedDateMemoAccordion } from "../components/SelectedDateMemoAccordion";
import { WeekdayHeader } from "../components/WeekdayHeader";
import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { DateMemoUi } from "../constants/dateMemo";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { LedgerEntry } from "../types/ledger";
import {
  addMonths,
  formatCurrency,
  formatLedgerListHeaderDate,
  formatMonthYear,
  toIsoDate,
} from "../utils/calendar";

type HomeScreenProps = {
  onDeleteSelectedEntry: (entry: LedgerEntry) => Promise<void>;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onOpenCharts: () => void;
  onOpenEntry: () => void;
  onOpenMonthPicker: () => void;
  onSelectCalendarDate: (isoDate: string) => void;
  showsBannerAd: boolean;
  state: LedgerScreenState;
};

type KeyboardAwareScrollViewRef = ComponentRef<typeof KeyboardAwareScrollView> & {
  scrollToFocusedInput?: (nodeHandle: number) => void;
};

export function HomeScreen({
  onDeleteSelectedEntry,
  onEditSelectedEntry,
  onOpenCharts,
  onOpenEntry,
  onOpenMonthPicker,
  onSelectCalendarDate,
  showsBannerAd,
  state,
}: HomeScreenProps) {
  const todayIsoDate = toIsoDate(new Date());
  const [isDateMemoExpanded, setIsDateMemoExpanded] = useState(false);
  const scrollViewRef = useRef<ComponentRef<typeof KeyboardAwareScrollView>>(null);
  const {
    handleDeleteSelectedDateNote,
    errorMessage,
    handleSaveSelectedDateNote,
    isLoadingSelectedDateEntries,
    monthlyLedger,
    selectedDate,
    selectedEntries,
    selectedDateNote,
    setVisibleMonth,
    visibleMonth,
  } = state;
  const selectedDateLabel = formatLedgerListHeaderDate(selectedDate);

  useEffect(() => {
    setIsDateMemoExpanded(Boolean(selectedDateNote.trim()));
  }, [selectedDate, selectedDateNote]);

  const handleBeginDateMemoEditing = (input: TextInput | null) => {
    const inputNodeHandle = input ? findNodeHandle(input) : null;
    const keyboardAwareScrollView = scrollViewRef.current as KeyboardAwareScrollViewRef | null;

    if (!inputNodeHandle || !keyboardAwareScrollView?.scrollToFocusedInput) {
      return;
    }

    requestAnimationFrame(() => {
      keyboardAwareScrollView.scrollToFocusedInput?.(inputNodeHandle);
    });
  };

  return (
    <TouchableWithoutFeedback
      accessible={false}
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        extraScrollHeight={DateMemoUi.keyboardExtraScrollHeight}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
      >
        <ScreenContentContainer maxWidth={AppLayout.calendarScreenMaxWidth}>
          <KeyboardAwareContent
            errorMessage={errorMessage}
            handleBeginDateMemoEditing={handleBeginDateMemoEditing}
            isDateMemoExpanded={isDateMemoExpanded}
            isLoadingSelectedDateEntries={isLoadingSelectedDateEntries}
            monthlyLedger={monthlyLedger}
            onDeleteSelectedEntry={onDeleteSelectedEntry}
            onDeleteSelectedDateNote={handleDeleteSelectedDateNote}
            onEditSelectedEntry={onEditSelectedEntry}
            onOpenCharts={onOpenCharts}
            onOpenEntry={onOpenEntry}
            onOpenMonthPicker={onOpenMonthPicker}
            onSaveSelectedDateNote={handleSaveSelectedDateNote}
            onSelectCalendarDate={onSelectCalendarDate}
            selectedDate={selectedDate}
            selectedDateLabel={selectedDateLabel}
            selectedDateNote={selectedDateNote}
            selectedEntries={selectedEntries}
            setIsDateMemoExpanded={setIsDateMemoExpanded}
            setVisibleMonth={setVisibleMonth}
            showsBannerAd={showsBannerAd}
            state={state}
            todayIsoDate={todayIsoDate}
            visibleMonth={visibleMonth}
          />
        </ScreenContentContainer>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
}

function KeyboardAwareContent({
  errorMessage,
  handleBeginDateMemoEditing,
  isDateMemoExpanded,
  isLoadingSelectedDateEntries,
  monthlyLedger,
  onDeleteSelectedEntry,
  onDeleteSelectedDateNote,
  onEditSelectedEntry,
  onOpenCharts,
  onOpenEntry,
  onOpenMonthPicker,
  onSaveSelectedDateNote,
  onSelectCalendarDate,
  selectedDate,
  selectedDateLabel,
  selectedDateNote,
  selectedEntries,
  setIsDateMemoExpanded,
  setVisibleMonth,
  showsBannerAd,
  state,
  todayIsoDate,
  visibleMonth,
}: {
  errorMessage: string | null;
  handleBeginDateMemoEditing: (input: TextInput | null) => void;
  isDateMemoExpanded: boolean;
  isLoadingSelectedDateEntries: boolean;
  monthlyLedger: LedgerScreenState["monthlyLedger"];
  onDeleteSelectedEntry: (entry: LedgerEntry) => Promise<void>;
  onDeleteSelectedDateNote: () => Promise<void>;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onOpenCharts: () => void;
  onOpenEntry: () => void;
  onOpenMonthPicker: () => void;
  onSaveSelectedDateNote: (note: string) => Promise<void>;
  onSelectCalendarDate: (isoDate: string) => void;
  selectedDate: string;
  selectedDateLabel: string;
  selectedDateNote: string;
  selectedEntries: LedgerEntry[];
  setIsDateMemoExpanded: (updater: boolean | ((currentValue: boolean) => boolean)) => void;
  setVisibleMonth: (nextMonth: Date) => void;
  showsBannerAd: boolean;
  state: LedgerScreenState;
  todayIsoDate: string;
  visibleMonth: Date;
}) {
  return (
    <>
      <View style={styles.fixedSection}>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <CalendarToolbar
          monthLabel={formatMonthYear(visibleMonth)}
          onPressMonthLabel={onOpenMonthPicker}
          onSelectToday={() => {
            onSelectCalendarDate(todayIsoDate);
          }}
          showMoveToCurrent={false}
        />
        <WeekdayHeader />
        <MonthCalendarPager
          currentPage={state.currentMonthPage}
          nextPage={state.nextMonthPage}
          onMoveMonth={(monthOffset) => moveMonth(visibleMonth, monthOffset, setVisibleMonth)}
          onSelectDate={onSelectCalendarDate}
          previousPage={state.previousMonthPage}
          selectedDate={selectedDate}
        />
        <View style={styles.summarySection}>
          {showsBannerAd ? <AppBannerAd /> : null}
          <MonthlySummary
            totalExpense={formatCurrency(monthlyLedger.totalExpense)}
            totalIncome={formatCurrency(monthlyLedger.totalIncome)}
          />
        </View>
        <View style={styles.selectionRow}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectedDate}>{selectedDateLabel}</Text>
            {selectedDate !== todayIsoDate ? (
              <IconActionButton
                accessibilityLabel="오늘 날짜로 이동"
                icon="crosshair"
                onPress={() => {
                  onSelectCalendarDate(todayIsoDate);
                }}
                size="compact"
              />
            ) : null}
          </View>
          <View style={styles.selectionInfo}>
            <DateMemoToggleButton
              isExpanded={isDateMemoExpanded}
              onPress={() => setIsDateMemoExpanded((currentValue) => !currentValue)}
            />
            <IconActionButton icon="pie-chart" onPress={onOpenCharts} size="compact" />
            <IconActionButton icon="plus" onPress={onOpenEntry} size="compact" />
          </View>
        </View>
      </View>
      {isLoadingSelectedDateEntries && selectedEntries.length === 0 ? (
        <ActivityIndicatorContainer />
      ) : (
        <>
          <SelectedDateMemoAccordion
            key={selectedDate}
            isExpanded={isDateMemoExpanded}
            note={selectedDateNote}
            onBeginEditing={handleBeginDateMemoEditing}
            onCollapse={() => setIsDateMemoExpanded(false)}
            onDelete={onDeleteSelectedDateNote}
            onSave={onSaveSelectedDateNote}
          />
          <LedgerEntryList
            entries={selectedEntries}
            onDeleteEntry={(entry) => {
              Alert.alert(
                AppMessages.editorDeleteConfirmTitle,
                AppMessages.editorDeleteConfirmMessage,
                [
                  {
                    style: "cancel",
                    text: CommonActionCopy.cancel,
                  },
                  {
                    onPress: () => {
                      void onDeleteSelectedEntry(entry);
                    },
                    style: "destructive",
                    text: AppMessages.editorDeleteConfirmAction,
                  },
                ],
              );
            }}
            onEditEntry={onEditSelectedEntry}
          />
        </>
      )}
    </>
  );
}

function ActivityIndicatorContainer() {
  return (
    <ActivityIndicator color={AppColors.primary} size="small" style={styles.selectedDateLoading} />
  );
}

function moveMonth(
  visibleMonth: Date,
  monthOffset: number,
  setVisibleMonth: (nextMonth: Date) => void,
) {
  setVisibleMonth(addMonths(visibleMonth, monthOffset));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: AppLayout.screenPadding,
    paddingBottom: DateMemoUi.keyboardExtraScrollHeight,
  },
  fixedSection: {
    gap: AppLayout.cardGap,
    paddingTop: AppLayout.screenPadding,
    paddingBottom: AppLayout.cardGap,
  },
  summarySection: {
    gap: AppLayout.compactGap,
  },
  error: {
    color: AppColors.expense,
    fontSize: 12,
  },
  selectedDate: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: AppLayout.compactGap,
  },
  selectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: AppLayout.compactGap,
  },
  selectedDateLoading: {
    minHeight: 160,
  },
});
