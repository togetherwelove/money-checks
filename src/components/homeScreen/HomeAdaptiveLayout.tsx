import { useContext, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { ResponsiveLayout, resolveHomeLayout } from "../../constants/responsiveLayout";
import { AppScrollBehavior } from "../../constants/scroll";
import { BottomContentInsetContext } from "../../contexts/BottomContentInsetContext";

type Props = {
  calendar: ReactNode;
  transactionHeader: ReactNode;
  renderTransactions: () => ReactNode;
};

export function HomeAdaptiveLayout({ calendar, transactionHeader, renderTransactions }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [calendarHeight, setCalendarHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const bottomInset = useContext(BottomContentInsetContext) ?? 0;
  const { split, scrollCalendarWithEntries } = resolveHomeLayout(
    size.width, size.height, calendarHeight + headerHeight, bottomInset,
  );
  const calendarContent = (
    <View style={styles.calendarContent}
      onLayout={(event) => setCalendarHeight(event.nativeEvent.layout.height)}>{calendar}</View>
  );
  const headerContent = (
    <View style={styles.headerContent} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>{transactionHeader}</View>
  );

  return (
    <View style={styles.workspace} onLayout={(event) => {
      const { width, height } = event.nativeEvent.layout;
      setSize((current) => current.width === width && current.height === height ? current : { width, height });
    }}>
      <ScrollView {...AppScrollBehavior} style={styles.compactScroll}
        scrollEnabled={scrollCalendarWithEntries}
        contentContainerStyle={[
          scrollCalendarWithEntries ? styles.compactContent : styles.fixedContent,
          split && styles.columns,
        ]}
        nestedScrollEnabled keyboardShouldPersistTaps="handled">
        <ScrollView {...AppScrollBehavior}
          style={split ? styles.calendarPane : styles.stackedCalendar}
          scrollEnabled={split}
          nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {calendarContent}
        </ScrollView>
        <View style={[styles.transactions, split && styles.splitTransactions,
          scrollCalendarWithEntries && { minHeight: ResponsiveLayout.minimumTransactionViewport + bottomInset }]}>
          {headerContent}
          {renderTransactions()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { flex: 1, minHeight: 0, width: "100%", maxWidth: ResponsiveLayout.workspaceMaxWidth, alignSelf: "center" },
  columns: { flexDirection: "row", gap: ResponsiveLayout.paneGap },
  compactScroll: { flex: 1 },
  compactContent: { flexGrow: 1 },
  fixedContent: { flex: 1 },
  stackedCalendar: { flexGrow: 0, flexShrink: 0 },
  calendarPane: { flex: 1, minWidth: 0 },
  calendarContent: { flexShrink: 0, paddingHorizontal: AppLayout.screenPadding },
  headerContent: { flexShrink: 0 },
  transactions: { flex: 1, minHeight: 0, minWidth: 0 },
  splitTransactions: { borderLeftWidth: AppLayout.dividerWidth, borderLeftColor: AppColors.border },
});
