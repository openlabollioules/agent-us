param(
    [Parameter(Mandatory=$true)][string]$EngineRoot,
    [ValidateSet('Win64','Linux')][string]$Target = 'Win64',
    [switch]$Package
)
$ErrorActionPreference = 'Stop'
$ModuleRoot = Split-Path $PSScriptRoot -Parent
$Project = Join-Path $ModuleRoot 'unreal/MaritimeSim.uproject'
$BuildTool = Join-Path $EngineRoot 'Engine/Build/BatchFiles/Build.bat'
$EditorTool = Join-Path $EngineRoot 'Engine/Binaries/Win64/UnrealEditor-Cmd.exe'
$AutomationTool = Join-Path $EngineRoot 'Engine/Build/BatchFiles/RunUAT.bat'
foreach ($RequiredPath in @($Project, $BuildTool, $EditorTool, $AutomationTool)) {
    if (-not (Test-Path -LiteralPath $RequiredPath)) { throw "Missing: $RequiredPath" }
}
& node (Join-Path $PSScriptRoot 'generate-models.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Mesh generation failed' }
& $BuildTool MaritimeSimEditor Win64 Development "-Project=$Project" -WaitMutex
if ($LASTEXITCODE -ne 0) { throw 'Editor compilation failed' }
$SetupScript = Join-Path $PSScriptRoot 'setup_unreal.py'
# The commandlet loads the map explicitly inside the Python script.
& $EditorTool $Project -run=pythonscript "-script=$SetupScript" -unattended -nosplash -nullrhi
if ($LASTEXITCODE -ne 0) { throw 'Asset import failed; inspect unreal/Saved/Logs' }
if ($Package) {
    $Archive = Join-Path $ModuleRoot "packages/$Target"
    & $AutomationTool BuildCookRun "-project=$Project" -noP4 "-platform=$Target" -clientconfig=Development -build -cook -stage -pak -archive "-archivedirectory=$Archive" -utf8output
    if ($LASTEXITCODE -ne 0) { throw 'Packaging failed' }
}
