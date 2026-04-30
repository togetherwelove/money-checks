package com.chanwook.moneychecks.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import androidx.compose.runtime.Composable
import androidx.glance.GlanceId
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.GlanceModifier
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ColumnScope
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.RowScope
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider

class MoneyChecksSummaryWidget : GlanceAppWidget() {
  override val sizeMode: SizeMode = SizeMode.Single

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val summary = MoneyChecksWidgetStore(context).readSummary()
    provideContent {
      MoneyChecksSummaryWidgetContent(summary)
    }
  }
}

@Composable
private fun MoneyChecksSummaryWidgetContent(summary: MoneyChecksWidgetSummary) {
  Row(
      modifier =
          GlanceModifier.fillMaxSize()
              .appWidgetBackground()
              .cornerRadius(MoneyChecksWidgetTokens.widgetCornerRadius)
              .background(MoneyChecksWidgetTokens.backgroundColor),
      verticalAlignment = Alignment.Vertical.CenterVertically,
  ) {
    MonthlySummaryPanel(
        summary = summary,
        modifier = GlanceModifier.defaultWeight(),
    )
    QuickEntryButton()
  }
}

@Composable
private fun RowScope.MonthlySummaryPanel(
    summary: MoneyChecksWidgetSummary,
    modifier: GlanceModifier,
) {
  Column(
      modifier =
          modifier
              .fillMaxHeight()
              .padding(MoneyChecksWidgetTokens.summaryPanelPadding),
  ) {
    Text(
        text = MoneyChecksWidgetCopy.SUMMARY_PERIOD_LABEL,
        style =
            TextStyle(
                color = MoneyChecksWidgetTokens.secondaryTextColor,
                fontSize = MoneyChecksWidgetTokens.periodTextSize,
                fontWeight = FontWeight.Medium,
            ),
    )
    Spacer(modifier = GlanceModifier.height(MoneyChecksWidgetTokens.periodBottomGap))
    SummaryProgressBar(
        summary = summary,
        modifier = GlanceModifier.defaultWeight(),
    )
    AmountRow(
        label = MoneyChecksWidgetCopy.MONTH_EXPENSE_LABEL,
        amountLabel = summary.monthExpenseLabel,
        color = MoneyChecksWidgetTokens.expenseColor,
    )
    Spacer(modifier = GlanceModifier.height(MoneyChecksWidgetTokens.amountRowGap))
    AmountRow(
        label = MoneyChecksWidgetCopy.MONTH_INCOME_LABEL,
        amountLabel = summary.monthIncomeLabel,
        color = MoneyChecksWidgetTokens.incomeColor,
    )
  }
}

@Composable
private fun AmountRow(
    label: String,
    amountLabel: String,
    color: ColorProvider,
) {
  Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.Vertical.CenterVertically) {
    Text(
        text = label,
        style =
            TextStyle(
                color = MoneyChecksWidgetTokens.secondaryTextColor,
                fontSize = MoneyChecksWidgetTokens.labelTextSize,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Start,
            ),
    )
    Spacer(modifier = GlanceModifier.width(MoneyChecksWidgetTokens.amountLabelGap))
    Text(
        text = amountLabel,
        modifier = GlanceModifier.fillMaxWidth(),
        style =
            TextStyle(
                color = color,
                fontSize = MoneyChecksWidgetTokens.amountTextSize,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Start,
            ),
    )
  }
}

@Composable
private fun ColumnScope.SummaryProgressBar(
    summary: MoneyChecksWidgetSummary,
    modifier: GlanceModifier,
) {
  val expenseAmount = summary.monthExpenseAmount.coerceAtLeast(0.0)
  val incomeAmount = summary.monthIncomeAmount.coerceAtLeast(0.0)

  Box(
      modifier = modifier.fillMaxWidth(),
      contentAlignment = Alignment.Center,
  ) {
    Column(modifier = GlanceModifier.fillMaxWidth()) {
      Text(
          text = resolveConsumptionStatus(expenseAmount, incomeAmount).message,
          modifier = GlanceModifier.fillMaxWidth(),
          style =
              TextStyle(
                  color = MoneyChecksWidgetTokens.primaryTextColor,
                  fontSize = MoneyChecksWidgetTokens.statusTextSize,
                  fontWeight = FontWeight.Bold,
                  textAlign = TextAlign.Center,
              ),
      )
      Spacer(modifier = GlanceModifier.height(MoneyChecksWidgetTokens.summaryStatusBottomGap))
      Image(
          provider = ImageProvider(createSummaryProgressBitmap(expenseAmount, incomeAmount)),
          contentDescription = null,
          modifier =
              GlanceModifier.fillMaxWidth()
                  .height(MoneyChecksWidgetTokens.summaryProgressAreaHeight),
          contentScale = ContentScale.FillBounds,
      )
    }
  }
}

