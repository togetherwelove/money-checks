package com.chanwook.moneychecks.widget

internal data class MoneyChecksWidgetSummary(
    val todayIncomeLabel: String,
    val todayExpenseLabel: String,
    val monthIncomeAmount: Double,
    val monthIncomeLabel: String,
    val monthExpenseAmount: Double,
    val monthExpenseLabel: String,
    val recentEntries: List<MoneyChecksWidgetRecentEntry>,
) {
  companion object {
    val Empty =
        MoneyChecksWidgetSummary(
            todayIncomeLabel = MoneyChecksWidgetCopy.EMPTY_AMOUNT,
            todayExpenseLabel = MoneyChecksWidgetCopy.EMPTY_AMOUNT,
            monthIncomeAmount = 0.0,
            monthIncomeLabel = MoneyChecksWidgetCopy.EMPTY_AMOUNT,
            monthExpenseAmount = 0.0,
            monthExpenseLabel = MoneyChecksWidgetCopy.EMPTY_AMOUNT,
            recentEntries = emptyList(),
        )
  }
}

internal data class MoneyChecksWidgetRecentEntry(
    val type: String,
    val amountLabel: String,
    val title: String,
    val dateLabel: String,
)
