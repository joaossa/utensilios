param(
  [switch]$MigrarBanco
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Ensure-LocalEnvFile {
  param(
    [string]$TargetPath,
    [string]$TemplatePath
  )

  if (Test-Path $TargetPath) {
    return $false
  }

  if (-not (Test-Path $TemplatePath)) {
    throw "Arquivo de exemplo nao encontrado: $TemplatePath"
  }

  Copy-Item $TemplatePath $TargetPath -Force
  return $true
}

function Get-EnvFileValue {
  param(
    [string]$FilePath,
    [string]$Key
  )

  $line = Get-Content $FilePath | Where-Object {
    $_ -match "^\s*$([regex]::Escape($Key))\s*="
  } | Select-Object -First 1

  if (-not $line) {
    return $null
  }

  return (($line -split "=", 2)[1]).Trim().Trim('"').Trim("'")
}

function Assert-LocalApiEnv {
  param(
    [string]$FilePath
  )

  $databaseUrl = Get-EnvFileValue -FilePath $FilePath -Key "DATABASE_URL"

  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    throw "DATABASE_URL nao encontrada em $FilePath"
  }

  if ($databaseUrl -notmatch "(localhost|127\.0\.0\.1|::1)") {
    throw "O arquivo '$FilePath' nao parece apontar para banco local. Ajuste a DATABASE_URL antes de iniciar."
  }
}

function Assert-LocalWebEnv {
  param(
    [string]$FilePath
  )

  $apiBaseUrl = Get-EnvFileValue -FilePath $FilePath -Key "VITE_API_BASE_URL"

  if ([string]::IsNullOrWhiteSpace($apiBaseUrl)) {
    throw "VITE_API_BASE_URL nao encontrada em $FilePath"
  }

  if ($apiBaseUrl -notmatch "^https?://(localhost|127\.0\.0\.1)(:\d+)?/?$") {
    throw "O arquivo '$FilePath' nao parece apontar para API local. Ajuste a VITE_API_BASE_URL antes de iniciar."
  }
}

function Start-DevWindow {
  param(
    [string]$Title,
    [string]$Command
  )

  Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoExit",
    "-Command",
    "& { `$Host.UI.RawUI.WindowTitle = '$Title'; $Command }"
  ) | Out-Null
}

function Open-BrowserWhenReady {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 30
  )

  Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-WindowStyle",
    "Hidden",
    "-Command",
    @"
`$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while ((Get-Date) -lt `$deadline) {
  try {
    `$response = Invoke-WebRequest -Uri '$Url' -UseBasicParsing -TimeoutSec 2
    if (`$response.StatusCode -ge 200 -and `$response.StatusCode -lt 500) {
      Start-Process '$Url'
      exit 0
    }
  }
  catch {}

  Start-Sleep -Seconds 1
}
"@
  ) | Out-Null
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $repoRoot "ibg.utensilios.api"
$webDir = Join-Path $repoRoot "ibg.utensilios.web"

$apiEnvPath = Join-Path $apiDir ".env.development.local"
$apiEnvExamplePath = Join-Path $apiDir ".env.development.local.example"
$webEnvPath = Join-Path $webDir ".env.development.local"
$webEnvExamplePath = Join-Path $webDir ".env.development.local.example"

Write-Step "Validando arquivos locais de ambiente"
$apiEnvCreated = Ensure-LocalEnvFile -TargetPath $apiEnvPath -TemplatePath $apiEnvExamplePath
$webEnvCreated = Ensure-LocalEnvFile -TargetPath $webEnvPath -TemplatePath $webEnvExamplePath

if ($apiEnvCreated -or $webEnvCreated) {
  Write-Host "Arquivos locais foram criados a partir dos exemplos:" -ForegroundColor Yellow
  if ($apiEnvCreated) {
    Write-Host " - $apiEnvPath"
  }
  if ($webEnvCreated) {
    Write-Host " - $webEnvPath"
  }
  Write-Host ""
  Write-Host "Revise esses arquivos antes da primeira execucao. O script foi interrompido para evitar iniciar com configuracao nao revisada." -ForegroundColor Yellow
  exit 1
}

Write-Step "Verificando isolamento do ambiente local"
Assert-LocalApiEnv -FilePath $apiEnvPath
Assert-LocalWebEnv -FilePath $webEnvPath

if ($MigrarBanco) {
  Write-Step "Executando migrations no banco de desenvolvimento"
  Push-Location $apiDir
  try {
    $env:DOTENV_CONFIG_PATH = $apiEnvPath
    npm run db:migrate
  }
  finally {
    Remove-Item Env:DOTENV_CONFIG_PATH -ErrorAction SilentlyContinue
    Pop-Location
  }
}

Write-Step "Abrindo janelas da API e da web"

$apiCommand = "`$env:DOTENV_CONFIG_PATH = '$apiEnvPath'; Set-Location '$apiDir'; npm run dev"
$webCommand = "Set-Location '$webDir'; npm run dev -- --host localhost --port 5173 --strictPort"

Start-DevWindow -Title "UTENSILIOS API DEV" -Command $apiCommand
Start-DevWindow -Title "UTENSILIOS WEB DEV" -Command $webCommand
Open-BrowserWhenReady -Url "http://localhost:5173/"

Write-Host ""
Write-Host "Ambiente de desenvolvimento iniciado." -ForegroundColor Green
Write-Host "API: usa $apiEnvPath"
Write-Host "WEB: usa $webEnvPath"
Write-Host "Browser: abertura automatica da tela inicial em http://localhost:5173/"
Write-Host ""
Write-Host "Comandos uteis:"
Write-Host " - .\iniciarDev.ps1"
Write-Host " - .\iniciarDev.ps1 -MigrarBanco"
Write-Host " - .\validarDev.ps1"
