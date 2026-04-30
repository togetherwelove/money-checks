import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import type { ComponentRef } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  type TextInput,
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
import { SelectedDateMemoAccordion } from "../components/SelectedDateMemoAccordion";
import { WeekdayHeader } from "../components/WeekdayHeader";
import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { DateMemoUi } from "../constants/dateMemo";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import { appPlatform } from "../lib/appPlatform";
import type { LedgerEntry } from "../types/ledger";
import {
  addMonths,
  formatCurrency,
  formatLedgerListHeaderDate,
  formatMonthYear,
  getMonthKey,
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
  const isScreenFocused = useIsFocused();
  const [isDateMemoExpanded, setIsDateMemoExpanded] = useState(false);
  const [calendarFocusRevision, setCalendarFocusRevision] = useState(0);
  const wasScreenFocusedRef = useRef(isScreenFocused);
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
  const calendarMonthKeyRef = useRef(getMonthKey(visibleMonth));
  const selectedDateLabel = formatLedgerListHeaderDate(selectedDate);

  useEffect(() => {
    setIsDateMemoExpanded(Boolean(selectedDateNote.trim()));
  }, [selectedDateNote]);

  useEffect(() => {
    if (!wasScreenFocusedRef.current && isScreenFocused) {
      setCalendarFocusRevision((currentRevision) => currentRevision + 1);
    }
    wasScreenFocusedRef.current = isScreenFocused;
  }, [isScreenFocused]);

  useEffect(() => {
    const nextMonthKey = getMonthKey(visibleMonth);
    if (calendarMonthKeyRef.current !== nextMonthKey) {
      calendarMonthKeyRef.current = nextMonthKey;
      setCalendarFocusRevision((currentRevision) => currentRevision + 1);
    }
  }, [visibleMonth]);

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
    <KeyboardAwareScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.content}
      extraScrollHeight={DateMemoUi.keyboardExtraScrollHeight}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <KeyboardAwareContent
        errorMessage={errorMessage}
        calendarFocusRevision={calendarFocusRevision}
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
    </KeyboardAwareScrollView>
  );
}

function KeyboardAwareContent({
  errorMessage,
  calendarFocusRevision,
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
  calendarFocusRevision: number;
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
          onMoveNextMonth={
            appPlatform.isWeb ? () => moveMonth(visibleMonth, 1, setVisibleMonth) : null
          }
          onMovePreviousMonth={
            appPlatform.isWeb ? () => moveMonth(visibleMonth, -1, setVisibleMonth) : null
          }
          onPressMonthLabel={appPlatform.isWeb ? null : onOpenMonthPicker}
          onSelectToday={() => {
            onSelectCalendarDate(todayIsoDate);
          }}
          showMoveToCurrent={selectedDate !== todayIsoDate}
        />
        <WeekdayHeader />
        <MonthCalendarPager
          key={calendarFocusRevision}
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
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDate}>{selectedDateLabel}</Text>
          </View>
          <View style={styles.selectionActions}>
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
  selectedDateInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: AppLayout.compactGap,
  },
  selectedDateLoading: {
    minHeight: 160,
  },
});
