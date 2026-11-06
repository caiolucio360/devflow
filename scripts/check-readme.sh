#!/usr/bin/env bash
# Fails when a skills/<name>/ directory has no "## /devflow:<name>" section in the plugin README.
# Usage: check-readme.sh [repository root]
set -euo pipefail

root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
plugin="$root/plugins/devflow"
status=0
# With no skills/ directory yet the glob would stay literal and be checked as a skill named "*".
shopt -s nullglob

for dir in "$plugin"/skills/*/; do
  name="$(basename "$dir")"
  if ! grep -qE "^## /devflow:${name}( |\$)" "$plugin/README.md"; then
    echo "README.md has no \"## /devflow:${name}\" section"
    status=1
  fi
done

exit "$status"
