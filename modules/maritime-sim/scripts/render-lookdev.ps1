param([Parameter(Mandatory=$true)][string]$EngineRoot, [string]$Project, [switch]$RuntimeCheck, [switch]$MotionTests, [switch]$GpuCheck, [string]$Views)
$ErrorActionPreference = 'Stop'
$ModuleRoot = Split-Path $PSScriptRoot -Parent
if (-not $Project) { $Project = Join-Path $ModuleRoot 'unreal/MaritimeSim.uproject' }
$EditorTool = Join-Path $EngineRoot 'Engine/Binaries/Win64/UnrealEditor-Cmd.exe'
$Script = Join-Path $PSScriptRoot 'render-lookdev.py'
$RenderLog = Join-Path $ModuleRoot 'generated/lookdev.log'
$ExtraArgs = @()
$RhiArgs = @('-d3d12','-sm6')
if ($GpuCheck) { $RuntimeCheck = $true }
if ($RuntimeCheck) {
    $Script = Join-Path $PSScriptRoot 'check-appearance.py'
    $RenderLog = Join-Path $ModuleRoot 'generated/appearance-check.log'
    $ExtraArgs = @('-SceneBridge=http://127.0.0.1:18787')
    $RhiArgs = @('-nullrhi')
    if ($GpuCheck) {
        $RhiArgs = @('-d3d12','-sm6')
        $RenderLog = Join-Path $ModuleRoot 'generated/appearance-gpu.log'
    }
}
if ($MotionTests) {
    $RenderLog = Join-Path $ModuleRoot 'generated/motion-tests.log'
    & $EditorTool $Project '-ExecCmds=Automation RunTests Maritime.Visual' '-TestExit=Automation Test Queue Empty' -unattended -nosplash -nullrhi "-abslog=$RenderLog"
    if ($LASTEXITCODE -ne 0) { throw "Native motion tests failed; see $RenderLog" }
    $LogText = Get-Content -LiteralPath $RenderLog -Raw
    if ($LogText -notmatch 'Result=\{Success\} Name=\{Damping\}' -or $LogText -notmatch 'Result=\{Success\} Name=\{WaterlineResponse\}' -or $LogText -match 'Result=\{Fail') { throw "Motion tests incomplete; see $RenderLog" }
    Write-Output "Native motion tests passed; $RenderLog"
    exit 0
}
$PreviousViews = $env:MARITIME_LOOKDEV
$PreviousGpuCheck = $env:MARITIME_GPU_CHECK
try {
    $env:MARITIME_GPU_CHECK = if ($GpuCheck) { '1' } else { '0' }
    if ($Views) { $env:MARITIME_LOOKDEV = $Views }
    & $EditorTool $Project "-ExecutePythonScript=$Script" -RenderOffscreen -unattended -nosplash "-abslog=$RenderLog" @RhiArgs @ExtraArgs
} finally { $env:MARITIME_LOOKDEV = $PreviousViews; $env:MARITIME_GPU_CHECK = $PreviousGpuCheck }
if ($LASTEXITCODE -ne 0) { throw "Lookdev failed; see $RenderLog" }
$LogText = Get-Content -LiteralPath $RenderLog -Raw
if ($LogText -notmatch $(if ($RuntimeCheck) { 'APPEARANCE_OK' } else { 'LOOKDEV_OK' }) -or $LogText -match 'Failed to compile Material|LogPython: Error:') {
    throw "Lookdev incomplete or shader failure; see $RenderLog"
}
if (-not $RuntimeCheck) {
    # Read only: validate the PNG luminance without modifying Unreal's output.
    Add-Type -AssemblyName System.Drawing
    $Manifest = Get-Content (Join-Path $ModuleRoot 'generated/lookdev/capture-manifest.json') -Raw | ConvertFrom-Json
    foreach ($Capture in $Manifest) {
        $Bitmap = [System.Drawing.Bitmap]::new((Join-Path $ModuleRoot "generated/lookdev/$($Capture.image)"))
        try {
            $Luminance = @()
            for ($x=40; $x -lt $Bitmap.Width; $x+=80) {
                for ($y=40; $y -lt $Bitmap.Height; $y+=80) {
                    $Pixel=$Bitmap.GetPixel($x,$y)
                    $Luminance += .2126*$Pixel.R+.7152*$Pixel.G+.0722*$Pixel.B
                }
            }
            if (($Luminance | Measure-Object -Average).Average -lt 8) { throw "Black capture: $($Capture.image)" }
        } finally { $Bitmap.Dispose() }
    }
}
