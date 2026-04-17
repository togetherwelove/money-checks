import { useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

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
  const {
    handleDeleteSelectedDateNote,
    errorMessage,
    handleSaveSelectedDateNote,
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

  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.fixedSectionContent}
        extraScrollHeight={DateMemoUi.keyboardExtraScrollHeight}
        showsVerticalScrollIndicator={false}
        style={styles.fixedSectionScroll}
      >
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <CalendarToolbar
          monthLabel={formatMonthYear(visibleMonth)}
          onPressMonthLabel={onOpenMonthPicker}
          onSelectToday={() => {
            onSelectCalendarDate(todayIsoDate);
          }}
          showMoveToCurrent={selectedDate !== todayIsoDate}
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
          <MonthlySummary
            totalExpense={formatCurrency(monthlyLedger.totalExpense)}
            totalIncome={formatCurrency(monthlyLedger.totalIncome)}
          />
          {showsBannerAd ? <AppBannerAd /> : null}
          <View style={styles.selectionRow}>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectedDate}>{selectedDateLabel}</Text>
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
          <SelectedDateMemoAccordion
            key={selectedDate}
            isExpanded={isDateMemoExpanded}
            note={selectedDateNote}
            onDelete={handleDeleteSelectedDateNote}
            onSave={handleSaveSelectedDateNote}
          />
        </View>
      </KeyboardAwareScrollView>
      <View style={styles.listSection}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                void refreshLedger();
              }}
              refreshing={isRefreshing}
              tintColor={AppColors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.listScroll}
        >
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
        </ScrollView>
      </View>
    </View>
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
    padding: AppLayout.screenPadding,
    gap: AppLayout.compactGap,
  },
  fixedSectionScroll: {
    flex: 0,
  },
  fixedSectionContent: {
    gap: AppLayout.cardGap,
  },
  summarySection: {
    gap: AppLayout.compactGap,
  },
  listSection: {
    flex: 1,
    minHeight: 0,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: 8,
    paddingBottom: 12,
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
});
