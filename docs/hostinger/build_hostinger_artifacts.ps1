$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Remove-PathWithRetry {
  param(
    [string]$Path,
    [int]$Attempts = 6,
    [int]$DelayMilliseconds = 400
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

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$webDir = Join-Path $repoRoot "ibg.utensilios.web"
$apiDir = Join-Path $repoRoot "ibg.utensilios.api"
$hostingerDir = Join-Path $repoRoot "docs\hostinger"
$tmpDir = Join-Path $hostingerDir "_tmp"
$webStage = Join-Path $tmpDir "web_public_html"
$apiStage = Join-Path $tmpDir "api_node"
$webZip = Join-Path $hostingerDir "ibg.utensilios.web-public_html.zip"
$apiZip = Join-Path $hostingerDir "ibg.utensilios.api-hostinger.zip"
$htaccessSource = Join-Path $hostingerDir ".htaccess"

if (-not (Test-Path $htaccessSource)) {
  throw "Arquivo obrigatorio nao encontrado: $htaccessSource"
}

New-Item -ItemType Directory -Force -Path $hostingerDir | Out-Null

if (Test-Path $tmpDir) {
  Remove-PathWithRetry -Path $tmpDir
}

New-Item -ItemType Directory -Force -Path $webStage, $apiStage | Out-Null

if (Test-Path $webZip) {
  Remove-Item $webZip -Force
}

if (Test-Path $apiZip) {
  Remove-Item $apiZip -Force
}

Write-Step "Compilando a API"
Push-Location $apiDir
try {
  npm run build | Out-Host
}
finally {
  Pop-Location
}

Write-Step "Compilando a web"
Push-Location $webDir
try {
  npm run build | Out-Host
}
finally {
  Pop-Location
}

Write-Step "Montando pacote do frontend para public_html"
Get-ChildItem -Force (Join-Path $webDir "dist") | ForEach-Object {
  Copy-Item $_.FullName -Destination $webStage -Recurse -Force
}
Copy-Item $htaccessSource -Destination (Join-Path $webStage ".htaccess") -Force

Write-Step "Montando pacote da API para app Node"
$apiItems = @(
  "src",
  "db",
  "dist",
  "package.json",
  "package-lock.json",
  "knexfile.js",
  ".env.example"
)

foreach ($item in $apiItems) {
  $source = Join-Path $apiDir $item
  if (Test-Path $source) {
    Copy-Item $source -Destination $apiStage -Recurse -Force
  }
  else {
    throw "Item obrigatorio ausente no pacote da API: $source"
  }
}

$webZipItems = Get-ChildItem -Force $webStage | Select-Object -ExpandProperty FullName
$apiZipItems = Get-ChildItem -Force $apiStage | Select-Object -ExpandProperty FullName

Write-Step "Gerando arquivos ZIP"
Compress-Archive -Path $webZipItems -DestinationPath $webZip -CompressionLevel Optimal
Compress-Archive -Path $apiZipItems -DestinationPath $apiZip -CompressionLevel Optimal

if (Test-Path $tmpDir) {
  Remove-PathWithRetry -Path $tmpDir
}

$webHash = (Get-FileHash $webZip -Algorithm SHA256).Hash
$apiHash = (Get-FileHash $apiZip -Algorithm SHA256).Hash

Write-Host ""
Write-Host "Artefatos gerados com sucesso." -ForegroundColor Green
[pscustomobject]@{
  WebZip = $webZip
  WebZipBytes = (Get-Item $webZip).Length
  WebSHA256 = $webHash
  ApiZip = $apiZip
  ApiZipBytes = (Get-Item $apiZip).Length
  ApiSHA256 = $apiHash
} | Format-List
