param()

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$signingDir = Join-Path $projectRoot '.tools\signing'
$keyFile = Join-Path $signingDir 'ritmo-release.jks'
$credentialsFile = Join-Path $signingDir 'credentials.json'
if (-not (Test-Path -LiteralPath $keyFile) -or -not (Test-Path -LiteralPath $credentialsFile)) {
  throw 'Chave privada ausente. Execute scripts/create-release-key.ps1 uma vez e preserve .tools/signing.'
}
$credentials = Get-Content -LiteralPath $credentialsFile -Raw | ConvertFrom-Json
$env:RITMO_SIGNING_STORE_FILE = $keyFile
$env:RITMO_SIGNING_STORE_PASSWORD = $credentials.storePassword
$env:RITMO_SIGNING_KEY_ALIAS = $credentials.keyAlias
$env:RITMO_SIGNING_KEY_PASSWORD = $credentials.keyPassword
$localJdk = Join-Path $projectRoot '.tools\jdk17\jdk-17.0.20.1+1'
if (Test-Path -LiteralPath $localJdk) { $env:JAVA_HOME = $localJdk }
elseif (-not $env:JAVA_HOME) { throw 'Configure JAVA_HOME para um JDK 17.' }
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$env:NODE_ENV = 'production'
try {
  Push-Location (Join-Path $projectRoot 'android')
  try {
    & .\gradlew.bat :app:assembleRelease '-PreactNativeArchitectures=arm64-v8a,x86_64' --console=plain --max-workers=4
    if ($LASTEXITCODE -ne 0) { throw 'Build release falhou.' }
  } finally { Pop-Location }
} finally {
  Remove-Item Env:\RITMO_SIGNING_STORE_FILE -ErrorAction SilentlyContinue
  Remove-Item Env:\RITMO_SIGNING_STORE_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:\RITMO_SIGNING_KEY_ALIAS -ErrorAction SilentlyContinue
  Remove-Item Env:\RITMO_SIGNING_KEY_PASSWORD -ErrorAction SilentlyContinue
}
