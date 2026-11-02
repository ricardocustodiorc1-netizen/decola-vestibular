#!/usr/bin/env bash
# Validation only. Never connects to Supabase, regardless of inherited execution gates.
set -euo pipefail
cd "$(dirname "$0")/../.."
EXPECTED_BRANCH="dev/navegacao-leo-familias-20261031"
test "$(git branch --show-current)" = "$EXPECTED_BRANCH" || { echo "STOP: wrong branch"; exit 2; }
test "$(node -p 'process.versions.node.split(".")[0]')" -eq 22 || { echo "Node.js 22 required"; exit 2; }
TARGET="scripts/homologacao/etapa2b-runner.mjs"
node --version
npm --version
node --check "$TARGET"
node --check scripts/homologacao/etapa2b-auth.mjs
echo "PASS: original executor and Auth entry point parse"
npm --prefix scripts/homologacao run verify:dependencies
DECOLA_TEST_PROJECT_ID=yxxrfhobhonigwczzpim node "$TARGET" check
if DECOLA_TEST_PROJECT_ID=wrong node "$TARGET" check >/dev/null 2>&1; then
 echo "FAIL: wrong-project gate allowed execution"; exit 1
fi
# CLI must deny provisioning even if someone sets legacy YES gates.
if DECOLA_TEST_PROJECT_ID=yxxrfhobhonigwczzpim DECOLA_TEST_CREATE=YES DECOLA_TEST_RUN=YES node "$TARGET" run >/dev/null 2>&1; then
 echo "FAIL: runner allowed provisioning"; exit 1
fi
if DECOLA_TEST_PROJECT_ID=yxxrfhobhonigwczzpim DECOLA_TEST_CREATE=YES node scripts/homologacao/etapa2b-auth.mjs create >/dev/null 2>&1; then
 echo "FAIL: Auth entry point allowed provisioning"; exit 1
fi
echo "PASS: wrong-project and both provisioning modes blocked"
echo "PASS: preflight finished; NO Supabase connection or writes"
