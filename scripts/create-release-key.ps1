param()

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$signingDir = Join-Path $projectRoot '.tools\signing'
$keyFile = Join-Path $signingDir 'ritmo-release.jks'
$credentialsFile = Join-Path $signingDir 'credentials.json'
$keytool = Join-Path $projectRoot '.tools\jdk17\jdk-17.0.20.1+1\bin\keytool.exe'
if (-not (Test-Path -LiteralPath $keytool)) { $keytool = 'keytool' }
if ((Test-Path -LiteralPath $keyFile) -or (Test-Path -LiteralPath $credentialsFile)) {
  throw 'A chave ou as credenciais ja existem. Nao sobrescreva uma chave de distribuicao.'
}
New-Item -ItemType Directory -Path $signingDir -Force | Out-Null
# Protect the directory before either the private key or plaintext credentials exists.
$ownerSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
$acl = Get-Acl -LiteralPath $signingDir
$acl.SetAccessRuleProtection($true, $false)
$acl.SetOwner($ownerSid)
$ownerRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
  $ownerSid, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow'
)
$acl.AddAccessRule($ownerRule)
Set-Acl -LiteralPath $signingDir -AclObject $acl
if (-not (Get-Acl -LiteralPath $signingDir).AreAccessRulesProtected) {
  throw 'Nao foi possivel proteger as permissoes da pasta de assinatura.'
}

$random = [byte[]]::new(48)
$generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $generator.GetBytes($random) } finally { $generator.Dispose() }
$password = [Convert]::ToBase64String($random).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$env:RITMO_SIGNING_STORE_PASSWORD = $password
$env:RITMO_SIGNING_KEY_PASSWORD = $password
try {
  & $keytool -genkeypair -v -keystore $keyFile -alias ritmo -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Ritmo, OU=Mobile, O=Ritmo, C=BR' -storepass:env RITMO_SIGNING_STORE_PASSWORD -keypass:env RITMO_SIGNING_KEY_PASSWORD -noprompt
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $keyFile)) { throw 'Falha ao gerar a chave de assinatura.' }
  @{ keyAlias = 'ritmo'; storePassword = $password; keyPassword = $password } |
    ConvertTo-Json | Set-Content -LiteralPath $credentialsFile -Encoding utf8
} finally {
  Remove-Item Env:\RITMO_SIGNING_STORE_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:\RITMO_SIGNING_KEY_PASSWORD -ErrorAction SilentlyContinue
}
Write-Host 'Chave privada criada em .tools/signing. Guarde uma copia segura da pasta inteira fora do repositorio.'
