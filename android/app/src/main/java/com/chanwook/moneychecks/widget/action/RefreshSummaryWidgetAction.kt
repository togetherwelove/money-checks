package com.chanwook.moneychecks.widget.action

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import com.chanwook.moneychecks.widget.MoneyChecksWidgetUpdater

class RefreshSummaryWidgetAction : ActionCallback {
  override suspend fun onAction(
      context: Context,
      glanceId: GlanceId,
      parameters: ActionParameters,
  ) {
    MoneyChecksWidgetUpdater.updateSummaryWidgets(context)
  }
}
