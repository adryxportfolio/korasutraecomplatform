$ErrorActionPreference = "Stop"

$bun = (Get-Command bun.exe).Source
$out = Join-Path (Get-Location) 'server.out.log'
$stderr = Join-Path (Get-Location) 'server.err.log'

Start-Process `
  -FilePath $bun `
  -ArgumentList @('scripts/serve-bun.mjs') `
  -WorkingDirectory (Get-Location) `
  -WindowStyle Hidden `
  -RedirectStandardOutput $out `
  -RedirectStandardError $stderr

Start-Sleep -Seconds 2
Invoke-WebRequest -Uri http://127.0.0.1:8080 -UseBasicParsing -TimeoutSec 10 | Select-Object -ExpandProperty StatusCode
