<#
  install-frontend-service.ps1

  Makes the Mahal React/Vite frontend (mahal-v1/frontend, port 5173) start
  automatically at boot and self-heal if it ever stops - the same fix
  already applied to ORDS (install-ords-service.ps1) and the backend
  (install-backend-service.ps1), for the same underlying reason: any
  foreground console window ("npm run dev" included) can be silently
  paused by Windows Quick Edit Mode if you click into it, and doesn't come
  back on its own after a crash or reboot.

  Uses the same schtasks.exe + hand-built task XML approach as the other
  two scripts (see install-ords-service.ps1's comments for why the
  PowerShell ScheduledTasks module isn't used - it was found to be broken
  on this machine). Resolves npm's absolute path once at install time
  (while running as your own logged-in user, who has npm on PATH) and
  bakes it into the task, so SYSTEM never needs to resolve `npm` via its
  own PATH at run time. `npm run dev` is a batch file (npm.cmd) under the
  hood, so - unlike node.exe in the backend script - it's invoked via
  cmd.exe either way, same as the log-redirection wrapper.

  N: was already confirmed (see install-backend-service.ps1) to be a real
  local Fixed Drive on nora, not a per-user `subst`/`net use` mapping - so
  it's visible system-wide and safe for a SYSTEM-context task to use
  directly.

  Output is logged to frontend\frontend.log.

  HOW TO RUN THIS SCRIPT:
    1. Click Start, type "PowerShell", right-click "Windows PowerShell",
       choose "Run as administrator".
    2. cd to the folder this script is in, e.g.:
         cd N:\mahal\mahal-v1\backend\oracle
    3. Run it:
         .\install-frontend-service.ps1
    4. Verify:
         schtasks /Query /TN "Mahal Frontend Server" /V /FO LIST
    5. Open http://localhost:5173 in a browser after a minute or two to
       confirm it's up.

  You do NOT need to keep an "npm run dev" console window open ever again
  after this. It's safe to close any existing frontend window - the
  script below finds and kills whatever's actually bound to port 5173
  first, so the port is free before the new service-managed copy starts.
#>

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

# --- Adjust these if your paths differ ---
$FrontendDir = "N:\mahal\mahal-v1\frontend"
$LogFile     = "frontend.log"
$Port        = 5173
$TaskName    = "Mahal Frontend Server"
# -------------------------------------------

if (-not (Test-Path $FrontendDir)) {
    Write-Error "Could not find $FrontendDir. Edit `$FrontendDir at the top of this script and re-run."
    exit 1
}
if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Error "$FrontendDir\node_modules doesn't exist - run 'npm install' in that folder first, then re-run this script."
    exit 1
}
if (-not (Test-Path (Join-Path $FrontendDir "package.json"))) {
    Write-Error "$FrontendDir\package.json not found - is `$FrontendDir really the frontend folder?"
    exit 1
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This PowerShell window is NOT running as Administrator." -ForegroundColor Red
    Write-Host "Close it, then right-click PowerShell and choose 'Run as administrator', and re-run this script." -ForegroundColor Red
    exit 1
}

# Resolve npm.cmd specifically - Get-Command npm can resolve to npm.ps1
# instead (whichever matching extension PATHEXT lists first), and cmd.exe
# (used below for log redirection) can't execute a .ps1 file directly, so
# that silently produces a task that "runs" but never actually starts
# Vite. Try the .cmd extension explicitly first; fall back to whatever
# Get-Command finds only if that fails, with a clear warning.
$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmCmd -and $npmCmd.Source -notlike "*.cmd") {
        Write-Host "Warning: only found npm at $($npmCmd.Source) (not a .cmd file) - this may not run correctly under cmd.exe. Consider locating npm.cmd manually (usually next to node.exe) and hardcoding `$NpmExe below." -ForegroundColor Yellow
    }
}
if (-not $npmCmd) {
    Write-Error "Could not find 'npm' on PATH in this session. Install Node.js/npm or run this from a shell where 'npm --version' works, then re-run."
    exit 1
}
$NpmExe = $npmCmd.Source
Write-Host "Using npm at: $NpmExe"

