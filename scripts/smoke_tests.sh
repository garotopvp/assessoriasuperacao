#!/usr/bin/env bash
set -euo pipefail

URL=${1:-http://localhost:5173}
echo "[deploy] Running smoke tests against $URL"

status=$(curl -s -o /dev/null -w "%{http_code}" "$URL") || status=000
if [ "$status" = "200" ]; then
  echo "[deploy] Smoke test passed (HTTP 200)"
  exit 0
else
  echo "[deploy] Smoke test failed (status=$status)"
  exit 2
fi
