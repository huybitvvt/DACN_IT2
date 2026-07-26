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
}

switch ($Action) {
  "up" {
    Invoke-Compose @("up", "-d", "judge0-server", "judge0-worker", "judge0-db", "judge0-redis")
    Write-Host "Judge0 local: http://localhost:2358"
  }
  "up-llama" {
    Invoke-Compose @("--profile", "llama", "up", "-d")
    Write-Host "Judge0 local: http://localhost:2358"
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
