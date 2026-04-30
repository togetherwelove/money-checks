package com.chanwook.moneychecks.widget

import android.content.Context
import androidx.glance.appwidget.updateAll

internal object MoneyChecksWidgetUpdater {
  suspend fun updateSummaryWidgets(context: Context) {
    MoneyChecksSummaryWidget().updateAll(context)
  }
}
