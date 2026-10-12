param([string]$ListenUrl = 'http://127.0.0.1:5080')
$ErrorActionPreference = 'Stop'
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    throw 'Install .NET SDK 10 before starting this project.'
}
$backend = Join-Path $PSScriptRoot 'apps\backend\DateTimeChecker.Api.csproj'
Write-Host "Date Time Checker: $ListenUrl"
& dotnet run --project $backend --no-launch-profile --urls $ListenUrl
if ($LASTEXITCODE -ne 0) { throw 'Could not start Date Time Checker.' }
