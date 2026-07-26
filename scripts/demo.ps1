param(
  [ValidateSet("up", "status")]
  [string]$Action = "up"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Test-Endpoint {
  param([string]$Url, [int]$TimeoutSeconds = 4)
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSeconds
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
  } catch {
    return $false
  }
}

function Wait-Endpoint {
  param([string]$Url, [int]$TimeoutSeconds)
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    if (Test-Endpoint -Url $Url) { return $true }
    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)
  return $false
}

function Start-DockerDesktop {
  $previousErrorAction = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  docker info 1>$null 2>$null
  $dockerReady = $LASTEXITCODE -eq 0
  $ErrorActionPreference = $previousErrorAction
  if ($dockerReady) { return }

  $dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  if (-not (Test-Path -LiteralPath $dockerDesktop)) {
    throw "Không tìm thấy Docker Desktop tại $dockerDesktop"
  }
  Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
  $deadline = (Get-Date).AddSeconds(60)
  do {
    $ErrorActionPreference = "SilentlyContinue"
    docker info 1>$null 2>$null
    $dockerReady = $LASTEXITCODE -eq 0
    $ErrorActionPreference = $previousErrorAction
    if ($dockerReady) { return }
    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)
  throw "Docker Desktop chưa sẵn sàng sau 60 giây."
}

function Import-DatabaseUrl {
  $envPath = Join-Path $root ".env"
  if (-not (Test-Path -LiteralPath $envPath)) {
    throw "Thiếu file .env tại $envPath"
  }

  $line = Get-Content -LiteralPath $envPath |
    Where-Object { $_ -match "^DATABASE_URL=" } |
    Select-Object -First 1
  if (-not $line) {
    throw "Thiếu DATABASE_URL trong .env"
  }
  $env:DATABASE_URL = $line.Substring("DATABASE_URL=".Length).Trim().Trim('"')
}

function Initialize-AppDatabase {
  Import-DatabaseUrl
  & npm.cmd run prisma:deploy --workspace server
  if ($LASTEXITCODE -ne 0) {
    throw "Không thể áp dụng migration cho database CodeLearn."
  }
  $previousSyncDemos = $env:SEED_SYNC_DEMOS
  try {
    $env:SEED_SYNC_DEMOS = "true"
    & npm.cmd run seed --workspace server
    if ($LASTEXITCODE -ne 0) {
      throw "Không thể kiểm tra/nạp dữ liệu mẫu CodeLearn."
    }
  } finally {
    if ($null -eq $previousSyncDemos) {
      Remove-Item Env:SEED_SYNC_DEMOS -ErrorAction SilentlyContinue
    } else {
      $env:SEED_SYNC_DEMOS = $previousSyncDemos
    }
  }
}

function Start-DevProcess {
  param(
    [string]$Role,
    [string]$Script,
    [string]$HealthUrl
  )
  if (Test-Endpoint -Url $HealthUrl) { return }
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $stdout = Join-Path $env:TEMP "codelearn-$Role-$stamp.out.log"
  $stderr = Join-Path $env:TEMP "codelearn-$Role-$stamp.err.log"
  Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", $Script) `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr
}

function Start-WebhookTunnel {
  $existing = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq "cloudflared.exe" -and $_.CommandLine -like "*localhost:4000*" } |
    Select-Object -First 1
  if (-not $existing) {
    $cloudflared = Get-Command cloudflared.exe -ErrorAction SilentlyContinue
    if (-not $cloudflared) {
      Write-Warning "Không tìm thấy cloudflared; thanh toán SePay sẽ không nhận webhook."
      return $null
    }
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $stdout = Join-Path $env:TEMP "codelearn-cloudflared-$stamp.out.log"
    $stderr = Join-Path $env:TEMP "codelearn-cloudflared-$stamp.err.log"
    Start-Process `
      -FilePath $cloudflared.Source `
      -ArgumentList @("tunnel", "--url", "http://localhost:4000", "--no-autoupdate") `
      -WorkingDirectory $root `
      -WindowStyle Hidden `
      -RedirectStandardOutput $stdout `
      -RedirectStandardError $stderr
  }

  $deadline = (Get-Date).AddSeconds(35)
  do {
    $logs = Get-ChildItem $env:TEMP -Filter "codelearn-cloudflared-*.err.log" |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 3
    foreach ($log in $logs) {
      $content = (Get-Content -LiteralPath $log.FullName -ErrorAction SilentlyContinue) -join "`n"
      $match = [regex]::Match($content, "https://[a-z0-9-]+\.trycloudflare\.com")
      if ($match.Success -and (Test-Endpoint -Url "$($match.Value)/api/health" -TimeoutSeconds 10)) {
        return "$($match.Value)/api/payments/sepay/webhook"
      }
    }
    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)
  return $null
}

function Show-Status {
  $checks = @(
    @{ Name = "Frontend"; Url = "http://localhost:5173" },
    @{ Name = "Backend"; Url = "http://localhost:4000/api/health" },
    @{ Name = "Judge0"; Url = "http://localhost:2358/languages" },
    @{ Name = "Llama"; Url = "http://localhost:8080/health" }
  )
  foreach ($check in $checks) {
    $status = if (Test-Endpoint -Url $check.Url) { "OK" } else { "DOWN" }
    Write-Host ("{0,-10} {1,-5} {2}" -f $check.Name, $status, $check.Url)
  }
}

if ($Action -eq "status") {
  Show-Status
  exit 0
}

Start-DockerDesktop
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "local-services.ps1") up-llama
Initialize-AppDatabase
Start-DevProcess -Role "server" -Script "dev:server" -HealthUrl "http://localhost:4000/api/health"
Start-DevProcess -Role "client" -Script "dev:client" -HealthUrl "http://localhost:5173"

if (-not (Wait-Endpoint -Url "http://localhost:4000/api/health" -TimeoutSeconds 30)) {
  throw "Backend không khởi động được."
}
if (-not (Wait-Endpoint -Url "http://localhost:5173" -TimeoutSeconds 30)) {
  throw "Frontend không khởi động được."
}
if (-not (Wait-Endpoint -Url "http://localhost:2358/languages" -TimeoutSeconds 45)) {
  throw "Judge0 không sẵn sàng."
}
if (-not (Wait-Endpoint -Url "http://localhost:8080/health" -TimeoutSeconds 180)) {
  throw "Llama không sẵn sàng."
}

$webhookUrl = Start-WebhookTunnel
Show-Status
if ($webhookUrl) {
  $webhookUrl | Set-Clipboard
  Write-Host ""
  Write-Host "Webhook SePay (đã sao chép): $webhookUrl"
}
Write-Host "CodeLearn: http://localhost:5173"
