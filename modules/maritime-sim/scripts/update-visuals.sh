#!/usr/bin/env bash
set -euo pipefail
: "${UE_ROOT:?Set UE_ROOT to Unreal Engine 5.8}"
module_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
project="${1:-$module_root/unreal/MaritimeSim.uproject}"
if [[ "${MARITIME_OFFLINE:-0}" != 1 ]]; then
  node --use-system-ca "$module_root/scripts/fetch-pbr-textures.mjs"
fi
test -f "$module_root/generated/textures/manifest.json" || { echo 'Missing texture cache. Run fetch-pbr-textures.mjs first.' >&2; exit 1; }
node "$module_root/scripts/generate-models.mjs"
MARITIME_REIMPORT=1 "$UE_ROOT/Engine/Binaries/Linux/UnrealEditor-Cmd" "$project" \
  "-ExecutePythonScript=$module_root/scripts/setup_unreal.py" -unattended -nosplash -nullrhi \
  "-abslog=$module_root/generated/import-exterior-v4.log"
grep -q 'Maritime exterior v4 imported' "$module_root/generated/import-exterior-v4.log"
echo 'Visual assets v4 updated. Rebuild the C++ renderer and repackage if using packages/Linux.'
