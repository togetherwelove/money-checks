Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$CanvasWidth = 1320
$CanvasHeight = 2868
$ScriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Resolve-Path ".\scripts").Path }
$SourceDir = "C:\Users\chanwook\Desktop\code\image\photo"
$IconPath = Join-Path $ScriptRoot "..\assets\app\icon.png"
$OutputDir = Join-Path $ScriptRoot "..\app-store-screenshots\output\iphone-6.9"
$FontFamily = "Malgun Gothic"

$Slides = @(
  @{ File = "1.png"; Label = "CALENDAR"; Headline = @("달력으로", "한눈에 보는", "한 달") },
  @{ File = "2.png"; Label = "HISTORY"; Headline = @("모든 내역을", "빠르게 찾아요") },
  @{ File = "3.png"; Label = "CHARTS"; Headline = @("수입과 지출을", "차트로 확인") },
  @{ File = "4.png"; Label = "ADD ENTRY"; Headline = @("입출금 기록을", "가볍게 등록") },
  @{ File = "5.png"; Label = "SUPPORT"; Headline = @("문의도", "앱에서 바로") },
  @{ File = "6.png"; Label = "EXPORT"; Headline = @("보고서를", "바로 내보내기") },
  @{ File = "7.png"; Label = "ALTTLE PLUS"; Headline = @("광고 없이", "더 넓게 관리") },
  @{ File = "8.png"; Label = "ALERTS"; Headline = @("필요한 알림만", "골라 받기") },
  @{ File = "9.png"; Label = "ACCOUNT"; Headline = @("계정과 언어를", "내 방식대로") },
  @{ File = "10.png"; Label = "SHARING"; Headline = @("함께 쓰는", "공유 가계부") }
)

function New-RectF($x, $y, $w, $h) {
  return [System.Drawing.RectangleF]::new([float]$x, [float]$y, [float]$w, [float]$h)
}

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-RoundedFill($graphics, $brush, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-RoundedRectPath $x $y $w $h $r
  $graphics.FillPath($brush, $path)
  $path.Dispose()
}

function Draw-RoundedStroke($graphics, $pen, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-RoundedRectPath $x $y $w $h $r
  $graphics.DrawPath($pen, $path)
  $path.Dispose()
}

function Draw-CenteredTextLine($graphics, [string]$text, $font, $brush, [float]$y, [float]$height) {
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString($text, $font, $brush, (New-RectF 96 $y ($CanvasWidth - 192) $height), $format)
  $format.Dispose()
}

function Draw-Phone($graphics, [string]$screenshotPath, [float]$x, [float]$y, [float]$outerWidth) {
  $screenshot = [System.Drawing.Image]::FromFile($screenshotPath)
  try {
    $bezel = [float]28
    $topBezel = [float]30
    $bottomBezel = [float]34
    $screenWidth = $outerWidth - ($bezel * 2)
    $screenHeight = $screenWidth * ($screenshot.Height / $screenshot.Width)
    $outerHeight = $screenHeight + $topBezel + $bottomBezel
    $radius = [float]72

    $shadowColor = [System.Drawing.Color]::FromArgb(42, 31, 42, 40)
    $shadowBrush = [System.Drawing.SolidBrush]::new($shadowColor)
    Draw-RoundedFill $graphics $shadowBrush ($x + 18) ($y + 24) $outerWidth $outerHeight $radius
    $shadowBrush.Dispose()

    $frameBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 31, 42, 40))
    Draw-RoundedFill $graphics $frameBrush $x $y $outerWidth $outerHeight $radius
    $frameBrush.Dispose()

    $screenX = $x + $bezel
    $screenY = $y + $topBezel
    $screenRadius = [float]48
    $screenPath = New-RoundedRectPath $screenX $screenY $screenWidth $screenHeight $screenRadius
    $oldClip = $graphics.Clip
    $graphics.SetClip($screenPath)
    $graphics.DrawImage($screenshot, (New-RectF $screenX $screenY $screenWidth $screenHeight))
    $graphics.Clip = $oldClip
    $oldClip.Dispose()
    $screenPath.Dispose()

    $strokePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(44, 255, 250, 242), 2)
    Draw-RoundedStroke $graphics $strokePen $x $y $outerWidth $outerHeight $radius
    $strokePen.Dispose()
  }
  finally {
    $screenshot.Dispose()
  }
}

function Save-JpegCompatiblePng($bitmap, [string]$path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$icon = [System.Drawing.Image]::FromFile((Resolve-Path $IconPath))
try {
  for ($i = 0; $i -lt $Slides.Count; $i++) {
    $slide = $Slides[$i]
    $bitmap = [System.Drawing.Bitmap]::new($CanvasWidth, $CanvasHeight, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

      $bgRect = [System.Drawing.Rectangle]::new(0, 0, $CanvasWidth, $CanvasHeight)
      $bgBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        $bgRect,
        [System.Drawing.Color]::FromArgb(255, 245, 241, 232),
        [System.Drawing.Color]::FromArgb(255, 242, 212, 202),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
      )
      $graphics.FillRectangle($bgBrush, $bgRect)
      $bgBrush.Dispose()

      $accentBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(24, 35, 83, 71))
      $graphics.FillEllipse($accentBrush, -220, 420 + (($i % 3) * 90), 620, 620)
      $graphics.FillEllipse($accentBrush, 940, 120 + (($i % 4) * 70), 520, 520)
      $accentBrush.Dispose()

      $iconSize = 96
      $iconPath = New-RoundedRectPath 96 112 $iconSize $iconSize 22
      $oldClip = $graphics.Clip
      $graphics.SetClip($iconPath)
      $graphics.DrawImage($icon, (New-RectF 96 112 $iconSize $iconSize))
      $graphics.Clip = $oldClip
      $oldClip.Dispose()
      $iconPath.Dispose()

      $labelFont = [System.Drawing.Font]::new($FontFamily, 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $headlineFont = [System.Drawing.Font]::new($FontFamily, 92, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $textBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 31, 42, 40))
      $mutedBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 95, 109, 104))
      try {
        Draw-CenteredTextLine $graphics $slide.Label $labelFont $mutedBrush 140 44
        $lineY = 248
        foreach ($line in $slide.Headline) {
          Draw-CenteredTextLine $graphics $line $headlineFont $textBrush $lineY 108
          $lineY += 106
        }
      }
      finally {
        $labelFont.Dispose()
        $headlineFont.Dispose()
        $textBrush.Dispose()
        $mutedBrush.Dispose()
      }

      $phoneWidth = 910
      $phoneX = ($CanvasWidth - $phoneWidth) / 2
      $phoneY = 760
      Draw-Phone $graphics (Join-Path $SourceDir $slide.File) $phoneX $phoneY $phoneWidth

      $outName = "{0:D2}-{1}-1320x2868.png" -f ($i + 1), ($slide.File -replace "\.png$", "")
      Save-JpegCompatiblePng $bitmap (Join-Path $OutputDir $outName)
    }
    finally {
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  }
}
finally {
  $icon.Dispose()
}

Write-Output "Generated $($Slides.Count) screenshots in $OutputDir"
