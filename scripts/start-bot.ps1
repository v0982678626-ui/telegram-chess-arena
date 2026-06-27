$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Read-EnvValue($Name) {
  $envPath = Join-Path $ProjectRoot ".env"
  if (-not (Test-Path $envPath)) {
    return $null
  }

  foreach ($line in Get-Content $envPath) {
    if ($line -match "^\s*$Name\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim()
    }
  }

  return $null
}

function Wait-ForApp($Url) {
  for ($i = 0; $i -lt 20; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  return $false
}

$portValue = Read-EnvValue "PORT"
if (-not $portValue) {
  $portValue = "3000"
}

$publicUrl = Read-EnvValue "PUBLIC_URL"

Write-Host ""
Write-Host "Starting Chess Arena..."
Write-Host ""

if (-not (Test-Path (Join-Path $ProjectRoot "node_modules"))) {
  Write-Host "Installing packages first..."
  npm install
}

$serverCommand = "cd /d `"$ProjectRoot`" && npm start"
Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", $serverCommand) -WindowStyle Normal

$localUrl = "http://127.0.0.1:$portValue"
if (Wait-ForApp $localUrl) {
  Write-Host "Local app is running: $localUrl"
} else {
  Write-Host "Local app did not answer yet. Check the server window."
}

$ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
if ($ngrok) {
  $ngrokCommand = "ngrok http $portValue"

  if ($publicUrl -and $publicUrl.StartsWith("https://")) {
    try {
      $publicHost = ([Uri]$publicUrl).Host
      if ($publicHost.EndsWith(".ngrok-free.dev") -or $publicHost.EndsWith(".ngrok.app")) {
        $ngrokCommand = "ngrok http --url=$publicHost $portValue"
      }
    } catch {
      $ngrokCommand = "ngrok http $portValue"
    }
  }

  Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", $ngrokCommand) -WindowStyle Normal
  Write-Host "ngrok is starting..."
} else {
  Write-Host "ngrok was not found. Install/open ngrok first."
}

if ($publicUrl -and $publicUrl.StartsWith("https://")) {
  Start-Process $publicUrl
  Write-Host "Public URL: $publicUrl"
}

Write-Host ""
Write-Host "Done. Keep the server and ngrok windows open while testing in Telegram."
