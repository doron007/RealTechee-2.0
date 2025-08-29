#!/bin/bash
# Verifies the currently configured backend suffix appears in active DynamoDB table list (Phase 5.4)
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-west-1}"
CURRENT_SUFFIX="${NEXT_PUBLIC_BACKEND_SUFFIX:-${TABLE_SUFFIX:-}}"
if [[ -z "$CURRENT_SUFFIX" ]]; then
  echo "[ERROR] NEXT_PUBLIC_BACKEND_SUFFIX or TABLE_SUFFIX must be exported" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIST_SCRIPT="$SCRIPT_DIR/list-active-suffixes.sh"
if [[ ! -x "$LIST_SCRIPT" ]]; then
  echo "[ERROR] list-active-suffixes.sh not found or not executable" >&2
  exit 2
fi

OUTPUT="$("$LIST_SCRIPT")" || { echo "[ERROR] Failed to list active suffixes" >&2; exit 1; }
# Remove header lines (first 2) for easier grep
echo "$OUTPUT" | sed '1,2d' > /tmp/active-suffixes.$$ || true

if ! grep -q "^$CURRENT_SUFFIX," /tmp/active-suffixes.$$; then
  echo "[FAIL] Current suffix $CURRENT_SUFFIX not found in active table set" >&2
  cat /tmp/active-suffixes.$$
  exit 1
fi

LEGACY_LIST=(fvn7t5hbobaxjklhrqzdl4ac34 yk6ecaswg5aehjn3ev76xzpbfe)
for legacy in "${LEGACY_LIST[@]}"; do
  if grep -q "^$legacy," /tmp/active-suffixes.$$ && [[ "$legacy" != "$CURRENT_SUFFIX" ]]; then
    echo "[WARN] Legacy suffix still present: $legacy (consider cleanup)" >&2
  fi
done

echo "[OK] Active suffix verification passed for $CURRENT_SUFFIX"
exit 0
