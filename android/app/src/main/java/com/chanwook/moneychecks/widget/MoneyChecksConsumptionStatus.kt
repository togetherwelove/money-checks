package com.chanwook.moneychecks.widget

internal enum class MoneyChecksConsumptionStatus(val message: String) {
  Empty(MoneyChecksWidgetCopy.STATUS_EMPTY),
  Relaxed(MoneyChecksWidgetCopy.STATUS_RELAXED),
  Stable(MoneyChecksWidgetCopy.STATUS_STABLE),
  Caution(MoneyChecksWidgetCopy.STATUS_CAUTION),
  Over(MoneyChecksWidgetCopy.STATUS_OVER),
}

internal fun resolveConsumptionStatus(expenseAmount: Double, incomeAmount: Double): MoneyChecksConsumptionStatus {
  if (expenseAmount <= 0.0 && incomeAmount <= 0.0) {
    return MoneyChecksConsumptionStatus.Empty
  }

  if (incomeAmount <= 0.0 || expenseAmount > incomeAmount) {
    return MoneyChecksConsumptionStatus.Over
  }

  val expenseRatio = expenseAmount / incomeAmount
  return when {
    expenseRatio <= MoneyChecksWidgetTokens.relaxedExpenseRatio -> MoneyChecksConsumptionStatus.Relaxed
    expenseRatio <= MoneyChecksWidgetTokens.stableExpenseRatio -> MoneyChecksConsumptionStatus.Stable
    else -> MoneyChecksConsumptionStatus.Caution
  }
}
