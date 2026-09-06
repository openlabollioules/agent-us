param([Parameter(Mandatory=$true)][string]$EngineRoot, [string]$Project)
$ErrorActionPreference = 'Stop'
$ModuleRoot = Split-Path $PSScriptRoot -Parent
if (-not $Project) { $Project = Join-Path $ModuleRoot 'unreal/MaritimeSim.uproject' }
$EditorTool = Join-Path $EngineRoot 'Engine/Binaries/Win64/UnrealEditor-Cmd.exe'
$Script = Join-Path $PSScriptRoot 'render-lookdev.py'
$RenderLog = Join-Path $ModuleRoot 'generated/lookdev.log'
& $EditorTool $Project "-ExecutePythonScript=$Script" -RenderOffscreen -d3d12 -sm6 -unattended -nosplash "-abslog=$RenderLog"
if ($LASTEXITCODE -ne 0) { throw "Lookdev failed; see $RenderLog" }
$LogText = Get-Content -LiteralPath $RenderLog -Raw
if ($LogText -notmatch 'LOOKDEV_OK' -or $LogText -match 'Failed to compile Material|LogPython: Error:') {
    throw "Lookdev incomplete or shader failure; see $RenderLog"
}
