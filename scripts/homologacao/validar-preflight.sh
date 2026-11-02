#!/usr/bin/env bash
# Offline-safe preflight. Run only in a disposable checkout of the approved dev branch.
set -euo pipefail
cd "$(dirname "$0")/../.."
EXPECTED_BRANCH="dev/navegacao-leo-familias-20261031"
test "$(git branch --show-current)" = "$EXPECTED_BRANCH" || { echo "STOP: wrong branch"; exit 2; }
test "$(node -p 'process.versions.node.split(".")[0]')" -ge 22 || { echo "Node 22+ required"; exit 2; }
TARGET="scripts/homologacao/etapa2b-runner.mjs"
node --check "$TARGET"
echo "PASS: original executor parses in Node"
# The default check mode exits before any Supabase network operation.
DECOLA_TEST_PROJECT_ID=yxxrfhobhonigwczzpim node "$TARGET" check
if DECOLA_TEST_PROJECT_ID=wrong node "$TARGET" check >/dev/null 2>&1; then
 echo "FAIL: wrong-project gate allowed execution"; exit 1
fi
echo "PASS: wrong-project gate blocks execution"
# Never set DECOLA_TEST_CREATE or DECOLA_TEST_RUN in this preflight.
echo "PASS: preflight finished; NO Supabase connection or writes"
