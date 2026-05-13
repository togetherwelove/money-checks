import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  type TextInput,
  View,
} from "react-native";

import { AppBannerAd } from "../components/AppBannerAd";
import { CalendarToolbar } from "../components/CalendarToolbar";
import { DateMemoToggleButton } from "../components/DateMemoToggleButton";
import { LedgerEntryList } from "../components/LedgerEntryList";
import { MonthCalendarPager } from "../components/MonthCalendarPager";
import { MonthlySummary } from "../components/MonthlySummary";
import { SelectedDateMemoAccordion } from "../components/SelectedDateMemoAccordion";
import { WeekdayHeader } from "../components/WeekdayHeader";
import { AppColors } from "../constants/colors";
import { CommonActionCopy } from "../constants/commonActions";
import { AppLayout } from "../constants/layout";
import { LedgerEditabilityCopy } from "../constants/ledgerEditability";
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
  onDeleteSelectedEntry: (entry: LedgerEntry) => Promise<boolean>;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onOpenMonthPicker: () => void;
  onSelectCalendarDate: (isoDate: string) => void;
  showsBannerAd: boolean;
  state: LedgerScreenState;
};

export function HomeScreen({
  onDeleteSelectedEntry,
  onEditSelectedEntry,
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
  const {
    handleDeleteSelectedDateNote,
    errorMessage,
    handleSaveSelectedDateNote,
    isLoadingSelectedDateEntries,
    isRefreshing,
    monthlyLedger,
    refreshLedger,
    selectedDate,
    selectedEntries,
    selectedDateNote,
    setVisibleMonth,
    visibleMonth,
  } = state;
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

  const handleBeginDateMemoEditing = (_input: TextInput | null) => {};

  return (
    <View style={styles.screen}>
      <KeyboardAwareContent
        errorMessage={errorMessage}
        calendarFocusRevision={calendarFocusRevision}
        handleBeginDateMemoEditing={handleBeginDateMemoEditing}
        isDateMemoExpanded={isDateMemoExpanded}
        isLoadingSelectedDateEntries={isLoadingSelectedDateEntries}
        isRefreshing={isRefreshing}
        isReadOnlyDueToPlanLimit={state.isReadOnlyDueToPlanLimit}
        monthlyLedger={monthlyLedger}
        onDeleteSelectedEntry={onDeleteSelectedEntry}
        onDeleteSelectedDateNote={handleDeleteSelectedDateNote}
        onEditSelectedEntry={onEditSelectedEntry}
        onDateMemoEditingChange={() => {}}
        onDateMemoHeightChange={() => {}}
        onOpenMonthPicker={onOpenMonthPicker}
        onRefreshLedger={refreshLedger}
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
    </View>
  );
}

function KeyboardAwareContent({
  errorMessage,
  calendarFocusRevision,
  handleBeginDateMemoEditing,
  isDateMemoExpanded,
  isLoadingSelectedDateEntries,
  isRefreshing,
  isReadOnlyDueToPlanLimit,
  monthlyLedger,
  onDeleteSelectedEntry,
  onDeleteSelectedDateNote,
  onEditSelectedEntry,
  onDateMemoEditingChange,
  onDateMemoHeightChange,
  onOpenMonthPicker,
  onRefreshLedger,
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
  isRefreshing: boolean;
  isReadOnlyDueToPlanLimit: boolean;
  monthlyLedger: LedgerScreenState["monthlyLedger"];
  onDeleteSelectedEntry: (entry: LedgerEntry) => Promise<boolean>;
  onDeleteSelectedDateNote: () => Promise<void>;
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onDateMemoEditingChange: (isEditing: boolean) => void;
  onDateMemoHeightChange: (height: number) => void;
  onOpenMonthPicker: () => void;
  onRefreshLedger: () => Promise<void>;
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
  const [closeEntrySwipeRevision, setCloseEntrySwipeRevision] = useState(0);

  return (
    <View style={styles.screenContent}>
      <View style={styles.adPanel}>
        {showsBannerAd ? <AppBannerAd variant="embedded" /> : null}
      </View>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <View style={styles.monthHeaderSection}>
        <CalendarToolbar
          monthLabel={formatMonthYear(visibleMonth)}
          onPressMonthLabel={onOpenMonthPicker}
          onSelectToday={() => {
            onSelectCalendarDate(todayIsoDate);
          }}
          showMoveToCurrent={selectedDate !== todayIsoDate}
        />
      </View>
      <View style={styles.calendarAdSection}>
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
        <View style={styles.summaryPanel}>
          <MonthlySummary
            balanceAmount={monthlyLedger.balance}
            totalExpense={formatCurrency(monthlyLedger.totalExpense)}
            totalIncome={formatCurrency(monthlyLedger.totalIncome)}
            variant="embedded"
          />
        </View>
      </View>
      <View style={styles.transactionSection}>
        {isReadOnlyDueToPlanLimit ? (
          <View style={styles.readOnlyNotice}>
            <View style={styles.readOnlyTextBlock}>
              <Text style={styles.readOnlyNoticeTitle}>
                {LedgerEditabilityCopy.readOnlyNoticeTitle}
              </Text>
              <Text style={styles.readOnlyNoticeDescription}>
                {LedgerEditabilityCopy.readOnlyNoticeDescription}
              </Text>
            </View>
          </View>
        ) : null}
        <View style={styles.selectionRow}>
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDate}>{selectedDateLabel}</Text>
          </View>
          <View style={styles.selectionActions}>
            <DateMemoToggleButton
              isExpanded={isDateMemoExpanded}
              onPress={() => setIsDateMemoExpanded((currentValue) => !currentValue)}
            />
          </View>
        </View>
        <ScrollView
          contentContainerStyle={styles.transactionScrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                void onRefreshLedger();
              }}
              refreshing={isRefreshing}
              tintColor={AppColors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.transactionScroll}
        >
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
                onEditingChange={onDateMemoEditingChange}
                onHeightChange={onDateMemoHeightChange}
                onSave={onSaveSelectedDateNote}
              />
              <LedgerEntryList
                activeBookId={state.activeBook?.id ?? null}
                closeSwipeRevision={closeEntrySwipeRevision}
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
        </ScrollView>
      </View>
    </View>
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
    paddingHorizontal: AppLayout.screenPadding,
  },
  screenContent: {
    flex: 1,
  },
  monthHeaderSection: {
    gap: AppLayout.calendarGap,
  },
  calendarAdSection: {
    gap: AppLayout.calendarGap,
  },
  transactionSection: {
    flex: 1,
    minHeight: 0,
    gap: AppLayout.compactGap,
  },
  transactionScroll: {
    flex: 1,
    minHeight: 0,
  },
  transactionScrollContent: {
    gap: AppLayout.compactGap,
  },
  adPanel: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surfaceMuted,
  },
  summaryPanel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surfaceMuted,
    paddingVertical: 2,
  },
  error: {
    color: AppColors.expense,
    fontSize: 12,
  },
  readOnlyNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: AppLayout.compactGap,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: AppLayout.cardRadius,
    backgroundColor: AppColors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  readOnlyTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  readOnlyNoticeTitle: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  readOnlyNoticeDescription: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
  },
  selectedDate: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: AppLayout.compactGap,
  },
  selectedDateInfo: {
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
