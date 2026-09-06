param(
    [Parameter(Mandatory=$true)][string]$EngineRoot,
    [string]$Project,
    [switch]$MaterialsOnly
)
$ErrorActionPreference = 'Stop'
$ModuleRoot = Split-Path $PSScriptRoot -Parent
if (-not $Project) { $Project = Join-Path $ModuleRoot 'unreal/MaritimeSim.uproject' }
$EditorTool = Join-Path $EngineRoot 'Engine/Binaries/Win64/UnrealEditor-Cmd.exe'
foreach ($RequiredPath in @($Project, $EditorTool)) {
    if (-not (Test-Path -LiteralPath $RequiredPath)) { throw "Missing: $RequiredPath" }
}
& node (Join-Path $PSScriptRoot 'generate-models.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Mesh generation failed' }
$PreviousReimport = $env:MARITIME_REIMPORT
$PreviousMaterials = $env:MARITIME_MATERIALS_ONLY
try {
    $env:MARITIME_REIMPORT = '1'
    $env:MARITIME_MATERIALS_ONLY = if ($MaterialsOnly) { '1' } else { '0' }
    $Setup = Join-Path $PSScriptRoot 'setup_unreal.py'
    $ImportLog = Join-Path $ModuleRoot 'generated/import-exterior-v2.log'
    & $EditorTool $Project -run=pythonscript "-script=$Setup" -unattended -nosplash -nullrhi "-abslog=$ImportLog"
    if ($LASTEXITCODE -ne 0) { throw "Visual import failed; see $ImportLog" }
} finally {
    $env:MARITIME_REIMPORT = $PreviousReimport
    $env:MARITIME_MATERIALS_ONLY = $PreviousMaterials
}
Write-Output 'Visual assets updated. Repackage if you use packages/Win64. See generated/import-exterior-v2.log.'
