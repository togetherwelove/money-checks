package com.chanwook.moneychecks.widget

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.unit.ColorProvider

internal object MoneyChecksWidgetTokens {
  val summaryPanelPadding = 10.dp
  val widgetCornerRadius = 18.dp
  val periodBottomGap = 4.dp
  val amountLabelGap = 2.dp
  val amountRowGap = 3.dp
  val buttonIconGap = 4.dp
  val quickEntryButtonPadding = 8.dp

  val summaryProgressHeight = 6.dp
  val summaryProgressAreaHeight = 18.dp
  val summaryStatusBottomGap = 3.dp
  val quickEntryButtonWidth = 72.dp

  const val summaryProgressBitmapWidthPx = 320
  const val summaryProgressBitmapHeightPx = 40
  const val summaryProgressBitmapRadiusPx = 7f
  const val summaryProgressBarHeightPx = 14f
  const val summaryProgressPointerWidthPx = 26f
  const val summaryProgressPointerHeightPx = 12f

  const val relaxedExpenseRatio = 0.5
  const val stableExpenseRatio = 0.8

  val periodTextSize = 10.sp
  val statusTextSize = 13.sp
  val labelTextSize = 10.sp
  val amountTextSize = 16.sp
  val buttonTextSize = 13.sp
  val buttonIconTextSize = 24.sp

  const val backgroundColorInt = 0xFFF5F1E8.toInt()
  const val primaryColorInt = 0xFF235347.toInt()
  const val inverseTextColorInt = 0xFFFFFAF2.toInt()
  const val primaryTextColorInt = 0xFF1F2A28.toInt()
  const val secondaryTextColorInt = 0xFF5F6D68.toInt()
  const val borderColorInt = 0xFFD8CFBF.toInt()
  const val incomeColorInt = 0xFF1D7A63.toInt()
  const val expenseColorInt = 0xFFB8543C.toInt()

  val backgroundColor = ColorProvider(Color(backgroundColorInt))
  val primaryButtonColor = ColorProvider(Color(primaryColorInt))
  val buttonTextColor = ColorProvider(Color(inverseTextColorInt))
  val primaryTextColor = ColorProvider(Color(primaryTextColorInt))
  val secondaryTextColor = ColorProvider(Color(secondaryTextColorInt))
  val borderColor = ColorProvider(Color(borderColorInt))
  val incomeColor = ColorProvider(Color(incomeColorInt))
  val expenseColor = ColorProvider(Color(expenseColorInt))
}
