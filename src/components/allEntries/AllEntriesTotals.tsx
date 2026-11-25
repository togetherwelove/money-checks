import { getCashflowTotalStyles } from "../../constants/cashflowTotalStyles";
import { OneLineTextFitProps } from "../../constants/textLayout";
import { Text, View } from "react-native";
import {
  AllEntriesPeriodCopy as Copy,
  type AllEntriesEntryTypeFilter,
} from "../../constants/allEntries";
import { getAppColors } from "../../constants/colors";
import { useAppTheme } from "../../hooks/useAppTheme";
import { formatCurrency } from "../../utils/currency";
import { resolveDisplayCurrency } from "../../lib/currencyPreference";
import type { FilteredLedgerTotal } from "../../lib/filteredLedgerTotals";
export function AllEntriesTotals({
  summary,
  type,
}: {
  summary?: { totals: FilteredLedgerTotal[] | null; failed: boolean } | null;
  type: AllEntriesEntryTypeFilter;
}) {
  useAppTheme();
  const layout = getCashflowTotalStyles();
  if (!summary?.totals) {
    return (
      <View style={layout.totalsCard}>
        <Text style={layout.totalLabel}>{summary?.failed ? Copy.error : Copy.loading}</Text>
      </View>
    );
  }
  const totals = summary.totals.length
    ? summary.totals
    : [{ currency: resolveDisplayCurrency(), expense: 0, income: 0 }];
  return (
    <View style={layout.totalsCard}>
      {totals.map((total) => (
        <View key={total.currency} style={layout.totalRow}>
          {type !== "income" ? (
            <View style={layout.totalColumn}>
              <Text style={layout.totalLabel}>{Copy.expense}</Text>
              <Text
                {...OneLineTextFitProps}
                style={[layout.totalAmount, { color: getAppColors().expense }]}
              >
                {formatTotal(total.expense, total.currency)}
              </Text>
            </View>
          ) : null}
          {type !== "expense" ? (
            <View style={layout.totalColumn}>
              <Text style={layout.totalLabel}>{Copy.income}</Text>
              <Text
                {...OneLineTextFitProps}
                style={[layout.totalAmount, { color: getAppColors().income }]}
              >
                {formatTotal(total.income, total.currency)}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const formatters = new Map<string, Intl.NumberFormat>();
function formatTotal(amount: number, currency: string): string {
  if (currency === resolveDisplayCurrency()) return formatCurrency(amount);
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("ko-KR", { style: "currency", currency });
    formatters.set(currency, formatter);
  }
  return formatter.format(amount);
}
