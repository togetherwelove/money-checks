package com.chanwook.moneychecks.widget

import android.content.Intent
import android.net.Uri
import androidx.glance.action.Action
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import com.chanwook.moneychecks.widget.action.RefreshSummaryWidgetAction

internal object MoneyChecksWidgetActions {
  val openEntry: Action = actionStartActivity(openDeepLinkIntent(MoneyChecksWidgetContract.ENTRY_DEEP_LINK))

  val openClipboardImport: Action =
      actionStartActivity(openDeepLinkIntent(MoneyChecksWidgetContract.CLIPBOARD_DEEP_LINK))

  val refreshSummary: Action = actionRunCallback<RefreshSummaryWidgetAction>()

  private fun openDeepLinkIntent(url: String): Intent {
    return Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
  }
}
