param(
  [ValidateSet("up", "up-llama", "down", "status", "logs")]
  [string]$Action = "up"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$composeDir = Join-Path $root "docker/local-services"
$composeFile = Join-Path $composeDir "docker-compose.yml"
$envFile = Join-Path $composeDir ".env"
$envExample = Join-Path $composeDir ".env.example"

if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
  Copy-Item -LiteralPath $envExample -Destination $envFile
}

function Invoke-Compose {
  param([string[]]$ComposeArgs)
  docker compose --env-file $envFile -f $composeFile @ComposeArgs
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose failed with exit code $LASTEXITCODE."
  }
}

function Get-Judge0WorkerCount {
  $line = Get-Content -LiteralPath $envFile |
    Where-Object { $_ -match '^\s*JUDGE0_WORKERS\s*=' } |
    Select-Object -Last 1
  if (-not $line) {
    return 2
  }

  $rawValue = ($line -split '=', 2)[1].Trim()
  $parsed = 0
  if (-not [int]::TryParse($rawValue, [ref]$parsed) -or $parsed -lt 1 -or $parsed -gt 16) {
    throw "JUDGE0_WORKERS must be an integer from 1 to 16."
  }
  return $parsed
}

switch ($Action) {
  "up" {
    $workers = Get-Judge0WorkerCount
    Invoke-Compose @("up", "-d", "--scale", "judge0-worker=$workers", "judge0-server", "judge0-worker", "judge0-db", "judge0-redis")
    Write-Host "Judge0 local: http://localhost:2358"
    Write-Host "Judge0 workers: $workers"
  }
  "up-llama" {
    $workers = Get-Judge0WorkerCount
    Invoke-Compose @("--profile", "llama", "up", "-d", "--scale", "judge0-worker=$workers")
    Write-Host "Judge0 local: http://localhost:2358"
    Write-Host "Judge0 workers: $workers"
    Write-Host "Llama local:  http://localhost:8080/v1"
    Write-Host "Put a GGUF model at docker/local-services/models and set LLAMA_MODEL_FILE in docker/local-services/.env."
  }
  "down" {
    Invoke-Compose @("down")
  }
  "status" {
    Invoke-Compose @("ps")
  }
  "logs" {
    Invoke-Compose @("logs", "--tail", "120")
  }
}
