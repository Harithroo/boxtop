# Boxtop: install MariaDB (if needed), create the database and write .env
# Run from the boxtop folder in an ADMIN PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-db.ps1

$ErrorActionPreference = "Stop"

# Needs admin (to install MariaDB and stop/start its service). Re-open elevated if not.
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "Opening an administrator window (click Yes on the prompt)..." -ForegroundColor Yellow
  Start-Process powershell -Verb RunAs -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  exit
}
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Find-MysqlExe {
  Get-ChildItem "C:\Program Files\MariaDB*\bin\mysql.exe", "C:\Program Files\MySQL\*\bin\mysql.exe" -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}

function Reset-RootPassword($svcName, $mysqlExe, $newPw) {
  # Restarts the server once without password checks (local only), sets a new root password, then restarts normally.
  $ErrorActionPreference = "Continue"  # expected connection errors while waiting must not abort the script
  $img = (Get-CimInstance Win32_Service -Filter "Name='$svcName'").PathName
  $mysqld = Join-Path (Split-Path $mysqlExe) "mysqld.exe"
  if (-not (Test-Path $mysqld)) { $mysqld = Join-Path (Split-Path $mysqlExe) "mariadbd.exe" }
  $defaults = if ($img -match '--defaults-file=([^"]+)') { $Matches[1] } else { $null }
  Write-Host "Resetting the root password on $svcName..." -ForegroundColor Yellow
  Stop-Service $svcName -Force
  $argList = @()
  if ($defaults) { $argList += "`"--defaults-file=$defaults`"" }  # quoted: path has spaces
  $argList += "--skip-grant-tables", "--bind-address=127.0.0.1"
  $proc = Start-Process $mysqld -ArgumentList $argList -PassThru -WindowStyle Hidden
  try {
    $ok = $false
    for ($i = 0; $i -lt 30 -and -not $ok; $i++) { Start-Sleep 1; & $mysqlExe -uroot "--host=127.0.0.1" -e "SELECT 1" 2>$null | Out-Null; $ok = ($LASTEXITCODE -eq 0) }
    if (-not $ok) { throw "The database didn't start in recovery mode." }
    $esc = $newPw.Replace("\", "\\").Replace("'", "\'")
    & $mysqlExe -uroot "--host=127.0.0.1" -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY '$esc'; FLUSH PRIVILEGES;"
    if ($LASTEXITCODE -ne 0) { throw "Couldn't set the new password." }
  } finally {
    Stop-Process $proc -Force -ErrorAction SilentlyContinue
    Start-Sleep 2
    Start-Service $svcName
  }
  Write-Host "Root password changed." -ForegroundColor Green
}

# 1. Is a database server already installed or running?
$svc = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "^(MariaDB|MySQL)" } | Select-Object -First 1
$mysql = Find-MysqlExe

if ($svc -or $mysql) {
  Write-Host "A database server is already installed. If you don't remember its root password, the script can reset it."
  $resetAnswer = Read-Host "Reset the root password? (y/N)"
}
$pw = Read-Host ($(if ($resetAnswer -eq "y") { "New root password" } else { "Choose (or enter your existing) root password" })) -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pw))
if ([string]::IsNullOrWhiteSpace($plain)) { throw "Password can't be empty." }

if (-not $svc -and -not $mysql) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "winget isn't available. Install MariaDB from https://mariadb.org/download, then run this script again."
  }
  Write-Host "Installing MariaDB (this takes a minute)..." -ForegroundColor Cyan
  winget install --id MariaDB.Server -e --accept-package-agreements --accept-source-agreements `
    --override "/qn SERVICENAME=MariaDB PASSWORD=`"$plain`" UTF8=1"
  if ($LASTEXITCODE -ne 0) { throw "MariaDB install failed (winget exit code $LASTEXITCODE)." }
  $mysql = Find-MysqlExe
} else {
  Write-Host "Found an existing database server: $($svc.Name) $mysql" -ForegroundColor Green
}

if (-not $mysql) { throw "Couldn't find mysql.exe after install. Check C:\Program Files\MariaDB*\bin." }

# 2. Make sure the service is running
$svc = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "^(MariaDB|MySQL)" } | Select-Object -First 1
if ($svc -and $svc.Status -ne "Running") { Start-Service $svc.Name; Write-Host "Started $($svc.Name)" }

if ($resetAnswer -eq "y") {
  if (-not $svc) { throw "Found mysql.exe but no MariaDB/MySQL Windows service to reset." }
  Reset-RootPassword $svc.Name $mysql $plain
}

# 3. Create the database
& $mysql -uroot "-p$plain" -e "CREATE DATABASE IF NOT EXISTS boxtop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($LASTEXITCODE -ne 0) { throw "Couldn't connect as root. Run the script again and answer y to reset the password." }
Write-Host "Database 'boxtop' is ready." -ForegroundColor Green

# 4. Write .env (keeps an existing one, only replacing DATABASE_URL)
$url = "mysql://root:$([uri]::EscapeDataString($plain))@localhost:3306/boxtop"
if (Test-Path .env) {
  $lines = Get-Content .env | Where-Object { $_ -notmatch "^DATABASE_URL=" }
  Set-Content .env -Value (@("# Boxtop settings", "DATABASE_URL=`"$url`"") + ($lines | Where-Object { $_ -ne "# Boxtop settings" }))
  Write-Host "Updated DATABASE_URL in your existing .env"
} else {
  $bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $secret = -join ($bytes | ForEach-Object { $_.ToString("x2") })
  $cron = -join ((1..24) | ForEach-Object { "{0:x}" -f (Get-Random -Max 16) })
  $adminEmail = Read-Host "Back office email (e.g. owner@box-top.lk)"
  $adminPw = Read-Host "Back office password (10+ characters)"
  @"
# Boxtop settings (first line is a comment so a UTF-8 BOM cannot break the first key)
DATABASE_URL="$url"
SESSION_SECRET="$secret"
ADMIN_EMAIL="$adminEmail"
ADMIN_PASSWORD="$adminPw"
UPLOAD_DIR="./uploads"
CRON_SECRET="$cron"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
"@ | Set-Content .env -Encoding UTF8
  Write-Host "Created .env" -ForegroundColor Green
}

Write-Host "`nNext: npm install; npm run db:push; npm run db:seed; npm run dev" -ForegroundColor Cyan
