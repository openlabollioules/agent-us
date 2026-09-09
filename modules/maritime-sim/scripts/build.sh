#!/usr/bin/env bash
set -euo pipefail
: "${UE_ROOT:?Set UE_ROOT to the Unreal Engine 5.8 installation directory}"
module_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
project="$module_root/unreal/MaritimeSim.uproject"
editor="$UE_ROOT/Engine/Binaries/Linux/UnrealEditor-Cmd"
test -x "$editor"
if ! node -e 'const fs=require("fs");try{if(JSON.parse(fs.readFileSync(process.argv[1],"utf8")).length<15)process.exit(1)}catch{process.exit(1)}' "$module_root/generated/textures/manifest.json"; then
  node --use-system-ca "$module_root/scripts/fetch-pbr-textures.mjs"
fi
node "$module_root/scripts/generate-models.mjs"
"$UE_ROOT/Engine/Build/BatchFiles/Linux/Build.sh" MaritimeSimEditor Linux Development "$project" -WaitMutex
"$editor" "$project" "-ExecutePythonScript=$module_root/scripts/setup_unreal.py" -unattended -nosplash -nullrhi "-abslog=$module_root/generated/setup-assets.log"
grep -q 'Maritime exterior v4 imported' "$module_root/generated/setup-assets.log"
if grep -q 'LogPython: Error:' "$module_root/generated/setup-assets.log"; then exit 1; fi
if [[ "${1:-}" == "--package" ]]; then
  "$UE_ROOT/Engine/Build/BatchFiles/RunUAT.sh" BuildCookRun "-project=$project" -noP4 -platform=Linux \
    -clientconfig=Development -build -cook -stage -pak -archive "-archivedirectory=$module_root/packages/Linux" -utf8output
fi
