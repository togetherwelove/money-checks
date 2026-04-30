package com.chanwook.moneychecks.widget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

internal class MoneyChecksWidgetStore(context: Context) {
  private val preferences =
      context.getSharedPreferences(MoneyChecksWidgetContract.PREFERENCES_NAME, Context.MODE_PRIVATE)

  fun readSummary(): MoneyChecksWidgetSummary {
    val summaryText = preferences.getString(MoneyChecksWidgetContract.SUMMARY_KEY, null)
        ?: return MoneyChecksWidgetSummary.Empty
    return runCatching { parseSummary(JSONObject(summaryText)) }
        .getOrDefault(MoneyChecksWidgetSummary.Empty)
  }

  fun saveSummary(summary: MoneyChecksWidgetSummary) {
    preferences
        .edit()
        .putString(MoneyChecksWidgetContract.SUMMARY_KEY, serializeSummary(summary).toString())
        .apply()
  }

  fun clearSummary() {
    preferences.edit().remove(MoneyChecksWidgetContract.SUMMARY_KEY).apply()
  }

  private fun parseSummary(summaryJson: JSONObject): MoneyChecksWidgetSummary {
    val recentEntriesJson = summaryJson.optJSONArray(SummaryKeys.RECENT_ENTRIES) ?: JSONArray()
    val recentEntries =
        List(recentEntriesJson.length()) { index ->
          val entryJson = recentEntriesJson.optJSONObject(index) ?: JSONObject()
          MoneyChecksWidgetRecentEntry(
              type = entryJson.optString(RecentEntryKeys.TYPE),
              amountLabel = entryJson.optString(RecentEntryKeys.AMOUNT_LABEL),
              title = entryJson.optString(RecentEntryKeys.TITLE),
              dateLabel = entryJson.optString(RecentEntryKeys.DATE_LABEL),
          )
        }

    return MoneyChecksWidgetSummary(
        todayIncomeLabel =
            summaryJson.optString(SummaryKeys.TODAY_INCOME_LABEL, MoneyChecksWidgetCopy.EMPTY_AMOUNT),
        todayExpenseLabel =
            summaryJson.optString(SummaryKeys.TODAY_EXPENSE_LABEL, MoneyChecksWidgetCopy.EMPTY_AMOUNT),
        monthIncomeAmount = summaryJson.optDouble(SummaryKeys.MONTH_INCOME_AMOUNT, 0.0),
        monthIncomeLabel =
            summaryJson.optString(SummaryKeys.MONTH_INCOME_LABEL, MoneyChecksWidgetCopy.EMPTY_AMOUNT),
        monthExpenseAmount = summaryJson.optDouble(SummaryKeys.MONTH_EXPENSE_AMOUNT, 0.0),
        monthExpenseLabel =
            summaryJson.optString(SummaryKeys.MONTH_EXPENSE_LABEL, MoneyChecksWidgetCopy.EMPTY_AMOUNT),
        recentEntries = recentEntries,
    )
  }

  private fun serializeSummary(summary: MoneyChecksWidgetSummary): JSONObject {
    return JSONObject()
        .put(SummaryKeys.TODAY_INCOME_LABEL, summary.todayIncomeLabel)
        .put(SummaryKeys.TODAY_EXPENSE_LABEL, summary.todayExpenseLabel)
        .put(SummaryKeys.MONTH_INCOME_AMOUNT, summary.monthIncomeAmount)
        .put(SummaryKeys.MONTH_INCOME_LABEL, summary.monthIncomeLabel)
        .put(SummaryKeys.MONTH_EXPENSE_AMOUNT, summary.monthExpenseAmount)
        .put(SummaryKeys.MONTH_EXPENSE_LABEL, summary.monthExpenseLabel)
        .put(
            SummaryKeys.RECENT_ENTRIES,
            JSONArray(
                summary.recentEntries.map { entry ->
                  JSONObject()
                      .put(RecentEntryKeys.TYPE, entry.type)
                      .put(RecentEntryKeys.AMOUNT_LABEL, entry.amountLabel)
                      .put(RecentEntryKeys.TITLE, entry.title)
                      .put(RecentEntryKeys.DATE_LABEL, entry.dateLabel)
                },
            ),
        )
  }
}

internal object SummaryKeys {
  const val TODAY_INCOME_LABEL = "todayIncomeLabel"
  const val TODAY_EXPENSE_LABEL = "todayExpenseLabel"
  const val MONTH_INCOME_AMOUNT = "monthIncomeAmount"
  const val MONTH_INCOME_LABEL = "monthIncomeLabel"
  const val MONTH_EXPENSE_AMOUNT = "monthExpenseAmount"
  const val MONTH_EXPENSE_LABEL = "monthExpenseLabel"
  const val RECENT_ENTRIES = "recentEntries"
}

internal object RecentEntryKeys {
  const val TYPE = "type"
  const val AMOUNT_LABEL = "amountLabel"
  const val TITLE = "title"
  const val DATE_LABEL = "dateLabel"
}
