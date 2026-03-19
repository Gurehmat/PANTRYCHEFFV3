param(
  [string]$SpecPath = "tmp/pdfs/pantrycheffv3_app_summary_preview.json",
  [string]$OutPath = "tmp/pdfs/pantrycheffv3_app_summary_preview.png"
)

Add-Type -AssemblyName System.Drawing

function New-ColorFromRgbString {
  param([string]$Rgb)
  $parts = $Rgb.Split(' ') | Where-Object { $_ -ne '' }
  $r = [int]([double]$parts[0] * 255)
  $g = [int]([double]$parts[1] * 255)
  $b = [int]([double]$parts[2] * 255)
  return [System.Drawing.Color]::FromArgb($r, $g, $b)
}

$spec = Get-Content $SpecPath -Raw | ConvertFrom-Json
$width = [int]$spec.page.width
$height = [int]$spec.page.height

$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.Color]::White)

$bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 247, 240))
$graphics.FillRectangle($bgBrush, 34, 48, 544, 66)
$headerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 252, 241, 232))
$graphics.FillRectangle($headerBrush, 35, 49, 542, 64)

foreach ($item in $spec.drawing) {
  if ($item.type -ne 'text') { continue }

  $fontFamily = if ($item.fontSize -ge 11 -or $item.content -cmatch '^[A-Z0-9 -]+$') { 'Segoe UI Semibold' } else { 'Segoe UI' }
  $font = New-Object System.Drawing.Font($fontFamily, [float]$item.fontSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
  $brush = New-Object System.Drawing.SolidBrush (New-ColorFromRgbString $item.color)
  $x = [float]$item.x
  $y = [float]($height - $item.y - ($item.fontSize * 1.2))
  $graphics.DrawString([string]$item.content, $font, $brush, $x, $y)
  $font.Dispose()
  $brush.Dispose()
}

$bitmap.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
$bgBrush.Dispose()
$headerBrush.Dispose()

Write-Output (Resolve-Path $OutPath)
