#!/usr/bin/env bash
# sync-skills.sh — installe / met à jour les skills Agent Us dans le store Hermes.
#
# Source (source de vérité, versionnée) : <repo>/hermes/skills/<skill>/SKILL.md
# Cible (lue par Hermes)                 : $HERMES_DATA/skills/$CATEGORY/<skill>/SKILL.md
#
# Usage :
#   ./hermes/sync-skills.sh                  # catégorie "agent-us", data ~/DEV/hermes/data
#   ./hermes/sync-skills.sh ma-categorie     # autre catégorie
#   HERMES_DATA=/chemin/vers/data ./hermes/sync-skills.sh
#
# Ré-exécutable : met à jour les SKILL.md modifiés, ajoute les nouveaux et
# retire ceux qui n'existent plus en source (uniquement dans la catégorie cible).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR/skills"
HERMES_DATA="${HERMES_DATA:-$HOME/DEV/hermes/data}"
CATEGORY="${1:-agent-us}"
DEST="$HERMES_DATA/skills/$CATEGORY"

if [ ! -d "$SRC" ]; then
  echo "❌ Dossier source introuvable : $SRC" >&2
  exit 1
fi
if [ ! -d "$HERMES_DATA/skills" ]; then
  echo "❌ Store Hermes introuvable : $HERMES_DATA/skills" >&2
  echo "   Définis HERMES_DATA vers le volume monté sur /opt/data." >&2
  exit 1
fi

mkdir -p "$DEST"

# Description de la catégorie (régénérée à chaque passage).
cat > "$DEST/DESCRIPTION.md" <<'EOF'
Agent Us — skills des subagents du serious game naval (Radar, Navigation,
Optronic, ThreatAssessment, GameMaster). Univers fictif et pédagogique :
pas de données militaires réelles, pas d'action offensive, humain dans la boucle.
EOF

installed=0
names=()
for dir in "$SRC"/*/; do
  [ -f "${dir}SKILL.md" ] || continue
  name="$(basename "$dir")"
  names+=("$name")
  mkdir -p "$DEST/$name"
  cp -f "${dir}SKILL.md" "$DEST/$name/SKILL.md"
  installed=$((installed + 1))
  echo "  ✓ $name"
done

# Élagage : retire de la catégorie les skills absents de la source.
if [ "$installed" -gt 0 ]; then
  for d in "$DEST"/*/; do
    [ -d "$d" ] || continue
    n="$(basename "$d")"
    keep=false
    for k in "${names[@]}"; do
      [ "$k" = "$n" ] && keep=true && break
    done
    if [ "$keep" = false ]; then
      rm -rf "$d"
      echo "  ✗ retiré (absent en source) : $n"
    fi
  done
fi

echo "✅ $installed skill(s) synchronisée(s) → $DEST"
echo "ℹ️  Si Hermes n'indexe pas à chaud : docker restart hermes"
