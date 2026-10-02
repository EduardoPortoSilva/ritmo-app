# Rasterize the source icon's simple vector geometry without extra dependencies.
Add-Type -AssemblyName System.Drawing
foreach ($size in @(1024, 48)) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#243D32'))
    $scale = $size / 1024.0
    $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#D5F578'), (52 * $scale))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $points = @(
        [System.Drawing.PointF]::new((245 * $scale), (530 * $scale)),
        [System.Drawing.PointF]::new((378 * $scale), (530 * $scale)),
        [System.Drawing.PointF]::new((469 * $scale), (336 * $scale)),
        [System.Drawing.PointF]::new((577 * $scale), (688 * $scale)),
        [System.Drawing.PointF]::new((668 * $scale), (530 * $scale)),
        [System.Drawing.PointF]::new((779 * $scale), (530 * $scale))
    )
    $graphics.DrawLines($pen, $points)
    $filename = if ($size -eq 1024) { 'icon.png' } else { 'favicon.png' }
    $bitmap.Save((Join-Path $PSScriptRoot $filename), [System.Drawing.Imaging.ImageFormat]::Png)
    $pen.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}
