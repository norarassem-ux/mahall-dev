<#
  install-backend-service.ps1

  Makes the Mahal Node backend (mahal-v1/backend, port 4000) start
  automatically at boot and self-heal if it ever stops responding -
  exactly the same fix already applied to ORDS via install-ords-service.ps1,
  and for the same reason: on 2026-09-15 the backend was found LISTENING on
  port 4000 but not answering ANY request (not even /api/health, which
  touches no database at all) - almost certainly the same "console window
  got Quick-Edit-Mode-paused" failure that used to hit ORDS, just hitting
  the backend's own npm start window instead. This eliminates that failure
  mode by running the backend with no visible console window at all.

  N: was confirmed (2026-09-15, via `fsutil fsinfo drivetype N:`) to be a
  real local Fixed Drive, not a per-user `subst` or `net use` mapping - so
  unlike those, it's visible system-wide and a SYSTEM-context Scheduled
  Task can use N:\ paths directly with no translation needed.

  Uses the same schtasks.exe + hand-built task XML approach as
  install-ords-service.ps1 (the PowerShell ScheduledTasks module was found
  to be broken on this machine - see that script's comments for the full
  story). Also resolves node.exe's absolute path once, at install time
  (while running as your own logged-in user, who has node on PATH), and
  bakes that absolute path into the task - so the SYSTEM account never
  needs to resolve `node` via its own PATH at run time.

  Output is logged to backend\backend.log (created/appended each run) so
  you can check what happened without needing a console window open -
  useful since this is exactly the kind of process where "is it actually
  working" used to be hard to tell without clicking into its window (which
  is the thing we're trying to stop doing).

  HOW TO RUN THIS SCRIPT:
    1. Click Start, type "PowerShell", right-click "Windows PowerShell",
       choose "Run as administrator".
    2. cd to the folder this script is in, e.g.:
         cd N:\mahal\mahal-v1\backend\oracle
    3. Run it:
         .\install-backend-service.ps1
    4. Verify:
         schtasks /Query /TN "Mahal Backend Server" /V /FO LIST
    5. Open http://localhost:4000/api/health in a browser after a minute
       or two to confirm it's up (allow time for the boot-delay trigger if
       you just rebooted; if you're running this on a machine that's
       already been up a while, it also starts within a few seconds of
       registration via the immediate /Run below).

  You do NOT need to keep any "npm start" console window open ever again
  after this. It's safe to close any existing backend window - the script
  below finds and kills whatever's actually bound to port 4000 first, so
  the port is free before the new service-managed copy starts.
#>

$ErrorActionPreference = "Stop"
# Same PowerShell 7.3+ gotcha as install-ords-service.ps1: without this,
# stderr from native commands (schtasks, taskkill) throws as a terminating
# PowerShell error even when redirected, which breaks "fail silently if
# there's nothing to clean up yet" cleanup steps.
$PSNativeCommandUseErrorActionPreference = $false

# --- Adjust these if your paths differ ---
$BackendDir  = "N:\mahal\mahal-v1\backend"
$EntryPoint  = "src\index.js"
$LogFile     = "backend.log"
$Port        = 4000
$TaskName    = "Mahal Backend Server"
# ------------------------------------------

if (-not (Test-Path $BackendDir)) {
    Write-Error "Could not find $BackendDir. Edit `$BackendDir at the top of this script and re-run."
    exit 1
}
if (-not (Test-Path (Join-Path $BackendDir $EntryPoint))) {
    Write-Error "Could not find $EntryPoint under $BackendDir. Edit `$EntryPoint at the top of this script and re-run."
    exit 1
}
if (-not (Test-Path (Join-Path $BackendDir "node_modules"))) {
    Write-Error "$BackendDir\node_modules doesn't exist - run 'npm install' in that folder first, then re-run this script."
    exit 1
}
if (-not (Test-Path (Join-Path $BackendDir ".env"))) {
    Write-Host "Warning: no .env found in $BackendDir - the backend may fall back to DB_DRIVER=json instead of talking to Oracle. Continuing anyway." -ForegroundColor Yellow
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This PowerShell window is NOT running as Administrator." -ForegroundColor Red
    Write-Host "Close it, then right-click PowerShell and choose 'Run as administrator', and re-run this script." -ForegroundColor Red
    exit 1
}

# Resolve node.exe's absolute path now, while running as a normal user with
# node on PATH - the scheduled task itself won't rely on PATH at all.
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Error "Could not find 'node' on PATH in this session. Install Node.js or run this from a shell where 'node --version' works, then re-run."
    exit 1
}
$NodeExe = $nodeCmd.Source
Write-Host "Using node.exe at: $NodeExe"

# Also resolve cmd.exe (used only to get stdout/stderr redirection to the
# log file - node.exe itself can't do shell redirection on its own).
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

# Boot delay is longer than ORDS's (2 min) so ORDS has a head start - the
# backend needs ORDS already answering on :8080 or its Oracle calls fail.
# Command/Arguments quoting: cmd.exe /c "<node.exe path> <entry>" >> log 2>&1
# run from WorkingDirectory so dotenv/config (which reads .env from
# process.cwd()) finds backend\.env correctly.
$cmdArgs = "/c `"`"$NodeExe`" $EntryPoint >> `"$LogFile`" 2>&1`""

# Task Scheduler's XML is real XML: & and > inside element text must be
# escaped (the raw "2>&1" above breaks an unescaped parser otherwise).
# Escape & first so the entities we're inserting don't get double-escaped.
$cmdArgsXml = $cmdArgs -replace '&', '&amp;' -replace '>', '&gt;' -replace '<', '&lt;'

$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Runs the Mahal Node backend (port $Port) permanently in the background; auto-starts at boot (after ORDS) and auto-restarts if it ever stops responding.</Description>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger>
      <Enabled>true</Enabled>
      <Delay>PT4M</Delay>
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
      <WorkingDirectory>$BackendDir</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

$xmlPath = Join-Path $env:TEMP "mahal-backend-task.xml"
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
Write-Host "Check http://localhost:4000/api/health in a browser in about 10-15 seconds to confirm it's up."
Write-Host "Logs are written to $BackendDir\$LogFile - check that file if something looks wrong."
Write-Host ""
Write-Host "From now on, the backend will:"
Write-Host "  - start automatically every time this PC boots (a few minutes after ORDS)"
Write-Host "  - restart automatically if it ever crashes"
Write-Host "  - run with no visible window, so nothing can Quick-Edit-pause it"
