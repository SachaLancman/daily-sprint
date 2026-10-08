# Draws the PNG app icons (same design as icon.svg) into the project folder.
# Run again after changing the icon design.
Add-Type -AssemblyName System.Drawing
$out = Split-Path -Parent $PSScriptRoot
function Bar($g, $brush, $x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90); $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90); $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure(); $g.FillPath($brush, $p)
}
foreach ($size in 180, 192, 512) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#2B2370'))
  $s = $size / 512
  # x, y, height, color for each bar, matching icon.svg (one bar per game)
  $bars = @(@(132, 300, 80, '#5B82FF'), @(198, 250, 130, '#A57BFF'), @(264, 200, 180, '#1FC9B6'), @(330, 150, 230, '#FF9A55'))
  foreach ($b in $bars) {
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($b[3]))
    Bar $g $brush ($b[0] * $s) ($b[1] * $s) (50 * $s) ($b[2] * $s) (14 * $s)
  }
  $name = if ($size -eq 180) { 'apple-touch-icon.png' } else { "icon-$size.png" }
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
