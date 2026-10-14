#!/usr/bin/env bash
# Run the headless test suite. Usage: tools/test.sh [path/to/godot]
# Fails if any test fails or if Godot reports a script error.
set -uo pipefail
GODOT="${1:-${GODOT:-godot}}"
cd "$(dirname "$0")/.."
"$GODOT" --headless --path . --import >/dev/null 2>&1 || true
LOG="$(mktemp)"
"$GODOT" --headless --path . -s res://tests/run_tests.gd 2>&1 | tee "$LOG"
STATUS=${PIPESTATUS[0]}
if grep -qE "SCRIPT ERROR|Parse Error|Compile Error" "$LOG"; then
  echo "Script errors detected." >&2
  STATUS=1
fi
rm -f "$LOG"
exit "$STATUS"
