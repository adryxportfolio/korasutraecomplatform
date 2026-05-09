$bun = (Get-Command bun.exe).Source
$out = Join-Path (Get-Location) 'server.smoke.out.log'
$stderr = Join-Path (Get-Location) 'server.smoke.err.log'
Remove-Item -LiteralPath $out,$stderr -ErrorAction SilentlyContinue
$p = Start-Process -FilePath $bun -ArgumentList @('scripts/serve-bun.mjs') -WorkingDirectory (Get-Location) -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $stderr -PassThru
Start-Sleep -Seconds 2

$homeResponse = $null
$adminResponse = $null
$js = $null
$css = $null
$err = $null

try {
  $homeResponse = Invoke-WebRequest -Uri http://127.0.0.1:8080 -UseBasicParsing -TimeoutSec 10
  $adminResponse = Invoke-WebRequest -Uri http://127.0.0.1:8080/admin -UseBasicParsing -TimeoutSec 10
  $js = Invoke-WebRequest -Uri http://127.0.0.1:8080/main.js -UseBasicParsing -TimeoutSec 10
  $css = Invoke-WebRequest -Uri http://127.0.0.1:8080/tailwind.css -UseBasicParsing -TimeoutSec 10
} catch {
  $err = $_.Exception.Message
} finally {
  Get-Process -Id $p.Id -ErrorAction SilentlyContinue | Stop-Process -Force
}

[pscustomobject]@{
  Error = $err
  HomeStatus = $homeResponse.StatusCode
  HomeHasRoot = ($homeResponse.Content -match '<div id="root"></div>')
  AdminStatus = $adminResponse.StatusCode
  AdminHasSpa = ($adminResponse.Content -match '/main.js')
  JsStatus = $js.StatusCode
  JsKb = if ($js) { [math]::Round($js.RawContentLength / 1KB, 1) } else { 0 }
  CssStatus = $css.StatusCode
  CssKb = if ($css) { [math]::Round($css.RawContentLength / 1KB, 1) } else { 0 }
  ServerOut = if (Test-Path $out) { [string](Get-Content $out -Raw) } else { "" }
  ServerErr = if (Test-Path $stderr) { [string](Get-Content $stderr -Raw) } else { "" }
} | ConvertTo-Json
