param(
  [switch]$MigrarBanco = $true
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Assert-FileExists($Path) {
  if (-not (Test-Path $Path)) {
    throw "Arquivo nao encontrado: $Path"
  }
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
    throw "O arquivo '$FilePath' nao parece apontar para banco local."
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
    throw "O arquivo '$FilePath' nao parece apontar para API local."
  }
}

function Wait-HttpOk {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $response
      }
    }
    catch {}

    Start-Sleep -Seconds 1
  }

  throw "Timeout aguardando resposta de $Url"
}

function Stop-ProcessIfRunning($Process) {
  if ($null -ne $Process -and -not $Process.HasExited) {
    Stop-Process -Id $Process.Id -Force
  }
}

function Remove-PathWithRetry {
  param(
    [string]$Path,
    [int]$Attempts = 5,
    [int]$DelayMilliseconds = 250
  )

  if (-not (Test-Path $Path)) {
    return
  }

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      Remove-Item $Path -Recurse -Force -ErrorAction Stop
      return
    }
    catch {
      if ($attempt -eq $Attempts) {
        throw
      }

      Start-Sleep -Milliseconds $DelayMilliseconds
    }
  }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $repoRoot "ibg.utensilios.api"
$webDir = Join-Path $repoRoot "ibg.utensilios.web"
$apiEnvPath = Join-Path $apiDir ".env.development.local"
$webEnvPath = Join-Path $webDir ".env.development.local"
$tmpRootDir = Join-Path $repoRoot ".tmp-dev-validation"
$tmpDir = Join-Path $tmpRootDir ([guid]::NewGuid().ToString())
$apiStdout = Join-Path $tmpDir "api.stdout.log"
$apiStderr = Join-Path $tmpDir "api.stderr.log"
$webStdout = Join-Path $tmpDir "web.stdout.log"
$webStderr = Join-Path $tmpDir "web.stderr.log"
$apiProcess = $null
$webProcess = $null

Assert-FileExists -Path $apiEnvPath
Assert-FileExists -Path $webEnvPath

Write-Step "Validando isolamento dos arquivos locais"
Assert-LocalApiEnv -FilePath $apiEnvPath
Assert-LocalWebEnv -FilePath $webEnvPath

New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

try {
  Write-Step "Compilando a API"
  Push-Location $apiDir
  try {
    npm run build

    if ($MigrarBanco) {
      Write-Step "Executando migrations do banco local"
      $env:DOTENV_CONFIG_PATH = $apiEnvPath
      npm run db:migrate
    }
  }
  finally {
    Remove-Item Env:DOTENV_CONFIG_PATH -ErrorAction SilentlyContinue
    Pop-Location
  }

  Write-Step "Compilando a web"
  Push-Location $webDir
  try {
    npm run build
  }
  finally {
    Pop-Location
  }

  Write-Step "Subindo API temporariamente para validacao"
  $env:DOTENV_CONFIG_PATH = $apiEnvPath
  $apiProcess = Start-Process -FilePath "node" -ArgumentList @(
    "dist/src/server.js"
  ) -WorkingDirectory $apiDir -PassThru -WindowStyle Hidden -RedirectStandardOutput $apiStdout -RedirectStandardError $apiStderr
  Remove-Item Env:DOTENV_CONFIG_PATH -ErrorAction SilentlyContinue

  $apiHealth = Wait-HttpOk -Url "http://127.0.0.1:3001/health"
  Write-Host "API respondeu em /health com status $($apiHealth.StatusCode)." -ForegroundColor Green

  Write-Step "Subindo preview da web para validacao"
  $webProcess = Start-Process -FilePath "npm.cmd" -ArgumentList @(
    "run",
    "preview",
    "--",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
    "--strictPort"
  ) -WorkingDirectory $webDir -PassThru -WindowStyle Hidden -RedirectStandardOutput $webStdout -RedirectStandardError $webStderr

  $webResponse = Wait-HttpOk -Url "http://127.0.0.1:4173"
  Write-Host "Web respondeu em localhost:4173 com status $($webResponse.StatusCode)." -ForegroundColor Green

  Write-Step "Validacao concluida"
  Write-Host "API, banco local e preview da web responderam conforme esperado." -ForegroundColor Green
}
catch {
  Write-Host ""
  Write-Host "Falha durante a validacao do ambiente local." -ForegroundColor Red

  if (Test-Path $apiStdout) {
    Write-Host ""
    Write-Host "--- API STDOUT ---" -ForegroundColor Yellow
    Get-Content $apiStdout
  }

  if (Test-Path $apiStderr) {
    Write-Host ""
    Write-Host "--- API STDERR ---" -ForegroundColor Yellow
    Get-Content $apiStderr
  }

  if (Test-Path $webStdout) {
    Write-Host ""
    Write-Host "--- WEB STDOUT ---" -ForegroundColor Yellow
    Get-Content $webStdout
  }

  if (Test-Path $webStderr) {
    Write-Host ""
    Write-Host "--- WEB STDERR ---" -ForegroundColor Yellow
    Get-Content $webStderr
  }

  throw
}
finally {
  Stop-ProcessIfRunning -Process $apiProcess
  Stop-ProcessIfRunning -Process $webProcess
  Start-Sleep -Milliseconds 300

  if (Test-Path $tmpDir) {
    Remove-PathWithRetry -Path $tmpDir
  }
}