$CmdExe = Join-Path $env:SystemRoot "System32\cmd.exe"

Write-Host "Finding whatever is currently bound to port $Port..."
$netstatLines = netstat -ano | Select-String -Pattern (":$Port\s+.*LISTENING\s+(\d+)")
$pidsOnPort = @()
foreach ($line in $netstatLines) {
    if ($line -match "\s(\d+)\s*$") {
        $pidsOnPort += [int]$Matches[1]
    }
}
$pidsOnPort = $pidsOnPort | Sort-Object -Unique

if ($pidsOnPort.Count -gt 0) {
    foreach ($p in $pidsOnPort) {
        Write-Host "  Stopping PID $p (was bound to port $Port)..."
        try { Stop-Process -Id $p -Force -ErrorAction Stop } catch { Write-Host "    (already gone: $_)" }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "  Nothing currently bound to port $Port."
}

Write-Host "Removing any previous '$TaskName' scheduled task (if any)..."
try { schtasks /End /TN $TaskName *> $null } catch { }
try { schtasks /Delete /TN $TaskName /F *> $null } catch { }
Start-Sleep -Seconds 1

$startBoundary = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")

$cmdArgs = "/c `"`"$NpmExe`" run dev >> `"$LogFile`" 2>&1`""
# Task Scheduler's XML is real XML - & and > in element text must be
# escaped (the same "task XML is malformed" bug hit and fixed in
# install-backend-service.ps1 on 2026-09-15).
$cmdArgsXml = $cmdArgs -replace '&', '&amp;' -replace '>', '&gt;' -replace '<', '&lt;'

$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Runs the Mahal React/Vite frontend (port $Port) permanently in the background; auto-starts at boot and auto-restarts if it ever stops.</Description>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger>
      <Enabled>true</Enabled>
      <Delay>PT3M</Delay>
    </BootTrigger>
    <TimeTrigger>
      <Repetition>
        <Interval>PT5M</Interval>
        <Duration>P3650D</Duration>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>$startBoundary</StartBoundary>
      <Enabled>true</Enabled>
    </TimeTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>S-1-5-18</UserId>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
    <RestartOnFailure>
      <Interval>PT1M</Interval>
      <Count>999</Count>
    </RestartOnFailure>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>$CmdExe</Command>
      <Arguments>$cmdArgsXml</Arguments>
      <WorkingDirectory>$FrontendDir</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

$xmlPath = Join-Path $env:TEMP "mahal-frontend-task.xml"
[System.IO.File]::WriteAllText($xmlPath, $taskXml, [System.Text.Encoding]::Unicode)

Write-Host "Registering '$TaskName' scheduled task via schtasks.exe..."
$createOutput = schtasks /Create /TN $TaskName /XML $xmlPath /F 2>&1
$createExit = $LASTEXITCODE
Write-Host $createOutput

if ($createExit -ne 0) {
    Write-Host ""
    Write-Host "FAILED to register the scheduled task (schtasks exit code $createExit)." -ForegroundColor Red
    Write-Host "The XML file is left at $xmlPath if you want to inspect it or import it manually via taskschd.msc -> Import Task." -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting '$TaskName' now..."
schtasks /Run /TN $TaskName | Out-Null

Start-Sleep -Seconds 5
Write-Host ""
Write-Host "Task status:"
schtasks /Query /TN $TaskName /FO LIST /V | Select-String -Pattern "TaskName|Status|Last Run Time|Last Result|Next Run Time"

Write-Host ""
Write-Host "Vite's dev server can take several seconds to actually come up - check http://localhost:5173 in a browser after 15-20 seconds."
Write-Host "Logs are written to $FrontendDir\$LogFile - check that file if something looks wrong."
Write-Host ""
Write-Host "From now on, the frontend will:"
Write-Host "  - start automatically every time this PC boots"
Write-Host "  - restart automatically if it ever stops"
Write-Host "  - run with no visible window, so nothing can Quick-Edit-pause it"
