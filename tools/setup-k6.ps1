$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $projectRoot '.tooling\k6'
$binary = Join-Path $destination 'k6-v2.3.0-windows-amd64\k6.exe'
if (Test-Path -LiteralPath $binary) { Write-Output 'k6 is already available.'; exit 0 }
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$archive = Join-Path $destination 'k6.zip'
Write-Output 'Downloading official k6 v2.3.0 for Windows x64. Internet is required on the first run.'
Invoke-WebRequest -Uri 'https://github.com/grafana/k6/releases/download/v2.3.0/k6-v2.3.0-windows-amd64.zip' -OutFile $archive
Expand-Archive -LiteralPath $archive -DestinationPath $destination -Force
if (-not (Test-Path -LiteralPath $binary)) { throw 'The downloaded archive did not contain k6.exe.' }
& $binary version
