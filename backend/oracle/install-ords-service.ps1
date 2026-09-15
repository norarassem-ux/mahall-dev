<#
  install-ords-service.ps1  (v3 - uses schtasks.exe, not the ScheduledTasks
  PowerShell module)

  Makes Oracle ORDS start automatically at boot and self-heal if it ever
  crashes or gets paused (e.g. by accidentally clicking into its console
  window and triggering Windows "Quick Edit Mode").

  v1/v2 used the PowerShell `ScheduledTasks` module (Register-ScheduledTask
  etc.) which hit two separate bugs on this machine: a RepetitionDuration
  formatting error, then a persistent "Access is denied" on registration
  even with nothing pre-existing to conflict with - consistent with that
  module's CIM/WMI provider being broken here (this machine has already
  shown one other unrelated Windows-update regression). This version drives
  Task Scheduler through schtasks.exe + a hand-written task XML instead,
  which uses a different, older code path and does not depend on that
  module at all.

  It registers ORDS as a Windows Scheduled Task that:
    - Starts automatically 2 minutes after every boot (giving the database
      time to come up first)
    - Also re-checks every 5 minutes and starts ORDS if it isn't already
      running (a "watchdog" trigger) - self-healing even beyond any
      crash-restart limit
    - Runs as SYSTEM, with no visible console window at all - so there is
      nothing to accidentally click into and pause ever again
    - Has no execution time limit (won't be killed after a few hours/days)

  HOW TO RUN THIS SCRIPT:
    1. Click Start, type "PowerShell", right-click "Windows PowerShell",
       choose "Run as administrator".
    2. cd to the folder this script is in, e.g.:
         cd N:\mahal\mahal-v1\backend\oracle
    3. Run it:
         .\install-ords-service.ps1
    4. Verify:
         schtasks /Query /TN "ORDS Server" /V /FO LIST
    5. Open http://localhost:8080/ords/apex in a browser to confirm it's up.

  You do NOT need to keep any Command Prompt / ords.exe window open ever
  again after this. It's safe to close any existing "ords serve" window -
  the script below kills any leftover foreground copy first so the port
  is free.
#>

$ErrorActionPreference = "Stop"
# On PowerShell 7.3+, this makes stderr output from native commands (like
# schtasks printing "ERROR: task not found" when there's nothing to clean
# up yet) throw as a terminating error even when redirected to $null.
# Disable that so cleanup steps can fail silently as intended.
$PSNativeCommandUseErrorActionPreference = $false

# --- Adjust these two paths if your install locations differ ---
$OrdsExe     = "C:\26_26\ords\bin\ords.exe"
$OrdsArgs    = "--config C:\ords_config serve"
$OrdsWorkDir = "C:\26_26\ords\bin"
$TaskName    = "ORDS Server"
# -----------------------------------------------------------------

if (-not (Test-Path $OrdsExe)) {
    Write-Error "Could not find ords.exe at $OrdsExe. Edit the `$OrdsExe path at the top of this script and re-run."
    exit 1
}

# Confirm we're actually elevated - a non-elevated "Run as administrator"
# click that got auto-denied by UAC produces exactly this script's failure
# mode (silently non-admin), so fail loudly and early instead.
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This PowerShell window is NOT running as Administrator." -ForegroundColor Red
    Write-Host "Close it, then right-click PowerShell and choose 'Run as administrator', and re-run this script." -ForegroundColor Red
    exit 1
}

Write-Host "Stopping any existing foreground 'ords.exe' process (frees port 8080)..."
Get-Process -Name "ords" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Removing any previous '$TaskName' scheduled task (if any)..."
try { schtasks /End /TN $TaskName *> $null } catch { }
try { schtasks /Delete /TN $TaskName /F *> $null } catch { }
Start-Sleep -Seconds 1

# Build the Task Scheduler XML by hand and hand it to schtasks.exe -
# this avoids the PowerShell ScheduledTasks module entirely.
$startBoundary = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")

$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Runs Oracle ORDS permanently in the background; auto-starts at boot and auto-restarts if it ever stops.</Description>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger>
      <Enabled>true</Enabled>
      <Delay>PT2M</Delay>
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
      <Command>$OrdsExe</Command>
      <Arguments>$OrdsArgs</Arguments>
      <WorkingDirectory>$OrdsWorkDir</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

$xmlPath = Join-Path $env:TEMP "ords-task.xml"
# Task Scheduler requires the XML file itself to be UTF-16LE, matching the
# encoding declared in its own prolog.
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
Write-Host "Check http://localhost:8080/ords/apex in a browser in about 10-15 seconds to confirm ORDS is up."
Write-Host ""
Write-Host "From now on, ORDS will:"
Write-Host "  - start automatically every time this PC boots"
Write-Host "  - restart automatically if it ever crashes"
Write-Host "  - run with no visible window, so nothing can Quick-Edit-pause it"
