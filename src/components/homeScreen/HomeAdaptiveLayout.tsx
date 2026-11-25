import { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";

import { getAppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { ResponsiveLayout } from "../../constants/responsiveLayout";
import { useAppTheme } from "../../hooks/useAppTheme";
import { createThemeValue } from "../../lib/appTheme";

type Props = {
  calendar: ReactNode;
  transactionHeader: ReactNode;
  renderTransactions: () => ReactNode;
};

export function HomeAdaptiveLayout({ calendar, transactionHeader, renderTransactions }: Props) {
  const styles = getStyles();
  useAppTheme();
  const [width, setWidth] = useState(0);
  const split = width >= ResponsiveLayout.splitViewMinWidth;

  return (
    <View
      style={[styles.workspace, split && styles.columns]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <View style={[styles.calendarContent, split && styles.calendarPane]}>{calendar}</View>
      <View style={[styles.transactions, split && styles.splitTransactions]}>
        <View style={styles.headerContent}>{transactionHeader}</View>
        {renderTransactions()}
      </View>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    workspace: {
      flex: 1,
      minHeight: 0,
      width: "100%",
      maxWidth: ResponsiveLayout.workspaceMaxWidth,
      alignSelf: "center",
    },
    columns: { flexDirection: "row", gap: ResponsiveLayout.paneGap },
    calendarPane: { flex: 1, minWidth: 0 },
    calendarContent: { flexShrink: 0, paddingHorizontal: AppLayout.screenPadding },
    headerContent: { flexShrink: 0 },
    transactions: { flex: 1, minHeight: 0, minWidth: 0 },
    splitTransactions: {
      borderLeftWidth: AppLayout.dividerWidth,
      borderLeftColor: getAppColors().border,
    },
  }),
);
