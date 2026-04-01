import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { CalendarToolbar } from "../components/CalendarToolbar";
import { IconActionButton } from "../components/IconActionButton";
import { LedgerEntryList } from "../components/LedgerEntryList";
import { MonthCalendarPager } from "../components/MonthCalendarPager";
import { MonthlySummary } from "../components/MonthlySummary";
import { WeekdayHeader } from "../components/WeekdayHeader";
import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import type { LedgerScreenState } from "../hooks/useLedgerScreenState";
import type { LedgerEntry } from "../types/ledger";
import { addMonths, formatCurrency, formatSelectedDate, toIsoDate } from "../utils/calendar";

type HomeScreenProps = {
  onEditSelectedEntry: (entry: LedgerEntry) => void;
  onOpenEntry: () => void;
  onSelectCalendarDate: (isoDate: string) => void;
  state: LedgerScreenState;
};

export function HomeScreen({
  onEditSelectedEntry,
  onOpenEntry,
  onSelectCalendarDate,
  state,
}: HomeScreenProps) {
  const actualToday = new Date();
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(false);
  const {
    errorMessage,
    handleDeleteEntry,
    entries,
    isRefreshing,
    monthlyLedger,
    refreshLedger,
    selectedDate,
    selectedEntries,
    setVisibleMonth,
    visibleMonth,
    resetEditor,
  } = state;

  return (
    <View style={styles.screen}>
      <View style={styles.fixedSection}>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        {!isCalendarCollapsed ? (
          <>
            <CalendarToolbar
              monthLabel={monthlyLedger.monthLabel}
              onMoveToCurrentMonth={() => {
                setVisibleMonth(actualToday);
                resetEditor(toIsoDate(actualToday));
              }}
            />
            <WeekdayHeader />
            <MonthCalendarPager
              entries={entries}
              onMoveMonth={(monthOffset) =>
                moveMonth(visibleMonth, monthOffset, setVisibleMonth, resetEditor)
              }
              onSelectDate={onSelectCalendarDate}
              selectedDate={selectedDate}
              visibleMonth={visibleMonth}
            />
          </>
        ) : null}
        <View style={styles.selectionRow}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectedDate}>{formatSelectedDate(selectedDate)}</Text>
            <IconActionButton
              icon={isCalendarCollapsed ? "chevron-down" : "chevron-up"}
              onPress={() => setIsCalendarCollapsed((currentValue) => !currentValue)}
            />
          </View>
          <IconActionButton icon="plus" onPress={onOpenEntry} />
        </View>
      </View>
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
          <MonthlySummary
            totalExpense={formatCurrency(monthlyLedger.totalExpense)}
            totalIncome={formatCurrency(monthlyLedger.totalIncome)}
          />
          <LedgerEntryList
            entries={selectedEntries}
            onDeleteEntry={handleDeleteEntry}
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
  resetEditor: (isoDate: string) => void,
) {
  const nextMonth = addMonths(visibleMonth, monthOffset);
  setVisibleMonth(nextMonth);
  resetEditor(toIsoDate(nextMonth));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
  },
  fixedSection: {
    gap: AppLayout.cardGap,
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
    gap: 8,
  },
  selectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
