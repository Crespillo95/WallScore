param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot
$target = [IO.Directory]::CreateDirectory($OutputDirectory).FullName
$html = Join-Path $target "WallScore.html"
$exe = Join-Path $target "WallScore.exe"
node (Join-Path $root "tools/build-guide.cjs") $html
if ($LASTEXITCODE) { throw "Could not build the interactive guide." }
$compiler = Join-Path $env:WINDIR "Microsoft.NET/Framework64/v4.0.30319/csc.exe"
& $compiler /nologo /target:winexe /platform:anycpu /optimize+ /codepage:65001 /reference:System.Windows.Forms.dll /reference:System.Drawing.dll "/resource:$html,WallScore.html" "/out:$exe" (Join-Path $PSScriptRoot "WallScore.cs")
if ($LASTEXITCODE) { throw "Could not build the Windows executable." }
