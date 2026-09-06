#!/usr/bin/env bash
set -euo pipefail
: "${UE_ROOT:?Set UE_ROOT to the Unreal Engine 5.8 installation directory}"
module_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
project="$module_root/unreal/MaritimeSim.uproject"
editor="$UE_ROOT/Engine/Binaries/Linux/UnrealEditor-Cmd"
test -x "$editor"
node "$module_root/scripts/generate-models.mjs"
"$UE_ROOT/Engine/Build/BatchFiles/Linux/Build.sh" MaritimeSimEditor Linux Development "$project" -WaitMutex
"$editor" "$project" -run=pythonscript "-script=$module_root/scripts/setup_unreal.py" -unattended -nosplash -nullrhi
if [[ "${1:-}" == "--package" ]]; then
  "$UE_ROOT/Engine/Build/BatchFiles/RunUAT.sh" BuildCookRun "-project=$project" -noP4 -platform=Linux \
    -clientconfig=Development -build -cook -stage -pak -archive "-archivedirectory=$module_root/packages/Linux" -utf8output
fi