private fun createSummaryProgressBitmap(
    expenseAmount: Double,
    incomeAmount: Double,
): Bitmap {
  val width = MoneyChecksWidgetTokens.summaryProgressBitmapWidthPx
  val height = MoneyChecksWidgetTokens.summaryProgressBitmapHeightPx
  val radius = MoneyChecksWidgetTokens.summaryProgressBitmapRadiusPx
  val barHeight = MoneyChecksWidgetTokens.summaryProgressBarHeightPx
  val barTop = height - barHeight
  val pointerHeight = MoneyChecksWidgetTokens.summaryProgressPointerHeightPx
  val pointerHalfWidth = MoneyChecksWidgetTokens.summaryProgressPointerWidthPx / 2
  val barLeft = pointerHalfWidth
  val barRight = width - pointerHalfWidth
  val barWidth = barRight - barLeft
  val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
  val canvas = Canvas(bitmap)
  val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  val barBounds = RectF(barLeft, barTop, barRight, height.toFloat())
  val clipPath =
      Path().apply {
        addRoundRect(barBounds, radius, radius, Path.Direction.CW)
      }

  canvas.save()
  canvas.clipPath(clipPath)
  paint.color = MoneyChecksWidgetTokens.incomeColorInt
  canvas.drawRect(barBounds, paint)

  val expenseRatio =
      when {
        incomeAmount <= 0.0 && expenseAmount <= 0.0 -> 0f
        incomeAmount <= 0.0 -> 1f
        else -> (expenseAmount / incomeAmount).toFloat().coerceIn(0f, 1f)
      }
  val pointerX = barLeft + (barWidth * expenseRatio)
  if (expenseRatio > 0f) {
    paint.color = MoneyChecksWidgetTokens.expenseColorInt
    canvas.drawRect(barLeft, barTop, pointerX, height.toFloat(), paint)
  }
  canvas.restore()

  drawProgressPointer(canvas, paint, pointerX, barTop, pointerHalfWidth, pointerHeight)
  return bitmap
}

private fun drawProgressPointer(
    canvas: Canvas,
    paint: Paint,
    pointerX: Float,
    barTop: Float,
    pointerHalfWidth: Float,
    pointerHeight: Float,
) {
  val pointerPath =
      Path().apply {
        moveTo(pointerX, barTop)
        lineTo(pointerX - pointerHalfWidth, barTop - pointerHeight)
        lineTo(pointerX + pointerHalfWidth, barTop - pointerHeight)
        close()
      }
  paint.color = MoneyChecksWidgetTokens.primaryColorInt
  canvas.drawPath(pointerPath, paint)
}

@Composable
private fun QuickEntryButton() {
  Box(
      modifier =
          GlanceModifier.width(MoneyChecksWidgetTokens.quickEntryButtonWidth)
              .fillMaxHeight()
              .background(MoneyChecksWidgetTokens.primaryButtonColor)
              .padding(MoneyChecksWidgetTokens.quickEntryButtonPadding)
              .clickable(MoneyChecksWidgetActions.openClipboardImport),
      contentAlignment = Alignment.Center,
  ) {
    Column(horizontalAlignment = Alignment.Horizontal.CenterHorizontally) {
      Text(
          text = MoneyChecksWidgetCopy.OPEN_ENTRY_BUTTON,
          style =
              TextStyle(
                  color = MoneyChecksWidgetTokens.buttonTextColor,
                  fontSize = MoneyChecksWidgetTokens.buttonTextSize,
                  fontWeight = FontWeight.Bold,
                  textAlign = TextAlign.Center,
              ),
      )
      Spacer(modifier = GlanceModifier.height(MoneyChecksWidgetTokens.buttonIconGap))
      Text(
          text = MoneyChecksWidgetCopy.OPEN_ENTRY_ICON,
          style =
              TextStyle(
                  color = MoneyChecksWidgetTokens.buttonTextColor,
                  fontSize = MoneyChecksWidgetTokens.buttonIconTextSize,
                  fontWeight = FontWeight.Bold,
                  textAlign = TextAlign.Center,
              ),
      )
    }
  }
}
