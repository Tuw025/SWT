param([switch]$SkipPubGet)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    throw 'Install Flutter SDK, add flutter/bin to PATH, then run this script again.'
}
$mobile = Join-Path $PSScriptRoot 'apps\mobile'
$scaffold = Join-Path $PSScriptRoot '.tooling\mobile-scaffold'
if ((Test-Path -LiteralPath (Join-Path $mobile 'android')) -or
    (Test-Path -LiteralPath (Join-Path $mobile 'ios'))) {
    throw 'Platform folders already exist. Run flutter pub get inside apps/mobile instead.'
}
& flutter create --empty --no-pub --platforms android,ios --project-name date_time_checker --org edu.fu.swt $scaffold
if ($LASTEXITCODE -ne 0) { throw 'Flutter could not generate platform folders.' }
foreach ($folder in @('android', 'ios')) {
    Copy-Item -LiteralPath (Join-Path $scaffold $folder) -Destination $mobile -Recurse
}
if (Test-Path -LiteralPath (Join-Path $scaffold '.metadata')) {
    Copy-Item -LiteralPath (Join-Path $scaffold '.metadata') -Destination $mobile
}
# Local HTTP is allowed only in Android debug/profile builds.
foreach ($variant in @('debug', 'profile')) {
    $manifestDirectory = Join-Path $mobile "android\app\src\$variant"
    New-Item -ItemType Directory -Force -Path $manifestDirectory | Out-Null
    $manifest = @'
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:usesCleartextTraffic="true" />
</manifest>
'@
    Set-Content -LiteralPath (Join-Path $manifestDirectory 'AndroidManifest.xml') -Value $manifest -Encoding utf8
}
# Simulator access to the local learning server. Real deployment should use HTTPS.
$plistPath = Join-Path $mobile 'ios\Runner\Info.plist'
$plist = Get-Content -LiteralPath $plistPath -Raw
$ats = @'
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsLocalNetworking</key>
        <true/>
    </dict>
'@
$closing = $plist.LastIndexOf('</dict>')
if ($closing -lt 0) { throw 'Generated iOS Info.plist is invalid.' }
$plist = $plist.Insert($closing, $ats)
Set-Content -LiteralPath $plistPath -Value $plist -Encoding utf8
if (-not $SkipPubGet) {
    Push-Location $mobile
    try {
        & flutter pub get
        if ($LASTEXITCODE -ne 0) { throw 'Flutter could not download dependencies.' }
    } finally { Pop-Location }
}
Write-Host 'Mobile platform folders are ready. Run flutter analyze, then flutter run inside apps/mobile.'
