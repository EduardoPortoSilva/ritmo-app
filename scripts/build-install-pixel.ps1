[CmdletBinding()]
param(
  [string]$AvdName = 'Pixel_7_2',
  [string]$Serial,
  [ValidateRange(1, 600)][int]$BootTimeoutSeconds = 120,
  [switch]$SkipPrebuild
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if ($Serial -and $Serial -notmatch '^emulator-\d+$') {
  throw 'Serial invalido: este comando instala somente em emuladores Android.'
}
if ([string]::IsNullOrWhiteSpace($AvdName)) { throw 'Informe o nome do AVD.' }

function Invoke-Adb {
  $result = & $script:adb @args
  if ($LASTEXITCODE -ne 0) { throw "adb falhou: $($args -join ' ')" }
  return $result
}

function Assert-Target {
  $devices = @(Invoke-Adb devices)
  if (-not ($devices -match "^$([regex]::Escape($script:targetSerial))\s+device(?:\s|$)")) {
    throw "O emulador $script:targetSerial nao esta conectado e pronto. Abra o AVD $AvdName."
  }
  $name = (Invoke-Adb -s $script:targetSerial shell getprop ro.boot.qemu.avd_name | Out-String).Trim()
  if (-not $name) {
    $name = (Invoke-Adb -s $script:targetSerial shell getprop ro.kernel.qemu.avd_name | Out-String).Trim()
  }
  if ($name -ne $AvdName) { throw "AVD incorreto: esperado '$AvdName', encontrado '$name'." }
}

function Wait-ForBoot {
  Assert-Target
  $deadline = (Get-Date).AddSeconds($BootTimeoutSeconds)
  do {
    $booted = (Invoke-Adb -s $script:targetSerial shell getprop sys.boot_completed | Out-String).Trim()
    if ($booted -eq '1') { return }
    if ((Get-Date) -ge $deadline) { throw "O AVD nao terminou de iniciar em $BootTimeoutSeconds segundos." }
    Start-Sleep -Seconds 2
  } while ($true)
}

$previousEnvironment = @{}
foreach ($name in @('ANDROID_HOME', 'JAVA_HOME', 'NODE_ENV', 'EXPO_NO_TELEMETRY')) {
  $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

Push-Location $projectRoot
try {
  $sdk = $env:ANDROID_HOME
  if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
  if (-not $sdk -and $env:LOCALAPPDATA) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
  if (-not $sdk -or -not (Test-Path -LiteralPath (Join-Path $sdk 'platform-tools\adb.exe'))) {
    throw 'Configure ANDROID_HOME para um Android SDK com platform-tools/adb.exe.'
  }
  $env:ANDROID_HOME = (Resolve-Path -LiteralPath $sdk).Path
  $script:adb = Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'
  $localJdk = Join-Path $projectRoot '.tools\jdk17\jdk-17.0.20.1+1'
  if (Test-Path -LiteralPath $localJdk) { $env:JAVA_HOME = $localJdk }
  if (-not $env:JAVA_HOME -or -not (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    throw 'Configure JAVA_HOME para um JDK 17.'
  }
  $javaRelease = Join-Path $env:JAVA_HOME 'release'
  if (-not (Test-Path -LiteralPath $javaRelease) -or
      -not (Select-String -LiteralPath $javaRelease -Pattern '^JAVA_VERSION="17\.' -Quiet)) {
    throw 'O build release exige JDK 17. Confira JAVA_HOME.'
  }
  $expoCli = Join-Path $projectRoot 'node_modules\expo\bin\cli'
  if (-not (Test-Path -LiteralPath $expoCli)) { throw 'Dependencias ausentes. Execute npm.cmd ci.' }
  $node = (Get-Command node.exe -ErrorAction Stop).Source

  if ($Serial) {
    $script:targetSerial = $Serial
  } else {
    $matchingDevices = @(foreach ($line in @(Invoke-Adb devices)) {
      if ($line -match '^(emulator-\d+)\s+device(?:\s|$)') {
        $candidate = $Matches[1]
        $candidateName = (Invoke-Adb -s $candidate shell getprop ro.boot.qemu.avd_name | Out-String).Trim()
        if (-not $candidateName) {
          $candidateName = (Invoke-Adb -s $candidate shell getprop ro.kernel.qemu.avd_name | Out-String).Trim()
        }
        if ($candidateName -eq $AvdName) { $candidate }
      }
    })
    if ($matchingDevices.Count -ne 1) {
      throw "Esperado um AVD '$AvdName' ligado; encontrados $($matchingDevices.Count). Abra-o ou informe -Serial emulator-XXXX."
    }
    $script:targetSerial = $matchingDevices[0]
  }
  Wait-ForBoot

  $config = (Get-Content -LiteralPath 'app.json' -Raw | ConvertFrom-Json).expo
  $package = $config.android.package
  if ($package -notmatch '^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$') {
    throw 'Pacote Android invalido em app.json.'
  }
  $buildTools = Get-ChildItem -LiteralPath (Join-Path $env:ANDROID_HOME 'build-tools') -Directory |
    Where-Object { $_.Name -match '^\d+\.\d+\.\d+$' -and
      (Test-Path -LiteralPath (Join-Path $_.FullName 'apksigner.bat')) -and
      (Test-Path -LiteralPath (Join-Path $_.FullName 'aapt2.exe')) } |
    Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
  if (-not $buildTools) { throw 'Instale Android SDK Build-Tools (apksigner e aapt2).' }

  Write-Host "Compilando release para $AvdName ($script:targetSerial)..."
  if (-not $SkipPrebuild -or -not (Test-Path -LiteralPath 'android\gradlew.bat')) {
    $env:EXPO_NO_TELEMETRY = '1'
    & $node $expoCli prebuild --platform android --no-install
    if ($LASTEXITCODE -ne 0) {
      throw 'Prebuild falhou. Se houver arquivo bloqueado, encerre o build/daemon deste projeto e tente novamente.'
    }
  }
  # Use a child process so failures cannot fall through to an older APK.
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'build-release.ps1') -NoDaemon
  if ($LASTEXITCODE -ne 0) { throw 'Build release falhou; nenhum APK foi instalado.' }
  $apk = Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk'
  if (-not (Test-Path -LiteralPath $apk)) { throw 'O build nao gerou app-release.apk.' }

  & (Join-Path $buildTools.FullName 'apksigner.bat') verify $apk
  if ($LASTEXITCODE -ne 0) { throw 'A assinatura do APK nao e valida; instalacao cancelada.' }
  $badging = & (Join-Path $buildTools.FullName 'aapt2.exe') dump badging $apk
  if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel conferir os metadados do APK.' }
  $packageLine = @($badging | Where-Object { $_ -like 'package:*' })[0]
  $expected = "^package: name='$([regex]::Escape($package))' versionCode='$($config.android.versionCode)' versionName='$([regex]::Escape($config.version))'"
  if ($packageLine -notmatch $expected) {
    throw 'APK divergente de app.json. Execute novamente sem -SkipPrebuild.'
  }

  # Re-check the AVD after the build: emulator serials can be reused.
  Wait-ForBoot
  Invoke-Adb -s $script:targetSerial install -r $apk | Out-Host
  $installedPath = (Invoke-Adb -s $script:targetSerial shell pm path $package | Out-String).Trim()
  if ($installedPath -notmatch '^package:(/data/app/[a-zA-Z0-9_./~+=-]+/base\.apk)$') {
    throw 'Nao foi possivel identificar o APK instalado.'
  }
  $deviceHash = (Invoke-Adb -s $script:targetSerial shell sha256sum $Matches[1] | Out-String).Trim().Split(' ')[0]
  $hasher = [Security.Cryptography.SHA256]::Create()
  $apkStream = [IO.File]::OpenRead($apk)
  try {
    $apkHash = [BitConverter]::ToString($hasher.ComputeHash($apkStream)).Replace('-', '').ToLowerInvariant()
  } finally {
    $apkStream.Dispose()
    $hasher.Dispose()
  }
  if ($deviceHash -ne $apkHash) { throw 'O APK instalado nao corresponde ao APK compilado.' }
  $launch = Invoke-Adb -s $script:targetSerial shell am start -W -n "$package/.MainActivity"
  $launch | Out-Host
  if (-not ($launch -match '^Status: ok')) { throw 'O Android nao confirmou a abertura do Ritmo.' }
  Write-Host "Ritmo $($config.version) (build $($config.android.versionCode)) instalado e aberto em $AvdName."
  Write-Host "APK: $apk"
  Write-Host "SHA-256: $apkHash"
} finally {
  Pop-Location
  foreach ($name in $previousEnvironment.Keys) {
    [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
  }
}
