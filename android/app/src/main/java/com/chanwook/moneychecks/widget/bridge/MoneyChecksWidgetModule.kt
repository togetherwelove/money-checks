package com.chanwook.moneychecks.widget.bridge

import com.chanwook.moneychecks.widget.MoneyChecksWidgetRecentEntry
import com.chanwook.moneychecks.widget.MoneyChecksWidgetStore
import com.chanwook.moneychecks.widget.MoneyChecksWidgetSummary
import com.chanwook.moneychecks.widget.MoneyChecksWidgetUpdater
import com.chanwook.moneychecks.widget.RecentEntryKeys
import com.chanwook.moneychecks.widget.SummaryKeys
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class MoneyChecksWidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
  private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

  override fun getName(): String = MODULE_NAME

  @ReactMethod
  fun updateSummary(summary: ReadableMap, promise: Promise) {
    moduleScope.launch {
      runCatching {
            MoneyChecksWidgetStore(reactContext).saveSummary(summary.toWidgetSummary())
            MoneyChecksWidgetUpdater.updateSummaryWidgets(reactContext)
          }
          .onSuccess { promise.resolve(null) }
          .onFailure { error -> promise.reject("money_checks_widget_update_failed", error) }
    }
  }

  @ReactMethod
  fun clearSummary(promise: Promise) {
    moduleScope.launch {
      runCatching {
            MoneyChecksWidgetStore(reactContext).clearSummary()
            MoneyChecksWidgetUpdater.updateSummaryWidgets(reactContext)
          }
          .onSuccess { promise.resolve(null) }
          .onFailure { error -> promise.reject("money_checks_widget_clear_failed", error) }
    }
  }

  private fun ReadableMap.toWidgetSummary(): MoneyChecksWidgetSummary {
    return MoneyChecksWidgetSummary(
        todayIncomeLabel = getString(SummaryKeys.TODAY_INCOME_LABEL).orEmpty(),
        todayExpenseLabel = getString(SummaryKeys.TODAY_EXPENSE_LABEL).orEmpty(),
        monthIncomeAmount = getDoubleOrZero(SummaryKeys.MONTH_INCOME_AMOUNT),
        monthIncomeLabel = getString(SummaryKeys.MONTH_INCOME_LABEL).orEmpty(),
        monthExpenseAmount = getDoubleOrZero(SummaryKeys.MONTH_EXPENSE_AMOUNT),
        monthExpenseLabel = getString(SummaryKeys.MONTH_EXPENSE_LABEL).orEmpty(),
        recentEntries = getArray(SummaryKeys.RECENT_ENTRIES).toRecentEntries(),
    )
  }

  private fun ReadableMap.getDoubleOrZero(key: String): Double {
    return if (hasKey(key) && !isNull(key)) {
      getDouble(key)
    } else {
      0.0
    }
  }

  private fun ReadableArray?.toRecentEntries(): List<MoneyChecksWidgetRecentEntry> {
    if (this == null) {
      return emptyList()
    }

    return List(size()) { index ->
      val entry = getMap(index)
      MoneyChecksWidgetRecentEntry(
          type = entry?.getString(RecentEntryKeys.TYPE).orEmpty(),
          amountLabel = entry?.getString(RecentEntryKeys.AMOUNT_LABEL).orEmpty(),
          title = entry?.getString(RecentEntryKeys.TITLE).orEmpty(),
          dateLabel = entry?.getString(RecentEntryKeys.DATE_LABEL).orEmpty(),
      )
    }
  }

  companion object {
    const val MODULE_NAME = "MoneyChecksWidget"
  }
}
