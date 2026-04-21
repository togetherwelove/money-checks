import { useEffect, useRef, useState } from "react";
import type { ComponentRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  RefreshControl,
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
        style={styles.screen}
      >
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
          <View style={styles.selectedDateLoadingState}>
            <ActivityIndicator color={AppColors.primary} size="small" />
          </View>
        ) : (
          <>
            <SelectedDateMemoAccordion
              key={selectedDate}
              isExpanded={isDateMemoExpanded}
              note={selectedDateNote}
              onBeginEditing={handleBeginDateMemoEditing}
              onCollapse={() => setIsDateMemoExpanded(false)}
              onDelete={handleDeleteSelectedDateNote}
              onSave={handleSaveSelectedDateNote}
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
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
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
    padding: AppLayout.screenPadding,
    gap: AppLayout.cardGap,
    paddingBottom: DateMemoUi.keyboardExtraScrollHeight,
  },
  fixedSection: {
    gap: AppLayout.cardGap,
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
  selectedDateLoadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
});
