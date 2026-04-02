param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,

  [switch]$Aplicar,

  [switch]$SemConfirmacao,

  [string]$HealthUrl = ""
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

function Get-QueryParams($Url) {
  $queryParams = @{}
  $parts = $Url -split "\?", 2

  if ($parts.Count -lt 2 -or [string]::IsNullOrWhiteSpace($parts[1])) {
    return $queryParams
  }

  foreach ($pair in ($parts[1] -split "&")) {
    if ([string]::IsNullOrWhiteSpace($pair)) {
      continue
    }

    $segments = $pair -split "=", 2
    $key = [System.Uri]::UnescapeDataString($segments[0]).Trim()
    $value = if ($segments.Count -gt 1) {
      [System.Uri]::UnescapeDataString($segments[1]).Trim()
    }
    else {
      ""
    }

    if (-not [string]::IsNullOrWhiteSpace($key)) {
      $queryParams[$key] = $value
    }
  }

  return $queryParams
}

function Assert-ProductionDatabaseUrl($Url) {
  if ($Url -notmatch "^postgres(ql)?://") {
    throw "A DATABASE_URL informada nao parece ser PostgreSQL."
  }

  if ($Url -match "(localhost|127\.0\.0\.1|::1)") {
    throw "A DATABASE_URL informada aponta para ambiente local. Revise antes de continuar."
  }

  $queryParams = Get-QueryParams -Url $Url

  if ($queryParams.ContainsKey("schema")) {
    $schema = $queryParams["schema"]

    if ([string]::IsNullOrWhiteSpace($schema)) {
      throw "O parametro schema foi informado sem valor. Revise a DATABASE_URL."
    }
  }
}

function Get-DatabaseTargetSummary($Url) {
  try {
    $uri = [System.Uri]$Url
    $databaseName = $uri.AbsolutePath.Trim("/")
    return "$($uri.Host) / $databaseName"
  }
  catch {
    return "destino nao identificado"
  }
}

function Invoke-CheckedCommand {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao executar: $FilePath $($Arguments -join ' ')"
  }
}

function Test-HealthUrl {
  param(
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    return $response
  }
  catch {
    throw "Nao foi possivel validar o healthcheck em $Url. Revise a API publicada."
  }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $repoRoot "ibg.utensilios.api"
$packageJsonPath = Join-Path $apiDir "package.json"
$knexfilePath = Join-Path $apiDir "knexfile.js"

Assert-FileExists -Path $packageJsonPath
Assert-FileExists -Path $knexfilePath
Assert-ProductionDatabaseUrl -Url $DatabaseUrl

try {
  Push-Location $apiDir
  $env:DATABASE_URL = $DatabaseUrl

  Write-Step "Destino validado para migracao"
  Write-Host (Get-DatabaseTargetSummary -Url $DatabaseUrl) -ForegroundColor Green

  $queryParams = Get-QueryParams -Url $DatabaseUrl
  if (-not $queryParams.ContainsKey("sslmode")) {
    Write-Host "Aviso: a DATABASE_URL nao informa sslmode. Confirme no provedor se SSL e exigido em producao." -ForegroundColor Yellow
  }

  Write-Step "Listando migrations pendentes para a base informada"
  Invoke-CheckedCommand -FilePath "npx.cmd" -Arguments @("knex", "migrate:list", "--knexfile", "knexfile.js")

  if (-not $Aplicar) {
    Write-Host ""
    Write-Host "Modo de pre-checagem concluido." -ForegroundColor Green
    Write-Host "Se a lista acima estiver coerente, rode novamente com -Aplicar." -ForegroundColor Green
    return
  }

  if (-not $SemConfirmacao) {
    Write-Host ""
    Write-Host "ATENCAO: voce esta prestes a aplicar migrations na base informada acima." -ForegroundColor Yellow
    $confirmation = Read-Host "Digite MIGRAR para continuar"

    if ($confirmation -ne "MIGRAR") {
      throw "Operacao cancelada pelo usuario."
    }
  }

  Write-Step "Aplicando migrations"
  Invoke-CheckedCommand -FilePath "npm.cmd" -Arguments @("run", "db:migrate")

  Write-Step "Conferindo estado final das migrations"
  Invoke-CheckedCommand -FilePath "npx.cmd" -Arguments @("knex", "migrate:list", "--knexfile", "knexfile.js")

  if (-not [string]::IsNullOrWhiteSpace($HealthUrl)) {
    Write-Step "Validando healthcheck publicado"
    $healthResponse = Test-HealthUrl -Url $HealthUrl
    Write-Host "Healthcheck respondeu com status $($healthResponse.StatusCode)." -ForegroundColor Green
  }
  else {
    Write-Host ""
    Write-Host "Healthcheck nao informado. Validacao externa foi pulada." -ForegroundColor Yellow
  }

  Write-Host ""
  Write-Host "Migracao de producao concluida com sucesso." -ForegroundColor Green
}
finally {
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue

  if ((Get-Location).Path -ne $repoRoot) {
    Pop-Location
  }
}
