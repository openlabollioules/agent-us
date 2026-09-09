param(
    [Parameter(Mandatory=$true)][string]$EngineRoot,
    [string]$Project,
    [switch]$MaterialsOnly,
    [switch]$Offline
)
$ErrorActionPreference = 'Stop'
$ModuleRoot = Split-Path $PSScriptRoot -Parent
if (-not $Project) { $Project = Join-Path $ModuleRoot 'unreal/MaritimeSim.uproject' }
$EditorTool = Join-Path $EngineRoot 'Engine/Binaries/Win64/UnrealEditor-Cmd.exe'
foreach ($RequiredPath in @($Project, $EditorTool)) {
    if (-not (Test-Path -LiteralPath $RequiredPath)) { throw "Missing: $RequiredPath" }
}
if (-not $Offline) {
    & node --use-system-ca (Join-Path $PSScriptRoot 'fetch-pbr-textures.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'CC0 texture download failed. Use -Offline only with the cached textures.' }
}
if (-not (Test-Path -LiteralPath (Join-Path $ModuleRoot 'generated/textures/manifest.json'))) { throw 'Missing CC0 texture cache. Run fetch-pbr-textures.mjs first.' }
& node (Join-Path $PSScriptRoot 'generate-models.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Mesh generation failed' }
$PreviousReimport = $env:MARITIME_REIMPORT
$PreviousMaterials = $env:MARITIME_MATERIALS_ONLY
try {
    $env:MARITIME_REIMPORT = '1'
    $env:MARITIME_MATERIALS_ONLY = if ($MaterialsOnly) { '1' } else { '0' }
    $Setup = Join-Path $PSScriptRoot 'setup_unreal.py'
    $ImportLog = Join-Path $ModuleRoot 'generated/import-exterior-v4.log'
    & $EditorTool $Project "-ExecutePythonScript=$Setup" -unattended -nosplash -nullrhi "-abslog=$ImportLog"
    if ($LASTEXITCODE -ne 0) { throw "Visual import failed; see $ImportLog" }
    if ((Get-Content -LiteralPath $ImportLog -Raw) -notmatch 'Maritime exterior v4 imported') { throw "Import incomplete; see $ImportLog" }
} finally {
    $env:MARITIME_REIMPORT = $PreviousReimport
    $env:MARITIME_MATERIALS_ONLY = $PreviousMaterials
}
Write-Output 'Visual assets v4 updated. Rebuild the C++ renderer, then repackage if you use packages/Win64. See generated/import-exterior-v4.log.'
