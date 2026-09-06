#!/usr/bin/env bash
set -euo pipefail
: "${UE_ROOT:?Set UE_ROOT to Unreal Engine 5.8}"
module_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
project="${1:-$module_root/unreal/MaritimeSim.uproject}"
node "$module_root/scripts/generate-models.mjs"
MARITIME_REIMPORT=1 "$UE_ROOT/Engine/Binaries/Linux/UnrealEditor-Cmd" "$project" \
  -run=pythonscript "-script=$module_root/scripts/setup_unreal.py" -unattended -nosplash -nullrhi \
  "-abslog=$module_root/generated/import-exterior-v2.log"
echo 'Visual assets updated. Repackage if using packages/Linux.'
