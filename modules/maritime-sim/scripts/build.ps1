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
$TextureManifest = Join-Path $ModuleRoot 'generated/textures/manifest.json'
if (-not (Test-Path -LiteralPath $TextureManifest) -or @((Get-Content -LiteralPath $TextureManifest -Raw | ConvertFrom-Json)).Count -lt 15) {
    & node --use-system-ca (Join-Path $PSScriptRoot 'fetch-pbr-textures.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'PBR texture download failed; run update-visuals when the connection is available.' }
}
& node (Join-Path $PSScriptRoot 'generate-models.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Mesh generation failed' }
& $BuildTool MaritimeSimEditor Win64 Development "-Project=$Project" -WaitMutex
if ($LASTEXITCODE -ne 0) { throw 'Editor compilation failed' }
$SetupScript = Join-Path $PSScriptRoot 'setup_unreal.py'
# Nanite/collision processing requires the editor's StaticMeshEditorSubsystem.
# Source fingerprints refresh changed generated assets, including existing installs.
$SetupLog = Join-Path $ModuleRoot 'generated/setup-assets.log'
& $EditorTool $Project "-ExecutePythonScript=$SetupScript" -unattended -nosplash -nullrhi "-abslog=$SetupLog"
if ($LASTEXITCODE -ne 0) { throw 'Asset import failed; inspect unreal/Saved/Logs' }
$SetupText = Get-Content -LiteralPath $SetupLog -Raw
if ($SetupText -notmatch 'Maritime exterior v4 imported' -or $SetupText -match 'LogPython: Error:') { throw "Asset setup incomplete; see $SetupLog" }
if ($Package) {
    $Archive = Join-Path $ModuleRoot "packages/$Target"
    & $AutomationTool BuildCookRun "-project=$Project" -noP4 "-platform=$Target" -clientconfig=Development -build -cook -stage -pak -archive "-archivedirectory=$Archive" -utf8output
    if ($LASTEXITCODE -ne 0) { throw 'Packaging failed' }
}
